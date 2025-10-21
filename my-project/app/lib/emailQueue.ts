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
  subject_line?: string;
  sender_name?: string;
  sender_email?: string;
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
  public currentSendMetadata: any = null; // Store current send metadata

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('Email queue is already being processed');
      return;
    }

    this.isProcessing = true;
    console.log('🚀 Starting email queue processing...');

    try {
      // Check if email service is ready before processing
      if (!emailService.isReady()) {
        console.error('❌ Email service is not ready - stopping queue processing');
        console.error('Please check SMTP configuration and restart the service');
        return;
      }

      let totalProcessed = 0;
      let totalFailed = 0;
      let smtpFailureDetected = false;

      while (true) {
        const pendingEmails = await this.getPendingEmails();
        
        if (pendingEmails.length === 0) {
          console.log('✅ No pending emails to process');
          break;
        }

        console.log(`📧 Processing batch of ${pendingEmails.length} emails`);
        
        // Process batch and track results
        const batchResults = await this.processBatch(pendingEmails);
        totalProcessed += batchResults.processed;
        totalFailed += batchResults.failed;

        // Check if SMTP failure was detected in this batch
        if (batchResults.smtpFailure) {
          smtpFailureDetected = true;
          console.error('❌ SMTP failure detected - stopping queue processing');
          console.error('Please fix SMTP configuration before retrying');
          break;
        }
        
        // Delay between batches
        await this.delay(this.batchDelay);
      }

      console.log(`📊 Queue processing completed:`);
      console.log(`   ✅ Processed: ${totalProcessed}`);
      console.log(`   ❌ Failed: ${totalFailed}`);
      
      if (smtpFailureDetected) {
        console.log(`   🚫 Stopped due to SMTP failure`);
      }

    } catch (error) {
      console.error('❌ Error processing email queue:', error);
      if (error instanceof Error) {
        console.error(`Error details: ${error.message}`);
      }
    } finally {
      this.isProcessing = false;
      this.currentSendMetadata = null; // Clear metadata after processing
      console.log('🏁 Email queue processing completed');
    }
  }

  private async getPendingEmails(): Promise<QueueItem[]> {
    const query = `
      SELECT eq.*
      FROM email_queue eq
      WHERE eq.status IN ('pending', 'retry') 
      AND eq.attempts < eq.max_attempts
      ORDER BY eq.created_at ASC
      LIMIT ?
    `;
    
    const result = await executeQuery(query, [this.batchSize]);
    return result as QueueItem[];
  }

  private async processBatch(emails: QueueItem[]): Promise<{
    processed: number;
    failed: number;
    smtpFailure: boolean;
  }> {
    const promises = emails.map(email => this.processEmail(email));
    const results = await Promise.allSettled(promises);
    
    let processed = 0;
    let failed = 0;
    let smtpFailure = false;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        processed++;
      } else {
        failed++;
        // Check if this was an SMTP-related failure
        const error = result.reason;
        if (error && typeof error === 'string' && error.includes('SMTP')) {
          smtpFailure = true;
        }
      }
    });

    return { processed, failed, smtpFailure };
  }

  private async processEmail(queueItem: QueueItem): Promise<void> {
    try {
      console.log(`📧 Processing email for: ${queueItem.email}`);
      
      // Check opt-in status before sending (only for contacts with contact_id)
      if (queueItem.contact_id) {
        const optInResult = await executeQuery(
          `SELECT c.opt1, c.opt2, c.opt3, camp.type as campaign_type 
           FROM contacts c, campaigns camp
           WHERE c.id = ? AND camp.id = ?`,
          [queueItem.contact_id, queueItem.campaign_id]
        );
        
        if (optInResult && Array.isArray(optInResult) && optInResult.length > 0) {
          const result = optInResult[0] as any;
          const isNewsletter = result.campaign_type === 'email';
          
          // Check specific opt-in based on email type
          if (isNewsletter) {
            // For newsletters (campaign type='email'), check opt2
            if (!result.opt2) {
              console.log(`⏭️  Skipping newsletter for ${queueItem.email} - opt2 disabled`);
              await this.updateQueueStatus(queueItem.id, 'skipped', 'Contact opted out of newsletters (opt2)');
              await this.logEmailAction(queueItem, 'skipped', 'Contact opted out of newsletters (opt2)');
              return;
            }
          } else {
            // For campaigns (all other types), check opt1
            if (!result.opt1) {
              console.log(`⏭️  Skipping campaign for ${queueItem.email} - opt1 disabled`);
              await this.updateQueueStatus(queueItem.id, 'skipped', 'Contact opted out of campaigns (opt1)');
              await this.logEmailAction(queueItem, 'skipped', 'Contact opted out of campaigns (opt1)');
              return;
            }
          }
        }
      }
      
      // Update status to 'sending'
      await this.updateQueueStatus(queueItem.id, 'sending');

      // Get campaign data
      const campaignData = await this.getCampaignData(queueItem.campaign_id);
      
      // Send email using current send metadata or defaults
      const subject = this.currentSendMetadata?.subjectLine || campaignData.subject_line;
      const senderName = this.currentSendMetadata?.senderName || campaignData.sender_name;
      const senderEmail = this.currentSendMetadata?.senderEmail || campaignData.sender_email;
      
      const result = await emailService.sendEmail({
        to: queueItem.email,
        subject: subject,
        html: campaignData.html_content,
        from: `${senderName} <${senderEmail}>`
      });

      if (result.success) {
        // Update queue status to 'sent'
        await this.updateQueueStatus(queueItem.id, 'sent', result.response);
        
        // Log success
        await this.logEmailAction(queueItem, 'sent', result.response);
        
        // Update campaign stats
        await this.updateCampaignStats(queueItem.campaign_id, 'sent');
        
        console.log(`✅ Email sent successfully to ${queueItem.email}`);
      } else {
        // Check if this is an SMTP transport failure
        const isSmtpFailure = result.error && result.error.includes('SMTP Transport Failed');
        
        if (isSmtpFailure) {
          console.error(`❌ SMTP Transport failure for ${queueItem.email}: ${result.error}`);
          // Don't retry SMTP failures - mark as failed immediately
          await this.updateQueueStatus(queueItem.id, 'failed', result.error, queueItem.max_attempts);
          await this.logEmailAction(queueItem, 'failed', result.error);
          await this.updateCampaignStats(queueItem.campaign_id, 'failed');
          throw new Error(`SMTP Transport Failed: ${result.error}`);
        } else {
          // Handle other types of failures (retry logic)
          await this.handleEmailFailure(queueItem, result.error || 'Unknown error');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if this is an SMTP-related error
      if (errorMessage.includes('SMTP')) {
        console.error(`❌ SMTP error for ${queueItem.email}: ${errorMessage}`);
        // Mark as failed immediately for SMTP errors
        await this.updateQueueStatus(queueItem.id, 'failed', errorMessage, queueItem.max_attempts);
        await this.logEmailAction(queueItem, 'failed', errorMessage);
        await this.updateCampaignStats(queueItem.campaign_id, 'failed');
        throw error; // Re-throw to be caught by processBatch
      } else {
        // Handle other errors normally
        await this.handleEmailFailure(queueItem, errorMessage);
      }
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
      SELECT id, 
             COALESCE(content, 'No content available') as html_content
      FROM campaigns 
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [campaignId]);
    
    // Check if campaign exists
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    const campaign = result[0] as any;
    
    // Return default values since the table doesn't have these columns
    return {
      id: campaign.id,
      subject_line: 'No Subject', // Will be overridden by provided values
      html_content: campaign.html_content,
      sender_name: 'CRM System', // Will be overridden by provided values
      sender_email: 'campaigns@2bentrods.com.au' // Will be overridden by provided values
    };
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
      UPDATE email_sends 
      SET ${field} = ${field} + 1,
          pending_count = pending_count - 1,
          status = CASE 
            WHEN pending_count - 1 = 0 THEN 'completed'
            ELSE status 
          END,
          completed_at = CASE 
            WHEN pending_count - 1 = 0 THEN CURRENT_TIMESTAMP
            ELSE completed_at 
          END
      WHERE campaign_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    await executeQuery(query, [campaignId]);
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
    skipped: number;
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
      retry: 0,
      skipped: 0
    };
    
    if (Array.isArray(result)) {
      result.forEach((row: any) => {
        if (stats.hasOwnProperty(row.status)) {
          stats[row.status as keyof typeof stats] = row.count;
        }
      });
    }
    
    return stats;
  }
}

export const emailQueueProcessor = new EmailQueueProcessor();
