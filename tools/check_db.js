// Lightweight DB connectivity check script
// Run from project root or from backend folder so that 'pg' resolves to backend/node_modules
let Pool;
try {
  Pool = require('pg').Pool;
} catch (err) {
  try {
    // fallback to backend node_modules
    // eslint-disable-next-line global-require
    Pool = require('../backend/node_modules/pg').Pool;
  } catch (err2) {
    console.error('Cannot locate pg module. Install pg in backend or add psql tools to PATH.');
    console.error(err2 && err2.message ? err2.message : err2);
    process.exit(3);
  }
}

const candidates = [
  process.env.DATABASE_URL,
  'postgres://postgres@localhost:5432/postgres',
  'postgres://postgres:postgres@localhost:5432/postgres',
  'postgres://postgres@localhost:5432/smartserve',
  'postgres://postgres:postgres@localhost:5432/smartserve',
  'postgres://user:password@localhost:5432/smartserve'
].filter(Boolean);

async function tryConnect(connStr) {
  const pool = new Pool({ connectionString: connStr, connectionTimeoutMillis: 2000 });
  try {
    console.log('\nTrying:', connStr);
    const client = await pool.connect();
    try {
      const { rows } = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
      console.log('Connected — public tables:');
      if (rows.length === 0) console.log('  (no public tables found)');
      rows.forEach(r => console.log('  -', r.table_name));
      return { ok: true, connStr };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Connection failed:', err.message || err);
    return { ok: false, connStr, err };
  } finally {
    await pool.end().catch(()=>{});
  }
}

async function main(){
  if (candidates.length === 0) {
    console.error('No connection strings to try (set DATABASE_URL or edit this script).');
    process.exit(2);
  }
  for (const c of candidates) {
    // eslint-disable-next-line no-await-in-loop
    await tryConnect(c);
  }
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
