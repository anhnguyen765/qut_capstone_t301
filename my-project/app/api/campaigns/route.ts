import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// Get all campaigns
export async function GET() {
  try {
    const campaigns = await executeQuery("SELECT * FROM campaigns ORDER BY date DESC", []);
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Fetch campaigns error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

// Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      date, 
      type, 
      status, 
      targetGroups, 
      content, 
      design, 
      createdBy
    } = body;
    
    const result = await executeQuery(
      `INSERT INTO campaigns (title, date, type, status, target_groups, content, design, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title || null,
        date || new Date().toISOString().split('T')[0],
        type || null,
        status || "draft",
        Array.isArray(targetGroups) ? targetGroups.join(",") : (targetGroups || null),
        content || null,
        design ? JSON.stringify(design) : null,
        createdBy || null,
      ]
    );
    // If result is an array, insertId may be on result[0] or not available
    const insertId = (result as any)?.insertId || (Array.isArray(result) && (result[0] as any)?.insertId) || null;
    return NextResponse.json({ id: insertId, message: "Campaign created successfully" });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}