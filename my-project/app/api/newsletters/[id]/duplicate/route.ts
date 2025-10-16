import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Newsletter ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Fetch the original newsletter
    const originalNewsletter = await executeQuery(
      `SELECT * FROM newsletters WHERE id = ?`,
      [id]
    );

    if (!originalNewsletter || originalNewsletter.length === 0) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }

    const original = originalNewsletter[0];

    // Create duplicate newsletter
    const result = await executeQuery(
      `INSERT INTO newsletters (title, date, status, content, design, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title.trim(),
        original.date,
        'draft', // Always create duplicates as draft
        original.content,
        original.design
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: "Newsletter duplicated successfully"
    });

  } catch (error) {
    console.error("Duplicate newsletter error:", error);
    return NextResponse.json({ error: "Failed to duplicate newsletter" }, { status: 500 });
  }
}
