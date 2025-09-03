export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaign_id, scheduled_at, recipientType, email, group } = body;
    // You can expand this logic to handle group/all as needed
    await executeQuery(
      `INSERT INTO email_schedule (campaign_id, scheduled_at, status, created_at, updated_at, recipient_type, recipient_email, recipient_group)
       VALUES (?, ?, 'pending', NOW(), NOW(), ?, ?, ?)`,
      [campaign_id, scheduled_at, recipientType, email || null, group || null]
    );
    return NextResponse.json({ message: "Email scheduled successfully" });
  } catch (error) {
    console.error("Schedule email error:", error);
    return NextResponse.json({ error: "Failed to schedule email" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Join with campaigns to get campaign title
    const schedules = await executeQuery(
      `SELECT es.*, c.title as campaign_title FROM email_schedule es
       JOIN campaigns c ON es.campaign_id = c.id`
    );
    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Fetch email schedules error:", error);
    return NextResponse.json({ error: "Failed to fetch email schedules" }, { status: 500 });
  }
}
