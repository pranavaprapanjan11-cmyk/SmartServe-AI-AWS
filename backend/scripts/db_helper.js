require('dotenv').config();
const { Pool: PGPool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  pool = new PGPool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
} else {
  pool = new PGPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'smartserve',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
}

module.exports = { pool };
