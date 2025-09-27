import { NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// Get all newsletters (campaigns with type 'email')
export async function GET() {
  try {
    const newsletters = await executeQuery(
      "SELECT * FROM campaigns WHERE type = 'email' ORDER BY date DESC", 
      []
    );
    return NextResponse.json({ newsletters });
  } catch (error) {
    console.error("Fetch newsletters error:", error);
    return NextResponse.json({ error: "Failed to fetch newsletters" }, { status: 500 });
  }
}
