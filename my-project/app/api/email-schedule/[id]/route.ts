import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// Update an email schedule
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid schedule ID" }, { status: 400 });
    }
    
    const body = await request.json();
    const { 
      scheduledAt, 
      status, 
      recipientType, 
      recipientEmail, 
      recipientGroup,
      sentAt,
      errorMessage
    } = body;

    await executeQuery(
      `UPDATE email_schedule SET 
       scheduled_at=?, 
       status=?, 
       recipient_type=?, 
       recipient_email=?, 
       recipient_group=?, 
       sent_at=?, 
       error_message=?, 
       updated_at=NOW() 
       WHERE id=?`,
      [
        scheduledAt || null,
        status || null,
        recipientType || null,
        recipientEmail || null,
        recipientGroup || null,
        sentAt || null,
        errorMessage || null,
        id
      ]
    );

    return NextResponse.json({ message: "Email schedule updated successfully" });
  } catch (error) {
    console.error("Update email schedule error:", error);
    return NextResponse.json({ error: "Failed to update email schedule" }, { status: 500 });
  }
}

// Delete an email schedule
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid schedule ID" }, { status: 400 });
    }

    await executeQuery(
      `DELETE FROM email_schedule WHERE id=?`,
      [id]
    );

    return NextResponse.json({ message: "Email schedule deleted successfully" });
  } catch (error) {
    console.error("Delete email schedule error:", error);
    return NextResponse.json({ error: "Failed to delete email schedule" }, { status: 500 });
  }
}
