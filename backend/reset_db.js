const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

(async () => {
  console.log('Resetting public schema in primary database (Aurora/PostgreSQL)...');
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    await client.query('GRANT ALL ON SCHEMA public TO public');
    console.log('Public schema reset successfully.');
  } catch (err) {
    console.error('Error resetting database:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
})();
