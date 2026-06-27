const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

async function run() {
  console.log("Starting remote AWS database connection diagnostic check...");
  console.log("Credentials from .env.local:");
  console.log(`- Host: ${process.env.PGHOST}`);
  console.log(`- User: ${process.env.PGUSER}`);
  console.log(`- Database: ${process.env.PGDATABASE}`);
  console.log(`- Port: ${process.env.PGPORT}`);

  const client = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: parseInt(process.env.PGPORT || '5432', 10),
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000 // 5 seconds timeout for fast triage
  });

  try {
    console.log("Connecting to AWS RDS cluster...");
    await client.connect();
    console.log("✔ SUCCESS! Successfully authenticated and connected to AWS RDS!");
    const res = await client.query("SELECT NOW()");
    console.log("Database timestamp:", res.rows[0].now);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ CONNECTION FAILED!");
    console.error(`- Error Code: ${err.code}`);
    console.error(`- Error Message: ${err.message}`);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

run();
