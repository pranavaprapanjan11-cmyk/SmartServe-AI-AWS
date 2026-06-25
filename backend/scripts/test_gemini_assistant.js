// Test script for Gemini AI Assistant integration
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  try {
    console.log('--- STARTING GEMINI ASSISTANT INTEGRATION TEST ---');
    console.log('Using database:', process.env.DATABASE_URL);
    console.log('Using Gemini API Key:', process.env.GEMINI_API_KEY ? 'DEFINED (Staged)' : 'NOT DEFINED');

    // 1. Fetch a user with RESTAURANT_OWNER role
    const { rows: users } = await pool.query("SELECT id, name, email, role, workspace_id FROM users WHERE role = 'RESTAURANT_OWNER' LIMIT 1");
    if (users.length === 0) {
      console.error('No owner user found in database to run test.');
      process.exit(1);
    }
    const testUser = users[0];
    console.log(`\nTest User: ${testUser.name} (${testUser.email}) | Role: ${testUser.role} | Workspace: ${testUser.workspace_id}`);

    // Import the service functions
    const aiService = require('../dist/modules/ai/ai.service');

    // 2. Fetch live context
    console.log('\n--- FETCHING LIVE CONTEXT ---');
    const context = await aiService.getLiveContext(testUser.id, testUser.role);
    console.log('Context generated successfully.');
    console.log('Current Date/Time:', context.current_date, context.current_time);
    console.log('Today\'s Revenue (raw):', context.dashboard_metrics.today_revenue);
    console.log('Today\'s Orders count:', context.dashboard_metrics.today_orders_count);

    // 3. Test Daily Summary Generation
    console.log('\n--- GENERATING DAILY AI SUMMARY REPORT ---');
    const summary = await aiService.getAiSummary(testUser.id, testUser.role);
    console.log('Summary Report Content:\n');
    console.log(summary);

    // 4. Test Chat response
    console.log('\n--- TESTING AI CHAT ASSISTANT RESPONSE ---');
    const question = 'What is our current inventory status and what items are low?';
    console.log('User Question:', question);
    const chatResponse = await aiService.getChatResponse(testUser.id, testUser.role, question, []);
    console.log('AI Response:\n');
    console.log(chatResponse);

    console.log('\n--- GEMINI ASSISTANT INTEGRATION TEST COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

test();
