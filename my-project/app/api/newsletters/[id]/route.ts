import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// Get, update, or delete a single newsletter (campaign with type 'email')
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const result = await executeQuery("SELECT * FROM newsletters WHERE id = ?", [id]) as any[];
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch newsletter" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const data = await req.json();
    await executeQuery(
      `UPDATE newsletters SET title = ?, date = ?, status = ?, content = ?, design = ? WHERE id = ?`,
      [data.title, data.date, data.status, data.content, JSON.stringify(data.design || {}), id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update newsletter" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    await executeQuery("DELETE FROM newsletters WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete newsletter" }, { status: 500 });
  }
}
