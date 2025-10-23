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

// GET /api/contact-groups/[id] - Get a specific contact group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = parseInt(params.id);
    
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "Invalid group ID" },
        { status: 400 }
      );
    }

    const groups = await executeQuery(`
      SELECT 
        cg.*,
        COUNT(c.id) as contact_count
      FROM contact_groups cg
      LEFT JOIN contacts c ON c.group_name = cg.name
      WHERE cg.id = ? AND cg.is_active = TRUE
      GROUP BY cg.id, cg.name, cg.description, cg.created_at, cg.updated_at, cg.is_active
    `, [groupId]) as ContactGroup[];

    if (groups.length === 0) {
      return NextResponse.json(
        { error: "Contact group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(groups[0]);
  } catch (error) {
    console.error("Error fetching contact group:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact group" },
      { status: 500 }
    );
  }
}

// PUT /api/contact-groups/[id] - Update a contact group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = parseInt(params.id);
    
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "Invalid group ID" },
        { status: 400 }
      );
    }

    const { name, description } = await request.json();

    // Validate required fields
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    // Validate name format
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
      return NextResponse.json(
        { error: "Group name can only contain letters, numbers, spaces, hyphens, and underscores" },
        { status: 400 }
      );
    }

    // Check if group exists
    const existingGroups = await executeQuery(
      "SELECT id, name FROM contact_groups WHERE id = ? AND is_active = TRUE",
      [groupId]
    ) as ContactGroup[];

    if (existingGroups.length === 0) {
      return NextResponse.json(
        { error: "Contact group not found" },
        { status: 404 }
      );
    }

    const currentGroup = existingGroups[0];

    // Check if new name conflicts with another group (excluding current)
    if (name.trim() !== currentGroup.name) {
      const conflictingGroups = await executeQuery(
        "SELECT id FROM contact_groups WHERE name = ? AND id != ? AND is_active = TRUE",
        [name.trim(), groupId]
      ) as ContactGroup[];

      if (conflictingGroups.length > 0) {
        return NextResponse.json(
          { error: "A group with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Update the group
    await executeQuery(
      "UPDATE contact_groups SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name.trim(), description?.trim() || null, groupId]
    );

    // If name changed, update all contacts with this group
    if (name.trim() !== currentGroup.name) {
      await executeQuery(
        "UPDATE contacts SET group_name = ? WHERE group_name = ?",
        [name.trim(), currentGroup.name]
      );
    }

    // Fetch updated group
    const updatedGroups = await executeQuery(
      "SELECT * FROM contact_groups WHERE id = ?",
      [groupId]
    ) as ContactGroup[];

    return NextResponse.json({
      message: "Contact group updated successfully",
      group: updatedGroups[0]
    });
  } catch (error) {
    console.error("Error updating contact group:", error);
    return NextResponse.json(
      { error: "Failed to update contact group" },
      { status: 500 }
    );
  }
}

// DELETE /api/contact-groups/[id] - Delete (deactivate) a contact group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = parseInt(params.id);
    
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "Invalid group ID" },
        { status: 400 }
      );
    }

    // Check if group exists and get contact count
    const groups = await executeQuery(`
      SELECT 
        cg.*,
        COUNT(c.id) as contact_count
      FROM contact_groups cg
      LEFT JOIN contacts c ON c.group_name = cg.name
      WHERE cg.id = ? AND cg.is_active = TRUE
      GROUP BY cg.id, cg.name, cg.description, cg.created_at, cg.updated_at, cg.is_active
    `, [groupId]) as ContactGroup[];

    if (groups.length === 0) {
      return NextResponse.json(
        { error: "Contact group not found" },
        { status: 404 }
      );
    }

    const group = groups[0];

    // Check if group has contacts
    if (group.contact_count && group.contact_count > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete group '${group.name}' because it has ${group.contact_count} contact(s). Please move or delete the contacts first.`,
          contactCount: group.contact_count
        },
        { status: 409 }
      );
    }

    // Soft delete the group (set is_active = FALSE)
    await executeQuery(
      "UPDATE contact_groups SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [groupId]
    );

    return NextResponse.json({
      message: "Contact group deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting contact group:", error);
    return NextResponse.json(
      { error: "Failed to delete contact group" },
      { status: 500 }
    );
  }
}