import { NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await executeQuery(`
      SELECT 
        id,
        name,
        email,
        phone,
        \`group\`,
        notes,
        opt1,
        opt2,
        opt3,
        created_at,
        updated_at
      FROM contacts 
      WHERE id = ?
    `, [params.id]);

    if (!contact || (Array.isArray(contact) && contact.length === 0)) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    const contactData = Array.isArray(contact) ? contact[0] : contact;
    return NextResponse.json(contactData);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const {
      name,
      email,
      phone,
      group,
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

    // Validate group
    const validGroups = ['Companies', 'Groups', 'Private', 'OSHC', 'Schools'];
    if (group && !validGroups.includes(group)) {
      return NextResponse.json(
        { error: "Invalid group. Must be one of: Companies, Groups, Private, OSHC, Schools" },
        { status: 400 }
      );
    }

    const result = await executeQuery(`
      UPDATE contacts 
      SET name = ?, email = ?, phone = ?, \`group\` = ?, notes = ?, opt1 = ?, opt2 = ?, opt3 = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      email,
      phone || null,
      group,
      notes || null,
      !!opt1,
      !!opt2,
      !!opt3,
      params.id
    ]) as any;

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Contact updated successfully"
    });

  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await executeQuery(`
      DELETE FROM contacts WHERE id = ?
    `, [params.id]) as any;

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Contact deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
} 