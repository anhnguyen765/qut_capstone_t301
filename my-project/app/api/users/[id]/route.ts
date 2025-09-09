import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// PUT: Update user (disable/enable)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { is_active } = await request.json();
    const userId = params.id;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
    }

    await executeQuery(
      "UPDATE users SET is_active = ? WHERE id = ?",
      [is_active ? 1 : 0, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
