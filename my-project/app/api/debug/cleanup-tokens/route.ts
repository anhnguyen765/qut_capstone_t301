import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Clean up expired tokens
    const result = await executeQuery(
      "DELETE FROM password_resets WHERE expires_at < UTC_TIMESTAMP() OR used = TRUE"
    );
    
    return NextResponse.json({
      message: "Expired tokens cleaned up",
      result
    });

  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({
      error: "Cleanup failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}