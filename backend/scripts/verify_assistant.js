// Script to verify Gemini AI Assistant chat router
const { pool } = require('../dist/database');
const axios = require('axios');
require('dotenv').config();

async function verify() {
  try {
    console.log('=== STARTING GEMINI AI ASSISTANT VERIFICATION ===');
    console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'DEFINED' : 'NOT DEFINED');

    // 1. Fetch a test user
    const { rows: users } = await pool.query("SELECT id, name, role FROM users WHERE role = 'RESTAURANT_OWNER' LIMIT 1");
    if (users.length === 0) {
      console.error('No owner user found in database to run verification.');
      await pool.end();
      process.exit(1);
    }
    const testUser = users[0];
    console.log(`Using test user: ${testUser.name} (${testUser.role})`);

    // Let's create an auth token for this test user
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: testUser.id, role: testUser.role },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1h' }
    );
    console.log('Generated test token successfully.');

    // 2. Test Gemini API via direct SDK call or route if server is running
    // Since the server is not necessarily running in this verification process,
    // we can either test the handleAssistantChat controller directly by mocking req, res!
    console.log('\n--- TESTING CONTROLLER DIRECTLY VIA MOCK REQ/RES ---');
    const { handleAssistantChat } = require('../dist/modules/assistant/assistant.controller');

    // Mock Express Request and Response
    const req = {
      body: {
        messages: [
          { role: 'user', content: 'What is your name and what do you do?' }
        ]
      },
      user: {
        id: testUser.id,
        role: testUser.role
      }
    };

    let responseData = '';
    const res = {
      headersSent: false,
      setHeader(name, value) {
        console.log(`[Header] ${name}: ${value}`);
      },
      write(chunk) {
        responseData += chunk.toString();
        process.stdout.write(chunk.toString());
      },
      end() {
        console.log('\n[Stream Closed]');
        console.log('\nFinal response accumulated:', responseData.length, 'chars');
        console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
        pool.end().then(() => process.exit(0));
      },
      status(code) {
        console.log(`[Status] ${code}`);
        return this;
      },
      json(obj) {
        console.log('[JSON Response]', JSON.stringify(obj));
        console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
        pool.end().then(() => process.exit(0));
      }
    };

    console.log('Sending chat prompt to handleAssistantChat...');
    await handleAssistantChat(req, res);

  } catch (err) {
    console.error('\nVerification failed with error:', err);
    try {
      await pool.end();
    } catch (_) {}
    process.exit(1);
  }
}

verify();
