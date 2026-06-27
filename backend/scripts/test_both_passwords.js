const { Client } = require('pg');

async function testEndpoint(host, password) {
  console.log(`Testing host: ${host}, password: ${password.substring(0, 3)}...`);
  const client = new Client({
    host: host,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log(`✔ SUCCESS! Host: ${host}, password: ${password}`);
    const res = await client.query('SELECT NOW()');
    console.log('Result:', res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ FAILED. Host: ${host}, password: ${password}. Error: ${err.message}`);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  const hosts = [
    'database-2.cluster-cnq8y26wwafj.ap-south-1.rds.amazonaws.com',
    'database-2-instance-1.cnq8y26wwafj.ap-south-1.rds.amazonaws.com'
  ];
  for (const host of hosts) {
    await testEndpoint(host, 'pranav06');
    await testEndpoint(host, 'SmartServeTempPass123!');
  }
}

run();
