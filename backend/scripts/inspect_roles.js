const { pool } = require('./db_helper');

async function inspectRoles() {
  try {
    const client = await pool.connect();
    console.log('Connected to database!');
    
    console.log('\n--- Database Users ---');
    const users = await client.query('SELECT usename, valuntil FROM pg_user');
    console.table(users.rows);

    console.log('\n--- Role Memberships ---');
    const roles = await client.query(`
      SELECT r.rolname, m.rolname as memberof 
      FROM pg_roles r 
      LEFT JOIN pg_auth_members am ON r.oid = am.member 
      LEFT JOIN pg_roles m ON am.roleid = m.oid
      WHERE r.rolname = 'postgres'
    `);
    console.table(roles.rows);

    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

inspectRoles();
