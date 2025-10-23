import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function POST() {
  try {
    console.log('Starting migration to dynamic contact groups...');

    // Step 1: Create contact_groups table
    try {
      await executeQuery(`
        CREATE TABLE contact_groups (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE
        )
      `);
      console.log('✓ Created contact_groups table');
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('✓ contact_groups table already exists');
      } else {
        throw error;
      }
    }

    // Step 2: Insert default groups
    const defaultGroups = [
      ['Companies', 'Business and corporate contacts'],
      ['Groups', 'Group bookings and organizations'],
      ['Private', 'Individual private customers'],
      ['OSHC', 'Overseas Student Health Cover contacts'],
      ['Schools', 'Educational institutions and school groups']
    ];

    for (const [name, description] of defaultGroups) {
      try {
        await executeQuery(
          'INSERT INTO contact_groups (name, description) VALUES (?, ?)',
          [name, description]
        );
        console.log(`✓ Inserted group: ${name}`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`✓ Group already exists: ${name}`);
        } else {
          throw error;
        }
      }
    }

    // Step 3: Add group_name column to contacts table
    try {
      await executeQuery('ALTER TABLE contacts ADD COLUMN group_name VARCHAR(50)');
      console.log('✓ Added group_name column to contacts table');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ group_name column already exists');
      } else {
        throw error;
      }
    }

    // Step 4: Copy existing group values to new column
    await executeQuery('UPDATE contacts SET group_name = `group` WHERE group_name IS NULL');
    console.log('✓ Copied existing group values to group_name column');

    // Step 5: Create indexes for performance
    try {
      await executeQuery('CREATE INDEX idx_contacts_group_name ON contacts(group_name)');
      console.log('✓ Created index on contacts.group_name');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Index on contacts.group_name already exists');
      } else {
        throw error;
      }
    }

    try {
      await executeQuery('CREATE INDEX idx_contact_groups_active ON contact_groups(is_active)');
      console.log('✓ Created index on contact_groups.is_active');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Index on contact_groups.is_active already exists');
      } else {
        throw error;
      }
    }

    // Verification
    const groups = await executeQuery('SELECT COUNT(*) as count FROM contact_groups WHERE is_active = TRUE');
    const contactsWithGroups = await executeQuery('SELECT COUNT(*) as count FROM contacts WHERE group_name IS NOT NULL');

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully!',
      details: {
        groupsCreated: groups[0]?.count || 0,
        contactsWithGroups: contactsWithGroups[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}