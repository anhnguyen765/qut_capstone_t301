#!/usr/bin/env node

/**
 * Test script to verify campaign types are working correctly
 * This script creates a test campaign with each new campaign type
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testCampaignTypes() {
  let connection;
  
  try {
    console.log('🧪 Testing campaign types...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'crm_db',
    });

    console.log('✅ Connected to database');

    // Test campaign types
    const testTypes = [
      'app',
      'classes', 
      'fishing_comps',
      'oshc_vacation_care',
      'promotion',
      'other'
    ];

    console.log('📝 Testing each campaign type...');

    for (const type of testTypes) {
      try {
        // Insert a test campaign
        const [result] = await connection.execute(
          `INSERT INTO campaigns (title, date, type, status, content) VALUES (?, ?, ?, ?, ?)`,
          [
            `Test ${type} Campaign`,
            new Date().toISOString().split('T')[0],
            type,
            'draft',
            `Test content for ${type} campaign`
          ]
        );

        console.log(`  ✅ Successfully created campaign with type: ${type} (ID: ${result.insertId})`);

        // Verify the campaign was stored correctly
        const [campaign] = await connection.execute(
          "SELECT id, title, type FROM campaigns WHERE id = ?",
          [result.insertId]
        );

        if (campaign.length > 0) {
          console.log(`    📋 Stored: ${campaign[0].title} (Type: ${campaign[0].type})`);
        }

        // Clean up test campaign
        await connection.execute(
          "DELETE FROM campaigns WHERE id = ?",
          [result.insertId]
        );

        console.log(`    🗑️ Cleaned up test campaign`);

      } catch (error) {
        console.error(`  ❌ Failed to create campaign with type '${type}':`, error.message);
      }
    }

    // Test invalid campaign type
    console.log('🚫 Testing invalid campaign type...');
    try {
      await connection.execute(
        `INSERT INTO campaigns (title, date, type, status, content) VALUES (?, ?, ?, ?, ?)`,
        [
          'Test Invalid Campaign',
          new Date().toISOString().split('T')[0],
          'invalid_type',
          'draft',
          'This should fail'
        ]
      );
      console.log('  ❌ ERROR: Invalid campaign type was accepted!');
    } catch (error) {
      console.log('  ✅ Correctly rejected invalid campaign type:', error.message);
    }

    console.log('🎉 Campaign type testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
if (require.main === module) {
  testCampaignTypes();
}

module.exports = testCampaignTypes;
