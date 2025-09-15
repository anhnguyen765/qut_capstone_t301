import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";
import { emailQueueProcessor } from "@/app/lib/emailQueue";

interface ScheduleEmailRequest {
  campaignId: number;
  scheduledAt: string;
  recipientType: 'all' | 'group' | 'individual';
  recipientEmail?: string;
  recipientGroup?: string;
  contactIds?: number[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleEmailRequest = await request.json();
    const { campaignId, scheduledAt, recipientType, recipientEmail, recipientGroup, contactIds } = body;

    if (!campaignId || !scheduledAt) {
      return NextResponse.json(
        { error: "Campaign ID and scheduled time are required" },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    if (scheduledDate <= now) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    // Get campaign details
    const campaignResult = await executeQuery(
      `SELECT * FROM campaigns WHERE id = ?`,
      [campaignId]
    );

    if (!campaignResult || campaignResult.length === 0) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const campaign = campaignResult[0] as any;

    // Get recipients based on type
    let contacts: any[] = [];
    
    switch (recipientType) {
      case 'individual':
        if (recipientEmail) {
          const contactResult = await executeQuery(
            `SELECT * FROM contacts WHERE email = ?`,
            [recipientEmail]
          );
          contacts = contactResult as any[];
        }
        break;
        
      case 'group':
        if (recipientGroup) {
          const contactResult = await executeQuery(
            `SELECT * FROM contacts WHERE \`group\` = ? AND email IS NOT NULL AND email != ''`,
            [recipientGroup]
          );
          contacts = contactResult as any[];
        }
        break;
        
      case 'all':
      default:
        if (contactIds && contactIds.length > 0) {
          const placeholders = contactIds.map(() => '?').join(',');
          const contactResult = await executeQuery(
            `SELECT * FROM contacts WHERE id IN (${placeholders}) AND email IS NOT NULL AND email != ''`,
            contactIds
          );
          contacts = contactResult as any[];
        } else {
          const contactResult = await executeQuery(
            `SELECT * FROM contacts WHERE email IS NOT NULL AND email != ''`,
            []
          );
          contacts = contactResult as any[];
        }
        break;
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No valid recipients found" },
        { status: 400 }
      );
    }

    // Update campaign with scheduled time
    await executeQuery(
      `UPDATE campaigns SET 
       status = 'scheduled', 
       scheduled_at = ?, 
       total_recipients = ?,
       updated_at = NOW() 
       WHERE id = ?`,
      [scheduledAt, contacts.length, campaignId]
    );

    // Add emails to queue with scheduled status
    const queueInserts = contacts.map(contact => ({
      query: `INSERT INTO email_queue (campaign_id, contact_id, email, status, created_at) VALUES (?, ?, ?, 'pending', NOW())`,
      params: [campaignId, contact.id, contact.email]
    }));

    for (const insert of queueInserts) {
      await executeQuery(insert.query, insert.params);
    }

    // Create schedule entry for tracking
    await executeQuery(
      `INSERT INTO email_schedule (campaign_id, scheduled_at, status, recipient_type, recipient_email, recipient_group, created_at, updated_at)
       VALUES (?, ?, 'scheduled', ?, ?, ?, NOW(), NOW())`,
      [campaignId, scheduledAt, recipientType, recipientEmail || null, recipientGroup || null]
    );

    return NextResponse.json({
      success: true,
      message: "Email scheduled successfully",
      scheduledAt: scheduledAt,
      recipientCount: contacts.length,
      campaignId: campaignId
    });

  } catch (error) {
    console.error("Schedule email error:", error);
    return NextResponse.json(
      { error: "Failed to schedule email" },
      { status: 500 }
    );
  }
}

// Get scheduled emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let query = `
      SELECT es.*, c.title, c.subject_line, c.sender_name, c.sender_email
      FROM email_schedule es
      JOIN campaigns c ON es.campaign_id = c.id
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];

    if (date) {
      conditions.push('DATE(es.scheduled_at) = ?');
      params.push(date);
    }

    if (status) {
      conditions.push('es.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY es.scheduled_at ASC`;

    const result = await executeQuery(query, params);

    return NextResponse.json({ scheduledEmails: result });

  } catch (error) {
    console.error("Get scheduled emails error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled emails" },
      { status: 500 }
    );
  }
}

// Update scheduled email
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduleId, scheduledAt, status } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (scheduledAt) {
      updates.push('scheduled_at = ?');
      params.push(scheduledAt);
    }

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');
    params.push(scheduleId);

    await executeQuery(
      `UPDATE email_schedule SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return NextResponse.json({
      success: true,
      message: "Schedule updated successfully"
    });

  } catch (error) {
    console.error("Update schedule error:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// Cancel scheduled email
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Update schedule status to cancelled
    await executeQuery(
      `UPDATE email_schedule SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
      [scheduleId]
    );

    // Get campaign ID to update campaign status
    const scheduleResult = await executeQuery(
      `SELECT campaign_id FROM email_schedule WHERE id = ?`,
      [scheduleId]
    );

    if (scheduleResult && scheduleResult.length > 0) {
      const campaignId = (scheduleResult[0] as any).campaign_id;
      
      // Update campaign status
      await executeQuery(
        `UPDATE campaigns SET status = 'draft', scheduled_at = NULL WHERE id = ?`,
        [campaignId]
      );

      // Cancel pending emails in queue
      await executeQuery(
        `UPDATE email_queue SET status = 'cancelled' WHERE campaign_id = ? AND status = 'pending'`,
        [campaignId]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Scheduled email cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel schedule error:", error);
    return NextResponse.json(
      { error: "Failed to cancel schedule" },
      { status: 500 }
    );
  }
}
