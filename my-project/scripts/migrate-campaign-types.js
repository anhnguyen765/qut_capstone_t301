#!/usr/bin/env node

/**
 * Migration script to update campaign types ENUM in the database
 * This script updates the campaigns table to support the new campaign types
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function migrateCampaignTypes() {
  let connection;
  
  try {
    console.log('🚀 Starting campaign types migration...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'crm_db',
    });

    console.log('✅ Connected to database');

    // Check current ENUM values
    console.log('🔍 Checking current campaign types...');
    const [currentTypes] = await connection.execute(
      "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'campaigns' AND COLUMN_NAME = 'type'",
      [process.env.DB_NAME || 'crm_db']
    );

    if (currentTypes.length > 0) {
      console.log('Current ENUM values:', currentTypes[0].COLUMN_TYPE);
    }

    // Check existing campaign data
    const [existingCampaigns] = await connection.execute(
      "SELECT DISTINCT type FROM campaigns ORDER BY type"
    );
    
    console.log('Existing campaign types in database:');
    existingCampaigns.forEach(campaign => {
      console.log(`  - ${campaign.type}`);
    });

    // Update the ENUM to include new values
    console.log('📝 Updating ENUM to include new campaign types...');
    
    const newEnumValues = "'workshop', 'event', 'community', 'special', 'email', 'template', 'app', 'classes', 'fishing_comps', 'oshc_vacation_care', 'promotion', 'other'";
    
    await connection.execute(
      `ALTER TABLE campaigns MODIFY COLUMN type ENUM(${newEnumValues}) NOT NULL`
    );

    console.log('✅ ENUM updated successfully');

    // Verify the change
    const [updatedTypes] = await connection.execute(
      "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'campaigns' AND COLUMN_NAME = 'type'",
      [process.env.DB_NAME || 'crm_db']
    );

    if (updatedTypes.length > 0) {
      console.log('Updated ENUM values:', updatedTypes[0].COLUMN_TYPE);
    }

    // Optional: Map old types to new types
    console.log('🔄 Mapping old campaign types to new ones...');
    
    const typeMapping = {
      'workshop': 'app',
      'event': 'classes', 
      'community': 'other',
      'special': 'promotion'
    };

    for (const [oldType, newType] of Object.entries(typeMapping)) {
      const [result] = await connection.execute(
        "UPDATE campaigns SET type = ? WHERE type = ?",
        [newType, oldType]
      );
      
      if (result.affectedRows > 0) {
        console.log(`  ✅ Updated ${result.affectedRows} campaigns from '${oldType}' to '${newType}'`);
      }
    }

    // Show final campaign types
    const [finalCampaigns] = await connection.execute(
      "SELECT DISTINCT type FROM campaigns ORDER BY type"
    );
    
    console.log('Final campaign types in database:');
    finalCampaigns.forEach(campaign => {
      console.log(`  - ${campaign.type}`);
    });

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Test creating a new campaign with the new types');
    console.log('2. Verify that campaign types are being stored correctly');
    console.log('3. Update any hardcoded references to old campaign types');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  migrateCampaignTypes();
}

module.exports = migrateCampaignTypes;
