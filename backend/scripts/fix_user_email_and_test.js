require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');

async function main(){
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try{
    await client.query("BEGIN");
    await client.query("UPDATE users SET email = $1 WHERE email = $2", ['analytics_test@local.com', 'analytics_test@local']);
    await client.query("COMMIT");
    console.log('Updated user email to analytics_test@local.com');

    const base = process.env.API_BASE || 'http://localhost:4000/api';
    const loginResp = await axios.post(`${base}/auth/login`, { email: 'analytics_test@local.com', password: 'password123' });
    const token = loginResp.data.token;
    console.log('Got token:', token ? 'YES' : 'NO');
    const dash = await axios.get(`${base}/analytics/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Dashboard status:', dash.status);
    console.log(JSON.stringify(dash.data, null, 2));
    process.exit(0);
  }catch(err){
    await client.query('ROLLBACK');
    console.error('ERROR', err.response ? err.response.status : '', err.response ? err.response.data : err.message);
    process.exit(1);
  }finally{
    client.release();
    await pool.end();
  }
}

main();
