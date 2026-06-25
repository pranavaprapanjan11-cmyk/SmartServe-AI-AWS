require('dotenv').config();
const axios = require('axios');

async function main(){
  try{
    const base = process.env.API_BASE || 'http://localhost:4000/api';
    const loginResp = await axios.post(`${base}/auth/login`, { email: 'analytics_test@local', password: 'password123' });
    const token = loginResp.data.token;
    console.log('Got token:', token ? 'YES' : 'NO');
    const dash = await axios.get(`${base}/analytics/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Dashboard status:', dash.status);
    console.log(JSON.stringify(dash.data, null, 2));
    process.exit(0);
  }catch(err){
    console.error('ERROR', err.response ? err.response.status : '', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

main();
