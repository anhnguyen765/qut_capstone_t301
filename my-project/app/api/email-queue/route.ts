import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";
import { emailQueueProcessor } from "@/app/lib/emailQueue";

// Get queue statistics
export async function GET() {
  try {
    const stats = await emailQueueProcessor.getQueueStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Get queue stats error:", error);
    return NextResponse.json({ error: "Failed to get queue stats" }, { status: 500 });
  }
}

// Trigger queue processing
export async function POST() {
  try {
    await emailQueueProcessor.triggerProcessing();
    return NextResponse.json({ message: "Queue processing triggered" });
  } catch (error) {
    console.error("Trigger queue processing error:", error);
    return NextResponse.json({ error: "Failed to trigger queue processing" }, { status: 500 });
  }
}
