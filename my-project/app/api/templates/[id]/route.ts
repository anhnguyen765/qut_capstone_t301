import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }
    const results = await executeQuery(
      "SELECT id, name, subject, design, content, created_at, updated_at, type FROM templates WHERE id = ?",
      [id]
    );
    const template = Array.isArray(results) && results.length ? (results as any)[0] : null;
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ template });
  } catch (error) {
    console.error("Fetch template by id error:", error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { name, subject, design, content, type } = body;

    if (!name || !subject || !design) {
      return NextResponse.json(
        { error: "Name, subject, and design are required" },
        { status: 400 }
      );
    }

    const templateType = (type === 'newsletter' ? 'newsletter' : 'campaign');
    await executeQuery(
      `UPDATE templates SET name = ?, subject = ?, type = ?, design = ?, content = ?, updated_at = NOW() WHERE id = ?`,
      [name.trim(), subject.trim(), templateType, JSON.stringify(design), content ?? null, id]
    );

    return NextResponse.json({
      success: true,
      message: "Template updated successfully"
    });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}


