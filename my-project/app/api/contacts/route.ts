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
        COALESCE(group_name, \`group\`) as \`group\`,
        notes,
        opt1,
        opt2,
        opt3,
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
      notes,
      opt1 = false,
      opt2 = false,
      opt3 = false
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

    // Check for duplicate email
    const existingContact = await executeQuery(
      `SELECT id, name FROM contacts WHERE email = ? LIMIT 1`,
      [email]
    );

    if (Array.isArray(existingContact) && existingContact.length > 0) {
      const existing = existingContact[0] as any;
      return NextResponse.json(
        { 
          error: "Email already exists", 
          message: `A contact with email "${email}" already exists (Name: ${existing.name})`,
          duplicate: true,
          existingContact: {
            id: existing.id,
            name: existing.name,
            email: email
          }
        },
        { status: 409 }
      );
    }

    // Validate group against dynamic groups
    if (group) {
      const validGroups = await executeQuery(
        'SELECT name FROM contact_groups WHERE is_active = TRUE'
      );
      const validGroupNames = Array.isArray(validGroups) ? validGroups.map((g: any) => g.name) : [];
      
      if (!validGroupNames.includes(group)) {
        return NextResponse.json(
          { 
            error: `Invalid group. Must be one of: ${validGroupNames.join(', ')}`,
            validGroups: validGroupNames
          },
          { status: 400 }
        );
      }
    }

    const result = await executeQuery(`
      INSERT INTO contacts (
        name, 
        email, 
        phone, 
        group_name, 
        notes,
        opt1,
        opt2,
        opt3
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      email,
      phone || null,
      group,
      notes || null,
      !!opt1,
      !!opt2,
      !!opt3
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