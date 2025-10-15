import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// Get, update, or delete a single newsletter (campaign with type 'email')
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const result = await executeQuery("SELECT * FROM newsletters WHERE id = ?", [id]) as any[];
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch newsletter" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const data = await req.json();
    await executeQuery(
      `UPDATE newsletters SET title = ?, date = ?, status = ?, content = ?, design = ? WHERE id = ?`,
      [data.title, data.date, data.status, data.content, JSON.stringify(data.design || {}), id]
    );

    // If the newsletter status is changed to scheduled, upsert an email_schedule entry
    let createdScheduleId: number | null = null;
    try {
      if (data.status === 'scheduled') {
        const scheduledAt = data.date || null;
        // Check for existing schedule for this newsletter at the same time
        const existing = await executeQuery(
          `SELECT id FROM email_schedule WHERE campaign_id = ? AND scheduled_at = ? LIMIT 1`,
          [id, scheduledAt]
        ) as any[];

        if (existing && existing.length > 0) {
          const existingId = existing[0].id;
          await executeQuery(
            `UPDATE email_schedule SET status = 'scheduled', recipient_type = 'all', recipient_email = NULL, recipient_group = NULL, updated_at = NOW() WHERE id = ?`,
            [existingId]
          );
          createdScheduleId = existingId;
        } else {
          const insertRes = await executeQuery(
            `INSERT INTO email_schedule (campaign_id, scheduled_at, status, recipient_type, recipient_email, recipient_group, created_at, updated_at)
             VALUES (?, ?, 'scheduled', 'all', NULL, NULL, NOW(), NOW())`,
            [id, scheduledAt]
          ) as any;
          createdScheduleId = insertRes?.insertId ?? null;
        }
      }
    } catch (err) {
      console.error('Failed to upsert email_schedule for newsletter:', err);
      // don't fail the main update
    }
    const resPayload: any = { success: true };
    if (createdScheduleId) resPayload.scheduleId = createdScheduleId;
    return NextResponse.json(resPayload);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update newsletter" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    await executeQuery("DELETE FROM newsletters WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete newsletter" }, { status: 500 });
  }
}
