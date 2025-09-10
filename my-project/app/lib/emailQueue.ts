import { executeQuery } from "@/app/lib/db";
import { emailService } from "@/app/lib/email";

interface QueueItem {
  id: number;
  campaign_id: number;
  contact_id: number;
  email: string;
  status: string;
  attempts: number;
  max_attempts: number;
}

interface CampaignData {
  id: number;
  subject_line: string;
  html_content: string;
  sender_name: string;
  sender_email: string;
}

class EmailQueueProcessor {
  private isProcessing = false;
  private batchSize = 10; // Number of emails to process per batch
  private batchDelay = 2000; // Delay between batches in milliseconds
  private retryDelay = 5000; // Delay before retrying failed emails

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('Email queue is already being processed');
      return;
    }

    this.isProcessing = true;
    console.log('Starting email queue processing...');

    try {
      while (true) {
        const pendingEmails = await this.getPendingEmails();
        
        if (pendingEmails.length === 0) {
          console.log('No pending emails to process');
          break;
        }

        console.log(`Processing batch of ${pendingEmails.length} emails`);
        await this.processBatch(pendingEmails);
        
        // Delay between batches
        await this.delay(this.batchDelay);
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    } finally {
      this.isProcessing = false;
      console.log('Email queue processing completed');
    }
  }

  private async getPendingEmails(): Promise<QueueItem[]> {
    const query = `
      SELECT eq.*, c.subject_line, c.html_content, c.sender_name, c.sender_email
      FROM email_queue eq
      JOIN campaigns c ON eq.campaign_id = c.id
      WHERE eq.status IN ('pending', 'retry') 
      AND eq.attempts < eq.max_attempts
      ORDER BY eq.created_at ASC
      LIMIT ?
    `;
    
    const result = await executeQuery(query, [this.batchSize]);
    return result as QueueItem[];
  }

  private async processBatch(emails: QueueItem[]): Promise<void> {
    const promises = emails.map(email => this.processEmail(email));
    await Promise.allSettled(promises);
  }

  private async processEmail(queueItem: QueueItem): Promise<void> {
    try {
      // Update status to 'sending'
      await this.updateQueueStatus(queueItem.id, 'sending');

      // Get campaign data
      const campaignData = await this.getCampaignData(queueItem.campaign_id);
      
      // Send email
      const result = await emailService.sendEmail({
        to: queueItem.email,
        subject: campaignData.subject_line,
        html: campaignData.html_content,
        from: `${campaignData.sender_name} <${campaignData.sender_email}>`
      });

      if (result.success) {
        // Update queue status to 'sent'
        await this.updateQueueStatus(queueItem.id, 'sent', result.response);
        
        // Log success
        await this.logEmailAction(queueItem, 'sent', result.response);
        
        // Update campaign stats
        await this.updateCampaignStats(queueItem.campaign_id, 'sent');
        
        console.log(`Email sent successfully to ${queueItem.email}`);
      } else {
        // Handle failure
        await this.handleEmailFailure(queueItem, result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.handleEmailFailure(queueItem, errorMessage);
    }
  }

  private async handleEmailFailure(queueItem: QueueItem, error: string): Promise<void> {
    const newAttempts = queueItem.attempts + 1;
    const status = newAttempts >= queueItem.max_attempts ? 'failed' : 'retry';
    
    // Update queue status
    await this.updateQueueStatus(queueItem.id, status, error, newAttempts);
    
    // Log failure
    await this.logEmailAction(queueItem, 'failed', error);
    
    if (status === 'failed') {
      // Update campaign stats
      await this.updateCampaignStats(queueItem.campaign_id, 'failed');
      console.log(`Email failed permanently for ${queueItem.email}: ${error}`);
    } else {
      // Schedule retry
      setTimeout(() => {
        this.processQueue();
      }, this.retryDelay);
      console.log(`Email failed for ${queueItem.email}, will retry (attempt ${newAttempts}/${queueItem.max_attempts})`);
    }
  }

  private async updateQueueStatus(
    queueId: number, 
    status: string, 
    errorMessage?: string, 
    attempts?: number
  ): Promise<void> {
    const query = `
      UPDATE email_queue 
      SET status = ?, 
          attempts = ?, 
          last_attempt_at = CURRENT_TIMESTAMP,
          sent_at = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END,
          error_message = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      status,
      attempts || 0,
      status,
      errorMessage || null,
      queueId
    ]);
  }

  private async getCampaignData(campaignId: number): Promise<CampaignData> {
    const query = `
      SELECT id, subject_line, html_content, sender_name, sender_email
      FROM campaigns 
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [campaignId]);
    return result[0] as CampaignData;
  }

  private async logEmailAction(
    queueItem: QueueItem, 
    action: string, 
    message?: string
  ): Promise<void> {
    const query = `
      INSERT INTO email_logs (campaign_id, queue_id, contact_id, email, action, smtp_response, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(query, [
      queueItem.campaign_id,
      queueItem.id,
      queueItem.contact_id,
      queueItem.email,
      action,
      action === 'sent' ? message : null,
      action === 'failed' ? message : null
    ]);
  }

  private async updateCampaignStats(campaignId: number, action: 'sent' | 'failed'): Promise<void> {
    const field = action === 'sent' ? 'sent_count' : 'failed_count';
    const query = `
      UPDATE campaigns 
      SET ${field} = ${field} + 1,
          sent_at = CASE WHEN ? = 'sent' AND sent_at IS NULL THEN CURRENT_TIMESTAMP ELSE sent_at END
      WHERE id = ?
    `;
    
    await executeQuery(query, [action, campaignId]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public method to manually trigger queue processing
  async triggerProcessing(): Promise<void> {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Get queue statistics
  async getQueueStats(): Promise<{
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    retry: number;
  }> {
    const query = `
      SELECT status, COUNT(*) as count
      FROM email_queue
      GROUP BY status
    `;
    
    const result = await executeQuery(query);
    const stats = {
      pending: 0,
      sending: 0,
      sent: 0,
      failed: 0,
      retry: 0
    };
    
    result.forEach((row: any) => {
      stats[row.status as keyof typeof stats] = row.count;
    });
    
    return stats;
  }
}

export const emailQueueProcessor = new EmailQueueProcessor();
