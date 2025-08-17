import { NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET() {
  try {
    const contacts = await executeQuery(`
      SELECT 
        id,
        name,
        email,
        phone,
        \`group\`,
        notes,
        created_at,
        updated_at
      FROM contacts 
      ORDER BY created_at DESC
    `);

    // Ensure we return an array
    const contactsArray = Array.isArray(contacts) ? contacts : [];
    
    return NextResponse.json(contactsArray);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      name,
      email,
      phone,
      group = 'Private',
      notes
    } = await request.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate group
    const validGroups = ['Companies', 'Groups', 'Private', 'OSHC', 'Schools'];
    if (group && !validGroups.includes(group)) {
      return NextResponse.json(
        { error: "Invalid group. Must be one of: Companies, Groups, Private, OSHC, Schools" },
        { status: 400 }
      );
    }

    const result = await executeQuery(`
      INSERT INTO contacts (
        name, 
        email, 
        phone, 
        \`group\`, 
        notes
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      name,
      email,
      phone || null,
      group,
      notes || null
    ]) as any;

    return NextResponse.json({ 
      success: true, 
      message: "Contact created successfully",
      contactId: result.insertId || result[0]?.insertId 
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}