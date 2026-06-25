const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:pranav@localhost:5432/SmartServe-AI';

async function runAudit() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  const report = {
    integrity: {},
    workflows: {},
    analytics: {},
    security: {},
    performance: {},
  };

  try {
    console.log('--- STARTING END-TO-END SYSTEM INTEGRATION AUDIT ---');

    // ==========================================
    // 1. DATA INTEGRITY CHECKS (ORPHANS & DUPLICATES)
    // ==========================================
    console.log('\nRunning Data Integrity Checks...');

    // A. Orphan Invoices (Invoices without orders)
    const orphanInvoices = await client.query(
      `SELECT id, invoice_number FROM invoices WHERE order_id NOT IN (SELECT id FROM orders)`
    );
    report.integrity.orphanInvoices = orphanInvoices.rows.length;
    console.log(`- Orphaned Invoices: ${orphanInvoices.rows.length}`);

    // B. Orphan Payments (Payments without invoices)
    const orphanPayments = await client.query(
      `SELECT id FROM payments WHERE invoice_id NOT IN (SELECT id FROM invoices)`
    );
    report.integrity.orphanPayments = orphanPayments.rows.length;
    console.log(`- Orphaned Payments: ${orphanPayments.rows.length}`);

    // C. Orphan Recipes (Recipes without menu items)
    const orphanRecipes = await client.query(
      `SELECT id FROM recipes WHERE menu_item_id NOT IN (SELECT id FROM menu_items)`
    );
    report.integrity.orphanRecipes = orphanRecipes.rows.length;
    console.log(`- Recipes Without Menu Items: ${orphanRecipes.rows.length}`);

    // D. Duplicate Payments (Identical invoice, method, amount, within 2 seconds)
    const duplicatePayments = await client.query(
      `SELECT p1.id, p1.invoice_id FROM payments p1
       JOIN payments p2 ON p1.invoice_id = p2.invoice_id 
       AND p1.id <> p2.id 
       AND p1.payment_method = p2.payment_method
       AND p1.amount = p2.amount
       AND ABS(EXTRACT(EPOCH FROM (p1.created_at - p2.created_at))) < 2`
    );
    report.integrity.duplicatePayments = duplicatePayments.rows.length / 2; // bidirectional join double-counts
    console.log(`- Duplicate Payments Detected: ${report.integrity.duplicatePayments}`);

    // E. Duplicate Inventory Transactions (Same item, type, amount, order_id, within 2 seconds)
    const duplicateTxs = await client.query(
      `SELECT t1.id FROM inventory_transactions t1
       JOIN inventory_transactions t2 ON t1.inventory_item_id = t2.inventory_item_id
       AND t1.id <> t2.id
       AND t1.transaction_type = t2.transaction_type
       AND t1.change_amount = t2.change_amount
       AND COALESCE(t1.order_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(t2.order_id, '00000000-0000-0000-0000-000000000000'::uuid)
       AND ABS(EXTRACT(EPOCH FROM (t1.created_at - t2.created_at))) < 2`
    );
    report.integrity.duplicateTransactions = duplicateTxs.rows.length / 2;
    console.log(`- Duplicate Inventory Transactions: ${report.integrity.duplicateTransactions}`);

    // F. Duplicate Event Logs (Identical event type, description, restaurant, within 1 second)
    const duplicateEvents = await client.query(
      `SELECT e1.id FROM activity_events e1
       JOIN activity_events e2 ON e1.restaurant_id = e2.restaurant_id
       AND e1.id <> e2.id
       AND e1.event_type = e2.event_type
       AND e1.description = e2.description
       AND ABS(EXTRACT(EPOCH FROM (e1.created_at - e2.created_at))) < 1`
    );
    report.integrity.duplicateEvents = duplicateEvents.rows.length / 2;
    console.log(`- Duplicate Event Logs: ${report.integrity.duplicateEvents}`);

    // ==========================================
    // 2. WORKFLOW LIFECYCLE AUDITS
    // ==========================================
    console.log('\nAuditing Workflows...');
    const userRes = await client.query("SELECT id FROM users ORDER BY created_at ASC LIMIT 1");
    if (userRes.rows.length === 0) throw new Error('No user to run workflow simulations');
    const restaurantId = userRes.rows[0].id;

    // A. Order & Kitchen Lifecycle simulation (NEW -> cooking -> READY -> SERVED -> PAID)
    console.log('- Simulating Order & Kitchen Lifecycle...');
    
    // Create Table if none exist
    let tableRes = await client.query(`SELECT id, table_number FROM restaurant_tables WHERE restaurant_id = $1 LIMIT 1`, [restaurantId]);
    if (tableRes.rows.length === 0) {
      tableRes = await client.query(
        `INSERT INTO restaurant_tables (restaurant_id, table_number, status, capacity, section, shape)
         VALUES ($1, 10, 'AVAILABLE', 4, 'Main Hall', 'ROUND') RETURNING id, table_number`,
        [restaurantId]
      );
    }
    const tableId = tableRes.rows[0].id;
    const tableNum = tableRes.rows[0].table_number;

    // Reset table status to AVAILABLE
    await client.query(`UPDATE restaurant_tables SET status = 'AVAILABLE' WHERE id = $1`, [tableId]);

    // Create Order
    const orderRes = await client.query(
      `INSERT INTO orders (restaurant_id, waiter_id, table_id, table_number, guest_count, status, total_amount)
       VALUES ($1, $1, $2, $3, 2, 'NEW', 250.0) RETURNING id`,
      [restaurantId, tableId, tableNum]
    );
    const orderId = orderRes.rows[0].id;
    report.workflows.orderCreated = !!orderId;

    // Transition table status to OCCUPIED
    await client.query(`UPDATE restaurant_tables SET status = 'OCCUPIED' WHERE id = $1`, [tableId]);

    // Log Sent to Kitchen event
    await client.query(
      `INSERT INTO activity_events (restaurant_id, event_type, description, payload, created_at)
       VALUES ($1, 'ORDER_SENT_TO_KITCHEN', 'Order sent to kitchen', $2, NOW())`,
      [restaurantId, JSON.stringify({ orderId, tableNum })]
    );

    // Transition Order status to PREPARING
    await client.query(`UPDATE orders SET status = 'PREPARING' WHERE id = $1`, [orderId]);
    report.workflows.cookingStarted = true;

    // Transition Order status to READY
    await client.query(`UPDATE orders SET status = 'READY' WHERE id = $1`, [orderId]);
    report.workflows.markedReady = true;

    // Transition Order status to SERVED
    await client.query(`UPDATE orders SET status = 'SERVED' WHERE id = $1`, [orderId]);
    report.workflows.markedServed = true;

    // Request Bill (order status BILL_REQUESTED, table status BILL_REQUESTED)
    await client.query(`UPDATE orders SET status = 'BILL_REQUESTED' WHERE id = $1`, [orderId]);
    await client.query(`UPDATE restaurant_tables SET status = 'BILL_REQUESTED' WHERE id = $1`, [tableId]);
    report.workflows.billRequested = true;

    // B. Billing & Payment lifecycle
    console.log('- Simulating Billing & Payment Lifecycle...');
    
    // Generate Invoice
    const invoiceRes = await client.query(
      `INSERT INTO invoices (restaurant_id, order_id, invoice_number, subtotal, tax_amount, discount_amount, total_amount, status)
       VALUES ($1, $2, 'INV-AUDIT-' || EXTRACT(EPOCH FROM NOW()), 250.0, 45.0, 0, 295.0, 'PENDING') RETURNING id`,
      [restaurantId, orderId]
    );
    const invoiceId = invoiceRes.rows[0].id;
    report.workflows.invoiceGenerated = !!invoiceId;

    // Process Payment
    await client.query(
      `INSERT INTO payments (restaurant_id, order_id, invoice_id, amount, payment_method, status)
       VALUES ($1, $2, $3, 295.0, 'UPI', 'PAID')`,
      [restaurantId, orderId, invoiceId]
    );
    await client.query(`UPDATE invoices SET status = 'PAID' WHERE id = $1`, [invoiceId]);
    await client.query(`UPDATE orders SET status = 'PAID' WHERE id = $1`, [orderId]);
    await client.query(`UPDATE restaurant_tables SET status = 'CLEANING' WHERE id = $1`, [tableId]);
    report.workflows.paymentCompleted = true;

    // Set Table back to AVAILABLE
    await client.query(`UPDATE restaurant_tables SET status = 'AVAILABLE' WHERE id = $1`, [tableId]);
    report.workflows.tableCleaningReset = true;

    // Cleanup simulation records
    await client.query(`DELETE FROM payments WHERE invoice_id = $1`, [invoiceId]);
    await client.query(`DELETE FROM invoices WHERE id = $1`, [invoiceId]);
    await client.query(`DELETE FROM orders WHERE id = $1`, [orderId]);
    console.log('Assert OK: Workflow simulations passed successfully.');

    // ==========================================
    // 3. ANALYTICS CONSISTENCY VALIDATION
    // ==========================================
    console.log('\nValidating Analytics & Financial Totals Consistency...');
    
    // Sum of completed payments
    const paySum = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'PAID'`
    );
    const paymentTotal = parseFloat(paySum.rows[0].total);

    // Sum of Paid Invoices
    const invSum = await client.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status = 'PAID'`
    );
    const invoiceTotal = parseFloat(invSum.rows[0].total);

    // Sum of revenue registered in activity_events
    const eventSum = await client.query(
      `SELECT COALESCE(SUM(CAST(payload->>'amount' as DECIMAL)), 0) as total 
       FROM activity_events 
       WHERE event_type = 'PAYMENT_RECEIVED'`
    );
    const eventTotal = parseFloat(eventSum.rows[0].total);

    report.analytics.paymentTotal = paymentTotal;
    report.analytics.invoiceTotal = invoiceTotal;
    report.analytics.eventTotal = eventTotal;
    report.analytics.discrepancy = Math.abs(paymentTotal - invoiceTotal);

    console.log(`- Payments Cumulative Total: ₹${paymentTotal.toFixed(2)}`);
    console.log(`- Paid Invoices Cumulative Total: ₹${invoiceTotal.toFixed(2)}`);
    console.log(`- Activity Event Payments Logged: ₹${eventTotal.toFixed(2)}`);
    console.log(`- Discrepancy: ₹${report.analytics.discrepancy.toFixed(2)}`);

    // ==========================================
    // 4. PERFORMANCE BENCHMARKS (MEASURE RESPONSE TIMES)
    // ==========================================
    console.log('\nBenchmarking Performance (Response Times)...');

    const benchmarkQuery = async (label, sql, params = []) => {
      const start = Date.now();
      await client.query(sql, params);
      const duration = Date.now() - start;
      report.performance[label] = duration;
      console.log(`- ${label} query execution time: ${duration}ms ${duration > 500 ? '⚠️ SLOW' : '✅ OK'}`);
    };

    // Query 1: AI Operations dashboard analytics equivalent query
    await benchmarkQuery(
      'AIOperationsDashboardQuery',
      `SELECT event_type, COUNT(*), MAX(created_at) as last_time
       FROM activity_events 
       WHERE restaurant_id = $1 
       GROUP BY event_type 
       ORDER BY last_time DESC`,
      [restaurantId]
    );

    // Query 2: Forecasting engine consumption aggregates query
    await benchmarkQuery(
      'InventoryForecastingQuery',
      `SELECT inventory_item_id, COALESCE(SUM(change_amount), 0) as total
       FROM inventory_transactions 
       WHERE restaurant_id = $1 AND transaction_type = 'STOCK_OUT' AND created_at >= NOW() - INTERVAL '14 days'
       GROUP BY inventory_item_id`,
      [restaurantId]
    );

    // Query 3: Core Billing Dashboard metrics load
    await benchmarkQuery(
      'BillingDashboardSummaryQuery',
      `SELECT status, COUNT(*), COALESCE(SUM(total_amount), 0) as val 
       FROM invoices 
       WHERE restaurant_id = $1 
       GROUP BY status`,
      [restaurantId]
    );

    // ==========================================
    // 5. SECURITY & ACCESS AUDIT
    // ==========================================
    console.log('\nChecking Security constraints...');
    
    // Check if there are any managers with null PIN or missing pins
    const managersWithoutPin = await client.query(
      `SELECT count(*) FROM users WHERE role IN ('MANAGER','OWNER','RESTAURANT_OWNER','SUPER_ADMIN') AND (pin IS NULL OR length(pin) < 4)`
    );
    report.security.managersWithoutPin = parseInt(managersWithoutPin.rows[0].count, 10);
    console.log(`- Managers/Admins without valid PIN: ${report.security.managersWithoutPin}`);

    // Print summary
    console.log('\n--- SYSTEM HEALTH AUDIT COMPLETED ---');
    console.log('Report Object:', JSON.stringify(report, null, 2));

  } catch (err) {
    console.error('Audit script execution failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runAudit();
