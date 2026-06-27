// File: backend/src/modules/orders/orders.service.ts
// Service layer for order operations: database queries and transactions

import { pool } from '../../database';
import {
  Order,
  OrderItem,
  CreateOrderPayload,
  OrderStatus,
} from './orders.types';
import * as inventoryService from '../inventory/inventory.service';
import { logEvent } from '../ai-operations/aiOperations.service';
import { OperationalEventType } from '../ai-operations/aiOperations.types';



/**
 * Resolves the appropriate restaurant_id.
 * If the user is an owner, it is their user ID.
 * If the user is a waiter, we find the first RESTAURANT_OWNER user in the DB.
 */
export async function getRestaurantId(userId: string, role: string): Promise<string> {
  // Try to find the workspace owner's user_id first
  const { rows } = await pool.query(
    `SELECT w.owner_id 
     FROM users u
     JOIN workspaces w ON u.workspace_id = w.id
     WHERE u.id = $1 LIMIT 1`,
    [userId]
  );
  if (rows.length > 0 && rows[0].owner_id) {
    return rows[0].owner_id;
  }

  if (role === 'RESTAURANT_OWNER' || role === 'OWNER' || role === 'SUPER_ADMIN') {
    return userId;
  }
  const { rows: firstOwner } = await pool.query(
    "SELECT id FROM users WHERE role IN ('RESTAURANT_OWNER', 'OWNER') ORDER BY created_at ASC LIMIT 1"
  );
  if (firstOwner.length > 0) {
    return firstOwner[0].id;
  }
  return userId;
}

export async function createOrder(
  waiterId: string,
  waiterRole: string,
  payload: CreateOrderPayload
): Promise<Order> {
  const restaurantId = await getRestaurantId(waiterId, waiterRole);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch menu item details to ensure validity and calculate subtotals
    const itemIds = payload.items.map((i) => i.menu_item_id);
    const { rows: dbItems } = await client.query(
      `SELECT id, name, price, is_available FROM menu_items 
       WHERE id = ANY($1) AND restaurant_id = $2`,
      [itemIds, restaurantId]
    );

    if (dbItems.length !== itemIds.length) {
      throw new Error('Some menu items were not found or unauthorized');
    }

    let totalAmount = 0;
    const itemsToInsert = payload.items.map((item) => {
      const dbItem = dbItems.find((d: any) => d.id === item.menu_item_id);
      if (!dbItem) {
        throw new Error(`Menu item ${item.menu_item_id} not found`);
      }
      if (!dbItem.is_available) {
        throw new Error(`Menu item "${dbItem.name}" is currently unavailable`);
      }
      const unitPrice = parseFloat(dbItem.price);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;

      return {
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
      };
    });

    // Fetch matching table_id
    const tableRes = await client.query(
      `SELECT id FROM restaurant_tables WHERE table_number = $1 AND restaurant_id = $2 LIMIT 1`,
      [payload.table_number, restaurantId]
    );
    const tableId = tableRes.rows.length > 0 ? tableRes.rows[0].id : null;

    // 2. Insert order
    const orderSql = `
      INSERT INTO orders (restaurant_id, waiter_id, table_number, table_id, guest_count, status, total_amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const { rows: orderRows } = await client.query(orderSql, [
      restaurantId,
      waiterId,
      payload.table_number,
      tableId,
      payload.guest_count || 1,
      OrderStatus.NEW,
      totalAmount,
    ]);
    const orderRecord = orderRows[0];

    // If a physical table exists, set status to OCCUPIED and set current_order_id
    if (tableId) {
      await client.query(
        `UPDATE restaurant_tables 
         SET status = 'OCCUPIED', current_order_id = $1, last_occupied_at = NOW(), updated_at = NOW() 
         WHERE id = $2`,
        [orderRecord.id, tableId]
      );
    }

    // 3. Insert order items
    const insertedItems: OrderItem[] = [];
    for (const item of itemsToInsert) {
      const itemSql = `
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const { rows: itemRows } = await client.query(itemSql, [
        orderRecord.id,
        item.menu_item_id,
        item.quantity,
        item.unit_price,
        item.subtotal,
      ]);
      insertedItems.push(itemRows[0]);
    }

    // 4. Update menu item analytics (increment orders count and revenue)
    for (const item of itemsToInsert) {
      await client.query(
        `UPDATE menu_item_analytics 
         SET orders_count = orders_count + $1, 
             revenue = revenue + $2,
             last_ordered_at = NOW(),
             updated_at = NOW()
         WHERE menu_item_id = $3`,
        [item.quantity, item.subtotal, item.menu_item_id]
      );
    }

    await client.query('COMMIT');

    // Log operations events
    try {
      await logEvent(restaurantId, OperationalEventType.ORDER_CREATED, `Order #${orderRecord.id.substring(0, 8)} created for Table ${orderRecord.table_number}`, {
        orderId: orderRecord.id,
        tableNumber: orderRecord.table_number,
        waiterId,
        totalAmount,
      });
      await logEvent(restaurantId, OperationalEventType.WAITER_ASSIGNED, `Waiter assigned to Table ${orderRecord.table_number}`, {
        orderId: orderRecord.id,
        waiterId,
      });
      if (tableId) {
        await logEvent(restaurantId, OperationalEventType.TABLE_OCCUPIED, `Table ${orderRecord.table_number} occupied`, {
          tableId,
          tableNumber: orderRecord.table_number,
          orderId: orderRecord.id,
        });
      }
    } catch (e) {
      console.error('Failed to log order events:', e);
    }

    try {
      const { notifyWorkspace } = require('../workspace/workspace.sse');
      let workspaceId = orderRecord.workspace_id;
      if (!workspaceId) {
        const { rows: userRows } = await client.query(
          `SELECT workspace_id FROM users WHERE id = $1 LIMIT 1`,
          [restaurantId]
        );
        workspaceId = userRows[0]?.workspace_id;
      }
      if (workspaceId) {
        const fullOrder = {
          ...orderRecord,
          total_amount: parseFloat(orderRecord.total_amount),
          items: insertedItems.map((item) => ({
            ...item,
            unit_price: parseFloat(item.unit_price as any),
            subtotal: parseFloat(item.subtotal as any),
          })),
        };
        console.log(`[ORDER CREATED]\n${orderRecord.id}\n${workspaceId}`);
        notifyWorkspace(workspaceId, 'order_created', fullOrder);
        notifyWorkspace(workspaceId, 'ordersUpdated', fullOrder);
      }
    } catch (e) {
      console.error('Failed to notify workspace of order creation:', e);
    }

    return {
      ...orderRecord,
      total_amount: parseFloat(orderRecord.total_amount),
      items: insertedItems.map((item) => ({
        ...item,
        unit_price: parseFloat(item.unit_price as any),
        subtotal: parseFloat(item.subtotal as any),
      })),
    } as Order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getOrders(
  userId: string,
  role: string
): Promise<Order[]> {
  const restaurantId = await getRestaurantId(userId, role);

  const sql = `
    SELECT o.*, u.name as waiter_name
    FROM orders o
    LEFT JOIN users u ON o.waiter_id = u.id
    WHERE o.restaurant_id = $1
    ORDER BY o.created_at DESC
  `;
  const { rows } = await pool.query(sql, [restaurantId]);

  return rows.map((r: any) => ({
    ...r,
    total_amount: parseFloat(r.total_amount),
  })) as Order[];
}

export async function getOrderById(
  userId: string,
  role: string,
  orderId: string
): Promise<Order | null> {
  const restaurantId = await getRestaurantId(userId, role);

  const orderSql = `
    SELECT o.*, u.name as waiter_name
    FROM orders o
    LEFT JOIN users u ON o.waiter_id = u.id
    WHERE o.id = $1 AND o.restaurant_id = $2
    LIMIT 1
  `;
  const { rows: orderRows } = await pool.query(orderSql, [orderId, restaurantId]);
  if (orderRows.length === 0) return null;

  const orderRecord = orderRows[0];

  const itemsSql = `
    SELECT oi.*, mi.name, mi.image_url
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = $1
    ORDER BY oi.created_at ASC
  `;
  const { rows: itemsRows } = await pool.query(itemsSql, [orderId]);

  return {
    ...orderRecord,
    total_amount: parseFloat(orderRecord.total_amount),
    items: itemsRows.map((item: any) => ({
      ...item,
      unit_price: parseFloat(item.unit_price as any),
      subtotal: parseFloat(item.subtotal as any),
    })),
  } as Order;
}

export async function getOrdersByTable(
  userId: string,
  role: string,
  tableNumber: number
): Promise<Order[]> {
  const restaurantId = await getRestaurantId(userId, role);

  const sql = `
    SELECT o.*, u.name as waiter_name
    FROM orders o
    LEFT JOIN users u ON o.waiter_id = u.id
    WHERE o.table_number = $1 AND o.restaurant_id = $2
    ORDER BY o.created_at DESC
  `;
  const { rows } = await pool.query(sql, [tableNumber, restaurantId]);

  return rows.map((r: any) => ({
    ...r,
    total_amount: parseFloat(r.total_amount),
  })) as Order[];
}

export async function updateOrderStatus(
  userId: string,
  role: string,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const restaurantId = await getRestaurantId(userId, role);

  const existingStatusResult = await pool.query(
    `SELECT status FROM orders WHERE id = $1 AND restaurant_id = $2 LIMIT 1`,
    [orderId, restaurantId]
  );
  if (existingStatusResult.rows.length === 0) {
    throw new Error('Order not found or unauthorized');
  }
  const previousStatus = existingStatusResult.rows[0].status;

  const sql = `
    UPDATE orders
    SET status = $1, updated_at = NOW()
    WHERE id = $2 AND restaurant_id = $3
    RETURNING *
  `;
  const { rows } = await pool.query(sql, [status, orderId, restaurantId]);

  if (rows.length === 0) {
    throw new Error('Order not found or unauthorized');
  }

  const orderRecord = rows[0];

  if (status === OrderStatus.READY && previousStatus !== OrderStatus.READY) {
    try {
      await inventoryService.deductInventoryForOrder(restaurantId, orderId);
    } catch (err) {
      await pool.query(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND restaurant_id = $3`,
        [previousStatus, orderId, restaurantId]
      );
      throw err;
    }
  }

  // Log operations events based on status change
  try {
    const tableNumber = orderRecord.table_number;
    const orderIdShort = orderId.substring(0, 8);
    
    if (status === OrderStatus.SENT_TO_KITCHEN && previousStatus !== OrderStatus.SENT_TO_KITCHEN) {
      await logEvent(restaurantId, OperationalEventType.ORDER_SENT_TO_KITCHEN, `Order #${orderIdShort} sent to kitchen for Table ${tableNumber}`, { orderId, tableNumber });
    } else if (status === OrderStatus.PREPARING && previousStatus !== OrderStatus.PREPARING) {
      await logEvent(restaurantId, OperationalEventType.ORDER_PREPARING, `Order #${orderIdShort} is being prepared in the kitchen`, { orderId, tableNumber });
      await logEvent(restaurantId, OperationalEventType.CHEF_STARTED_ORDER, `Chef started preparing Order #${orderIdShort}`, { orderId, tableNumber });
    } else if (status === OrderStatus.READY && previousStatus !== OrderStatus.READY) {
      await logEvent(restaurantId, OperationalEventType.ORDER_READY, `Order #${orderIdShort} is ready for service`, { orderId, tableNumber });
      await logEvent(restaurantId, OperationalEventType.CHEF_COMPLETED_ORDER, `Chef completed preparing Order #${orderIdShort}`, { orderId, tableNumber });
    } else if (status === OrderStatus.SERVED && previousStatus !== OrderStatus.SERVED) {
      await logEvent(restaurantId, OperationalEventType.ORDER_SERVED, `Order #${orderIdShort} served to Table ${tableNumber}`, { orderId, tableNumber });
      await logEvent(restaurantId, OperationalEventType.STOCK_REDUCED, `Inventory stock reduced for Order #${orderIdShort} ingredients`, { orderId, tableNumber });
      await logEvent(restaurantId, OperationalEventType.WAITER_COMPLETED_SERVICE, `Waiter completed service for Order #${orderIdShort}`, { orderId, tableNumber, waiterId: orderRecord.waiter_id });
    } else if (status === OrderStatus.BILL_REQUESTED && previousStatus !== OrderStatus.BILL_REQUESTED) {
      await logEvent(restaurantId, OperationalEventType.BILL_REQUESTED, `Bill requested for Table ${tableNumber}`, { orderId, tableNumber });
    } else if (status === OrderStatus.CHECKOUT_OPEN && previousStatus !== OrderStatus.CHECKOUT_OPEN) {
      await logEvent(restaurantId, OperationalEventType.INVOICE_GENERATED, `Checkout initiated for Order #${orderIdShort}`, { orderId, tableNumber });
    } else if (status === OrderStatus.ON_HOLD && previousStatus !== OrderStatus.ON_HOLD) {
      await logEvent(restaurantId, OperationalEventType.BILL_REQUESTED, `Checkout put on hold for Table ${tableNumber}`, { orderId, tableNumber });
    }
  } catch (e) {
    console.error('Failed to log event in updateOrderStatus:', e);
  }

  // Fetch items to complete the order response payload
  const itemsSql = `
    SELECT oi.*, mi.name, mi.image_url
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = $1
    ORDER BY oi.created_at ASC
  `;
  const { rows: itemsRows } = await pool.query(itemsSql, [orderId]);

  try {
    const { notifyWorkspace } = require('../workspace/workspace.sse');
    let workspaceId = orderRecord.workspace_id;
    if (!workspaceId) {
      const { rows: userRows } = await pool.query(
        `SELECT workspace_id FROM users WHERE id = $1 LIMIT 1`,
        [restaurantId]
      );
      workspaceId = userRows[0]?.workspace_id;
    }
    if (workspaceId) {
      const fullOrder = {
        ...orderRecord,
        total_amount: parseFloat(orderRecord.total_amount),
        items: itemsRows.map((item: any) => ({
          ...item,
          unit_price: parseFloat(item.unit_price as any),
          subtotal: parseFloat(item.subtotal as any),
        })),
      };
      
      let specificEvent = 'order_updated';
      if (status === OrderStatus.PAID) {
        specificEvent = 'order_completed';
      } else if (status === OrderStatus.REFUNDED) {
        specificEvent = 'order_cancelled';
      }

      notifyWorkspace(workspaceId, specificEvent, fullOrder);
      notifyWorkspace(workspaceId, 'ordersUpdated', fullOrder);
    }
  } catch (e) {
    console.error('Failed to notify workspace of order status update:', e);
  }

  return {
    ...orderRecord,
    total_amount: parseFloat(orderRecord.total_amount),
    items: itemsRows.map((item: any) => ({
      ...item,
      unit_price: parseFloat(item.unit_price as any),
      subtotal: parseFloat(item.subtotal as any),
    })),
  } as Order;
}

export async function deleteOrder(
  userId: string,
  role: string,
  orderId: string
): Promise<void> {
  const restaurantId = await getRestaurantId(userId, role);

  const sql = `
    DELETE FROM orders
    WHERE id = $1 AND restaurant_id = $2
  `;
  const result = await pool.query(sql, [orderId, restaurantId]);

  if (result.rowCount === 0) {
    throw new Error('Order not found or unauthorized');
  }

  try {
    const { notifyWorkspace } = require('../workspace/workspace.sse');
    const { rows: userRows } = await pool.query(
      `SELECT workspace_id FROM users WHERE id = $1 LIMIT 1`,
      [restaurantId]
    );
    const workspaceId = userRows[0]?.workspace_id;
    if (workspaceId) {
      notifyWorkspace(workspaceId, 'order_cancelled', { id: orderId });
      notifyWorkspace(workspaceId, 'ordersUpdated', { id: orderId });
    }
  } catch (e) {
    console.error('Failed to notify workspace of order deletion:', e);
  }
}

export async function getKitchenOrders(
  userId: string,
  role: string
): Promise<{ newOrders: Order[]; preparing: Order[]; ready: Order[] }> {
  const restaurantId = await getRestaurantId(userId, role);

  // 1. Fetch active orders
  const ordersSql = `
    SELECT o.*, u.name as waiter_name
    FROM orders o
    LEFT JOIN users u ON o.waiter_id = u.id
    WHERE o.restaurant_id = $1 AND o.status IN ('NEW', 'SENT_TO_KITCHEN', 'PREPARING', 'READY')
    ORDER BY o.created_at ASC
  `;
  const { rows: orders } = await pool.query(ordersSql, [restaurantId]);

  if (orders.length === 0) {
    return { newOrders: [], preparing: [], ready: [] };
  }

  const orderIds = orders.map((o) => o.id);

  // 2. Fetch items for all these active orders
  const itemsSql = `
    SELECT oi.*, mi.name, mi.image_url
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = ANY($1)
    ORDER BY oi.created_at ASC
  `;
  const { rows: items } = await pool.query(itemsSql, [orderIds]);

  // 3. Map items back to their corresponding orders
  const ordersWithItems = orders.map((o: any) => {
    const orderItems = items
      .filter((item: any) => item.order_id === o.id)
      .map((item: any) => ({
        ...item,
        unit_price: parseFloat(item.unit_price),
        subtotal: parseFloat(item.subtotal),
      }));
    return {
      ...o,
      total_amount: parseFloat(o.total_amount),
      items: orderItems,
    } as Order;
  });

  // 4. Categorize active orders into columns
  const newOrders = ordersWithItems.filter((o) => o.status === OrderStatus.NEW);
  const preparing = ordersWithItems.filter(
    (o) => o.status === OrderStatus.PREPARING || o.status === OrderStatus.SENT_TO_KITCHEN
  );
  const ready = ordersWithItems.filter((o) => o.status === OrderStatus.READY);

  return { newOrders, preparing, ready };
}

export async function updateOrderItems(
  userId: string,
  role: string,
  orderId: string,
  items: { menu_item_id: string; quantity: number }[]
): Promise<Order> {
  const restaurantId = await getRestaurantId(userId, role);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch menu item details to ensure validity and calculate subtotals
    const itemIds = items.map((i) => i.menu_item_id);
    const { rows: dbItems } = await client.query(
      `SELECT id, name, price, is_available FROM menu_items 
       WHERE id = ANY($1) AND restaurant_id = $2`,
      [itemIds, restaurantId]
    );

    if (dbItems.length !== itemIds.length) {
      throw new Error('Some menu items were not found or unauthorized');
    }

    let totalAmount = 0;
    const itemsToInsert = items.map((item) => {
      const dbItem = dbItems.find((d: any) => d.id === item.menu_item_id);
      if (!dbItem) throw new Error(`Menu item ${item.menu_item_id} not found`);
      const subtotal = dbItem.price * item.quantity;
      totalAmount += subtotal;
      return {
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: dbItem.price,
        subtotal,
      };
    });

    // Delete existing order items
    await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);

    // Insert new order items
    const insertedItems = [];
    for (const item of itemsToInsert) {
      const { rows: itemRows } = await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [orderId, item.menu_item_id, item.quantity, item.unit_price, item.subtotal]
      );
      insertedItems.push(itemRows[0]);
    }

    // Update order total amount
    await client.query(
      `UPDATE orders SET total_amount = $1, updated_at = NOW() WHERE id = $2`,
      [totalAmount, orderId]
    );

    // Delete existing invoice for this order so it can be regenerated
    await client.query('DELETE FROM invoices WHERE order_id = $1', [orderId]);

    await client.query('COMMIT');

    // Return the updated order details
    const orderSql = `SELECT o.*, u.name as waiter_name FROM orders o LEFT JOIN users u ON o.waiter_id = u.id WHERE o.id = $1 LIMIT 1`;
    const { rows: orderRows } = await pool.query(orderSql, [orderId]);
    const updatedOrder = {
      ...orderRows[0],
      total_amount: totalAmount,
      items: insertedItems.map(item => ({
        ...item,
        unit_price: parseFloat(item.unit_price),
        subtotal: parseFloat(item.subtotal),
      }))
    };

    try {
      const { notifyWorkspace } = require('../workspace/workspace.sse');
      let workspaceId = orderRows[0]?.workspace_id;
      if (!workspaceId) {
        const { rows: userRows } = await pool.query(
          `SELECT workspace_id FROM users WHERE id = $1 LIMIT 1`,
          [restaurantId]
        );
        workspaceId = userRows[0]?.workspace_id;
      }
      if (workspaceId) {
        notifyWorkspace(workspaceId, 'order_updated', updatedOrder);
        notifyWorkspace(workspaceId, 'ordersUpdated', updatedOrder);
      }
    } catch (e) {
      console.error('Failed to notify workspace of order items update:', e);
    }
    return {
      ...orderRows[0],
      total_amount: totalAmount,
      items: insertedItems.map(item => ({
        ...item,
        unit_price: parseFloat(item.unit_price),
        subtotal: parseFloat(item.subtotal),
      }))
    } as any;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
