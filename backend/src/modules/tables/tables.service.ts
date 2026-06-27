// File: backend/src/modules/tables/tables.service.ts
import { pool } from '../../database';
import { getRestaurantId } from '../orders/orders.service';
import {
  RestaurantTable,
  CreateTablePayload,
  UpdateTablePayload,
  ReservationPayload,
  TableStatus,
} from './tables.types';
import { logEvent } from '../ai-operations/aiOperations.service';
import { OperationalEventType } from '../ai-operations/aiOperations.types';



export async function listTables(userId: string, role: string): Promise<RestaurantTable[]> {
  const restaurantId = await getRestaurantId(userId, role);
  
  // Always clear expired reservations first to ensure status is up to date
  await clearExpiredReservations(restaurantId);

  const sql = `
    SELECT * FROM restaurant_tables
    WHERE restaurant_id = $1
    ORDER BY table_number ASC
  `;
  const { rows } = await pool.query(sql, [restaurantId]);
  return rows as RestaurantTable[];
}

function findNextAvailablePosition(existingTables: any[]) {
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

export async function createTable(
  userId: string,
  role: string,
  payload: CreateTablePayload
): Promise<RestaurantTable> {
  const restaurantId = await getRestaurantId(userId, role);
  const existing = await listTables(userId, role);
  
  let posX = payload.position_x;
  let posY = payload.position_y;
  
  if (posX === undefined || posY === undefined || (posX === 0 && posY === 0)) {
    const nextPos = findNextAvailablePosition(existing);
    posX = nextPos.position_x;
    posY = nextPos.position_y;
  }
  
  const sql = `
    INSERT INTO restaurant_tables 
      (restaurant_id, table_number, capacity, status, section, shape, position_x, position_y, width, height, rotation)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  const { rows } = await pool.query(sql, [
    restaurantId,
    payload.table_number,
    payload.capacity,
    TableStatus.AVAILABLE,
    payload.section || 'Main Hall',
    payload.shape || 'square',
    posX,
    posY,
    payload.width || 80,
    payload.height || 80,
    payload.rotation || 0,
  ]);

  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'tablesUpdated');
  } catch (e) {
    console.error('Failed to notify tablesUpdated', e);
  }

  return rows[0] as RestaurantTable;
}

export async function updateTable(
  userId: string,
  role: string,
  id: string,
  payload: UpdateTablePayload
): Promise<RestaurantTable> {
  const restaurantId = await getRestaurantId(userId, role);

  // First, verify table belongs to the restaurant
  const checkSql = `SELECT * FROM restaurant_tables WHERE id = $1 AND restaurant_id = $2 LIMIT 1`;
  const { rows: checkRows } = await pool.query(checkSql, [id, restaurantId]);
  if (checkRows.length === 0) {
    throw new Error('Table not found or unauthorized');
  }

  const table = checkRows[0];

  // Apply RBAC: Waiters can ONLY modify status, current_order_id, and reservation info
  const isWaiter = role === 'WAITER';
  const fieldsToUpdate: string[] = [];
  const values: any[] = [id, restaurantId];
  let valIdx = 3;

  const addField = (name: string, value: any) => {
    fieldsToUpdate.push(`${name} = $${valIdx}`);
    values.push(value);
    valIdx++;
  };

  if (payload.status !== undefined) {
    addField('status', payload.status);
    if (payload.status === TableStatus.OCCUPIED) {
      addField('last_occupied_at', new Date());
    }
  }
  if (payload.current_order_id !== undefined) addField('current_order_id', payload.current_order_id);

  // Restricted fields (Managers and Owners only)
  if (!isWaiter) {
    if (payload.capacity !== undefined) addField('capacity', payload.capacity);
    if (payload.section !== undefined) addField('section', payload.section);
    if (payload.shape !== undefined) addField('shape', payload.shape);
    if (payload.position_x !== undefined) addField('position_x', payload.position_x);
    if (payload.position_y !== undefined) addField('position_y', payload.position_y);
    if (payload.width !== undefined) addField('width', payload.width);
    if (payload.height !== undefined) addField('height', payload.height);
    if (payload.rotation !== undefined) addField('rotation', payload.rotation);
  }

  if (fieldsToUpdate.length === 0) {
    return table as RestaurantTable;
  }

  addField('updated_at', new Date());

  const sql = `
    UPDATE restaurant_tables
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = $1 AND restaurant_id = $2
    RETURNING *
  `;
  const { rows } = await pool.query(sql, values);
  const updatedTable = rows[0] as RestaurantTable;

  if (payload.status !== undefined && payload.status !== table.status) {
    try {
      let eventType = OperationalEventType.TABLE_AVAILABLE;
      let desc = `Table ${updatedTable.table_number} status updated to AVAILABLE`;
      
      if (payload.status === TableStatus.OCCUPIED) {
        eventType = OperationalEventType.TABLE_OCCUPIED;
        desc = `Table ${updatedTable.table_number} occupied`;
      } else if (payload.status === TableStatus.CLEANING) {
        eventType = OperationalEventType.TABLE_CLEANING;
        desc = `Table ${updatedTable.table_number} cleaning in progress`;
      } else if (payload.status === TableStatus.RESERVED) {
        eventType = OperationalEventType.TABLE_RESERVED;
        desc = `Table ${updatedTable.table_number} reserved`;
      }
      
      await logEvent(restaurantId, eventType, desc, {
        tableId: updatedTable.id,
        tableNumber: updatedTable.table_number,
        status: updatedTable.status
      });
    } catch (e) {
      console.error('Failed to log table status event:', e);
    }
  }

  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'tablesUpdated');
  } catch (e) {
    console.error('Failed to notify tablesUpdated', e);
  }

  return updatedTable;
}

export async function deleteTable(userId: string, role: string, id: string): Promise<void> {
  const restaurantId = await getRestaurantId(userId, role);
  
  const sql = `
    DELETE FROM restaurant_tables
    WHERE id = $1 AND restaurant_id = $2
  `;
  const result = await pool.query(sql, [id, restaurantId]);
  if (result.rowCount === 0) {
    throw new Error('Table not found or unauthorized');
  }

  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'tablesUpdated');
  } catch (e) {
    console.error('Failed to notify tablesUpdated', e);
  }
}

export async function createReservation(
  userId: string,
  role: string,
  id: string,
  payload: ReservationPayload
): Promise<RestaurantTable> {
  const restaurantId = await getRestaurantId(userId, role);

  const sql = `
    UPDATE restaurant_tables
    SET status = $1,
        reserved_for = $2,
        reserved_phone = $3,
        reservation_time = $4,
        updated_at = NOW()
    WHERE id = $5 AND restaurant_id = $6
    RETURNING *
  `;
  const { rows } = await pool.query(sql, [
    TableStatus.RESERVED,
    payload.reserved_for,
    payload.reserved_phone,
    payload.reservation_time,
    id,
    restaurantId,
  ]);

  if (rows.length === 0) {
    throw new Error('Table not found or unauthorized');
  }

  const updatedTable = rows[0] as RestaurantTable;
  try {
    await logEvent(restaurantId, OperationalEventType.TABLE_RESERVED, `Table ${updatedTable.table_number} reserved for ${payload.reserved_for}`, {
      tableId: updatedTable.id,
      tableNumber: updatedTable.table_number,
      reservedFor: payload.reserved_for,
      reservationTime: payload.reservation_time
    });
  } catch (e) {
    console.error('Failed to log TABLE_RESERVED event:', e);
  }

  return updatedTable;
}

export async function modifyReservation(
  userId: string,
  role: string,
  id: string,
  payload: ReservationPayload
): Promise<RestaurantTable> {
  const restaurantId = await getRestaurantId(userId, role);

  const sql = `
    UPDATE restaurant_tables
    SET reserved_for = $1,
        reserved_phone = $2,
        reservation_time = $3,
        updated_at = NOW()
    WHERE id = $4 AND restaurant_id = $5 AND status = 'RESERVED'
    RETURNING *
  `;
  const { rows } = await pool.query(sql, [
    payload.reserved_for,
    payload.reserved_phone,
    payload.reservation_time,
    id,
    restaurantId,
  ]);

  if (rows.length === 0) {
    throw new Error('Table not found, not reserved, or unauthorized');
  }

  return rows[0] as RestaurantTable;
}

export async function cancelReservation(
  userId: string,
  role: string,
  id: string
): Promise<RestaurantTable> {
  const restaurantId = await getRestaurantId(userId, role);

  const sql = `
    UPDATE restaurant_tables
    SET status = $1,
        reserved_for = NULL,
        reserved_phone = NULL,
        reservation_time = NULL,
        updated_at = NOW()
    WHERE id = $2 AND restaurant_id = $3 AND status = 'RESERVED'
    RETURNING *
  `;
  const { rows } = await pool.query(sql, [TableStatus.AVAILABLE, id, restaurantId]);

  if (rows.length === 0) {
    throw new Error('Table not found, not reserved, or unauthorized');
  }

  return rows[0] as RestaurantTable;
}

/**
 * Auto-clears reservations that have expired (e.g. reservation time is in the past by more than 30 mins)
 */
export async function clearExpiredReservations(restaurantId: string): Promise<void> {
  const expirationThresholdMinutes = 30;
  const sql = `
    UPDATE restaurant_tables
    SET status = 'AVAILABLE',
        reserved_for = NULL,
        reserved_phone = NULL,
        reservation_time = NULL,
        updated_at = NOW()
    WHERE restaurant_id = $1 
      AND status = 'RESERVED' 
      AND reservation_time < NOW() - INTERVAL '${expirationThresholdMinutes} minutes'
  `;
  await pool.query(sql, [restaurantId]);
}
