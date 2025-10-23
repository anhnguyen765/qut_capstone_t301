const fs = require('fs');
const path = require('path');

// Import from the correct relative path
const dbPath = path.join(__dirname, '..', 'app', 'lib', 'db.ts');

// Since we can't directly import TypeScript, let's use the executeQuery function from the API pattern
async function createConnection() {
  const mysql = require('mysql2/promise');
  
  // Use the same environment variable pattern as the app
  const config = {
    host: process.env.DB_HOST || "s02bd.syd2.hostingplatform.net.au",
    user: process.env.DB_USER || "bentrod2_crm",
    password: process.env.DB_PASS || "Qut123456", // Based on the test-db response
    database: process.env.DB_NAME || "bentrod2_crm",
    connectTimeout: 30000
  };

  return await mysql.createConnection(config);
}

async function runMigration() {
  try {
    console.log('Connecting to database...');
    const connection = await createConnection();
    
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync('./database/migrate-to-dynamic-groups.sql', 'utf8');
    
    console.log('Executing migration...');
    
    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log('Executing:', statement.substring(0, 50) + '...');
          await connection.execute(statement);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_FIELDNAME') {
            console.log('Already exists, skipping:', error.message);
          } else {
            console.error('Error executing statement:', error);
            throw error;
          }
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    console.log('\nVerifying migration...');
    const [groups] = await connection.execute('SELECT * FROM contact_groups');
    console.log('Contact groups created:', groups.length);
    
    const [contacts] = await connection.execute('SHOW COLUMNS FROM contacts LIKE "group_name"');
    console.log('group_name column exists:', contacts.length > 0);
    
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();