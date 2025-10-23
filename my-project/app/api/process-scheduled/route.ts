import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";
import { emailQueueProcessor } from "@/app/lib/emailQueue";

// Process scheduled emails that are due
export async function POST() {
  try {
    console.log("🕐 Processing scheduled emails...");
    
    // Get scheduled emails that are due (accounting for Brisbane timezone)
    // Brisbane is UTC+10, so we need to add 10 hours to server time for comparison
    const now = new Date();
    const brisbaneNow = new Date(now.getTime() + (10 * 60 * 60 * 1000));
    
    console.log("Server time:", now.toISOString());
    console.log("Brisbane time for comparison:", brisbaneNow.toISOString());
    
    const dueSchedules = await executeQuery(`
      SELECT es.*, c.title as campaign_title, c.content, c.design 
      FROM email_schedule es
      JOIN campaigns c ON es.campaign_id = c.id
      WHERE es.status = 'scheduled' 
      AND es.scheduled_at <= ?
    `, [brisbaneNow.toISOString()]);
    
    console.log(`Found ${Array.isArray(dueSchedules) ? dueSchedules.length : 0} due scheduled emails`);
    
    if (!Array.isArray(dueSchedules) || dueSchedules.length === 0) {
      return NextResponse.json({ 
        message: "No scheduled emails due for sending",
        processedCount: 0 
      });
    }
    
    let processedCount = 0;
    
    for (const schedule of dueSchedules) {
      console.log(`Processing schedule ${schedule.id} for campaign ${schedule.campaign_id}`);
      
      try {
        // Get contacts for this schedule
        let contacts = [];
        
        if (schedule.recipient_type === 'all') {
          contacts = await executeQuery("SELECT id, email, name FROM contacts");
        } else if (schedule.recipient_type === 'group' && schedule.recipient_group) {
          contacts = await executeQuery("SELECT id, email, name FROM contacts WHERE `group` = ?", [schedule.recipient_group]);
        } else if (schedule.recipient_type === 'individual' && schedule.recipient_email) {
          contacts = [{ id: null, email: schedule.recipient_email, name: 'Individual' }];
        }
        
        // Add contacts to email queue
        for (const contact of contacts) {
          await executeQuery(
            `INSERT INTO email_queue (campaign_id, contact_id, email, status, created_at) VALUES (?, ?, ?, 'pending', NOW())`,
            [schedule.campaign_id, contact.id, contact.email]
          );
        }
        
        // Mark schedule as sent
        await executeQuery(
          `UPDATE email_schedule SET status = 'sent', updated_at = NOW() WHERE id = ?`,
          [schedule.id]
        );
        
        console.log(`✅ Processed schedule ${schedule.id}: ${contacts.length} emails queued`);
        processedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to process schedule ${schedule.id}:`, error);
        
        // Mark schedule as failed
        await executeQuery(
          `UPDATE email_schedule SET status = 'failed', updated_at = NOW() WHERE id = ?`,
          [schedule.id]
        );
      }
    }
    
    console.log(`🎉 Processed ${processedCount} scheduled emails`);
    
    // Trigger email queue processing
    if (processedCount > 0) {
      console.log("🚀 Triggering email queue processing...");
      await emailQueueProcessor.triggerProcessing();
    }
    
    return NextResponse.json({
      message: `Processed ${processedCount} scheduled emails`,
      processedCount,
      totalFound: dueSchedules.length
    });
    
  } catch (error) {
    console.error("Process scheduled emails error:", error);
    return NextResponse.json({ 
      error: "Failed to process scheduled emails",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}