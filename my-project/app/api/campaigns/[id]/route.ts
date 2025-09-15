import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

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
        title,
        date,
        type,
        status,
        Array.isArray(targetGroups) ? targetGroups.join(",") : targetGroups,
        content,
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