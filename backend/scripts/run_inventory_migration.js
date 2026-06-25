const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', '..', 'database', 'schema', '005_create_inventory_schema.sql');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:pranav@localhost:5432/SmartServe-AI';

async function run() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    console.log('Running migration file:', sqlPath);
    await client.query(sql);
    console.log('Migration executed successfully.');

    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`
    );
    console.log('Public tables:');
    rows.forEach((row) => console.log(row.table_name));
    
      // --- Seed test data for Module 7 ---
      console.log('\nSeeding test data: categories, supplier, inventory items, menu item, recipe, order');

      // find a restaurant id (first RESTAURANT_OWNER or any user)
      const uRes = await client.query("SELECT id FROM users ORDER BY created_at ASC LIMIT 1");
      if (uRes.rows.length === 0) {
        throw new Error('No users found to associate restaurant data');
      }
      const restaurantId = uRes.rows[0].id;

      async function ensureCategory(name) {
        const r = await client.query('SELECT id FROM inventory_categories WHERE restaurant_id=$1 AND name=$2 LIMIT 1', [restaurantId, name]);
        if (r.rows.length) return r.rows[0].id;
        const ins = await client.query('INSERT INTO inventory_categories (restaurant_id, name, description, display_order) VALUES ($1,$2,$3,$4) RETURNING id', [restaurantId, name, '', 0]);
        return ins.rows[0].id;
      }

      async function ensureSupplier(name) {
        const r = await client.query('SELECT id FROM suppliers WHERE restaurant_id=$1 AND name=$2 LIMIT 1', [restaurantId, name]);
        if (r.rows.length) return r.rows[0].id;
        const ins = await client.query('INSERT INTO suppliers (restaurant_id, name, contact_name, phone, email, address) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [restaurantId, name, null, null, null, null]);
        return ins.rows[0].id;
      }

      async function ensureInventoryItem({ name, category_id, supplier_id, quantity_on_hand, reorder_threshold, unit='kg' }) {
        const r = await client.query('SELECT id FROM inventory_items WHERE restaurant_id=$1 AND name=$2 LIMIT 1', [restaurantId, name]);
        if (r.rows.length) {
          // update quantity to desired value for testing
          await client.query('UPDATE inventory_items SET quantity_on_hand=$1, reorder_threshold=$2, updated_at=NOW() WHERE id=$3', [quantity_on_hand, reorder_threshold, r.rows[0].id]);
          return r.rows[0].id;
        }
        const ins = await client.query('INSERT INTO inventory_items (restaurant_id, category_id, supplier_id, name, unit, quantity_on_hand, reorder_threshold) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id', [restaurantId, category_id, supplier_id, name, unit, quantity_on_hand, reorder_threshold]);
        return ins.rows[0].id;
      }

      // ensure categories
      const catVegetables = await ensureCategory('Vegetables');
      const catMeat = await ensureCategory('Meat');
      const catSpices = await ensureCategory('Spices');

      // ensure supplier
      const demoSupplier = await ensureSupplier('Demo Supplier');

      // create inventory items
      const riceId = await ensureInventoryItem({ name: 'Rice', category_id: catVegetables, supplier_id: demoSupplier, quantity_on_hand: 10.0, reorder_threshold: 10.0, unit: 'kg' });
      const chickenId = await ensureInventoryItem({ name: 'Chicken', category_id: catMeat, supplier_id: demoSupplier, quantity_on_hand: 5.0, reorder_threshold: 2.0, unit: 'kg' });
      const oilId = await ensureInventoryItem({ name: 'Oil', category_id: catSpices, supplier_id: demoSupplier, quantity_on_hand: 2.0, reorder_threshold: 1.0, unit: 'litre' });
      const onionId = await ensureInventoryItem({ name: 'Onion', category_id: catVegetables, supplier_id: demoSupplier, quantity_on_hand: 20.0, reorder_threshold: 5.0, unit: 'kg' });
      const tomatoId = await ensureInventoryItem({ name: 'Tomato', category_id: catVegetables, supplier_id: demoSupplier, quantity_on_hand: 20.0, reorder_threshold: 5.0, unit: 'kg' });

      // ensure a menu item for Chicken Biryani
      let menuItemId;
      const mRes = await client.query('SELECT id FROM menu_items WHERE restaurant_id=$1 AND name=$2 LIMIT 1', [restaurantId, 'Chicken Biryani']);
      if (mRes.rows.length) menuItemId = mRes.rows[0].id;
      else {
        // try to find a menu category
        const mc = await client.query('SELECT id FROM menu_categories WHERE restaurant_id=$1 LIMIT 1', [restaurantId]);
        const menuCat = mc.rows.length ? mc.rows[0].id : null;
        const mi = await client.query('INSERT INTO menu_items (restaurant_id, category_id, name, price) VALUES ($1,$2,$3,$4) RETURNING id', [restaurantId, menuCat, 'Chicken Biryani', 10.0]);
        menuItemId = mi.rows[0].id;
      }

      // Ensure compatibility table `menu_item_ingredients` exists (canonical schema)
      await client.query(`CREATE TABLE IF NOT EXISTS menu_item_ingredients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL,
        menu_item_id UUID NOT NULL,
        inventory_item_id UUID NOT NULL,
        quantity_required DECIMAL(10,4) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
        UNIQUE (menu_item_id, inventory_item_id)
      );`);

      // insert recipe mapping (menu_item_inventory table) - Rice 0.25, Chicken 0.20, Oil 0.03
      async function ensureRecipeLine(menu_item_id, inventory_item_id, qty) {
        const r = await client.query('SELECT id FROM menu_item_ingredients WHERE restaurant_id=$1 AND menu_item_id=$2 AND inventory_item_id=$3 LIMIT 1', [restaurantId, menu_item_id, inventory_item_id]);
        if (r.rows.length) return r.rows[0].id;
        const ins = await client.query('INSERT INTO menu_item_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required) VALUES ($1,$2,$3,$4) RETURNING id', [restaurantId, menu_item_id, inventory_item_id, qty]);
        return ins.rows[0].id;
      }

      await ensureRecipeLine(menuItemId, riceId, 0.25);
      await ensureRecipeLine(menuItemId, chickenId, 0.2);
      await ensureRecipeLine(menuItemId, oilId, 0.03);

      // create an order for 1 Chicken Biryani
      const orderIns = await client.query('INSERT INTO orders (restaurant_id, waiter_id, table_number, guest_count, status, total_amount) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [restaurantId, restaurantId, 1, 1, 'NEW', 10.0]);
      const orderId = orderIns.rows[0].id;
      await client.query('INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal) VALUES ($1,$2,$3,$4,$5)', [orderId, menuItemId, 1, 10.0, 10.0]);

      console.log('Order created:', orderId);

      // advance order statuses and run deduction when served
      const statuses = ['PREPARING','READY','SERVED'];
      for (const st of statuses) {
        await client.query('UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2', [st, orderId]);
        console.log('Order status set to', st);
        if (st === 'SERVED') {
          // perform deduction similar to inventory.deductInventoryForOrder
          const { rows: rrows } = await client.query(
            `SELECT oi.quantity as order_quantity, mii.inventory_item_id, mii.quantity_required, ii.name as inventory_item_name, ii.quantity_on_hand
             FROM order_items oi
             JOIN menu_item_ingredients mii ON oi.menu_item_id = mii.menu_item_id
             JOIN inventory_items ii ON ii.id = mii.inventory_item_id
             WHERE oi.order_id = $1 AND ii.restaurant_id = $2`,
            [orderId, restaurantId]
          );

          const totals = new Map();
          rrows.forEach(row => {
            const required = parseFloat(row.quantity_required) * parseInt(row.order_quantity,10);
            const existing = totals.get(row.inventory_item_id);
            if (existing) existing.required += required; else totals.set(row.inventory_item_id, { required, name: row.inventory_item_name, available: parseFloat(row.quantity_on_hand) });
          });

          for (const [itemId,data] of totals.entries()){
            if (data.available < data.required){
              throw new Error('Insufficient inventory for ingredient '+data.name);
            }
          }

          for (const [itemId,data] of totals.entries()){
            await client.query('UPDATE inventory_items SET quantity_on_hand = quantity_on_hand - $1, updated_at = NOW() WHERE id=$2 AND restaurant_id=$3', [data.required, itemId, restaurantId]);
            await client.query('INSERT INTO inventory_transactions (restaurant_id, inventory_item_id, order_id, change_amount, transaction_type, note, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())', [restaurantId, itemId, orderId, -data.required, 'STOCK_OUT', 'Order served consumption']);
          }
          console.log('Inventory deduction applied for order', orderId);
        }
      }

      // report inventory after deduction
      const invRows = await client.query("SELECT id,name,quantity_on_hand,reorder_threshold FROM inventory_items WHERE restaurant_id=$1 AND name IN ('Rice','Chicken','Oil','Onion','Tomato') ORDER BY name", [restaurantId]);
      console.log('\nInventory after deduction:');
      invRows.rows.forEach(r => console.log(r.name, r.quantity_on_hand));

      // verify inventory_transactions for this order
      const txRows = await client.query('SELECT inventory_item_id, change_amount, transaction_type FROM inventory_transactions WHERE order_id=$1', [orderId]);
      console.log('\nInventory transactions for order:');
      txRows.rows.forEach(r => console.log(r.inventory_item_id, r.change_amount, r.transaction_type));

      // Phase 4: create low stock alert by setting Rice to 9 (below threshold 10)
      await client.query('UPDATE inventory_items SET quantity_on_hand=$1, updated_at=NOW() WHERE id=$2', [9.0, riceId]);
      // insert alert if not exists
      const existAlert = await client.query('SELECT id FROM inventory_alerts WHERE restaurant_id=$1 AND inventory_item_id=$2 AND alert_type=$3 LIMIT 1', [restaurantId, riceId, 'LOW_STOCK']);
      if (existAlert.rows.length === 0) {
        await client.query('INSERT INTO inventory_alerts (restaurant_id, inventory_item_id, alert_type, threshold, message) VALUES ($1,$2,$3,$4,$5)', [restaurantId, riceId, 'LOW_STOCK', 10.0, 'Rice below minimum stock']);
        console.log('\nLow stock alert created for Rice');
      } else {
        console.log('\nLow stock alert already exists for Rice');
      }

      const alerts = await client.query('SELECT inventory_item_id, alert_type, threshold FROM inventory_alerts WHERE restaurant_id=$1', [restaurantId]);
      console.log('\nInventory alerts:');
      alerts.rows.forEach(a => console.log(a.inventory_item_id, a.alert_type, a.threshold));
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
