const { pool } = require('./db_helper');

async function testConnection() {
  console.log('Testing connection to Aurora instance...');
  const censoredUrl = (process.env.DATABASE_URL || '').replace(/:[^:@]+@/, ':***@');
  console.log('DATABASE_URL:', censoredUrl);
  console.log('USE_AURORA_IAM_AUTH:', process.env.USE_AURORA_IAM_AUTH);

  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL!');
    const res = await client.query('SELECT NOW(), current_database(), current_user');
    console.log('Query result:', res.rows[0]);
    client.release();
    console.log('Connection test passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal connection error:', err);
    process.exit(1);
  }
}

testConnection();
