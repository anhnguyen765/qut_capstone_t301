import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// Get a campaign by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const result = await executeQuery(
      `SELECT * FROM campaigns WHERE id = ?`,
      [id]
    );

    const campaign = Array.isArray(result) ? result[0] : result;
    
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Get campaign error:", error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

// Update a campaign by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }
    const body = await request.json();
    const { title, date, type, status, targetGroups, content, design } = body;

    await executeQuery(
      `UPDATE campaigns SET title=?, date=?, type=?, status=?, target_groups=?, content=?, design=?, updated_at=NOW() WHERE id=?`,
      [
        title || null,
        date || null,
        type || null,
        status || null,
        Array.isArray(targetGroups) ? targetGroups.join(",") : (targetGroups || null),
        content || null,
        design ? JSON.stringify(design) : null,
        id,
      ]
    );

    return NextResponse.json({ message: "Campaign updated successfully" });
  } catch (error) {
    console.error("Update campaign error:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}