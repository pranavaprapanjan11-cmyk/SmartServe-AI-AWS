// File: backend/scripts/seed_restaurant_data.js
const { pool } = require('./db_helper');
require('dotenv').config();

async function seedForOwner(client, ownerId) {
  console.log(`Seeding data for Restaurant Owner ID: ${ownerId}`);

  // Clean up any old test data under this owner to avoid duplicates
  await client.query('DELETE FROM payments WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM invoices WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id = $1)', [ownerId]);
  await client.query('UPDATE orders SET customer_id = NULL WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM orders WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM inventory_alerts WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM inventory_transactions WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM menu_item_ingredients WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM inventory_items WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM suppliers WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM inventory_categories WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM menu_items WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM menu_categories WHERE restaurant_id = $1', [ownerId]);

  // Clean up employee tables
  await client.query('DELETE FROM disciplinary_actions WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM performance_reviews WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM attendance WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM employee_shifts WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM leave_requests WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM salary WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM employees WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM shifts WHERE restaurant_id = $1', [ownerId]);

  // Clean up CRM tables
  await client.query('DELETE FROM loyalty_transactions WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM customer_visits WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM reservations WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM waitlist_entries WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM customers WHERE restaurant_id = $1', [ownerId]);

  // 1. Seed Menu Categories and Items
  const catNames = ['Beverages', 'Starters', 'Main Course', 'Desserts'];
  const catIds = [];
  for (const name of catNames) {
    const res = await client.query(
      'INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING id',
      [ownerId, name]
    );
    catIds.push(res.rows[0].id);
  }

  const menuItemsData = [
    { catIdx: 0, name: 'Lemon Tea', price: 45.00 },
    { catIdx: 0, name: 'Cold Coffee', price: 90.00 },
    { catIdx: 1, name: 'Paneer Tikka', price: 180.00 },
    { catIdx: 1, name: 'Chicken 65', price: 210.00 },
    { catIdx: 2, name: 'Veg Biryani', price: 220.00 },
    { catIdx: 2, name: 'Butter Chicken with Naan', price: 320.00 },
    { catIdx: 3, name: 'Chocolate Brownie', price: 120.00 }
  ];

  const itemIds = [];
  for (const item of menuItemsData) {
    const res = await client.query(
      'INSERT INTO menu_items (restaurant_id, category_id, name, price, is_available) VALUES ($1, $2, $3, $4, true) RETURNING id',
      [ownerId, catIds[item.catIdx], item.name, item.price]
    );
    itemIds.push(res.rows[0].id);
    
    // Seed menu item analytics
    await client.query(
      `INSERT INTO menu_item_analytics (menu_item_id, orders_count, revenue, last_ordered_at) 
       VALUES ($1, 0, 0, NULL) ON CONFLICT DO NOTHING`,
      [res.rows[0].id]
    );
  }

  // 2. Seed Inventory Categories and Suppliers
  const invCatRes = await client.query(
    'INSERT INTO inventory_categories (restaurant_id, name) VALUES ($1, $2) RETURNING id',
    [ownerId, 'Food Ingredients']
  );
  const invCategoryId = invCatRes.rows[0].id;

  const supplierRes = await client.query(
    `INSERT INTO suppliers (restaurant_id, name, contact_name, phone, email, address)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [ownerId, 'Fresh Foods Supplier', 'John Supplier', '9999988888', 'john@freshfoods.com', '123 Market St']
  );
  const supplierId = supplierRes.rows[0].id;

  // 3. Seed Inventory Items
  const inventoryItemsData = [
    { name: 'Basmati Rice', qty: 5.0, threshold: 25.0, unit: 'kg' }, // Trigger low stock
    { name: 'Chicken Breast', qty: 45.0, threshold: 15.0, unit: 'kg' },
    { name: 'Paneer', qty: 12.0, threshold: 5.0, unit: 'kg' },
    { name: 'Tomatoes', qty: 8.0, threshold: 10.0, unit: 'kg' }, // Trigger low stock
    { name: 'Onions', qty: 30.0, threshold: 15.0, unit: 'kg' }
  ];

  const invIds = [];
  for (const item of inventoryItemsData) {
    const res = await client.query(
      `INSERT INTO inventory_items (restaurant_id, category_id, supplier_id, name, quantity_on_hand, reorder_threshold, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [ownerId, invCategoryId, supplierId, item.name, item.qty, item.threshold, item.unit]
    );
    const invId = res.rows[0].id;
    invIds.push(invId);

    // If stock is below threshold, trigger an active inventory alert
    if (item.qty <= item.threshold) {
      await client.query(
        `INSERT INTO inventory_alerts (restaurant_id, inventory_item_id, alert_type, message, is_active)
         VALUES ($1, $2, 'LOW_STOCK', $3, true)`,
        [ownerId, invId, `Low stock alert for ${item.name}. Current: ${item.qty}${item.unit}`]
      );
    }
  }

  // Map ingredients for forecasting (Basmati Rice is used in Veg Biryani)
  if (itemIds[4] && invIds[0]) {
    await client.query(
      `INSERT INTO menu_item_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
       VALUES ($1, $2, $3, 0.25)`, 
      [ownerId, itemIds[4], invIds[0]]
    );
  }
  // Butter Chicken is at index 5, uses Chicken (index 1) and Tomatoes (index 3)
  if (itemIds[5]) {
    if (invIds[1]) {
      await client.query(
        `INSERT INTO menu_item_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
         VALUES ($1, $2, $3, 0.3)`,
        [ownerId, itemIds[5], invIds[1]]
      );
    }
    if (invIds[3]) {
      await client.query(
        `INSERT INTO menu_item_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
         VALUES ($1, $2, $3, 0.15)`,
        [ownerId, itemIds[5], invIds[3]]
      );
    }
  }

  // 4. Seed/Reset Floor Layout Tables
  const tableIdsMap = {};
  for (let t = 1; t <= 8; t++) {
    const section = t <= 4 ? 'Main Hall' : (t <= 6 ? 'VIP' : 'Outdoor');
    const capacity = t % 2 === 0 ? 4 : 2;
    const shape = t % 3 === 0 ? 'round' : (t % 3 === 1 ? 'square' : 'rectangle');
    const posX = ((t - 1) % 4) * 150 + 50;
    const posY = Math.floor((t - 1) / 4) * 150 + 50;
    const res = await client.query(
      `INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, section, shape, position_x, position_y)
       VALUES ($1, $2, $3, 'AVAILABLE', $4, $5, $6, $7)
       ON CONFLICT (restaurant_id, table_number) DO UPDATE
       SET status = 'AVAILABLE', current_order_id = NULL, reserved_for = NULL, reserved_phone = NULL, reservation_time = NULL
       RETURNING id`,
      [ownerId, t, capacity, section, shape, posX, posY]
    );
    tableIdsMap[t] = res.rows[0].id;
  }

  // 5. Seed CRM Customers
  const now = new Date();
  const customersData = [
    { name: 'Vijay Mallya', phone: '9999999999', email: 'vijay@vip.com', visits: 8, spend: 6500.00, points: 650, vip: true, lastDaysAgo: 2 },
    { name: 'Rajesh Kumar', phone: '9812345670', email: 'rajesh@vip.com', visits: 6, spend: 5200.00, points: 520, vip: true, lastDaysAgo: 4 },
    { name: 'Simran Kaur', phone: '9812345671', email: 'simran@local.com', visits: 5, spend: 2500.00, points: 250, vip: false, lastDaysAgo: 5 },
    { name: 'Vikram Malhotra', phone: '9812345672', email: 'vikram.m@local.com', visits: 2, spend: 1200.00, points: 120, vip: false, lastDaysAgo: 65 }, // Trigger At-Risk (>60 days)
    { name: 'Anjali Gupta', phone: '9812345673', email: 'anjali@local.com', visits: 1, spend: 450.00, points: 45, vip: false, lastDaysAgo: 0 } // Trigger New Customer
  ];

  const customerIds = [];
  for (const cust of customersData) {
    const lastVisitDate = new Date();
    lastVisitDate.setDate(now.getDate() - cust.lastDaysAgo);
    
    const res = await client.query(
      `INSERT INTO customers (restaurant_id, name, phone_number, email, total_visits, total_spend, avg_bill_value, reward_points, vip_status, last_visit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        ownerId,
        cust.name,
        cust.phone,
        cust.email,
        cust.visits,
        cust.spend,
        cust.visits > 0 ? (cust.spend / cust.visits) : 0,
        cust.points,
        cust.vip,
        lastVisitDate
      ]
    );
    customerIds.push(res.rows[0].id);
  }

  // Seed Customer Visits & Loyalty Transactions
  for (let i = 0; i < customersData.length; i++) {
    const cust = customersData[i];
    const custId = customerIds[i];
    
    for (let v = 0; v < cust.visits; v++) {
      const visitDate = new Date();
      visitDate.setDate(now.getDate() - cust.lastDaysAgo - (v * 5));
      const spend = cust.spend / cust.visits;
      
      await client.query(
        `INSERT INTO customer_visits (restaurant_id, customer_id, spend_amount, visit_date)
         VALUES ($1, $2, $3, $4)`,
        [ownerId, custId, spend, visitDate]
      );

      const points = Math.floor(spend / 10);
      if (points > 0) {
        await client.query(
          `INSERT INTO loyalty_transactions (restaurant_id, customer_id, points, transaction_type, description, created_at)
           VALUES ($1, $2, $3, 'EARNED', $4, $5)`,
          [ownerId, custId, points, `Earned from visit: spend ₹${spend.toFixed(2)}`, visitDate]
        );
      }
    }
  }

  // 6. Seed Employees
  const employeesData = [
    { name: 'Amit Patel', email: 'amit@local.com', phone: '9876543211', role: 'MANAGER', position: 'Restaurant Manager', hire_date: '2025-01-15', salary: 45000.00, notes: 'Experienced manager.' },
    { name: 'Rohan Das', email: 'rohan@local.com', phone: '9876543212', role: 'WAITER', position: 'Senior Waiter', hire_date: '2025-03-10', salary: 18000.00, notes: 'Customer favorite.' },
    { name: 'Priya Singh', email: 'priya@local.com', phone: '9876543213', role: 'WAITER', position: 'Junior Waiter', hire_date: '2025-05-01', salary: 15000.00, notes: 'Very active.' },
    { name: 'Chef Vikram', email: 'vikram@local.com', phone: '9876543214', role: 'KITCHEN_STAFF', position: 'Head Chef', hire_date: '2024-11-01', salary: 60000.00, notes: 'Specializes in Indian cuisine.' },
    { name: 'Neha Sharma', email: 'neha@local.com', phone: '9876543215', role: 'CASHIER', position: 'Senior Cashier', hire_date: '2025-02-20', salary: 20000.00, notes: 'Very reliable.' }
  ];

  const empIds = [];
  for (const emp of employeesData) {
    const res = await client.query(
      `INSERT INTO employees (restaurant_id, name, email, phone, role, position, hire_date, status, salary, salary_frequency, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8, 'MONTHLY', $9, $1) RETURNING id`,
      [ownerId, emp.name, emp.email, emp.phone, emp.role, emp.position, emp.hire_date, emp.salary, emp.notes]
    );
    empIds.push(res.rows[0].id);
  }

  // 7. Seed Shifts and Assignments
  const morningShiftRes = await client.query(
    `INSERT INTO shifts (restaurant_id, name, start_time, end_time, break_duration_minutes, description)
     VALUES ($1, 'Morning Shift', '08:00:00', '16:00:00', 30, 'Standard morning shift') RETURNING id`,
    [ownerId]
  );
  const morningShiftId = morningShiftRes.rows[0].id;

  const eveningShiftRes = await client.query(
    `INSERT INTO shifts (restaurant_id, name, start_time, end_time, break_duration_minutes, description)
     VALUES ($1, 'Evening Shift', '16:00:00', '23:00:00', 30, 'Standard evening shift') RETURNING id`,
    [ownerId]
  );
  const eveningShiftId = eveningShiftRes.rows[0].id;

  const todayStr = now.toISOString().slice(0, 10);
  for (let d = -5; d <= 1; d++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + d);
    const dateStr = targetDate.toISOString().slice(0, 10);
    
    // Rohan - Morning
    await client.query(
      `INSERT INTO employee_shifts (employee_id, shift_id, restaurant_id, assigned_date, status)
       VALUES ($1, $2, $3, $4, 'SCHEDULED')`,
      [empIds[1], morningShiftId, ownerId, dateStr]
    );
    // Priya - Evening
    await client.query(
      `INSERT INTO employee_shifts (employee_id, shift_id, restaurant_id, assigned_date, status)
       VALUES ($1, $2, $3, $4, 'SCHEDULED')`,
      [empIds[2], eveningShiftId, ownerId, dateStr]
    );
    // Chef Vikram - Morning
    await client.query(
      `INSERT INTO employee_shifts (employee_id, shift_id, restaurant_id, assigned_date, status)
       VALUES ($1, $2, $3, $4, 'SCHEDULED')`,
      [empIds[3], morningShiftId, ownerId, dateStr]
    );
    // Neha - Evening
    await client.query(
      `INSERT INTO employee_shifts (employee_id, shift_id, restaurant_id, assigned_date, status)
       VALUES ($1, $2, $3, $4, 'SCHEDULED')`,
      [empIds[4], eveningShiftId, ownerId, dateStr]
    );
  }

  // 8. Seed Attendance Logs (past 5 days + today's check-in)
  for (let d = -5; d < 0; d++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + d);
    const dateStr = targetDate.toISOString().slice(0, 10);

    // Rohan
    let checkIn = new Date(targetDate);
    checkIn.setHours(8, 0, 0);
    let checkOut = new Date(targetDate);
    checkOut.setHours(16, 0, 0);
    let status = 'PRESENT';
    if (d === -2) {
      checkIn.setHours(8, 45, 0);
      status = 'LATE';
    }
    await client.query(
      `INSERT INTO attendance (employee_id, restaurant_id, attendance_date, check_in_time, check_out_time, duration_hours, status, notes)
       VALUES ($1, $2, $3, $4, $5, 8.0, $6, $7)`,
      [empIds[1], ownerId, dateStr, checkIn, checkOut, status, status === 'LATE' ? 'Late check-in' : 'Punctual']
    );

    // Priya
    let priyaCheckIn = new Date(targetDate);
    priyaCheckIn.setHours(16, 0, 0);
    let priyaCheckOut = new Date(targetDate);
    priyaCheckOut.setHours(23, 0, 0);
    await client.query(
      `INSERT INTO attendance (employee_id, restaurant_id, attendance_date, check_in_time, check_out_time, duration_hours, status, notes)
       VALUES ($1, $2, $3, $4, $5, 7.0, 'PRESENT', 'On time')`,
      [empIds[2], ownerId, dateStr, priyaCheckIn, priyaCheckOut]
    );

    // Chef Vikram
    let chefCheckIn = new Date(targetDate);
    chefCheckIn.setHours(7, 55, 0);
    let chefCheckOut = new Date(targetDate);
    chefCheckOut.setHours(16, 5, 0);
    await client.query(
      `INSERT INTO attendance (employee_id, restaurant_id, attendance_date, check_in_time, check_out_time, duration_hours, status, notes)
       VALUES ($1, $2, $3, $4, $5, 8.1, 'PRESENT', 'Great job')`,
      [empIds[3], ownerId, dateStr, chefCheckIn, chefCheckOut]
    );

    // Neha
    let nehaCheckIn = new Date(targetDate);
    nehaCheckIn.setHours(16, 0, 0);
    let nehaCheckOut = new Date(targetDate);
    nehaCheckOut.setHours(23, 0, 0);
    let nehaStatus = 'PRESENT';
    if (d === -4) {
      nehaCheckIn.setHours(16, 35, 0);
      nehaStatus = 'LATE';
    }
    await client.query(
      `INSERT INTO attendance (employee_id, restaurant_id, attendance_date, check_in_time, check_out_time, duration_hours, status, notes)
       VALUES ($1, $2, $3, $4, $5, 7.0, $6, $7)`,
      [empIds[4], ownerId, dateStr, nehaCheckIn, nehaCheckOut, nehaStatus, nehaStatus === 'LATE' ? 'Late due to traffic' : 'On time']
    );
  }

  // Today's attendance (Rohan checked in but not checked out)
  const todayCheckIn = new Date();
  todayCheckIn.setHours(8, 0, 0);
  await client.query(
    `INSERT INTO attendance (employee_id, restaurant_id, attendance_date, check_in_time, check_out_time, duration_hours, status, notes)
     VALUES ($1, $2, $3, $4, NULL, NULL, 'PRESENT', 'Clocked in today')`,
    [empIds[1], ownerId, todayStr, todayCheckIn]
  );

  // 9. Seed Performance Reviews
  const lastMonthStart = new Date();
  lastMonthStart.setMonth(now.getMonth() - 1);
  lastMonthStart.setDate(1);
  const lastMonthEnd = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth() + 1, 0);

  await client.query(
    `INSERT INTO performance_reviews (employee_id, restaurant_id, review_period_start, review_period_end, reviewer_id, overall_rating, punctuality_rating, quality_rating, teamwork_rating, attitude_rating, skills_rating, comments, strengths, areas_for_improvement, status)
     VALUES ($1, $2, $3, $4, $2, 4.2, 4.0, 4.5, 4.0, 4.5, 4.0, 'Very good performance last month.', 'Great client interaction.', 'Can improve punctuality slightly.', 'SUBMITTED')`,
    [empIds[1], ownerId, lastMonthStart, lastMonthEnd]
  );

  await client.query(
    `INSERT INTO performance_reviews (employee_id, restaurant_id, review_period_start, review_period_end, reviewer_id, overall_rating, punctuality_rating, quality_rating, teamwork_rating, attitude_rating, skills_rating, comments, strengths, areas_for_improvement, status)
     VALUES ($1, $2, $3, $4, $2, 4.8, 4.8, 4.9, 4.5, 4.8, 5.0, 'Outstanding performance. Chef Vikram has elevated the quality of our dishes.', 'Excellent culinary skills and leadership.', 'None', 'SUBMITTED')`,
    [empIds[3], ownerId, lastMonthStart, lastMonthEnd]
  );

  // 10. Seed Reservations
  const tomorrowResDate = new Date();
  tomorrowResDate.setDate(now.getDate() + 1);

  const yesterdayResDate = new Date();
  yesterdayResDate.setDate(now.getDate() - 1);

  const nextWeekResDate = new Date();
  nextWeekResDate.setDate(now.getDate() + 7);

  const reservationsData = [
    { customerIdx: 2, date: tomorrowResDate, time: '19:30:00', guests: 4, status: 'CONFIRMED', notes: 'Window table preferred.' },
    { customerIdx: 1, date: yesterdayResDate, time: '20:00:00', guests: 2, status: 'COMPLETED', notes: 'Anniversary dinner.' },
    { customerIdx: 0, date: now, time: '20:00:00', guests: 6, status: 'PENDING', notes: 'VIP customer. Request round table.' },
    { customerIdx: 3, date: nextWeekResDate, time: '18:00:00', guests: 2, status: 'PENDING', notes: 'Quiet corner preferred.' },
    { customerIdx: 4, date: now, time: '13:00:00', guests: 2, status: 'SEATED', notes: 'Business lunch.' }
  ];

  for (const res of reservationsData) {
    await client.query(
      `INSERT INTO reservations (restaurant_id, customer_id, reservation_date, reservation_time, guest_count, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ownerId, customerIds[res.customerIdx], res.date.toISOString().slice(0, 10), res.time, res.guests, res.status, res.notes]
    );
  }

  // 11. Seed Waitlist entries
  await client.query(
    `INSERT INTO waitlist_entries (restaurant_id, customer_id, customer_name, phone_number, party_size, estimated_wait_mins, status, notes)
     VALUES ($1, $2, 'Rohan Verma', '9898989898', 3, 20, 'WAITING', 'Need high chair for toddler')`,
    [ownerId, customerIds[2]]
  );
  await client.query(
    `INSERT INTO waitlist_entries (restaurant_id, customer_name, phone_number, party_size, estimated_wait_mins, status, notes)
     VALUES ($1, 'Shreya Roy', '9797979797', 2, 10, 'WAITING', 'Near outdoor area')`,
    [ownerId]
  );

  // 12. Seed Orders, Invoices, and Payments
  // Create 15 orders spread over the last 10 days
  for (let i = 0; i < 15; i++) {
    let orderDate = new Date();
    // Spread back in time, but set some PAID orders to TODAY (index 9 and 10 and 14)
    if (i === 9 || i === 10 || i === 14) {
      orderDate = now;
    } else {
      orderDate.setDate(now.getDate() - (14 - i));
    }
    
    let status = 'PAID';
    if (i === 11) status = 'SERVED';
    if (i === 12) status = 'READY';
    if (i === 13) status = 'PREPARING';
    if (i === 14) {
      status = 'NEW';
    }

    const tableNum = (i % 8) + 1;
    const tableId = tableIdsMap[tableNum];
    const guestCount = (i % 3) + 2;
    
    const selectedItemIdx = i % menuItemsData.length;
    const menuItemId = itemIds[selectedItemIdx];
    const itemPrice = menuItemsData[selectedItemIdx].price;
    const qty = (i % 2) + 1;
    const subtotal = itemPrice * qty;

    const customerId = customerIds[i % customerIds.length];

    const orderRes = await client.query(
      `INSERT INTO orders (restaurant_id, waiter_id, table_id, table_number, guest_count, status, total_amount, customer_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING id`,
      [ownerId, ownerId, tableId, tableNum, guestCount, status, subtotal, customerId, orderDate]
    );
    const orderId = orderRes.rows[0].id;

    // Insert order item
    await client.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, menuItemId, qty, itemPrice, subtotal, orderDate]
    );

    // Increment menu item analytics
    await client.query(
      `UPDATE menu_item_analytics 
       SET orders_count = orders_count + $1, revenue = revenue + $2, last_ordered_at = $3, updated_at = NOW()
       WHERE menu_item_id = $4`,
      [qty, subtotal, orderDate, menuItemId]
    );

    // If paid, create invoice and payment
    if (status === 'PAID') {
      const tax = parseFloat((subtotal * 0.18).toFixed(2));
      const total = subtotal + tax;
      const invNum = `INV-${2000 + i}-${Date.now().toString().slice(-4)}`;

      const invRes = await client.query(
        `INSERT INTO invoices (restaurant_id, order_id, invoice_number, subtotal, tax_amount, discount_amount, total_amount, status, issue_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 0, $6, 'PAID', $7, $7, $7) RETURNING id`,
        [ownerId, orderId, invNum, subtotal, tax, total, orderDate]
      );
      const invoiceId = invRes.rows[0].id;

      await client.query(
        `INSERT INTO payments (restaurant_id, order_id, invoice_id, amount, payment_method, status, transaction_reference, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'CARD', 'PAID', $5, $6, $6)`,
        [ownerId, orderId, invoiceId, total, `TX-${2000 + i}`, orderDate]
      );
    }
  }

  // 13. Update some tables to reflect active orders
  const readyOrder = await client.query("SELECT id FROM orders WHERE restaurant_id = $1 AND status = 'READY' LIMIT 1", [ownerId]);
  if (readyOrder.rows.length > 0) {
    await client.query(
      `UPDATE restaurant_tables SET status = 'OCCUPIED', current_order_id = $1, last_occupied_at = NOW()
       WHERE table_number = 1 AND restaurant_id = $2`,
      [readyOrder.rows[0].id, ownerId]
    );
  }
  
  const prepOrder = await client.query("SELECT id FROM orders WHERE restaurant_id = $1 AND status = 'PREPARING' LIMIT 1", [ownerId]);
  if (prepOrder.rows.length > 0) {
    await client.query(
      `UPDATE restaurant_tables SET status = 'OCCUPIED', current_order_id = $1, last_occupied_at = NOW()
       WHERE table_number = 2 AND restaurant_id = $2`,
      [prepOrder.rows[0].id, ownerId]
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await client.query(
    `UPDATE restaurant_tables SET status = 'RESERVED', reserved_for = 'Rahul Sharma', 
     reserved_phone = '9876543210', reservation_time = $1 WHERE table_number = 3 AND restaurant_id = $2`,
    [tomorrow, ownerId]
  );

  console.log(`Seeding complete for owner: ${ownerId}!`);
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ownersRes = await client.query("SELECT id, name FROM users WHERE role = 'RESTAURANT_OWNER'");
    console.log(`Found ${ownersRes.rows.length} restaurant owner accounts to seed.`);

    for (const owner of ownersRes.rows) {
      await seedForOwner(client, owner.id);
    }

    await client.query('COMMIT');
    console.log('Database seeding successfully applied to all owners!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('SEEDING FAILED:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
