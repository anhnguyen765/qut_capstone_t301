import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Test timezone information - MariaDB compatible
    const timezoneInfo = await executeQuery("SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz, NOW() as now_time, UTC_TIMESTAMP() as utc_time");
    
    // Get a sample scheduled email
    const sampleSchedule = await executeQuery(
      "SELECT id, campaign_id, scheduled_at FROM email_schedule ORDER BY id DESC LIMIT 1"
    );
    
    console.log("=== DATABASE TIMEZONE TEST ===");
    console.log("Timezone info:", timezoneInfo);
    console.log("Sample schedule:", sampleSchedule);
    console.log("Server Date.now():", new Date());
    console.log("Server timezone:", process.env.TZ || "undefined");
    console.log("=== END TEST ===");

    return NextResponse.json({
      timezoneInfo: Array.isArray(timezoneInfo) ? timezoneInfo : [timezoneInfo],
      sampleSchedule: Array.isArray(sampleSchedule) ? sampleSchedule : [sampleSchedule],
      serverTime: new Date(),
      serverTimezone: process.env.TZ || "undefined",
      nodeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (error) {
    console.error("Timezone test error:", error);
    return NextResponse.json({ 
      error: "Failed to test timezone", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}