const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('--- RUNNING ACTIVITY EVENTS DATABASE MIGRATION ---');
  try {
    const sqlPath = path.join(__dirname, '../../database/schema/008_create_activity_events.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Reading migration file:', sqlPath);
    await pool.query(sqlContent);
    
    console.log('Database migration successfully applied!');
    
    // Quick validation check
    const checkRes = await pool.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'activity_events'
      );
    `);
    console.log('Verification: does activity_events table exist?', checkRes.rows[0].exists);
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
