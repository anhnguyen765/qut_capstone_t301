import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface ContactGroup extends RowDataPacket {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  contact_count?: number;
}

// GET /api/contact-groups - Get all contact groups
export async function GET() {
  try {
    const rows = await executeQuery(`
      SELECT 
        cg.*,
        COUNT(c.id) as contact_count
      FROM contact_groups cg
      LEFT JOIN contacts c ON c.group_name = cg.name
      WHERE cg.is_active = TRUE
      GROUP BY cg.id, cg.name, cg.description, cg.created_at, cg.updated_at, cg.is_active
      ORDER BY cg.name ASC
    `) as ContactGroup[];

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching contact groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact groups" },
      { status: 500 }
    );
  }
}

// POST /api/contact-groups - Create a new contact group
export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    // Validate required fields
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    // Validate name format (alphanumeric, spaces, hyphens, underscores only)
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
      return NextResponse.json(
        { error: "Group name can only contain letters, numbers, spaces, hyphens, and underscores" },
        { status: 400 }
      );
    }

    // Check if group name already exists
    const existingRows = await executeQuery(
      "SELECT id FROM contact_groups WHERE name = ? AND is_active = TRUE",
      [name.trim()]
    ) as ContactGroup[];

    if (existingRows.length > 0) {
      return NextResponse.json(
        { error: "A group with this name already exists" },
        { status: 409 }
      );
    }

    // Insert new group
    const result = await executeQuery(
      "INSERT INTO contact_groups (name, description) VALUES (?, ?)",
      [name.trim(), description?.trim() || null]
    ) as ResultSetHeader;

    // Fetch the created group
    const newGroup = await executeQuery(
      "SELECT * FROM contact_groups WHERE id = ?",
      [result.insertId]
    ) as ContactGroup[];

    return NextResponse.json({
      message: "Contact group created successfully",
      group: newGroup[0]
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact group:", error);
    return NextResponse.json(
      { error: "Failed to create contact group" },
      { status: 500 }
    );
  }
}