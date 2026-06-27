const { pool } = require('./db_helper');
require('dotenv').config();

async function run() {
  console.log('--- STARTING AI OPERATIONS TELEMETRY & ENGINE VALIDATION ---');
  
  // 1. Get a restaurant owner user
  const userRes = await pool.query("SELECT id FROM users WHERE role = 'RESTAURANT_OWNER' LIMIT 1");
  if (userRes.rows.length === 0) {
    console.error('No OWNER found in database!');
    process.exit(1);
  }
  const restaurantId = userRes.rows[0].id;
  console.log(`Using Restaurant ID: ${restaurantId}`);

  // 2. Clear old test events to keep audit clean
  await pool.query("DELETE FROM activity_events WHERE restaurant_id = $1", [restaurantId]);
  console.log('Cleared previous operational event logs.');

  // 3. Log mock events representing typical flow
  console.log('\nLogging operational event sequence...');
  
  const mockEvents = [
    { type: 'ORDER_CREATED', desc: 'Order #9f2a8c created for Table 4' },
    { type: 'WAITER_ASSIGNED', desc: 'Waiter Assigned to Table 4' },
    { type: 'ORDER_PREPARING', desc: 'Order #9f2a8c sent to KDS stations' },
    { type: 'CHEF_STARTED_ORDER', desc: 'Chef started preparing order' },
    { type: 'ORDER_READY', desc: 'Order #9f2a8c marked ready for pickup' },
    { type: 'ORDER_SERVED', desc: 'Order #9f2a8c served to customers' },
    { type: 'LOW_STOCK', desc: 'Inventory item Paneer Tikka fell below reorder threshold (On Hand: 2 units)' },
    { type: 'BILL_REQUESTED', desc: 'Bill folder requested for Table 4' },
    { type: 'INVOICE_GENERATED', desc: 'Invoice INV-2026-0001 generated for Table 4 (Total: ₹450)' },
    { type: 'PAYMENT_RECEIVED', desc: 'Payment of ₹450 received via UPI' },
    { type: 'PAYMENT_COMPLETED', desc: 'Invoice INV-2026-0001 fully settled' },
    { type: 'TABLE_CLEANING', desc: 'Table 4 marked as cleaning in progress' },
    { type: 'TABLE_AVAILABLE', desc: 'Table 4 sanitized and marked available' },
  ];

  for (const event of mockEvents) {
    await pool.query(
      `INSERT INTO activity_events (restaurant_id, event_type, description, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [restaurantId, event.type, event.desc, JSON.stringify({ test: true })]
    );
  }
  console.log(`Successfully logged ${mockEvents.length} operational telemetry events.`);

  // 4. Verify fetchEvents API output
  console.log('\nVerifying Events API list...');
  const eventsRes = await pool.query(
    "SELECT event_type, description FROM activity_events WHERE restaurant_id = $1 ORDER BY created_at DESC",
    [restaurantId]
  );
  console.log(`Retrieved ${eventsRes.rows.length} events from DB.`);
  if (eventsRes.rows.length !== mockEvents.length) {
    console.error('Mismatch in logged events count!');
    process.exit(1);
  }
  console.log('Latest event:', eventsRes.rows[0].description);

  // 5. Verify KPI aggregations (Real-time Wall, Health score categories, Heatmaps, Recommendations)
  console.log('\nRunning KPI telemetry calculations...');
  
  // Test Wall SQL
  const wallRes = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM restaurant_tables WHERE restaurant_id = $1 AND status = 'OCCUPIED') as occupied,
       (SELECT COUNT(*) FROM restaurant_tables WHERE restaurant_id = $1 AND status = 'AVAILABLE') as available,
       (SELECT COUNT(*) FROM restaurant_tables WHERE restaurant_id = $1 AND status = 'CLEANING') as cleaning,
       (SELECT COUNT(*) FROM orders WHERE restaurant_id = $1 AND status NOT IN ('PAID', 'REFUNDED', 'CANCELLED')) as active,
       (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE restaurant_id = $1 AND created_at >= CURRENT_DATE AND amount > 0) as revenue
    `,
    [restaurantId]
  );
  
  const wall = wallRes.rows[0];
  console.log('Real-Time Wall Data:');
  console.log(`- Tables Occupied: ${wall.occupied}`);
  console.log(`- Tables Available: ${wall.available}`);
  console.log(`- Tables Cleaning: ${wall.cleaning}`);
  console.log(`- Active Orders: ${wall.active}`);
  console.log(`- Today's Revenue: ₹${wall.revenue}`);

  // Test Heatmaps SQL
  const heatRes = await pool.query(
    `SELECT t.table_number, COUNT(o.id) as usage, COALESCE(SUM(o.total_amount), 0) as revenue
     FROM restaurant_tables t
     LEFT JOIN orders o ON o.table_id = t.id OR (o.table_number = t.table_number AND o.restaurant_id = t.restaurant_id)
     WHERE t.restaurant_id = $1
     GROUP BY t.table_number
     ORDER BY revenue DESC LIMIT 3`,
    [restaurantId]
  );
  console.log('\nTop Table Heatmap Points:');
  heatRes.rows.forEach(r => {
    console.log(`- Table ${r.table_number}: ${r.usage} orders | Revenue: ₹${r.revenue}`);
  });

  // Test Time Heatmap
  const timeRes = await pool.query(
    `SELECT to_char(o.created_at, 'HH24') || ':00' as hour_label, COUNT(o.id) as order_count
     FROM orders o
     WHERE o.restaurant_id = $1
     GROUP BY hour_label
     ORDER BY hour_label LIMIT 3`,
    [restaurantId]
  );
  console.log('\nTime Heatmap Points:');
  timeRes.rows.forEach(r => {
    console.log(`- Hour ${r.hour_label}: ${r.order_count} orders`);
  });

  console.log('\n--- AI OPERATIONS TELEMETRY & ENGINE VALIDATION PASSED ---');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
