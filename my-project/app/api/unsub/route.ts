import { NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function POST(req: Request) {
  try {
    const { email, opt1, opt2, opt3 } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    // Update preferences for the contact with this email
    // Store numeric values: 1 = subscribed/true, 0 = unsubscribed/false
    const result = await executeQuery(
      `UPDATE contacts SET opt1=?, opt2=?, opt3=? WHERE email=?`,
      [opt1 ? 1 : 0, opt2 ? 1 : 0, opt3 ? 1 : 0, email]
    );
    // Handle both ResultSetHeader and array result (for db util compatibility)
    let affectedRows = 0;
    if (Array.isArray(result)) {
      if (result.length > 0 && typeof result[0] === 'object' && result[0] !== null && 'affectedRows' in result[0]) {
        affectedRows = (result[0] as any).affectedRows ?? 0;
      }
    } else if (result && typeof result === 'object' && 'affectedRows' in result) {
      affectedRows = (result as any).affectedRows ?? 0;
    }
    if (affectedRows === 0) {
      return NextResponse.json({ error: "No contact found with that email." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update preferences." }, { status: 500 });
  }
}
