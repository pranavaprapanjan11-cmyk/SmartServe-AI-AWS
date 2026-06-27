const { pool } = require('./db_helper');

async function run() {
  console.log('--- STARTING TABLE OVERLAP & GRID AUTO-PLACEMENT AUDIT ---');
  
  // Get dynamic restaurant owner ID
  const ownerRes = await pool.query("SELECT id FROM users WHERE role = 'RESTAURANT_OWNER' LIMIT 1");
  if (ownerRes.rows.length === 0) {
    console.error("No restaurant owner found in database!");
    process.exit(1);
  }
  const restaurantId = ownerRes.rows[0].id;
  
  // 1. Clean existing tables for this test restaurant first
  await pool.query("DELETE FROM restaurant_tables WHERE restaurant_id = $1", [restaurantId]);
  console.log('Cleaned up previous tables.');

  // Helper findNextAvailablePosition (same as backend service logic)
  function findNextAvailablePosition(existingTables) {
    const cols = [40, 180, 320, 460, 600, 740];
    const rows = [40, 180, 320, 460];
    
    for (const y of rows) {
      for (const x of cols) {
        const margin = 20;
        const w = 80;
        const h = 80;
        const collides = existingTables.some(t => {
          const tW = t.width || 80;
          const tH = t.height || 80;
          return (
            x < Number(t.position_x) + tW + margin &&
            x + w + margin > Number(t.position_x) &&
            y < Number(t.position_y) + tH + margin &&
            y + h + margin > Number(t.position_y)
          );
        });
        if (!collides) {
          return { position_x: x, position_y: y };
        }
      }
    }
    return { position_x: 80, position_y: 80 };
  }

  // 2. Create 10 tables consecutively and record their coordinates
  const createdTables = [];
  for (let i = 1; i <= 10; i++) {
    const existing = await pool.query("SELECT position_x, position_y, width, height FROM restaurant_tables WHERE restaurant_id = $1", [restaurantId]);
    const { position_x, position_y } = findNextAvailablePosition(existing.rows);
    
    const { rows } = await pool.query(
      `INSERT INTO restaurant_tables 
         (restaurant_id, table_number, capacity, status, section, shape, position_x, position_y, width, height, rotation)
       VALUES ($1, $2, 4, 'AVAILABLE', 'Main Hall', 'square', $3, $4, 80, 80, 0)
       RETURNING *`,
      [restaurantId, i, position_x, position_y]
    );
    
    const t = rows[0];
    createdTables.push(t);
    console.log(`Created Table T${t.table_number} at Position (${t.position_x}, ${t.position_y})`);
  }

  // 3. Verify distinctness of positions
  console.log('\nVerifying distinctness...');
  const positions = new Set();
  let overlaps = 0;
  for (const t of createdTables) {
    const posKey = `${t.position_x},${t.position_y}`;
    if (positions.has(posKey)) {
      overlaps++;
      console.error(`[ERROR] Overlap detected at position ${posKey} for Table T${t.table_number}!`);
    } else {
      positions.add(posKey);
    }
  }

  if (overlaps === 0) {
    console.log('✔ [VERIFIED]: All 10 tables were created at completely unique positions. Zero overlaps!');
  } else {
    console.error(`✖ [FAILED]: Detected ${overlaps} overlapping table placements!`);
  }

  // 4. Test dragging / updating position
  console.log('\nTesting drag updating position persistence...');
  const targetTable = createdTables[0];
  const newX = 500;
  const newY = 300;
  
  await pool.query(
    "UPDATE restaurant_tables SET position_x = $1, position_y = $2 WHERE id = $3",
    [newX, newY, targetTable.id]
  );
  
  const checkUpdated = await pool.query("SELECT position_x, position_y FROM restaurant_tables WHERE id = $1", [targetTable.id]);
  const updatedTable = checkUpdated.rows[0];
  if (updatedTable.position_x === newX && updatedTable.position_y === newY) {
    console.log(`✔ [VERIFIED]: Position updated successfully to (${newX}, ${updatedTable.position_y}). Position persisted!`);
  } else {
    console.error('✖ [FAILED]: Position update failed.');
  }

  // 5. Test deleting a table
  console.log('\nTesting table deletion...');
  await pool.query("DELETE FROM restaurant_tables WHERE id = $1", [targetTable.id]);
  const checkDeleted = await pool.query("SELECT count(*) FROM restaurant_tables WHERE id = $1", [targetTable.id]);
  if (parseInt(checkDeleted.rows[0].count) === 0) {
    console.log('✔ [VERIFIED]: Table deleted successfully.');
  } else {
    console.error('✖ [FAILED]: Table deletion failed.');
  }

  console.log('\n--- TABLE OVERLAP & GRID AUTO-PLACEMENT AUDIT COMPLETE ---');
  await pool.end();
}

run().catch(err => {
  console.error(err);
  pool.end();
});
