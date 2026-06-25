// File: backend/scripts/inspect_db_data.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    console.log('--- USER ACCOUNTS ---');
    const { rows: users } = await pool.query('SELECT id, name, email, role, created_at FROM users');
    users.forEach(u => console.log(`[${u.role}] ID: ${u.id} | ${u.name} | ${u.email}`));

    console.log('\n--- ORDERS COUNT BY RESTAURANT ---');
    const { rows: orders } = await pool.query(
      'SELECT restaurant_id, status, COUNT(*), SUM(total_amount) as total FROM orders GROUP BY restaurant_id, status'
    );
    orders.forEach(o => console.log(`Restaurant: ${o.restaurant_id} | Status: ${o.status} | Count: ${o.count} | Sum: ₹${o.total}`));

    console.log('\n--- INVOICES COUNT ---');
    const { rows: invoices } = await pool.query(
      'SELECT restaurant_id, status, COUNT(*), SUM(total_amount) as total FROM invoices GROUP BY restaurant_id, status'
    );
    invoices.forEach(i => console.log(`Restaurant: ${i.restaurant_id} | Status: ${i.status} | Count: ${i.count} | Sum: ₹${i.total}`));

    console.log('\n--- PAYMENTS COUNT ---');
    const { rows: payments } = await pool.query(
      'SELECT restaurant_id, status, COUNT(*), SUM(amount) as total FROM payments GROUP BY restaurant_id, status'
    );
    payments.forEach(p => console.log(`Restaurant: ${p.restaurant_id} | Status: ${p.status} | Count: ${p.count} | Sum: ₹${p.total}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
