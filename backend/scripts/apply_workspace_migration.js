const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL not defined');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  console.log('--- APPLYING WORKSPACE SCHEMA ---');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, '../../database/schema/011_create_workspaces_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log('SUCCESS: Workspace schema applied.');
    
    // Now run data migration
    console.log('\n--- RUNNING DATA MIGRATION ---');
    const migrationScript = require('./data_migration_workspaces.js');
  } catch (err) {
    console.error('Failed to apply workspace schema:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
