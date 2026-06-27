const { pool } = require('./db_helper');

async function revokeIam() {
  try {
    const client = await pool.connect();
    console.log('Connected to database!');
    
    console.log('Revoking rds_iam from postgres user...');
    await client.query('REVOKE rds_iam FROM postgres');
    console.log('Successfully revoked rds_iam role membership!');
    
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

revokeIam();
