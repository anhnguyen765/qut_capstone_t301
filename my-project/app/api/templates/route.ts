import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// GET: List all templates
export async function GET() {
  try {
    const templates = await executeQuery(
      "SELECT * FROM templates ORDER BY updated_at DESC"
    );
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Fetch templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST: Create a new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, design } = body;

    if (!name || !subject || !design) {
      return NextResponse.json(
        { error: "Name, subject, and design are required" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO templates (name, subject, design) VALUES (?, ?, ?)`,
      [name.trim(), subject.trim(), JSON.stringify(design)]
    );

    const templateId = (result as any)?.insertId;

    return NextResponse.json({
      success: true,
      message: "Template created successfully",
      templateId: templateId
    });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// PUT: Update a template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, subject, design } = body;

    if (!id || !name || !subject || !design) {
      return NextResponse.json(
        { error: "ID, name, subject, and design are required" },
        { status: 400 }
      );
    }

    await executeQuery(
      `UPDATE templates SET name = ?, subject = ?, design = ?, updated_at = NOW() WHERE id = ?`,
      [name.trim(), subject.trim(), JSON.stringify(design), id]
    );

    return NextResponse.json({
      success: true,
      message: "Template updated successfully"
    });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    await executeQuery(
      `DELETE FROM templates WHERE id = ?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully"
    });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}