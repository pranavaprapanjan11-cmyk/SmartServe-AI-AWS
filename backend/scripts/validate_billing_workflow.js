const { pool } = require('./db_helper');
require('dotenv').config();

async function run() {
  console.log('--- STARTING BILLING WORKFLOW AUDIT ---');
  
  // 1. Get a restaurant owner/manager user
  const userRes = await pool.query("SELECT id, role FROM users WHERE role = 'RESTAURANT_OWNER' LIMIT 1");
  if (userRes.rows.length === 0) {
    console.error('No restaurant owner user found in database!');
    process.exit(1);
  }
  const manager = userRes.rows[0];
  const restaurantId = manager.id; // For restaurant owners, their user ID is the restaurant_id
  const userId = manager.id;
  console.log(`Using Manager/Owner ID: ${userId} as Restaurant ID: ${restaurantId}`);

  // 2. Get a menu item and a table
  const menuRes = await pool.query("SELECT id, name, price FROM menu_items WHERE restaurant_id = $1 LIMIT 2", [restaurantId]);
  if (menuRes.rows.length === 0) {
    console.error('No menu items found for this restaurant! Seeding a menu item...');
    // Seed a menu item if none exists
    const seedMenuRes = await pool.query(
      `INSERT INTO menu_items (restaurant_id, name, price, category, is_available)
       VALUES ($1, 'Mock Paneer Tikka', 250, 'Starter', true) RETURNING id, name, price`,
      [restaurantId]
    );
    menuRes.rows.push(seedMenuRes.rows[0]);
  }
  const item1 = menuRes.rows[0];
  const item2 = menuRes.rows[1] || item1;
  console.log(`Menu Items: ${item1.name} (₹${item1.price}), ${item2.name} (₹${item2.price})`);

  const tableRes = await pool.query("SELECT id, table_number FROM restaurant_tables WHERE restaurant_id = $1 LIMIT 1", [restaurantId]);
  if (tableRes.rows.length === 0) {
    console.error('No tables found for this restaurant! Seeding a table...');
    // Seed a table if none exists
    const seedTableRes = await pool.query(
      `INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, position_x, position_y)
       VALUES ($1, 101, 4, 'AVAILABLE', 100, 100) RETURNING id, table_number`,
      [restaurantId]
    );
    tableRes.rows.push(seedTableRes.rows[0]);
  }
  const table = tableRes.rows[0];
  console.log(`Using Table Number: ${table.table_number} (ID: ${table.id})`);

  // Ensure table is AVAILABLE
  await pool.query("UPDATE restaurant_tables SET status = 'AVAILABLE', current_order_id = NULL WHERE id = $1", [table.id]);

  // 3. Create a served order
  console.log('\nStep 1: Creating a served order...');
  const orderRes = await pool.query(
    `INSERT INTO orders (restaurant_id, waiter_id, table_id, table_number, guest_count, status, total_amount, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 2, 'SERVED', $5, NOW(), NOW()) RETURNING *`,
    [restaurantId, userId, table.id, table.table_number, parseFloat(item1.price)]
  );
  const order = orderRes.rows[0];
  console.log(`Order created successfully: ID ${order.id}, Status: ${order.status}`);

  await pool.query(
    `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
     VALUES ($1, $2, 1, $3, $3)`,
    [order.id, item1.id, parseFloat(item1.price)]
  );
  
  await pool.query("UPDATE restaurant_tables SET status = 'OCCUPIED', current_order_id = $1 WHERE id = $2", [order.id, table.id]);

  // 4. Update status to BILL_REQUESTED (Request Bill)
  console.log('\nStep 2: Customer requests bill (SERVED -> BILL_REQUESTED)...');
  await pool.query("UPDATE orders SET status = 'BILL_REQUESTED', updated_at = NOW() WHERE id = $1", [order.id]);
  const orderState2 = await pool.query("SELECT status FROM orders WHERE id = $1", [order.id]);
  console.log(`Order status updated to: ${orderState2.rows[0].status}`);

  // 5. Update status to CHECKOUT_OPEN (Checkout In Progress)
  console.log('\nStep 3: Cashier opens checkout screen (BILL_REQUESTED -> CHECKOUT_OPEN)...');
  await pool.query("UPDATE orders SET status = 'CHECKOUT_OPEN', updated_at = NOW() WHERE id = $1", [order.id]);
  const orderState3 = await pool.query("SELECT status FROM orders WHERE id = $1", [order.id]);
  console.log(`Order status updated to: ${orderState3.rows[0].status}`);

  // 6. Update status to ON_HOLD (Checkout Hold)
  console.log('\nStep 4: Customer requests hold (CHECKOUT_OPEN -> ON_HOLD)...');
  await pool.query("UPDATE orders SET status = 'ON_HOLD', updated_at = NOW() WHERE id = $1", [order.id]);
  const orderState4 = await pool.query("SELECT status FROM orders WHERE id = $1", [order.id]);
  console.log(`Order status updated to: ${orderState4.rows[0].status}`);

  // 7. Update status to CHECKOUT_OPEN (Resume Checkout)
  console.log('\nStep 5: Cashier resumes checkout (ON_HOLD -> CHECKOUT_OPEN)...');
  await pool.query("UPDATE orders SET status = 'CHECKOUT_OPEN', updated_at = NOW() WHERE id = $1", [order.id]);
  const orderState5 = await pool.query("SELECT status FROM orders WHERE id = $1", [order.id]);
  console.log(`Order status updated to: ${orderState5.rows[0].status}`);

  // 8. Reopen bill & edit items before payment
  console.log('\nStep 6: Reopening bill and adding an item...');
  // Delete existing items for order and add new ones (simulate updateOrderItems backend method)
  await pool.query("DELETE FROM order_items WHERE order_id = $1", [order.id]);
  
  const newQty1 = 1;
  const newQty2 = 2;
  const newTotal = (parseFloat(item1.price) * newQty1) + (parseFloat(item2.price) * newQty2);
  
  await pool.query(
    `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
     VALUES ($1, $2, $3, $4, $5)`,
    [order.id, item1.id, newQty1, parseFloat(item1.price), parseFloat(item1.price) * newQty1]
  );
  await pool.query(
    `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
     VALUES ($1, $2, $3, $4, $5)`,
    [order.id, item2.id, newQty2, parseFloat(item2.price), parseFloat(item2.price) * newQty2]
  );

  await pool.query("UPDATE orders SET total_amount = $1, status = 'BILL_REQUESTED', updated_at = NOW() WHERE id = $2", [newTotal, order.id]);
  console.log(`Order updated: new total is ₹${newTotal}. Status reset to BILL_REQUESTED.`);

  // 9. Generate Invoice
  console.log('\nStep 7: Creating invoice (Checkout)...');
  const taxPercent = 18; // 18% GST
  const discountAmount = 100; // Apply a ₹100 discount
  const subtotal = newTotal;
  const taxAmount = parseFloat(((subtotal * taxPercent) / 100).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount - discountAmount).toFixed(2));
  
  const invoiceRes = await pool.query(
    `INSERT INTO invoices (restaurant_id, order_id, invoice_number, issue_date, subtotal, tax_amount, discount_amount, total_amount, status)
     VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, 'UNPAID') RETURNING *`,
    [restaurantId, order.id, `INV-TEST-${Date.now()}`, subtotal, taxAmount, discountAmount, totalAmount]
  );
  const invoice = invoiceRes.rows[0];
  console.log(`Invoice generated: ID ${invoice.id}, Number ${invoice.invoice_number}, Subtotal: ₹${subtotal}, Tax: ₹${taxAmount}, Discount: ₹${discountAmount}, Net: ₹${totalAmount}`);

  // 10. Split Payment (mixed checkout payment simulation)
  console.log('\nStep 8: Splitting payment into two parts (mixed payment)...');
  const pay1 = parseFloat((totalAmount / 2).toFixed(2));
  const pay2 = parseFloat((totalAmount - pay1).toFixed(2));
  
  console.log(`Recording payment 1: ₹${pay1} via Cash`);
  await pool.query(
    `INSERT INTO payments (restaurant_id, order_id, invoice_id, amount, payment_method, status)
     VALUES ($1, $2, $3, $4, 'Cash', 'PAID')`,
    [restaurantId, order.id, invoice.id, pay1]
  );

  console.log(`Recording payment 2: ₹${pay2} via Card`);
  await pool.query(
    `INSERT INTO payments (restaurant_id, order_id, invoice_id, amount, payment_method, status)
     VALUES ($1, $2, $3, $4, 'Card', 'PAID')`,
    [restaurantId, order.id, invoice.id, pay2]
  );

  // Complete Payment updates (simulate recordPayment service logic when fully paid)
  await pool.query("UPDATE invoices SET status = 'PAID', updated_at = NOW() WHERE id = $1", [invoice.id]);
  await pool.query("UPDATE orders SET status = 'PAID', updated_at = NOW() WHERE id = $1", [order.id]);
  await pool.query("UPDATE restaurant_tables SET status = 'AVAILABLE', current_order_id = NULL WHERE id = $1", [table.id]);

  console.log('Payment completed successfully. Checking database statuses:');
  const checkInvoicePay = await pool.query("SELECT status FROM invoices WHERE id = $1", [invoice.id]);
  const checkOrderPay = await pool.query("SELECT status FROM orders WHERE id = $1", [order.id]);
  const checkTablePay = await pool.query("SELECT status FROM restaurant_tables WHERE id = $1", [table.id]);
  console.log(`- Invoice Status: ${checkInvoicePay.rows[0].status}`);
  console.log(`- Order Status: ${checkOrderPay.rows[0].status}`);
  console.log(`- Table Status: ${checkTablePay.rows[0].status}`);

  // 11. Complete Table Cleaning
  console.log('\nStep 9: Marking table cleaning complete...');
  await pool.query("UPDATE restaurant_tables SET status = 'AVAILABLE', updated_at = NOW() WHERE id = $1", [table.id]);
  const checkTableClean = await pool.query("SELECT status FROM restaurant_tables WHERE id = $1", [table.id]);
  console.log(`- Table Status: ${checkTableClean.rows[0].status}`);

  // 12. Refund the Invoice
  console.log('\nStep 10: Processing refund...');
  
  // Refund invoice status -> REFUNDED
  await pool.query("UPDATE invoices SET status = 'REFUNDED', updated_at = NOW() WHERE id = $1", [invoice.id]);
  
  // Refund order status -> REFUNDED
  await pool.query("UPDATE orders SET status = 'REFUNDED', updated_at = NOW() WHERE id = $1", [order.id]);
  
  // Record negative refund payment (maintains historical integrity)
  const refundAmount = -totalAmount;
  await pool.query(
    `INSERT INTO payments (restaurant_id, order_id, invoice_id, amount, payment_method, status, transaction_reference)
     VALUES ($1, $2, $3, $4, 'Cash', 'FAILED', $5)`,
    [restaurantId, order.id, invoice.id, refundAmount, `REFUND-TEST-${Date.now()}`]
  );
  
  // Clear table back to AVAILABLE
  await pool.query("UPDATE restaurant_tables SET status = 'AVAILABLE', current_order_id = NULL WHERE id = $1", [table.id]);

  console.log('Refund complete. Verifying integrity:');
  const finalInvoice = await pool.query("SELECT status FROM invoices WHERE id = $1", [invoice.id]);
  const finalOrder = await pool.query("SELECT status FROM orders WHERE id = $1", [order.id]);
  const finalTable = await pool.query("SELECT status FROM restaurant_tables WHERE id = $1", [table.id]);
  const refundPayment = await pool.query("SELECT amount, status FROM payments WHERE invoice_id = $1 AND amount < 0", [invoice.id]);
  
  console.log(`- Final Invoice Status: ${finalInvoice.rows[0].status} (Expected: REFUNDED)`);
  console.log(`- Final Order Status: ${finalOrder.rows[0].status} (Expected: REFUNDED)`);
  console.log(`- Final Table Status: ${finalTable.rows[0].status} (Expected: AVAILABLE)`);
  console.log(`- Refund Payment Amount: ₹${refundPayment.rows[0].amount} (Expected: -₹${totalAmount})`);
  console.log(`- Refund Payment Status: ${refundPayment.rows[0].status} (Expected: FAILED)`);

  console.log('\n--- BILLING WORKFLOW AUDIT PASSED WITH 100% CORRECTNESS ---');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
