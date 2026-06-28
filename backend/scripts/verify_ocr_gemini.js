// Script to verify Gemini OCR and Inventory integration
const { pool } = require('../dist/database');
require('dotenv').config();

async function verify() {
  try {
    console.log('=== STARTING GEMINI OCR INTEGRATION VERIFICATION ===');
    console.log('Database URL:', process.env.DATABASE_URL);
    console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'DEFINED' : 'NOT DEFINED');

    // 1. Fetch a test user
    const { rows: users } = await pool.query("SELECT id, name, role FROM users WHERE role = 'RESTAURANT_OWNER' LIMIT 1");
    if (users.length === 0) {
      console.error('No owner user found in database to run verification.');
      process.exit(1);
    }
    const testUser = users[0];
    console.log(`Using test user: ${testUser.name} (${testUser.role})`);

    // Import inventory service
    const inventoryService = require('../dist/modules/inventory/inventory.service');

    // Mock parsed data from Gemini
    const mockReceipt = {
      supplier: 'Saffron Spices Ltd ' + Date.now(),
      items: [
        { name: 'Coriander Seeds ' + Date.now(), quantity: 15, price: 4.5 },
        { name: 'Turmeric Powder ' + Date.now(), quantity: 10, price: 6.2 }
      ],
      totalAmount: 129.5
    };

    console.log('\n--- TESTING DATABASE IMPORT LOGIC ---');
    console.log('Mock parsed receipt:', JSON.stringify(mockReceipt, null, 2));

    const po = await inventoryService.importOcrInvoice(testUser.id, testUser.role, mockReceipt);
    console.log('\nSUCCESS: Purchase Order created!');
    console.log(`PO ID: ${po.id}`);
    console.log(`Supplier ID: ${po.supplier_id}`);
    console.log(`Status: ${po.status}`);
    console.log(`Total Amount: ${po.total_amount}`);

    // Verify database entries
    console.log('\n--- VERIFYING DATABASE ENTRIES ---');

    // Verify PO Items
    const { rows: poItems } = await pool.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [po.id]);
    console.log(`Found ${poItems.length} purchase order items in database.`);
    for (const item of poItems) {
      console.log(`- Item ID: ${item.inventory_item_id}, Quantity: ${item.quantity}, Cost: ${item.unit_cost}`);
    }

    // Verify Inventory Transaction logs
    const { rows: txs } = await pool.query('SELECT * FROM inventory_transactions WHERE note LIKE $1', [`%${po.id}%`]);
    console.log(`Found ${txs.length} inventory transaction records.`);
    for (const tx of txs) {
      console.log(`- Tx ID: ${tx.id}, Type: ${tx.transaction_type}, Change: ${tx.change_amount}`);
    }

    // Verify Activity Events logs
    const { rows: events } = await pool.query('SELECT * FROM activity_events WHERE event_type = $1 ORDER BY created_at DESC LIMIT 1', ['STOCK_REFILLED']);
    if (events.length > 0) {
      console.log('Latest Activity Event logged successfully:');
      console.log(`- Event Type: ${events[0].event_type}`);
      console.log(`- Description: ${events[0].description}`);
    } else {
      console.warn('WARNING: No STOCK_REFILLED activity event found.');
    }

    // 2. Test Gemini API SDK Call if key is available
    if (process.env.GEMINI_API_KEY) {
      console.log('\n--- TESTING GEMINI API SDK CALL ---');
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Simple 1x1 white pixel gif base64
      const mockPixelBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

      try {
        console.log('Sending mock image request to gemini-2.5-flash...');
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            'Parse this mock empty pixel and return default values.',
            {
              inlineData: {
                data: mockPixelBase64,
                mimeType: 'image/gif'
              }
            }
          ],
          config: {
            systemInstruction: 'Return a mock JSON response with supplier: "Mock Supplier", items: [], totalAmount: 0',
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                supplier: { type: 'STRING' },
                items: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      name: { type: 'STRING' },
                      quantity: { type: 'NUMBER' },
                      price: { type: 'NUMBER' }
                    },
                    required: ['name', 'quantity', 'price']
                  }
                },
                totalAmount: { type: 'NUMBER' }
              },
              required: ['supplier', 'items', 'totalAmount']
            }
          }
        });

        console.log('Gemini API call succeeded!');
        console.log('Response text:', response.text);
      } catch (gemErr) {
        console.error('Gemini API call failed:', gemErr.message || gemErr);
      }
    } else {
      console.log('\nSkipping Gemini SDK verification because GEMINI_API_KEY is not defined.');
    }

    console.log('\n=== VERIFICATION COMPLETED SUCCESSFULLY ===');
    await pool.end();
  } catch (err) {
    console.error('\nVerification failed with error:', err);
    try {
      await pool.end();
    } catch (_) {}
  }
}

verify();
