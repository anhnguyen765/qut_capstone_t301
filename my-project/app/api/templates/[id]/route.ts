import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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


