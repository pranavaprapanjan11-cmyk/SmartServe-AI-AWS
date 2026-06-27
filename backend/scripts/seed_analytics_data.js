require('dotenv').config();
const { pool } = require('./db_helper');
const bcrypt = require('bcrypt');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Create or get a restaurant owner user
    let res = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', ['analytics_test@local']);
    let userId;
    if (res.rows.length === 0) {
      const pwHash = await bcrypt.hash('password123', 10);
      res = await client.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id',
        ['Analytics Test', 'analytics_test@local', pwHash, 'RESTAURANT_OWNER']
      );
      userId = res.rows[0].id;
      console.log('Created user', userId);
    } else {
      userId = res.rows[0].id;
      console.log('Using existing user', userId);
      
      // Clean up old orders/payments/invoices for this user
      console.log('Cleaning up old data...');
      await client.query('DELETE FROM payments WHERE restaurant_id = $1', [userId]);
      await client.query('DELETE FROM invoices WHERE restaurant_id = $1', [userId]);
      await client.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id = $1)', [userId]);
      await client.query('DELETE FROM orders WHERE restaurant_id = $1', [userId]);
      await client.query('DELETE FROM menu_items WHERE restaurant_id = $1', [userId]);
      await client.query('DELETE FROM menu_categories WHERE restaurant_id = $1', [userId]);
    }

    // 2) Create a menu category and item (required for order_items FK)
    res = await client.query('INSERT INTO menu_categories (restaurant_id, name) VALUES ($1,$2) RETURNING id', [userId, 'Test Category']);
    const categoryId = res.rows[0].id;
    res = await client.query('INSERT INTO menu_items (restaurant_id, category_id, name, price) VALUES ($1,$2,$3,$4) RETURNING id', [userId, categoryId, 'Test Item', 100]);
    const menuItemId = res.rows[0].id;
    console.log('Created menu item', menuItemId);

    // 3) Create 5 orders with one order_item each
    const orderIds = [];
    for (let i = 1; i <= 5; i++) {
      res = await client.query(
        'INSERT INTO orders (restaurant_id, waiter_id, table_number, guest_count, status, total_amount) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
        [userId, userId, i, 1, 'PAID', 100]
      );
      const orderId = res.rows[0].id;
      orderIds.push(orderId);
      await client.query('INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal) VALUES ($1,$2,$3,$4,$5)', [orderId, menuItemId, 1, 100, 100]);
      console.log('Created order', orderId);
    }

    // 4) Create invoices and payments for first 3 orders
    const timestamp = Date.now();
    for (let i = 0; i < 3; i++) {
      const oid = orderIds[i];
      const invoiceNum = `INV-${1000 + i}-${timestamp}`;
      
      res = await client.query(
        `INSERT INTO invoices (restaurant_id, order_id, invoice_number, subtotal, tax_amount, discount_amount, total_amount, status) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) 
         RETURNING id`,
        [userId, oid, invoiceNum, 100, 10, 0, 110, 'PAID']
      );
      const invoiceId = res.rows[0].id;
      
      await client.query(
        `INSERT INTO payments (restaurant_id, order_id, invoice_id, amount, payment_method, status, transaction_reference) 
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [userId, oid, invoiceId, 110, 'CARD', 'PAID', `TX-${1000 + i}-${timestamp}`]
      );
      console.log('Created invoice+payment for order', oid);
    }

    await client.query('COMMIT');

    // 5) Report revenue aggregates
    res = await client.query(
      `SELECT
        COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS today,
        COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'), 0) AS week,
        COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0) AS month,
        COALESCE(SUM(amount), 0) AS total
      FROM payments
      WHERE restaurant_id = $1`,
      [userId]
    );

    console.log('Revenue aggregates for restaurant', userId, res.rows[0]);

    // Also output counts
    res = await client.query('SELECT COUNT(*) AS orders_count FROM orders WHERE restaurant_id=$1', [userId]);
    console.log('Orders count:', res.rows[0].orders_count);

    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('SEED ERROR', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
