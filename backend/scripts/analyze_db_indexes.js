const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    console.log('Connecting to database...');
    
    // 1. Check existing indexes
    const { rows: indexes } = await pool.query(`
      SELECT
        t.relname as table_name,
        i.relname as index_name,
        a.attname as column_name
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname IN ('inventory_items', 'purchase_orders', 'activity_events', 'suppliers', 'menu_items', 'menu_categories', 'users')
      ORDER BY
        t.relname,
        i.relname;
    `);

    console.log('\n--- Existing Indexes ---');
    console.table(indexes);

    // 2. Create missing indexes
    const queries = [
      'CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);',
      'CREATE INDEX IF NOT EXISTS idx_inventory_items_workspace_id ON inventory_items(workspace_id);',
      'CREATE INDEX IF NOT EXISTS idx_purchase_orders_workspace_id ON purchase_orders(workspace_id);',
      'CREATE INDEX IF NOT EXISTS idx_activity_events_workspace_id ON activity_events(workspace_id);',
      'CREATE INDEX IF NOT EXISTS idx_suppliers_workspace_id ON suppliers(workspace_id);',
      'CREATE INDEX IF NOT EXISTS idx_inventory_items_restaurant_id ON inventory_items(restaurant_id);',
      'CREATE INDEX IF NOT EXISTS idx_suppliers_restaurant_id ON suppliers(restaurant_id);',
      'CREATE INDEX IF NOT EXISTS idx_purchase_orders_restaurant_id ON purchase_orders(restaurant_id);'
    ];

    console.log('\n--- Creating Missing Indexes ---');
    for (const q of queries) {
      console.log(`Running: ${q}`);
      await pool.query(q);
    }
    console.log('\nIndexes created successfully!');
  } catch (err) {
    console.error('Error running index analysis:', err);
  } finally {
    await pool.end();
  }
}

run();
