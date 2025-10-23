import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";
import { emailQueueProcessor } from "@/app/lib/emailQueue";

interface SendCampaignRequest {
  campaignId: number;
  contactIds?: number[];
  targetGroups?: string[];
  individualEmail?: string;
  individualEmails?: string[];
  sendImmediately?: boolean;
  scheduledAt?: string;
  subjectLine?: string;
  senderName?: string;
  senderEmail?: string;
}

export async function PUT(request: NextRequest) {
  try {
    const body: SendCampaignRequest = await request.json();
    const { 
      campaignId, 
      contactIds, 
      targetGroups, 
      individualEmail, 
      individualEmails, 
      sendImmediately = false, 
      scheduledAt,
      subjectLine,
      senderName,
      senderEmail
    } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Validate scheduled time if provided
    if (scheduledAt && !sendImmediately) {
      const scheduledDate = new Date(scheduledAt);
      const now = new Date();
      
      // Add a 1-minute buffer to account for processing time
      const minScheduleTime = new Date(now.getTime() + 60 * 1000);
      
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduled date format" },
          { status: 400 }
        );
      }
      
      if (scheduledDate <= minScheduleTime) {
        return NextResponse.json(
          { error: "Scheduled time must be at least 1 minute in the future" },
          { status: 400 }
        );
      }
    }

    // Get campaign details
    const campaignResult = await executeQuery(
      `SELECT * FROM campaigns WHERE id = ?`,
      [campaignId]
    );

    if (!campaignResult || !Array.isArray(campaignResult) || campaignResult.length === 0) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const campaign = campaignResult[0] as any;
    const isNewsletter = campaign.type === 'email';

    // Get recipients based on selection criteria with appropriate opt-in filtering
    let contacts: any[] = [];
    
    // Determine the opt-in field to check based on campaign type
    const optInField = isNewsletter ? 'opt2' : 'opt1';
    const emailTypeDesc = isNewsletter ? 'newsletters' : 'campaigns';
    
    // Handle individual emails first
    if (individualEmail || (individualEmails && individualEmails.length > 0)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailsToProcess = individualEmail ? [individualEmail] : individualEmails || [];
      
      // Validate all email formats
      for (const email of emailsToProcess) {
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            { error: `Invalid email format: ${email}` },
            { status: 400 }
          );
        }
      }
      
      // Create temporary contact objects for individual emails
      const individualContacts = emailsToProcess.map(email => ({
        id: 0, // Temporary ID for individual emails
        email: email,
        name: email.split('@')[0], // Use email prefix as name
        group: 'Individual'
      }));
      contacts = [...contacts, ...individualContacts];
    }
    
    // Handle specific contacts
    if (contactIds && contactIds.length > 0) {
      const placeholders = contactIds.map(() => '?').join(',');
      const contactResult = await executeQuery(
        `SELECT * FROM contacts WHERE id IN (${placeholders}) AND email IS NOT NULL AND email != '' AND ${optInField} = 1`,
        contactIds
      );
      contacts = [...contacts, ...(contactResult as any[])];
    }
    
    // Handle specific groups
    if (targetGroups && targetGroups.length > 0) {
      const placeholders = targetGroups.map(() => '?').join(',');
      const contactResult = await executeQuery(
        `SELECT * FROM contacts WHERE \`group\` IN (${placeholders}) AND email IS NOT NULL AND email != '' AND ${optInField} = 1`,
        targetGroups
      );
      contacts = [...contacts, ...(contactResult as any[])];
    }
    
    // If no specific recipients selected, send to all contacts with appropriate opt-ins
    if (contacts.length === 0) {
      const contactResult = await executeQuery(
        `SELECT * FROM contacts WHERE email IS NOT NULL AND email != '' AND ${optInField} = 1`,
        []
      );
      contacts = contactResult as any[];
    }
    
    // Remove duplicate emails
    const uniqueContacts = contacts.filter((contact, index, self) => 
      index === self.findIndex(c => c.email === contact.email)
    );
    contacts = uniqueContacts;

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: `No valid recipients found with ${emailTypeDesc} opt-in enabled` },
        { status: 400 }
      );
    }

    // Create email_sends record to track this send operation
    const emailSendResult = await executeQuery(
      `INSERT INTO email_sends (campaign_id, total_recipients, pending_count, status, send_type, scheduled_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        campaignId, 
        contacts.length, 
        contacts.length, 
        sendImmediately ? 'queued' : 'queued',
        sendImmediately ? 'immediate' : 'scheduled',
        scheduledAt || null
      ]
    );
    
    // Store subject line and sender info for this send operation
    // We'll use a simple approach: store in a JSON field or use the campaign title
    const sendMetadata = {
      subjectLine: subjectLine || 'No Subject',
      senderName: senderName || 'CRM System',
      senderEmail: 'campaigns@2bentrods.com.au'
    };

    const emailSendId = (emailSendResult as any).insertId;

    // Update campaign status (without touching total_recipients)
    await executeQuery(
      `UPDATE campaigns SET status = ?, updated_at = NOW() WHERE id = ?`,
      ['scheduled', campaignId]
    );

    // Add emails to queue
    for (const contact of contacts) {
      // Ensure contact has required properties
      if (!contact || !contact.email) {
        console.warn('Skipping contact with missing email:', contact);
        continue;
      }
      
      if (contact.id === 0 || contact.id === null || contact.id === undefined) {
        // Individual email - insert with NULL contact_id
        await executeQuery(
          `INSERT INTO email_queue (campaign_id, contact_id, email, status, created_at) VALUES (?, NULL, ?, 'pending', NOW())`,
          [campaignId, contact.email]
        );
      } else {
        // Regular contact
        await executeQuery(
          `INSERT INTO email_queue (campaign_id, contact_id, email, status, created_at) VALUES (?, ?, ?, 'pending', NOW())`,
          [campaignId, contact.id, contact.email]
        );
      }
    }

    // Update email_sends status if sending immediately
    if (sendImmediately) {
      await executeQuery(
        `UPDATE email_sends SET status = 'sending', started_at = NOW() WHERE id = ?`,
        [emailSendId]
      );
    }

    // If sending immediately, trigger queue processing with metadata
    if (sendImmediately) {
      // Pass metadata to the queue processor
      (emailQueueProcessor as any).currentSendMetadata = sendMetadata;
      // Start queue processing in background
      emailQueueProcessor.triggerProcessing().catch(error => {
        console.error('Error triggering queue processing:', error);
      });
    }

    // If scheduled, create or update entry in email_schedule
    let createdScheduleId: number | null = null;
    if (scheduledAt && !sendImmediately) {
      // Create or update an entry in email_schedule so the calendar/schedule UI can display this send
      try {
        // Determine recipient type for schedule tracking
        let recipientType: string = 'all';
        let recipientEmail: string | null = null;
        let recipientGroup: string | null = null;

        if ((individualEmails && individualEmails.length > 0) || individualEmail) {
          recipientType = 'individual';
          recipientEmail = (individualEmails && individualEmails.length > 0) ? individualEmails[0] : (individualEmail || null);
        } else if (targetGroups && targetGroups.length > 0) {
          recipientType = 'group';
          recipientGroup = targetGroups.join(',');
        } else if (contactIds && contactIds.length > 0) {
          recipientType = 'all';
        }

        // Try to find existing schedule for this campaign at same time
        const existing = await executeQuery(
          `SELECT id FROM email_schedule WHERE campaign_id = ? AND scheduled_at = ? LIMIT 1`,
          [campaignId, scheduledAt]
        ) as any[];

        if (existing && existing.length > 0) {
          const existingId = existing[0].id;
          await executeQuery(
            `UPDATE email_schedule SET status = 'scheduled', recipient_type = ?, recipient_email = ?, recipient_group = ?, updated_at = NOW() WHERE id = ?`,
            [recipientType, recipientEmail, recipientGroup, existingId]
          );
          createdScheduleId = existingId;
        } else {
          const insertRes = await executeQuery(
            `INSERT INTO email_schedule (campaign_id, scheduled_at, status, recipient_type, recipient_email, recipient_group, created_at, updated_at)
             VALUES (?, ?, 'scheduled', ?, ?, ?, NOW(), NOW())`,
            [campaignId, scheduledAt, recipientType, recipientEmail, recipientGroup]
          ) as any;
          createdScheduleId = insertRes?.insertId ?? null;
        }
      } catch (err) {
        console.error('Failed to upsert email_schedule entry:', err);
        // Don't fail the whole request for a schedule insert/update error - campaign was already updated and queue entries created
      }
    }

    const responsePayload: any = {
      success: true,
      message: sendImmediately ? "Campaign queued and processing started" : "Campaign scheduled successfully",
      queuedCount: contacts.length,
      campaignId: campaignId
    };
    if (createdScheduleId) responsePayload.scheduleId = createdScheduleId;
    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error("Send campaign error:", error);
    return NextResponse.json(
      { error: "Failed to send campaign" },
      { status: 500 }
    );
  }
}

// Get campaign statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');

    if (campaignId) {
      // Get specific campaign with email_sends stats
      const campaignResult = await executeQuery(
        `SELECT c.*, 
         es.total_recipients,
         es.sent_count,
         es.failed_count,
         es.pending_count,
         es.status as send_status,
         es.send_type,
         es.scheduled_at as email_scheduled_at,
         es.started_at,
         es.completed_at,
         COUNT(eq.id) as total_queued,
         SUM(CASE WHEN eq.status = 'sent' THEN 1 ELSE 0 END) as queue_sent_count,
         SUM(CASE WHEN eq.status = 'failed' THEN 1 ELSE 0 END) as queue_failed_count,
         SUM(CASE WHEN eq.status = 'pending' THEN 1 ELSE 0 END) as queue_pending_count,
         SUM(CASE WHEN eq.status = 'sending' THEN 1 ELSE 0 END) as queue_sending_count
         FROM campaigns c
         LEFT JOIN email_sends es ON c.id = es.campaign_id
         LEFT JOIN email_queue eq ON c.id = eq.campaign_id
         WHERE c.id = ?
         GROUP BY c.id, es.id`,
        [campaignId]
      );

      if (!campaignResult || !Array.isArray(campaignResult) || campaignResult.length === 0) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ campaign: campaignResult[0] });
    } else {
      // Get all campaigns with email_sends stats
      const campaigns = await executeQuery(
        `SELECT c.*, 
         es.total_recipients,
         es.sent_count,
         es.failed_count,
         es.pending_count,
         es.status as send_status,
         es.send_type,
         es.scheduled_at as email_scheduled_at,
         es.started_at,
         es.completed_at,
         COUNT(eq.id) as total_queued,
         SUM(CASE WHEN eq.status = 'sent' THEN 1 ELSE 0 END) as queue_sent_count,
         SUM(CASE WHEN eq.status = 'failed' THEN 1 ELSE 0 END) as queue_failed_count
         FROM campaigns c
         LEFT JOIN email_sends es ON c.id = es.campaign_id
         LEFT JOIN email_queue eq ON c.id = eq.campaign_id
         GROUP BY c.id, es.id
         ORDER BY c.created_at DESC`,
        []
      );

      return NextResponse.json({ campaigns });
    }
  } catch (error) {
    console.error("Get campaigns error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}
