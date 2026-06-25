const { Pool } = require('pg');
const connectionString = 'postgres://postgres:pranav@localhost:5432/SmartServe-AI';
const pool = new Pool({ connectionString });

async function main() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;");
    console.log(res.rows.map((r) => r.table_name).join('\n'));
  } catch (err) {
    console.error('ERROR', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
