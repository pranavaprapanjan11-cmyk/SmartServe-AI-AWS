const { Client } = require('pg');

async function run() {
  console.log("Connecting to database-2 using the newly set password...");
  const client = new Client({
    host: 'database-2.cluster-cnq8y26wwafj.ap-south-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'SmartServeTempPass123!',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("✔ Connected successfully! Running GRANT rds_iam TO postgres...");
    
    await client.query("GRANT rds_iam TO postgres;");
    console.log("✔ SQL query executed successfully!");
    
    console.log("Checking roles membership...");
    const res = await client.query(`
      SELECT rolname, member.rolname AS member_of 
      FROM pg_roles 
      LEFT JOIN pg_auth_members ON (pg_roles.oid = member_id) 
      LEFT JOIN pg_roles member ON (role_id = member.oid) 
      WHERE pg_roles.rolname = 'postgres';
    `);
    console.log(res.rows);
    
  } catch (err) {
    console.error("Failed to connect or run query:", err.message);
  } finally {
    await client.end();
  }
}

run();
