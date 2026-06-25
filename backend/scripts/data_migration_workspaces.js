const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL not defined');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function generateCode(client, restaurantName) {
  const base = restaurantName.replace(/[^A-Z]/gi, '').substring(0, 5).toUpperCase() || 'REST';
  let attempts = 0;
  while (attempts < 100) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const code = `${base}${randomDigits}`;
    const { rows } = await client.query('SELECT id FROM workspaces WHERE workspace_code = $1 LIMIT 1', [code]);
    if (rows.length === 0) {
      return code;
    }
    attempts++;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
}

async function run() {
  console.log('--- STARTING WORKSPACE MIGRATION ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get all owners
    const { rows: owners } = await client.query(
      `SELECT id, name FROM users WHERE role IN ('RESTAURANT_OWNER', 'OWNER')`
    );
    console.log(`Found ${owners.length} owner accounts.`);

    for (const owner of owners) {
      // Check if user already has a workspace
      const { rows: existingUser } = await client.query(
        `SELECT workspace_id FROM users WHERE id = $1`,
        [owner.id]
      );
      
      if (existingUser[0] && existingUser[0].workspace_id) {
        console.log(`Owner ${owner.name} already has workspace: ${existingUser[0].workspace_id}`);
        continue;
      }

      // Create new workspace
      const rName = owner.name.includes('Admin') ? 'SmartServe Restaurant' : `${owner.name} Restaurant`;
      const code = await generateCode(client, rName);
      const wName = `${owner.name}'s Workspace`;

      const { rows: ws } = await client.query(
        `INSERT INTO workspaces (workspace_code, workspace_name, owner_id, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id`,
        [code, wName, owner.id]
      );
      const workspaceId = ws[0].id;
      console.log(`Created workspace ${wName} (${code}) for owner ${owner.name}.`);

      // Update owner user's workspace_id
      await client.query(
        `UPDATE users SET workspace_id = $1 WHERE id = $2`,
        [workspaceId, owner.id]
      );
    }

    // 2. Associate non-owners with the first workspace
    const { rows: firstWs } = await client.query(
      `SELECT id FROM workspaces ORDER BY created_at ASC LIMIT 1`
    );
    if (firstWs.length > 0) {
      const defaultWorkspaceId = firstWs[0].id;
      const { rowCount } = await client.query(
        `UPDATE users SET workspace_id = $1 WHERE workspace_id IS NULL`,
        [defaultWorkspaceId]
      );
      console.log(`Associated ${rowCount} non-owner / other users with default workspace ID: ${defaultWorkspaceId}`);
    }

    // 3. Migrate data for all target tables
    const tablesToMigrate = [
      'employees', 'orders', 'restaurant_tables', 'customers', 'reservations',
      'waitlist_entries', 'inventory_categories', 'suppliers', 'inventory_items',
      'menu_item_ingredients', 'inventory_transactions', 'purchase_orders', 'inventory_alerts',
      'restaurant_settings', 'printer_settings', 'invoices', 'payments', 'activity_events',
      'menu_categories', 'menu_items', 'attendance', 'shifts', 'employee_shifts',
      'leave_requests', 'salary', 'performance_reviews', 'disciplinary_actions'
    ];

    for (const tableName of tablesToMigrate) {
      const query = `
        UPDATE ${tableName} t
        SET workspace_id = u.workspace_id
        FROM users u
        WHERE t.restaurant_id = u.id AND t.workspace_id IS NULL
      `;
      const { rowCount } = await client.query(query);
      console.log(`Updated workspace_id for ${rowCount} rows in table: ${tableName}`);
    }

    await client.query('COMMIT');
    console.log('--- WORKSPACE MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
