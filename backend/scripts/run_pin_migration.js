// File: backend/scripts/run_pin_migration.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log('--- STARTING PIN MIGRATION ---');
    await client.query('BEGIN');

    // 1. Add pin column if not exists
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pin VARCHAR(10)
    `);
    console.log('Column "pin" checked/created on users table.');

    // 2. Set default pin for existing manager/owner accounts
    const updateRes = await client.query(`
      UPDATE users 
      SET pin = '1234' 
      WHERE role IN ('OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'SUPER_ADMIN') 
        AND pin IS NULL
    `);
    console.log(`Updated ${updateRes.rowCount} manager/owner users with default PIN '1234'.`);

    // 3. Print out users to confirm
    const { rows: users } = await client.query(`
      SELECT id, name, email, role, pin FROM users 
      WHERE role IN ('OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'SUPER_ADMIN')
    `);
    console.log('\n--- VERIFYING USER PINS ---');
    users.forEach(u => {
      console.log(`User: ${u.name} (${u.email}) | Role: ${u.role} | PIN: ${u.pin}`);
    });

    await client.query('COMMIT');
    console.log('Migration successfully completed!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
