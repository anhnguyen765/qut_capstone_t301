const { executeQuery } = require('../app/lib/db');

async function addFinalizedStatus() {
  try {
    console.log('Adding finalized status to campaigns table...');
    
    // First, let's check the current schema
    const currentSchema = await executeQuery(
      `SHOW COLUMNS FROM campaigns WHERE Field = 'status'`,
      []
    );
    console.log('Current status column schema:', currentSchema);
    
    // Run the migration
    await executeQuery(
      `ALTER TABLE campaigns 
       MODIFY COLUMN status ENUM('draft', 'scheduled', 'finalized', 'sent', 'archived') DEFAULT 'draft'`,
      []
    );
    
    console.log('Successfully added finalized status to campaigns table!');
    
    // Verify the change
    const updatedSchema = await executeQuery(
      `SHOW COLUMNS FROM campaigns WHERE Field = 'status'`,
      []
    );
    console.log('Updated status column schema:', updatedSchema);
    
  } catch (error) {
    console.error('Error adding finalized status:', error);
  }
}

addFinalizedStatus();