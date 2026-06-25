const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:pranav@localhost:5432/SmartServe-AI';

async function run() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    console.log('Running inventory intelligence schema migration...');
    
    // Execute ALTER TYPE ADD VALUE statements outside transaction, one by one, catching errors
    const statuses = ['SUBMITTED', 'APPROVED', 'DELIVERED'];
    for (const status of statuses) {
      try {
        await client.query(`ALTER TYPE purchase_order_status ADD VALUE '${status}'`);
        console.log(`Added status: ${status} to purchase_order_status`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`Status ${status} already exists in purchase_order_status enum`);
        } else {
          console.error(`Failed to add status ${status}:`, err.message);
        }
      }
    }

    // Execute the rest of the schema statements
    const sqlPath = path.join(__dirname, '..', '..', 'database', 'schema', '009_inventory_intelligence.sql');
    let sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    // Remove the ALTER TYPE statements since we executed them manually with check/catch
    sqlContent = sqlContent.replace(/ALTER TYPE purchase_order_status ADD VALUE[^;]+;/g, '');

    await client.query(sqlContent);
    console.log('Database tables and columns created successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
