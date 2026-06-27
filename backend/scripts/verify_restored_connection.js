require('dotenv').config();
const { Client } = require('pg');
const { Signer } = require('@aws-sdk/rds-signer');

const signer = new Signer({
  hostname: 'database-2-restored.cluster-cnq8y26wwafj.ap-south-1.rds.amazonaws.com',
  port: 5432,
  username: 'postgres',
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log('Testing IAM connection to restored Aurora cluster...');
  console.log('Host: database-2-restored.cluster-cnq8y26wwafj.ap-south-1.rds.amazonaws.com');
  
  try {
    console.log('Generating token...');
    const token = await signer.getAuthToken();
    console.log('Token generated successfully! Length:', token.length);

    const client = new Client({
      host: 'database-2-restored.cluster-cnq8y26wwafj.ap-south-1.rds.amazonaws.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: token,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('Connecting to database...');
    await client.connect();
    console.log('✔ Connected successfully to restored database!');
    const res = await client.query('SELECT NOW(), current_database(), current_user');
    console.log('Query result:', res.rows[0]);
    await client.end();
    console.log('Connection test passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal connection error:', err);
    process.exit(1);
  }
}

run();
