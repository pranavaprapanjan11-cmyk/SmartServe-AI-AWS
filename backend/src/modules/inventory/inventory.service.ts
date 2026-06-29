import { pool } from '../../database';
import {
  InventoryItem,
  CreateInventoryItemPayload,
  UpdateInventoryItemPayload,
  MenuItemRecipeLine,
  MenuItemRecipe,
  Wastage,
  PurchaseOrder,
  PurchaseOrderItem,
  ForecastItem
} from './inventory.types';



async function resolveRestaurantId(userId: string, role: string): Promise<string> {
  if (role === 'RESTAURANT_OWNER' || role === 'OWNER' || role === 'SUPER_ADMIN') {
    return userId;
  }

  const { rows } = await pool.query(
    "SELECT id FROM users WHERE role = 'RESTAURANT_OWNER' ORDER BY created_at ASC LIMIT 1"
  );

  return rows.length > 0 ? rows[0].id : userId;
}

async function resolveWorkspaceId(userId: string): Promise<string | null> {
  const { rows } = await pool.query(
    'SELECT workspace_id FROM users WHERE id = $1 LIMIT 1',
    [userId]
  );
  return rows[0]?.workspace_id || null;
}

// ==========================================
// INVENTORY ITEMS
// ==========================================

export async function getInventoryItems(userId: string, role: string): Promise<InventoryItem[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM inventory_items WHERE restaurant_id = $1 ORDER BY name ASC`,
    [restaurantId]
  );
  return rows.map((row: any) => ({
    ...row,
    quantity_on_hand: parseFloat(row.quantity_on_hand),
    reorder_threshold: parseFloat(row.reorder_threshold),
  })) as InventoryItem[];
}

export async function getInventoryItemById(userId: string, role: string, id: string): Promise<InventoryItem | null> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(`SELECT * FROM inventory_items WHERE id = $1 AND restaurant_id = $2 LIMIT 1`, [id, restaurantId]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    quantity_on_hand: parseFloat(row.quantity_on_hand),
    reorder_threshold: parseFloat(row.reorder_threshold),
  } as InventoryItem;
}

export async function createInventoryItem(userId: string, role: string, payload: CreateInventoryItemPayload): Promise<InventoryItem> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const workspaceId = await resolveWorkspaceId(userId);

  let categoryId = payload.category_id;
  if (!categoryId) {
    const catResult = await pool.query(
      `SELECT id FROM inventory_categories WHERE restaurant_id = $1 ORDER BY name ASC LIMIT 1`,
      [restaurantId]
    );
    if (catResult.rows.length > 0) {
      categoryId = catResult.rows[0].id;
    } else {
      const newCatResult = await pool.query(
        `INSERT INTO inventory_categories (restaurant_id, workspace_id, name, description)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [restaurantId, workspaceId, 'General', 'Default general inventory category']
      );
      categoryId = newCatResult.rows[0].id;
    }
  }

  let supplierId = payload.supplier_id;
  if (!supplierId) {
    const supResult = await pool.query(
      `SELECT id FROM suppliers WHERE restaurant_id = $1 ORDER BY name ASC LIMIT 1`,
      [restaurantId]
    );
    if (supResult.rows.length > 0) {
      supplierId = supResult.rows[0].id;
    } else {
      const newSupResult = await pool.query(
        `INSERT INTO suppliers (restaurant_id, workspace_id, name, contact_name, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [restaurantId, workspaceId, 'Default Supplier', 'Manager', '0000000000']
      );
      supplierId = newSupResult.rows[0].id;
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO inventory_items (restaurant_id, workspace_id, name, description, unit, quantity_on_hand, reorder_threshold, category_id, supplier_id, expiry_date, batch_number, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      restaurantId,
      workspaceId,
      payload.name,
      payload.description || null,
      payload.unit,
      payload.quantity_on_hand,
      payload.reorder_threshold,
      categoryId,
      supplierId,
      payload.expiry_date || null,
      payload.batch_number || null,
      payload.is_active ?? true,
    ]
  );

  const row = rows[0];

  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'inventoryUpdated');
  } catch (err) {
    console.error('Failed to notify workspace on createInventoryItem:', err);
  }

  return {
    ...row,
    quantity_on_hand: parseFloat(row.quantity_on_hand),
    reorder_threshold: parseFloat(row.reorder_threshold),
  } as InventoryItem;
}

export async function updateInventoryItem(userId: string, role: string, id: string, payload: UpdateInventoryItemPayload): Promise<InventoryItem> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const existing = await getInventoryItemById(userId, role, id);
  if (!existing) {
    throw new Error('Inventory item not found');
  }

  const updates: string[] = [];
  const values: any[] = [id, restaurantId];
  let paramIndex = 2;

  const mapping: { [key: string]: string } = {
    name: 'name',
    description: 'description',
    unit: 'unit',
    quantity_on_hand: 'quantity_on_hand',
    reorder_threshold: 'reorder_threshold',
    category_id: 'category_id',
    supplier_id: 'supplier_id',
    expiry_date: 'expiry_date',
    batch_number: 'batch_number',
    is_active: 'is_active',
  };

  for (const key of Object.keys(mapping)) {
    if (key in payload && (payload as any)[key] !== undefined) {
      values.push((payload as any)[key]);
      updates.push(`${mapping[key]} = $${++paramIndex}`);
    }
  }

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  updates.push('updated_at = NOW()');

  const { rows } = await pool.query(
    `UPDATE inventory_items SET ${updates.join(', ')} WHERE id = $1 AND restaurant_id = $2 RETURNING *`,
    values
  );

  if (rows.length === 0) {
    throw new Error('Inventory item update failed');
  }

  const row = rows[0];
  const updatedItem = {
    ...row,
    quantity_on_hand: parseFloat(row.quantity_on_hand),
    reorder_threshold: parseFloat(row.reorder_threshold),
  } as InventoryItem;

  if (payload.quantity_on_hand !== undefined && updatedItem.quantity_on_hand > existing.quantity_on_hand) {
    try {
      const workspaceId = await resolveWorkspaceId(userId);
      await pool.query(
        `INSERT INTO activity_events (restaurant_id, workspace_id, event_type, description, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          restaurantId,
          workspaceId,
          'STOCK_REFILLED',
          `Inventory item ${updatedItem.name} refilled (Stock increased from ${existing.quantity_on_hand} to ${updatedItem.quantity_on_hand} ${updatedItem.unit})`,
          JSON.stringify({ itemId: updatedItem.id, oldQuantity: existing.quantity_on_hand, newQuantity: updatedItem.quantity_on_hand })
        ]
      );
    } catch (e) {
      console.error('Failed to log STOCK_REFILLED event:', e);
    }
  }

  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'inventoryUpdated');
  } catch (err) {
    console.error('Failed to notify workspace on updateInventoryItem:', err);
  }

  return updatedItem;
}

export async function deleteInventoryItem(userId: string, role: string, id: string): Promise<void> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rowCount } = await pool.query(`DELETE FROM inventory_items WHERE id = $1 AND restaurant_id = $2`, [id, restaurantId]);
  if (rowCount === 0) {
    throw new Error('Inventory item not found');
  }

  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'inventoryUpdated');
  } catch (err) {
    console.error('Failed to notify workspace on deleteInventoryItem:', err);
  }
}

export async function listLowStockItems(userId: string, role: string): Promise<InventoryItem[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM inventory_items
     WHERE restaurant_id = $1 AND quantity_on_hand <= reorder_threshold
     ORDER BY quantity_on_hand ASC`,
    [restaurantId]
  );
  return rows.map((row: any) => ({
    ...row,
    quantity_on_hand: parseFloat(row.quantity_on_hand),
    reorder_threshold: parseFloat(row.reorder_threshold),
  })) as InventoryItem[];
}

// ==========================================
// RECIPE MANAGEMENT ENGINE
// ==========================================

export async function getRecipeForMenuItem(userId: string, role: string, menuItemId: string): Promise<MenuItemRecipe[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT ri.id, r.menu_item_id, ri.inventory_item_id, ri.quantity_required,
            ii.name as inventory_item_name, ii.unit as inventory_item_unit
     FROM recipes r
     JOIN recipe_ingredients ri ON r.id = ri.recipe_id
     JOIN inventory_items ii ON ii.id = ri.inventory_item_id
     WHERE r.menu_item_id = $1 AND r.restaurant_id = $2`,
    [menuItemId, restaurantId]
  );
  return rows.map((row: any) => ({
    ...row,
    quantity_required: parseFloat(row.quantity_required),
  })) as MenuItemRecipe[];
}

export async function saveRecipeForMenuItem(
  userId: string,
  role: string,
  menuItemId: string,
  recipeLines: MenuItemRecipeLine[]
): Promise<MenuItemRecipe[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Validate menu item exists and belongs to restaurant
    const { rows: menuRows } = await client.query(
      `SELECT id FROM menu_items WHERE id = $1 AND restaurant_id = $2 LIMIT 1`,
      [menuItemId, restaurantId]
    );
    if (menuRows.length === 0) {
      throw new Error('Menu item not found');
    }

    // 2. Validate all inventory items exist and belong to restaurant
    if (recipeLines.length > 0) {
      const inventoryIds = recipeLines.map((line) => line.inventory_item_id);
      const { rows: inventoryRows } = await client.query(
        `SELECT id FROM inventory_items WHERE id = ANY($1) AND restaurant_id = $2`,
        [inventoryIds, restaurantId]
      );
      if (inventoryRows.length !== inventoryIds.length) {
        throw new Error('Some inventory items are missing or unauthorized');
      }
    }

    // 3. Find or create recipe
    let recipeId: string;
    const { rows: existRecipe } = await client.query(
      `SELECT id FROM recipes WHERE menu_item_id = $1 AND restaurant_id = $2 LIMIT 1`,
      [menuItemId, restaurantId]
    );

    if (existRecipe.length > 0) {
      recipeId = existRecipe[0].id;
      await client.query(`UPDATE recipes SET updated_at = NOW() WHERE id = $1`, [recipeId]);
    } else {
      const { rows: newRecipe } = await client.query(
        `INSERT INTO recipes (restaurant_id, menu_item_id) VALUES ($1, $2) RETURNING id`,
        [restaurantId, menuItemId]
      );
      recipeId = newRecipe[0].id;
    }

    // 4. Delete old ingredients mapping
    await client.query(
      `DELETE FROM recipe_ingredients WHERE recipe_id = $1`,
      [recipeId]
    );

    // 5. Insert new ingredients mapping
    const inserted: MenuItemRecipe[] = [];
    for (const line of recipeLines) {
      const { rows: itemInfo } = await client.query(
        `SELECT name, unit FROM inventory_items WHERE id = $1 LIMIT 1`,
        [line.inventory_item_id]
      );
      const item = itemInfo[0];

      const { rows: insertedRow } = await client.query(
        `INSERT INTO recipe_ingredients (recipe_id, inventory_item_id, quantity_required, unit)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [recipeId, line.inventory_item_id, line.quantity_required, item.unit]
      );

      inserted.push({
        id: insertedRow[0].id,
        menu_item_id: menuItemId,
        inventory_item_id: line.inventory_item_id,
        quantity_required: line.quantity_required,
        inventory_item_name: item.name,
        inventory_item_unit: item.unit,
      });
    }

    await client.query('COMMIT');
    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// AUTO STOCK DEDUCTION (ON READY)
// ==========================================

export async function deductInventoryForOrder(restaurantId: string, orderId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Select all ingredients for order items where consumption has not been logged yet
    const { rows } = await client.query(
      `SELECT oi.id as order_item_id,
              oi.quantity as order_quantity,
              ri.inventory_item_id,
              ri.quantity_required,
              ii.name as inventory_item_name,
              ii.quantity_on_hand,
              ii.unit as inventory_item_unit
       FROM order_items oi
       JOIN recipes r ON oi.menu_item_id = r.menu_item_id
       JOIN recipe_ingredients ri ON r.id = ri.recipe_id
       JOIN inventory_items ii ON ii.id = ri.inventory_item_id
       WHERE oi.order_id = $1 AND r.restaurant_id = $2 AND oi.consumption_logged = false`,
      [orderId, restaurantId]
    );

    if (rows.length === 0) {
      // Mark all order items as logged for safety even if no recipes are mapped
      await client.query(
        `UPDATE order_items SET consumption_logged = true WHERE order_id = $1`,
        [orderId]
      );
      await client.query('COMMIT');
      return;
    }

    // Accumulate total required ingredients across order items
    const totals = new Map<string, { required: number; name: string; available: number; unit: string }>();
    rows.forEach((row: any) => {
      const required = parseFloat(row.quantity_required) * parseInt(row.order_quantity, 10);
      const existing = totals.get(row.inventory_item_id);
      if (existing) {
        existing.required += required;
      } else {
        totals.set(row.inventory_item_id, {
          required,
          name: row.inventory_item_name,
          available: parseFloat(row.quantity_on_hand),
          unit: row.inventory_item_unit,
        });
      }
    });

    // Check inventory constraints
    for (const [itemId, data] of totals.entries()) {
      if (data.available < data.required) {
        throw new Error(`Insufficient inventory for ingredient ${data.name}. (On Hand: ${data.available} ${data.unit}, Required: ${data.required} ${data.unit})`);
      }
    }

    // Deduct stock, insert stock ledger entries and update order items consumption status
    for (const [itemId, data] of totals.entries()) {
      await client.query(
        `UPDATE inventory_items
         SET quantity_on_hand = quantity_on_hand - $1,
             updated_at = NOW()
         WHERE id = $2 AND restaurant_id = $3`,
        [data.required, itemId, restaurantId]
      );

      await client.query(
        `INSERT INTO inventory_transactions
          (restaurant_id, inventory_item_id, order_id, change_amount, transaction_type, note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [restaurantId, itemId, orderId, -data.required, 'STOCK_OUT', 'Kitchen ready production consumption']
      );

      // Alert check
      const checkStock = await client.query(
        `SELECT name, quantity_on_hand, reorder_threshold, unit FROM inventory_items WHERE id = $1`,
        [itemId]
      );
      if (checkStock.rows.length > 0) {
        const item = checkStock.rows[0];
        const qoh = parseFloat(item.quantity_on_hand);
        const thresh = parseFloat(item.reorder_threshold);
        if (qoh <= thresh) {
          // Log low stock event
          await client.query(
            `INSERT INTO activity_events (restaurant_id, event_type, description, payload, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
              restaurantId,
              'LOW_STOCK',
              `Inventory item ${item.name} is running LOW (On Hand: ${qoh} ${item.unit})`,
              JSON.stringify({ itemId, quantityOnHand: qoh, threshold: thresh })
            ]
          );

          // Insert or update inventory_alerts table
          await client.query(
            `INSERT INTO inventory_alerts (restaurant_id, inventory_item_id, alert_type, threshold, message, is_active, updated_at)
             VALUES ($1, $2, $3, $4, $5, true, NOW())
             ON CONFLICT (restaurant_id, inventory_item_id, alert_type)
             DO UPDATE SET threshold = EXCLUDED.threshold, message = EXCLUDED.message, is_active = true, updated_at = NOW()`,
            [restaurantId, itemId, 'LOW_STOCK', thresh, `Low stock alert: ${item.name} is at ${qoh} ${item.unit}`]
          );
        }
      }
    }

    // Set consumption_logged = true for the order items
    await client.query(
      `UPDATE order_items SET consumption_logged = true WHERE order_id = $1`,
      [orderId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// KITCHEN DISH REMAKE & WASTE TRACKING
// ==========================================

export async function remakeOrderItem(userId: string, role: string, orderId: string, orderItemId: string, reason: string): Promise<any> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch order item details
    const { rows: itemRows } = await client.query(
      `SELECT oi.id, oi.menu_item_id, oi.quantity, oi.consumption_logged, mi.name as menu_item_name
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.id = $1 AND oi.order_id = $2`,
      [orderItemId, orderId]
    );
    if (itemRows.length === 0) {
      throw new Error('Order item not found');
    }
    const orderItem = itemRows[0];

    // 2. Fetch recipe ingredients
    const { rows: ingredients } = await client.query(
      `SELECT ri.inventory_item_id, ri.quantity_required, ii.name as inventory_item_name, ii.unit, ii.quantity_on_hand
       FROM recipes r
       JOIN recipe_ingredients ri ON r.id = ri.recipe_id
       JOIN inventory_items ii ON ii.id = ri.inventory_item_id
       WHERE r.menu_item_id = $1 AND r.restaurant_id = $2`,
      [orderItem.menu_item_id, restaurantId]
    );

    // 3. Deduct stock for wastage and record transaction / wastage log
    for (const ing of ingredients) {
      const wastedQty = parseFloat(ing.quantity_required) * parseInt(orderItem.quantity, 10);
      const estUnitCost = 100.0; // Fallback unit cost
      const totalWastedCost = wastedQty * estUnitCost;

      // Decrement stock
      await client.query(
        `UPDATE inventory_items
         SET quantity_on_hand = quantity_on_hand - $1,
             updated_at = NOW()
         WHERE id = $2 AND restaurant_id = $3`,
        [wastedQty, ing.inventory_item_id, restaurantId]
      );

      // Log waste transaction
      await client.query(
        `INSERT INTO inventory_transactions
          (restaurant_id, inventory_item_id, order_id, change_amount, transaction_type, note, created_at)
         VALUES ($1, $2, $3, $4, 'WASTE', $5, NOW())`,
        [restaurantId, ing.inventory_item_id, orderId, -wastedQty, `Remake kitchen waste: ${reason}`]
      );

      // Insert to inventory_wastage
      await client.query(
        `INSERT INTO inventory_wastage
          (restaurant_id, inventory_item_id, quantity, cost, reason, staff_member, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [restaurantId, ing.inventory_item_id, wastedQty, totalWastedCost, `Dish Remake: ${reason} (${orderItem.menu_item_name})`, 'Kitchen Chef']
      );
    }

    // 4. Reset consumption_logged to false if it was already logged
    // This triggers consumption deduction again when order status becomes READY
    if (orderItem.consumption_logged) {
      await client.query(
        `UPDATE order_items SET consumption_logged = false WHERE id = $1`,
        [orderItemId]
      );
    }

    // 5. Log AI Operations Event
    await client.query(
      `INSERT INTO activity_events (restaurant_id, event_type, description, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        restaurantId,
        'KITCHEN_WASTE',
        `Kitchen remade dish ${orderItem.menu_item_name} due to: ${reason}`,
        JSON.stringify({ orderId, orderItemId, menuItemName: orderItem.menu_item_name, reason })
      ]
    );

    await client.query('COMMIT');
    return { success: true, message: 'Remake logged and waste recorded' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// SUPPLIERS MODULE
// ==========================================

export async function getSuppliers(userId: string, role: string): Promise<any[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM suppliers WHERE restaurant_id = $1 ORDER BY name ASC`,
    [restaurantId]
  );
  return rows;
}

export async function getSupplierById(userId: string, role: string, id: string): Promise<any | null> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM suppliers WHERE id = $1 AND restaurant_id = $2 LIMIT 1`,
    [id, restaurantId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createSupplier(userId: string, role: string, payload: any): Promise<any> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(
    `INSERT INTO suppliers (restaurant_id, name, contact_name, phone, email, address, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [restaurantId, payload.name, payload.contact_name || null, payload.phone || null, payload.email || null, payload.address || null, payload.is_active ?? true]
  );
  return rows[0];
}

export async function updateSupplier(userId: string, role: string, id: string, payload: any): Promise<any> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const updates: string[] = [];
  const values: any[] = [id, restaurantId];
  let paramIndex = 2;

  const mapping = ['name', 'contact_name', 'phone', 'email', 'address', 'is_active'];
  mapping.forEach((key) => {
    if (key in payload && payload[key] !== undefined) {
      values.push(payload[key]);
      updates.push(`${key} = $${++paramIndex}`);
    }
  });

  if (updates.length === 0) throw new Error('No fields to update');
  updates.push('updated_at = NOW()');

  const { rows } = await pool.query(
    `UPDATE suppliers SET ${updates.join(', ')} WHERE id = $1 AND restaurant_id = $2 RETURNING *`,
    values
  );
  if (rows.length === 0) throw new Error('Supplier not found');
  return rows[0];
}

export async function deleteSupplier(userId: string, role: string, id: string): Promise<void> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rowCount } = await pool.query(`DELETE FROM suppliers WHERE id = $1 AND restaurant_id = $2`, [id, restaurantId]);
  if (rowCount === 0) throw new Error('Supplier not found');
}

// ==========================================
// PURCHASE ORDERS MODULE
// ==========================================

export async function getPurchaseOrders(userId: string, role: string): Promise<PurchaseOrder[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows: poRows } = await pool.query(
    `SELECT po.*, s.name as supplier_name
     FROM purchase_orders po
     JOIN suppliers s ON po.supplier_id = s.id
     WHERE po.restaurant_id = $1
     ORDER BY po.created_at DESC`,
    [restaurantId]
  );

  const list: PurchaseOrder[] = [];
  for (const po of poRows) {
    const { rows: itemRows } = await pool.query(
      `SELECT poi.*, ii.name as inventory_item_name, ii.unit
       FROM purchase_order_items poi
       JOIN inventory_items ii ON poi.inventory_item_id = ii.id
       WHERE poi.purchase_order_id = $1`,
      [po.id]
    );
    list.push({
      ...po,
      total_amount: parseFloat(po.total_amount),
      ordered_items: itemRows.map((item: any) => ({
        ...item,
        quantity: parseFloat(item.quantity),
        unit_cost: parseFloat(item.unit_cost),
        total_cost: parseFloat(item.total_cost),
      })),
    });
  }
  return list;
}

export async function getPurchaseOrderById(userId: string, role: string, id: string): Promise<PurchaseOrder | null> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows: poRows } = await pool.query(
    `SELECT po.*, s.name as supplier_name
     FROM purchase_orders po
     JOIN suppliers s ON po.supplier_id = s.id
     WHERE po.id = $1 AND po.restaurant_id = $2 LIMIT 1`,
    [id, restaurantId]
  );
  if (poRows.length === 0) return null;
  const po = poRows[0];

  const { rows: itemRows } = await pool.query(
    `SELECT poi.*, ii.name as inventory_item_name, ii.unit
     FROM purchase_order_items poi
     JOIN inventory_items ii ON poi.inventory_item_id = ii.id
     WHERE poi.purchase_order_id = $1`,
    [po.id]
  );

  return {
    ...po,
    total_amount: parseFloat(po.total_amount),
    ordered_items: itemRows.map((item: any) => ({
      ...item,
      quantity: parseFloat(item.quantity),
      unit_cost: parseFloat(item.unit_cost),
      total_cost: parseFloat(item.total_cost),
    })),
  };
}

export async function createPurchaseOrder(userId: string, role: string, payload: any): Promise<PurchaseOrder> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const workspaceId = await resolveWorkspaceId(userId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Calculate total amount
    let total = 0;
    const lines = payload.ordered_items || [];
    lines.forEach((line: any) => {
      total += parseFloat(line.quantity) * parseFloat(line.unit_price || line.unit_cost);
    });

    const { rows: poRows } = await client.query(
      `INSERT INTO purchase_orders (restaurant_id, workspace_id, supplier_id, status, notes, total_amount, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [restaurantId, workspaceId, payload.supplier_id, payload.status || 'DRAFT', payload.notes || null, total]
    );
    const po = poRows[0];

    for (const line of lines) {
      const lineCost = parseFloat(line.quantity) * parseFloat(line.unit_price || line.unit_cost);
      await client.query(
        `INSERT INTO purchase_order_items (purchase_order_id, workspace_id, inventory_item_id, quantity, unit_cost, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [po.id, workspaceId, line.inventory_item_id, line.quantity, line.unit_price || line.unit_cost, lineCost]
      );
    }

    await client.query('COMMIT');

    try {
      const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
      notifyWorkspaceByRestaurantId(restaurantId, 'inventoryUpdated');
    } catch (err) {
      console.error('Failed to notify workspace on createPurchaseOrder:', err);
    }

    const fullPo = await getPurchaseOrderById(userId, role, po.id);
    return fullPo!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updatePurchaseOrderStatus(userId: string, role: string, id: string, status: string): Promise<PurchaseOrder> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const workspaceId = await resolveWorkspaceId(userId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const po = await getPurchaseOrderById(userId, role, id);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (po.status === 'DELIVERED') {
      throw new Error('Completed purchase order status cannot be modified');
    }

    // Update status
    await client.query(
      `UPDATE purchase_orders SET status = $1, received_date = CASE WHEN $1 = 'DELIVERED' THEN CURRENT_DATE ELSE received_date END, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    // If status is DELIVERED, perform stock additions and log refilled transactions
    if (status === 'DELIVERED') {
      for (const item of po.ordered_items || []) {
        // Increment stock
        await client.query(
          `UPDATE inventory_items
           SET quantity_on_hand = quantity_on_hand + $1,
               updated_at = NOW()
           WHERE id = $2 AND restaurant_id = $3`,
          [item.quantity, item.inventory_item_id, restaurantId]
        );

        // Log transaction
        await client.query(
          `INSERT INTO inventory_transactions
            (restaurant_id, workspace_id, inventory_item_id, change_amount, transaction_type, note, created_at)
           VALUES ($1, $2, $3, $4, 'STOCK_IN', $5, NOW())`,
          [restaurantId, workspaceId, item.inventory_item_id, item.quantity, `Purchase order delivery: ${po.id}`]
        );

        // Log refilled activity
        await client.query(
          `INSERT INTO activity_events (restaurant_id, workspace_id, event_type, description, payload, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            restaurantId,
            workspaceId,
            'STOCK_REFILLED',
            `Inventory item ${item.inventory_item_name} refilled via PO Delivery (Added ${item.quantity} ${item.unit})`,
            JSON.stringify({ itemId: item.inventory_item_id, quantityAdded: item.quantity, poId: po.id })
          ]
        );

        // Turn off low stock alert if stock is now healthy
        const checkStock = await client.query(
          `SELECT quantity_on_hand, reorder_threshold FROM inventory_items WHERE id = $1`,
          [item.inventory_item_id]
        );
        if (checkStock.rows.length > 0) {
          const qoh = parseFloat(checkStock.rows[0].quantity_on_hand);
          const thresh = parseFloat(checkStock.rows[0].reorder_threshold);
          if (qoh > thresh) {
            await client.query(
              `UPDATE inventory_alerts SET is_active = false, updated_at = NOW() WHERE inventory_item_id = $1 AND alert_type = 'LOW_STOCK'`,
              [item.inventory_item_id]
            );
          }
        }
      }
    }

    await client.query('COMMIT');

    try {
      const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
      notifyWorkspaceByRestaurantId(restaurantId, 'inventoryUpdated');
    } catch (err) {
      console.error('Failed to notify workspace on updatePurchaseOrderStatus:', err);
    }

    const updatedPo = await getPurchaseOrderById(userId, role, id);
    return updatedPo!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deletePurchaseOrder(userId: string, role: string, id: string): Promise<void> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rowCount } = await pool.query(
    `DELETE FROM purchase_orders WHERE id = $1 AND restaurant_id = $2`,
    [id, restaurantId]
  );
  if (rowCount === 0) throw new Error('Purchase order not found');
}

// ==========================================
// WASTAGE MANAGEMENT
// ==========================================

export async function getWastageList(userId: string, role: string): Promise<Wastage[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT w.*, ii.name as inventory_item_name, ii.unit as inventory_item_unit
     FROM inventory_wastage w
     JOIN inventory_items ii ON w.inventory_item_id = ii.id
     WHERE w.restaurant_id = $1
     ORDER BY w.created_at DESC`,
    [restaurantId]
  );
  return rows.map((r: any) => ({
    ...r,
    quantity: parseFloat(r.quantity),
    cost: parseFloat(r.cost),
  }));
}

export async function createWastage(userId: string, role: string, payload: any): Promise<Wastage> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch item details
    const { rows: items } = await client.query(
      `SELECT name, unit, quantity_on_hand FROM inventory_items WHERE id = $1 AND restaurant_id = $2`,
      [payload.inventory_item_id, restaurantId]
    );
    if (items.length === 0) throw new Error('Inventory item not found');
    const item = items[0];

    // 2. Perform stock deduction
    await client.query(
      `UPDATE inventory_items
       SET quantity_on_hand = quantity_on_hand - $1,
           updated_at = NOW()
       WHERE id = $2 AND restaurant_id = $3`,
      [payload.quantity, payload.inventory_item_id, restaurantId]
    );

    // 3. Insert transaction
    await client.query(
      `INSERT INTO inventory_transactions
        (restaurant_id, inventory_item_id, change_amount, transaction_type, note, created_at)
       VALUES ($1, $2, $3, 'WASTE', $4, NOW())`,
      [restaurantId, payload.inventory_item_id, -payload.quantity, `Manual wastage logged: ${payload.reason}`]
    );

    // 4. Save wastage record
    const { rows: wasteRows } = await client.query(
      `INSERT INTO inventory_wastage (restaurant_id, inventory_item_id, quantity, cost, reason, staff_member, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [restaurantId, payload.inventory_item_id, payload.quantity, payload.cost, payload.reason, payload.staff_member || 'Manager']
    );

    // 5. Log activity event
    await client.query(
      `INSERT INTO activity_events (restaurant_id, event_type, description, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        restaurantId,
        'INVENTORY_WASTE',
        `Wastage logged: ${payload.quantity} ${item.unit} of ${item.name} (Cost: ₹${payload.cost}) due to: ${payload.reason}`,
        JSON.stringify({ itemId: payload.inventory_item_id, itemName: item.name, quantity: payload.quantity, cost: payload.cost })
      ]
    );

    await client.query('COMMIT');
    return {
      ...wasteRows[0],
      quantity: parseFloat(wasteRows[0].quantity),
      cost: parseFloat(wasteRows[0].cost),
      inventory_item_name: item.name,
      inventory_item_unit: item.unit,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getWastageAnalytics(userId: string, role: string): Promise<any> {
  const restaurantId = await resolveRestaurantId(userId, role);
  // Get monthly wastage cost (current calendar month)
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(cost), 0) as monthly_wastage_cost
     FROM inventory_wastage
     WHERE restaurant_id = $1 AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
    [restaurantId]
  );
  return {
    monthlyWastageCost: parseFloat(rows[0].monthly_wastage_cost),
  };
}

// ==========================================
// INVENTORY FORECASTING ENGINE
// ==========================================

export async function getInventoryForecast(userId: string, role: string): Promise<ForecastItem[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  
  // 1. Fetch all inventory items
  const items = await getInventoryItems(userId, role);

  // 2. Fetch all STOCK_OUT transactions in the last 14 days to compute average daily consumption
  const { rows: txs } = await pool.query(
    `SELECT inventory_item_id, change_amount, created_at
     FROM inventory_transactions
     WHERE restaurant_id = $1 AND transaction_type = 'STOCK_OUT' AND created_at >= NOW() - INTERVAL '14 days'`,
    [restaurantId]
  );

  const txMap = new Map<string, number>();
  txs.forEach((tx: any) => {
    const key = tx.inventory_item_id;
    const amount = Math.abs(parseFloat(tx.change_amount));
    txMap.set(key, (txMap.get(key) || 0) + amount);
  });

  const forecast: ForecastItem[] = items.map((item) => {
    const totalConsumed = txMap.get(item.id) || 0;
    const dailyRate = totalConsumed / 14.0; // average daily consumption rate over 14 days
    
    let daysRemaining = 999.0; // fallback if no consumption occurs
    if (dailyRate > 0) {
      daysRemaining = item.quantity_on_hand / dailyRate;
    }

    const depletionDate = dailyRate > 0 
      ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined;

    return {
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      quantityOnHand: item.quantity_on_hand,
      dailyRate: Number(dailyRate.toFixed(4)),
      daysRemaining: Number(daysRemaining.toFixed(1)),
      depletionDate,
    };
  });

  return forecast.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

// ==========================================
// RECONCILIATION ENGINE
// ==========================================

export async function getReconciliationHistory(userId: string, role: string): Promise<any[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM inventory_reconciliations WHERE restaurant_id = $1 ORDER BY reconciliation_date DESC`,
    [restaurantId]
  );
  return rows;
}

export async function getLatestReconciliation(userId: string, role: string): Promise<any | null> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM inventory_reconciliations WHERE restaurant_id = $1 ORDER BY reconciliation_date DESC LIMIT 1`,
    [restaurantId]
  );
  if (rows.length === 0) return null;
  const rec = rows[0];

  const { rows: items } = await pool.query(
    `SELECT ri.*, ii.name as inventory_item_name, ii.unit
     FROM inventory_reconciliation_items ri
     JOIN inventory_items ii ON ri.inventory_item_id = ii.id
     WHERE ri.reconciliation_id = $1`,
    [rec.id]
  );

  return {
    ...rec,
    items: items.map((it: any) => ({
      ...it,
      opening_stock: parseFloat(it.opening_stock),
      purchases: parseFloat(it.purchases),
      consumption: parseFloat(it.consumption),
      wastage: parseFloat(it.wastage),
      expected_stock: parseFloat(it.expected_stock),
      actual_stock: parseFloat(it.actual_stock),
      variance: parseFloat(it.variance),
      cost_impact: parseFloat(it.cost_impact),
    })),
  };
}

export async function submitReconciliation(userId: string, role: string, payload: any): Promise<any> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create or retrieve reconciliation header
    const today = new Date().toISOString().split('T')[0];
    await client.query(
      `DELETE FROM inventory_reconciliations WHERE restaurant_id = $1 AND reconciliation_date = $2`,
      [restaurantId, today]
    );

    const { rows: recRows } = await client.query(
      `INSERT INTO inventory_reconciliations (restaurant_id, reconciliation_date, staff_member)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [restaurantId, today, payload.staff_member || 'System Audit']
    );
    const rec = recRows[0];

    // 2. Fetch last reconciliation items to find opening stock
    const { rows: lastRec } = await client.query(
      `SELECT id FROM inventory_reconciliations WHERE restaurant_id = $1 AND reconciliation_date < $2 ORDER BY reconciliation_date DESC LIMIT 1`,
      [restaurantId, today]
    );
    const lastRecId = lastRec.length > 0 ? lastRec[0].id : null;

    const openingStockMap = new Map<string, number>();
    if (lastRecId) {
      const { rows: lastItems } = await client.query(
        `SELECT inventory_item_id, actual_stock FROM inventory_reconciliation_items WHERE reconciliation_id = $1`,
        [lastRecId]
      );
      lastItems.forEach((it: any) => openingStockMap.set(it.inventory_item_id, parseFloat(it.actual_stock)));
    }

    // 3. Fetch transaction aggregates for today
    // Purchases (STOCK_IN)
    const { rows: purchasesTxs } = await client.query(
      `SELECT inventory_item_id, COALESCE(SUM(change_amount), 0) as amt
       FROM inventory_transactions
       WHERE restaurant_id = $1 AND transaction_type = 'STOCK_IN' AND created_at >= CURRENT_DATE
       GROUP BY inventory_item_id`,
      [restaurantId]
    );
    const purchasesMap = new Map<string, number>();
    purchasesTxs.forEach((t: any) => purchasesMap.set(t.inventory_item_id, parseFloat(t.amt)));

    // Consumption (STOCK_OUT)
    const { rows: consumptionTxs } = await client.query(
      `SELECT inventory_item_id, COALESCE(SUM(change_amount), 0) as amt
       FROM inventory_transactions
       WHERE restaurant_id = $1 AND transaction_type = 'STOCK_OUT' AND created_at >= CURRENT_DATE
       GROUP BY inventory_item_id`,
      [restaurantId]
    );
    const consumptionMap = new Map<string, number>();
    consumptionTxs.forEach((t: any) => consumptionMap.set(t.inventory_item_id, Math.abs(parseFloat(t.amt))));

    // Wastage (WASTE)
    const { rows: wasteTxs } = await client.query(
      `SELECT inventory_item_id, COALESCE(SUM(change_amount), 0) as amt
       FROM inventory_transactions
       WHERE restaurant_id = $1 AND transaction_type = 'WASTE' AND created_at >= CURRENT_DATE
       GROUP BY inventory_item_id`,
      [restaurantId]
    );
    const wasteMap = new Map<string, number>();
    wasteTxs.forEach((t: any) => wasteMap.set(t.inventory_item_id, Math.abs(parseFloat(t.amt))));

    // 4. Calculate for each submitted item
    const itemsInserted: any[] = [];
    let totalAbsVariancePercent = 0;
    let criticalAlertsCount = 0;

    for (const submitItem of payload.items || []) {
      const itemId = submitItem.inventory_item_id;
      const actual = parseFloat(submitItem.actual_stock);

      // Fetch current database values
      const { rows: currentDb } = await client.query(
        `SELECT name, quantity_on_hand, unit FROM inventory_items WHERE id = $1 LIMIT 1`,
        [itemId]
      );
      if (currentDb.length === 0) continue;
      const dbItem = currentDb[0];

      // Calculate aggregates
      // Opening stock defaults to quantity_on_hand today minus flow, or last reconciliation value
      const purchases = purchasesMap.get(itemId) || 0;
      const consumption = consumptionMap.get(itemId) || 0;
      const wastage = wasteMap.get(itemId) || 0;
      const defaultOpening = parseFloat(dbItem.quantity_on_hand) - purchases + consumption + wastage;
      const opening = openingStockMap.has(itemId) ? openingStockMap.get(itemId)! : defaultOpening;

      const expected = opening + purchases - consumption - wastage;
      const variance = actual - expected;
      
      const estUnitCost = 100.0; // default item price ₹100
      const costImpact = variance * estUnitCost;

      // Save reconciliation item record
      await client.query(
        `INSERT INTO inventory_reconciliation_items
          (reconciliation_id, inventory_item_id, opening_stock, purchases, consumption, wastage, expected_stock, actual_stock, variance, cost_impact)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [rec.id, itemId, opening, purchases, consumption, wastage, expected, actual, variance, costImpact]
      );

      // Update database quantity_on_hand to actual stock
      await client.query(
        `UPDATE inventory_items SET quantity_on_hand = $1, updated_at = NOW() WHERE id = $2`,
        [actual, itemId]
      );

      // Write ADJUSTMENT transaction
      if (Math.abs(variance) > 0.0001) {
        await client.query(
          `INSERT INTO inventory_transactions
            (restaurant_id, inventory_item_id, change_amount, transaction_type, note, created_at)
           VALUES ($1, $2, $3, 'ADJUSTMENT', $4, NOW())`,
          [restaurantId, itemId, variance, `Reconciliation variance adjustment: ${variance >= 0 ? '+' : ''}${variance}`]
        );
      }

      // Calculate variance percentage
      const denom = expected === 0 ? 1 : expected;
      const varPct = (Math.abs(variance) / denom) * 100;
      totalAbsVariancePercent += varPct;

      // Check critical variance threshold (e.g. variance > 5% or cost impact > ₹500)
      if (varPct > 5.0 || Math.abs(costImpact) > 500) {
        criticalAlertsCount++;
        // Log telemetry
        await client.query(
          `INSERT INTO activity_events (restaurant_id, event_type, description, payload, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            restaurantId,
            'CRITICAL_VARIANCE',
            `Critical stock variance: ${dbItem.name} variance is ${variance.toFixed(2)} ${dbItem.unit} (Expected: ${expected.toFixed(2)}, Actual: ${actual.toFixed(2)}, Cost Impact: ₹${costImpact.toFixed(2)})`,
            JSON.stringify({ itemId, itemName: dbItem.name, expected, actual, variance, costImpact })
          ]
        );
      }

      itemsInserted.push({
        inventory_item_id: itemId,
        inventory_item_name: dbItem.name,
        opening_stock: opening,
        purchases,
        consumption,
        wastage,
        expected_stock: expected,
        actual_stock: actual,
        variance,
        cost_impact: costImpact,
      });
    }

    const accuracyScore = payload.items && payload.items.length > 0
      ? Math.max(0, 100 - (totalAbsVariancePercent / payload.items.length))
      : 100.0;

    // Log complete reconciliation summary event
    await client.query(
      `INSERT INTO activity_events (restaurant_id, event_type, description, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        restaurantId,
        'RECONCILIATION_COMPLETED',
        `Reconciliation completed by ${rec.staff_member}. Score: ${accuracyScore.toFixed(1)}%. Items audited: ${payload.items.length}. Critical issues: ${criticalAlertsCount}`,
        JSON.stringify({ staff: rec.staff_member, score: accuracyScore, auditedCount: payload.items.length, criticalCount: criticalAlertsCount })
      ]
    );

    await client.query('COMMIT');
    return {
      ...rec,
      accuracyScore,
      items: itemsInserted,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getInventoryAccuracyScore(restaurantId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT id FROM inventory_reconciliations WHERE restaurant_id = $1 ORDER BY reconciliation_date DESC LIMIT 1`,
    [restaurantId]
  );
  if (rows.length === 0) return 98.5; // Default healthy baseline of 98.5%

  const recId = rows[0].id;
  const { rows: items } = await pool.query(
    `SELECT expected_stock, actual_stock, variance FROM inventory_reconciliation_items WHERE reconciliation_id = $1`,
    [recId]
  );

  if (items.length === 0) return 98.5;

  let totalVarPct = 0;
  items.forEach((it: any) => {
    const expected = parseFloat(it.expected_stock);
    const variance = Math.abs(parseFloat(it.variance));
    const denom = expected === 0 ? 1 : expected;
    totalVarPct += (variance / denom) * 100;
  });

  return Math.max(0, 100 - (totalVarPct / items.length));
}

export async function getTransactions(userId: string, role: string): Promise<any[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT t.*, ii.name as inventory_item_name, ii.unit
     FROM inventory_transactions t
     JOIN inventory_items ii ON t.inventory_item_id = ii.id
     WHERE t.restaurant_id = $1
     ORDER BY t.created_at DESC LIMIT 100`,
    [restaurantId]
  );
  return rows.map((r: any) => ({
    ...r,
    change_amount: parseFloat(r.change_amount),
  }));
}

export async function getAuditForm(userId: string, role: string): Promise<any[]> {
  const restaurantId = await resolveRestaurantId(userId, role);
  const items = await getInventoryItems(userId, role);
  const today = new Date().toISOString().split('T')[0];

  const { rows: lastRec } = await pool.query(
    `SELECT id FROM inventory_reconciliations WHERE restaurant_id = $1 AND reconciliation_date < $2 ORDER BY reconciliation_date DESC LIMIT 1`,
    [restaurantId, today]
  );
  const lastRecId = lastRec.length > 0 ? lastRec[0].id : null;

  const openingStockMap = new Map<string, number>();
  if (lastRecId) {
    const { rows: lastItems } = await pool.query(
      `SELECT inventory_item_id, actual_stock FROM inventory_reconciliation_items WHERE reconciliation_id = $1`,
      [lastRecId]
    );
    lastItems.forEach((it: any) => openingStockMap.set(it.inventory_item_id, parseFloat(it.actual_stock)));
  }

  const { rows: purchasesTxs } = await pool.query(
    `SELECT inventory_item_id, COALESCE(SUM(change_amount), 0) as amt
     FROM inventory_transactions
     WHERE restaurant_id = $1 AND transaction_type = 'STOCK_IN' AND created_at >= CURRENT_DATE
     GROUP BY inventory_item_id`,
    [restaurantId]
  );
  const purchasesMap = new Map<string, number>();
  purchasesTxs.forEach((t: any) => purchasesMap.set(t.inventory_item_id, parseFloat(t.amt)));

  const { rows: consumptionTxs } = await pool.query(
    `SELECT inventory_item_id, COALESCE(SUM(change_amount), 0) as amt
     FROM inventory_transactions
     WHERE restaurant_id = $1 AND transaction_type = 'STOCK_OUT' AND created_at >= CURRENT_DATE
     GROUP BY inventory_item_id`,
    [restaurantId]
  );
  const consumptionMap = new Map<string, number>();
  consumptionTxs.forEach((t: any) => consumptionMap.set(t.inventory_item_id, Math.abs(parseFloat(t.amt))));

  const { rows: wasteTxs } = await pool.query(
    `SELECT inventory_item_id, COALESCE(SUM(change_amount), 0) as amt
     FROM inventory_transactions
     WHERE restaurant_id = $1 AND transaction_type = 'WASTE' AND created_at >= CURRENT_DATE
     GROUP BY inventory_item_id`,
    [restaurantId]
  );
  const wasteMap = new Map<string, number>();
  wasteTxs.forEach((t: any) => wasteMap.set(t.inventory_item_id, Math.abs(parseFloat(t.amt))));

  return items.map((item) => {
    const purchases = purchasesMap.get(item.id) || 0;
    const consumption = consumptionMap.get(item.id) || 0;
    const wastage = wasteMap.get(item.id) || 0;
    const defaultOpening = item.quantity_on_hand - purchases + consumption + wastage;
    const opening = openingStockMap.has(item.id) ? openingStockMap.get(item.id)! : defaultOpening;
    const expected = opening + purchases - consumption - wastage;

    return {
      inventory_item_id: item.id,
      inventory_item_name: item.name,
      unit: item.unit,
      opening_stock: opening,
      purchases,
      consumption,
      wastage,
      expected_stock: expected,
      actual_stock: item.quantity_on_hand,
    };
  });
}

export async function importOcrInvoice(
  userId: string,
  role: string,
  payload: any
) {
  const restaurantId = await resolveRestaurantId(userId, role);
  const workspaceId = await resolveWorkspaceId(userId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Dynamic mapping supporting both legacy and new invoice schemas
    const supplierName = (payload.supplierName || payload.supplier || 'Default OCR Supplier').trim();
    const invoiceNumber = payload.invoiceNumber || '';
    const invoiceDate = payload.invoiceDate || '';
    const grandTotal = payload.grandTotal !== undefined ? Number(payload.grandTotal) : (payload.totalAmount !== undefined ? Number(payload.totalAmount) : 0);

    const rawItems = payload.items || [];
    const parsedItems = rawItems.map((item: any) => ({
      name: item.name,
      quantity: Number(item.quantity || 1),
      unitPrice: item.unitPrice !== undefined ? Number(item.unitPrice) : (item.price !== undefined ? Number(item.price) : 0)
    }));

    // 1. Find or create supplier
    let supplierId: string;
    const { rows: supRows } = await client.query(
      `SELECT id FROM suppliers WHERE restaurant_id = $1 AND name = $2`,
      [restaurantId, supplierName]
    );
    if (supRows.length > 0) {
      supplierId = supRows[0].id;
    } else {
      const { rows: newSupRows } = await client.query(
        `INSERT INTO suppliers (restaurant_id, workspace_id, name, is_active, created_at)
         VALUES ($1, $2, $3, true, NOW())
         RETURNING id`,
        [restaurantId, workspaceId, supplierName]
      );
      supplierId = newSupRows[0].id;
    }

    // 2. Find or create default category for inventory items if needed
    let categoryId: string;
    const { rows: catRows } = await client.query(
      `SELECT id FROM inventory_categories WHERE restaurant_id = $1 LIMIT 1`,
      [restaurantId]
    );
    if (catRows.length > 0) {
      categoryId = catRows[0].id;
    } else {
      const { rows: newCatRows } = await client.query(
        `INSERT INTO inventory_categories (restaurant_id, workspace_id, name, created_at)
         VALUES ($1, $2, 'General', NOW())
         RETURNING id`,
        [restaurantId, workspaceId]
      );
      categoryId = newCatRows[0].id;
    }

    const orderedItems = [];

    // 3. For each item, find or create inventory item
    for (const item of parsedItems) {
      const itemName = (item.name || 'Unnamed Item').trim();
      let itemId: string;
      const { rows: itemRows } = await client.query(
        `SELECT id FROM inventory_items WHERE restaurant_id = $1 AND name = $2`,
        [restaurantId, itemName]
      );
      if (itemRows.length > 0) {
        itemId = itemRows[0].id;
      } else {
        const { rows: newItemRows } = await client.query(
          `INSERT INTO inventory_items (restaurant_id, workspace_id, category_id, supplier_id, name, unit, quantity_on_hand, reorder_threshold, created_at)
           VALUES ($1, $2, $3, $4, $5, 'units', 0, 0, NOW())
           RETURNING id`,
          [restaurantId, workspaceId, categoryId, supplierId, itemName]
        );
        itemId = newItemRows[0].id;
      }

      orderedItems.push({
        inventory_item_id: itemId,
        quantity: item.quantity,
        unit_cost: item.unitPrice
      });
    }

    // 4. Create the purchase order with status DELIVERED
    const notesStr = `Imported via Receipt OCR. Invoice #${invoiceNumber} dated ${invoiceDate}`.trim();
    const { rows: poRows } = await client.query(
      `INSERT INTO purchase_orders (restaurant_id, workspace_id, supplier_id, status, notes, total_amount, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [restaurantId, workspaceId, supplierId, 'DELIVERED', notesStr, grandTotal]
    );
    const po = poRows[0];

    for (const item of orderedItems) {
      const lineCost = item.quantity * item.unit_cost;
      await client.query(
        `INSERT INTO purchase_order_items (purchase_order_id, workspace_id, inventory_item_id, quantity, unit_cost, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [po.id, workspaceId, item.inventory_item_id, item.quantity, item.unit_cost, lineCost]
      );

      // Increment stock
      await client.query(
        `UPDATE inventory_items
         SET quantity_on_hand = quantity_on_hand + $1,
             updated_at = NOW()
         WHERE id = $2 AND restaurant_id = $3`,
        [item.quantity, item.inventory_item_id, restaurantId]
      );

      // Log transaction
      await client.query(
        `INSERT INTO inventory_transactions
          (restaurant_id, workspace_id, inventory_item_id, change_amount, transaction_type, note, created_at)
         VALUES ($1, $2, $3, $4, 'STOCK_IN', $5, NOW())`,
        [restaurantId, workspaceId, item.inventory_item_id, item.quantity, `Receipt OCR import PO delivery: ${po.id}`]
      );

      // Log activity
      await client.query(
        `INSERT INTO activity_events (restaurant_id, workspace_id, event_type, description, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          restaurantId,
          workspaceId,
          'STOCK_REFILLED',
          `Inventory item refilled via OCR Invoice (Added ${item.quantity} units)`,
          JSON.stringify({ itemId: item.inventory_item_id, quantityAdded: item.quantity, poId: po.id })
        ]
      );
    }

    await client.query('COMMIT');

    // Notify workspace
    try {
      const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
      notifyWorkspaceByRestaurantId(restaurantId, 'inventoryUpdated');
    } catch (sseErr) {
      console.error('Failed to notify workspace on OCR import:', sseErr);
    }

    return po;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


