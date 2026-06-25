const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:pranav@localhost:5432/SmartServe-AI' });
(async () => {
  const client = await pool.connect();
  try {
    const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
    console.log('TABLES');
    tables.rows.forEach(r => console.log(r.table_name));
    const types = await client.query(`SELECT typname FROM pg_type WHERE typname IN ('inventory_transaction_type','inventory_alert_type','purchase_order_status')`);
    console.log('\nTYPES');
    types.rows.forEach(r => console.log(r.typname));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
