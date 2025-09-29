import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// Get email send statistics for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (campaignId) {
      // Get specific email send record for a campaign
      const emailSendResult = await executeQuery(
        `SELECT * FROM email_sends WHERE campaign_id = ? ORDER BY created_at DESC LIMIT 1`,
        [campaignId]
      );

      if (!emailSendResult || !Array.isArray(emailSendResult) || emailSendResult.length === 0) {
        return NextResponse.json(
          { error: "No email send record found for this campaign" },
          { status: 404 }
        );
      }

      return NextResponse.json({ emailSend: emailSendResult[0] });
    } else {
      // Get all email send records
      const emailSends = await executeQuery(
        `SELECT es.*, c.title as campaign_title, c.subject_line 
         FROM email_sends es 
         LEFT JOIN campaigns c ON es.campaign_id = c.id 
         ORDER BY es.created_at DESC`,
        []
      );

      return NextResponse.json({ emailSends });
    }
  } catch (error) {
    console.error("Get email sends error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email sends" },
      { status: 500 }
    );
  }
}

// Update email send statistics (called by email queue processor)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      campaignId, 
      sentCount, 
      failedCount, 
      pendingCount, 
      status 
    } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Update the latest email send record for this campaign
    const updateFields = [];
    const updateValues = [];

    if (sentCount !== undefined) {
      updateFields.push('sent_count = ?');
      updateValues.push(sentCount);
    }
    if (failedCount !== undefined) {
      updateFields.push('failed_count = ?');
      updateValues.push(failedCount);
    }
    if (pendingCount !== undefined) {
      updateFields.push('pending_count = ?');
      updateValues.push(pendingCount);
    }
    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(campaignId);

    await executeQuery(
      `UPDATE email_sends SET ${updateFields.join(', ')} WHERE campaign_id = ? ORDER BY created_at DESC LIMIT 1`,
      updateValues
    );

    return NextResponse.json({
      success: true,
      message: "Email send statistics updated successfully"
    });

  } catch (error) {
    console.error("Update email sends error:", error);
    return NextResponse.json(
      { error: "Failed to update email send statistics" },
      { status: 500 }
    );
  }
}

