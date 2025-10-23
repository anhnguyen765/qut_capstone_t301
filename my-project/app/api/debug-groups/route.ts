import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple test without database
    return NextResponse.json({
      status: "API is working",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Debug API Error:", error);
    return NextResponse.json(
      { 
        error: "Debug API failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}