require('dotenv').config();
const { Pool: PGPool } = require('pg');
const { Signer } = require('@aws-sdk/rds-signer');

const useAuroraIAM = process.env.USE_AURORA_IAM_AUTH === 'true';

let pool;

if (useAuroraIAM) {
  const signer = new Signer({
    hostname: process.env.AURORA_ENDPOINT || "",
    port: parseInt(process.env.AURORA_PORT || "5432"),
    username: process.env.AURORA_USER || "postgres",
    region: process.env.AWS_REGION || "us-east-1",
    ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    } : {})
  });

  pool = new PGPool({
    host: process.env.AURORA_ENDPOINT,
    port: parseInt(process.env.AURORA_PORT || "5432"),
    database: process.env.AURORA_DB_NAME || "smartserve",
    user: process.env.AURORA_USER || "postgres",
    password: () => signer.getAuthToken(),
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
} else {
  pool = new PGPool({ connectionString: process.env.DATABASE_URL });
}

module.exports = { pool };
