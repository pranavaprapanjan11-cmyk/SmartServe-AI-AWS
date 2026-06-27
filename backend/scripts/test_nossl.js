const { Client } = require('pg');

async function run() {
  console.log("Connecting without SSL...");
  const client = new Client({
    host: 'database-2.cluster-cnq8y26wwafj.ap-south-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'pranav06',
    ssl: false
  });

  try {
    await client.connect();
    console.log("✔ Connected successfully without SSL!");
    await client.end();
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

run();
