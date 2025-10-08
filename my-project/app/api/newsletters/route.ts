// Create a new newsletter (campaign with type 'email')
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const result = await executeQuery(
  `INSERT INTO newsletters (title, date, status, content, design) VALUES (?, ?, ?, ?, ?)`,
  [data.title, data.date, data.status, data.content, JSON.stringify(data.design || {})]
    );
    // If result.insertId is not available, return a generic success response
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create newsletter" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// Get all newsletters (campaigns with type 'email')
export async function GET() {
  try {
    const newsletters = await executeQuery(
  "SELECT * FROM newsletters ORDER BY date DESC",
  []
    );
    return NextResponse.json({ newsletters });
  } catch (error) {
    console.error("Fetch newsletters error:", error);
    return NextResponse.json({ error: "Failed to fetch newsletters" }, { status: 500 });
  }
}
