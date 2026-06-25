require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api';
const TEST_FILES_DIR = path.join(process.cwd(), 'scripts', 'ocr_test_files');

async function login() {
  const resp = await axios.post(`${API_BASE}/auth/login`, { email: 'analytics_test@local.com', password: 'password123' });
  return resp.data.token;
}

async function upload(filePath) {
  const data = new FormData();
  data.append('file', fs.createReadStream(filePath));
  const headers = data.getHeaders();
  const resp = await axios.post(`${API_BASE}/ocr/upload`, data, { headers });
  return resp.data.fileId;
}

async function parse(fileId) {
  const resp = await axios.post(`${API_BASE}/ocr/parse`, { fileId });
  return resp.data;
}

async function run() {
  const token = await login();
  console.log('token ready');

  if (!fs.existsSync(TEST_FILES_DIR)) {
    fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
  }

  const testFiles = ['english-menu.png', 'tamil-menu.png', 'menu.pdf'];
  for (const file of testFiles) {
    const src = path.join(TEST_FILES_DIR, file);
    if (!fs.existsSync(src)) {
      console.error('Missing test file', src);
      continue;
    }
    console.log('Testing file', file);
    const fileId = await upload(src);
    console.log('  uploaded', fileId);
    const parsed = await parse(fileId);
    console.log('  parsed items', parsed.items.length, 'errors', parsed.errors || []);
    console.log(JSON.stringify(parsed.items.slice(0, 10), null, 2));
  }
}

run().catch(err => {
  console.error(err.response ? err.response.data : err.message);
  process.exit(1);
});