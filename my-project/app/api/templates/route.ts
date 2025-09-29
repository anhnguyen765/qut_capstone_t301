import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// GET: List all templates
export async function GET() {
  const rows = await executeQuery("SELECT * FROM templates ORDER BY updated_at DESC");
  return NextResponse.json({ templates: rows });
}

// POST: Create a new template
export async function POST(req: NextRequest) {
  const { name, subject, content } = await req.json();
  if (!name || !subject || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  await executeQuery(
    "INSERT INTO templates (name, subject, content) VALUES (?, ?, ?)",
    [name, subject, content]
  );
  return NextResponse.json({ success: true });
}

// PUT: Update a template
export async function PUT(req: NextRequest) {
  const { id, name, subject, content } = await req.json();
  if (!id || !name || !subject || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  await executeQuery(
    "UPDATE templates SET name=?, subject=?, content=? WHERE id=?",
    [name, subject, content, id]
  );
  return NextResponse.json({ success: true });
}

// DELETE: Delete a template
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await executeQuery("DELETE FROM templates WHERE id=?", [id]);
  return NextResponse.json({ success: true });
}
