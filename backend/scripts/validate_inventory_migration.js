const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

(async function() {
  const sqlPath = path.join(__dirname, '..', '..', 'database', 'schema', '005_create_inventory_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const statements = sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:pranav@localhost:5432/SmartServe-AI' });
  const client = await pool.connect();
  try {
    let i = 0;
    for (const stmt of statements) {
      i += 1;
      console.log(`Executing statement ${i}/${statements.length}`);
      try {
        await client.query(stmt);
      } catch (err) {
        console.error(`Error in statement ${i}:`, err.message);
        console.error('Statement content:', stmt.substring(0, 500));
        process.exitCode = 1;
        return;
      }
    }
    console.log('All statements executed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
})();
