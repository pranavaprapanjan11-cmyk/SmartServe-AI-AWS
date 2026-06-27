const { pool } = require('./db_helper');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const schemaDir = path.join(__dirname, '../../database/schema');

async function run() {
  console.log('--- STARTING ALL DATABASE MIGRATIONS ---');
  const client = await pool.connect();

  try {
    // Read all files in the schema directory
    const files = fs.readdirSync(schemaDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Sorts numerically by sequence prefix (e.g. 001, 002, 003...)

    console.log(`Found ${files.length} migration files to apply.`);

    for (const file of files) {
      const filePath = path.join(schemaDir, file);
      console.log(`Executing: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the migration SQL
      await client.query(sql);
      console.log(`SUCCESS: ${file} applied.`);
    }

    // Seed the default users
    console.log('\n--- SEEDING DEFAULT USER ACCOUNTS ---');
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const seedQuery = `
      INSERT INTO users (name, email, password_hash, role, pin)
      VALUES 
      ('Admin User', 'admin@smartserve.ai', $1, 'RESTAURANT_OWNER', '1234'),
      ('Analytics Test User', 'analytics_test@local.com', $1, 'RESTAURANT_OWNER', '1234')
      ON CONFLICT (email) DO NOTHING;
    `;
    
    await client.query(seedQuery, [passwordHash]);
    console.log('SUCCESS: Default admin and test users seeded successfully.');

    console.log('\n--- ALL MIGRATIONS COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('\nERROR: Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
