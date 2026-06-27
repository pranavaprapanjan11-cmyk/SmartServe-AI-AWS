// File: backend/src/modules/crm/crm.service.ts
import { pool } from '../../database';
import { getRestaurantId } from '../orders/orders.service';
import {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  Reservation,
  CreateReservationPayload,
  UpdateReservationStatusPayload,
  ReservationStatus,
  WaitlistEntry,
  CreateWaitlistEntryPayload,
  UpdateWaitlistStatusPayload,
  WaitlistStatus,
} from './crm.types';
import { logEvent } from '../ai-operations/aiOperations.service';
import { OperationalEventType } from '../ai-operations/aiOperations.types';
// Removed incorrect import: `getGeminiInsight` is not exported from ../ai/ai.service



// --- Customers ---

export async function listCustomers(userId: string, role: string): Promise<Customer[]> {
  const restaurantId = await getRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM customers WHERE restaurant_id = $1 ORDER BY total_spend DESC, last_visit DESC`,
    [restaurantId]
  );
  return rows.map((r) => enrichCustomerWithSegment(r));
}

export async function findCustomerByPhone(restaurantId: string, phone: string): Promise<Customer | null> {
  const { rows } = await pool.query(`SELECT * FROM customers WHERE restaurant_id = $1 AND phone_number = $2`, [
    restaurantId,
    phone,
  ]);
  return rows[0] ? enrichCustomerWithSegment(rows[0]) : null;
}

export async function createCustomer(
  userId: string,
  role: string,
  payload: CreateCustomerPayload
): Promise<Customer> {
  const restaurantId = await getRestaurantId(userId, role);
  return await createCustomerInternal(restaurantId, payload);
}

export async function createCustomerInternal(
  restaurantId: string,
  payload: CreateCustomerPayload
): Promise<Customer> {
  const { rows } = await pool.query(
    `INSERT INTO customers (
      restaurant_id, name, phone_number, email, birthday, anniversary, notes, preferred_seating, preferred_dishes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      restaurantId,
      payload.name || null,
      payload.phone_number,
      payload.email || null,
      payload.birthday || null,
      payload.anniversary || null,
      payload.notes || null,
      payload.preferred_seating || null,
      payload.preferred_dishes ? JSON.stringify(payload.preferred_dishes) : '[]',
    ]
  );
  
  await logEvent(restaurantId, OperationalEventType.AI_INSIGHT_GENERATED, `New Customer created: ${payload.name || payload.phone_number}`);
  return enrichCustomerWithSegment(rows[0]);
}

export async function updateCustomer(
  userId: string,
  role: string,
  id: string,
  payload: UpdateCustomerPayload
): Promise<Customer> {
  const restaurantId = await getRestaurantId(userId, role);
  
  const updates: string[] = [];
  const values: any[] = [id, restaurantId];
  let valIdx = 3;

  const addField = (name: string, value: any) => {
    updates.push(`${name} = $${valIdx}`);
    values.push(value);
    valIdx++;
  };

  if (payload.name !== undefined) addField('name', payload.name);
  if (payload.phone_number !== undefined) addField('phone_number', payload.phone_number);
  if (payload.email !== undefined) addField('email', payload.email);
  if (payload.birthday !== undefined) addField('birthday', payload.birthday);
  if (payload.anniversary !== undefined) addField('anniversary', payload.anniversary);
  if (payload.notes !== undefined) addField('notes', payload.notes);
  if (payload.preferred_seating !== undefined) addField('preferred_seating', payload.preferred_seating);
  if (payload.preferred_dishes !== undefined) addField('preferred_dishes', JSON.stringify(payload.preferred_dishes));

  if (updates.length === 0) {
    const { rows } = await pool.query(`SELECT * FROM customers WHERE id = $1 AND restaurant_id = $2`, [id, restaurantId]);
    return enrichCustomerWithSegment(rows[0]);
  }

  addField('updated_at', new Date());

  const sql = `UPDATE customers SET ${updates.join(', ')} WHERE id = $1 AND restaurant_id = $2 RETURNING *`;
  const { rows } = await pool.query(sql, values);
  return enrichCustomerWithSegment(rows[0]);
}

function enrichCustomerWithSegment(c: any): Customer {
  const totalSpend = parseFloat(c.total_spend || '0');
  const visits = parseInt(c.total_visits || '0', 10);
  const points = parseInt(c.reward_points || '0', 10);
  const avgBill = parseFloat(c.avg_bill_value || '0');
  
  let segment = 'Regular';
  const lastVisit = c.last_visit ? new Date(c.last_visit) : null;
  const daysSinceVisit = lastVisit ? (new Date().getTime() - lastVisit.getTime()) / (1000 * 3600 * 24) : -1;

  if (c.vip_status || totalSpend > 50000) {
    segment = 'VIP';
  } else if (visits >= 5 && daysSinceVisit >= 0 && daysSinceVisit <= 30) {
    segment = 'Frequent Visitor';
  } else if (visits === 1) {
    segment = 'New Customer';
  } else if (daysSinceVisit > 60) {
    segment = 'At Risk';
  }

  return {
    ...c,
    total_spend: totalSpend,
    total_visits: visits,
    avg_bill_value: avgBill,
    reward_points: points,
    segment
  };
}

// --- Reservations ---

export async function recordCustomerVisit(
  restaurantId: string,
  phone: string,
  name: string | undefined,
  spend: number
): Promise<void> {
  const { rows } = await pool.query(
    `SELECT * FROM customers WHERE restaurant_id = $1 AND phone_number = $2 LIMIT 1`,
    [restaurantId, phone]
  );
  
  let customerId: string;
  let newVisits = 1;
  let newSpend = spend;
  let earnedPoints = Math.floor(spend / 100);

  if (rows.length === 0) {
    // create new
    const cust = await createCustomerInternal(restaurantId, {
      phone_number: phone,
      name: name,
    });
    customerId = cust.id;
    await pool.query(
      `UPDATE customers SET total_visits = 1, total_spend = $1, avg_bill_value = $1, last_visit = NOW(), reward_points = $2 WHERE id = $3`,
      [spend, earnedPoints, customerId]
    );
  } else {
    // update existing
    const c = rows[0];
    customerId = c.id;
    newVisits = (c.total_visits || 0) + 1;
    newSpend = parseFloat(c.total_spend || '0') + spend;
    const newAvg = newSpend / newVisits;
    earnedPoints = Math.floor(spend / 100);
    const newPoints = (c.reward_points || 0) + earnedPoints;

    await pool.query(
      `UPDATE customers SET 
         total_visits = $1, 
         total_spend = $2, 
         avg_bill_value = $3, 
         reward_points = $4,
         last_visit = NOW(),
         name = COALESCE($5, name)
       WHERE id = $6`,
      [newVisits, newSpend, newAvg, newPoints, name || null, customerId]
    );

    // Check milestones
    if (newVisits === 5) {
      await logEvent(restaurantId, OperationalEventType.AI_INSIGHT_GENERATED, `Customer ${name || phone} reached Frequent Visitor milestone (5 visits)`);
    }
    if (newSpend > 50000 && !c.vip_status) {
      await pool.query(`UPDATE customers SET vip_status = true WHERE id = $1`, [customerId]);
      await logEvent(restaurantId, OperationalEventType.AI_INSIGHT_GENERATED, `Customer ${name || phone} unlocked VIP Status`);
    }
  }

  // Insert visit record
  await pool.query(
    `INSERT INTO customer_visits (restaurant_id, customer_id, spend_amount) VALUES ($1, $2, $3)`,
    [restaurantId, customerId, spend]
  );

  // Insert loyalty transaction record
  if (earnedPoints > 0) {
    await pool.query(
      `INSERT INTO loyalty_transactions (restaurant_id, customer_id, points, transaction_type, description)
       VALUES ($1, $2, $3, 'EARNED', $4)`,
      [restaurantId, customerId, earnedPoints, `Earned from visit: spend ₹${spend}`]
    );
  }
}

// --- Reservations ---

export async function listReservations(userId: string, role: string): Promise<Reservation[]> {
  const restaurantId = await getRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT r.*, c.name as customer_name, c.phone_number 
     FROM reservations r 
     JOIN customers c ON r.customer_id = c.id 
     WHERE r.restaurant_id = $1 
     ORDER BY r.reservation_date ASC, r.reservation_time ASC`,
    [restaurantId]
  );
  return rows;
}

export async function createReservation(
  userId: string,
  role: string,
  payload: CreateReservationPayload
): Promise<Reservation> {
  const restaurantId = await getRestaurantId(userId, role);
  
  const { rows } = await pool.query(
    `INSERT INTO reservations (
      restaurant_id, customer_id, reservation_date, reservation_time, guest_count, requested_table, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      restaurantId,
      payload.customer_id,
      payload.reservation_date,
      payload.reservation_time,
      payload.guest_count,
      payload.requested_table || null,
      payload.notes || null,
    ]
  );
  
  const r = rows[0];
  await logEvent(restaurantId, OperationalEventType.TABLE_RESERVED, `Reservation created for ${payload.guest_count} guests on ${payload.reservation_date} at ${payload.reservation_time}`);
  
  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'reservationsUpdated');
  } catch (e) {
    console.error('Failed to notify reservationsUpdated', e);
  }

  return r;
}

export async function updateReservationStatus(
  userId: string,
  role: string,
  id: string,
  payload: UpdateReservationStatusPayload
): Promise<Reservation> {
  const restaurantId = await getRestaurantId(userId, role);
  
  const { rows } = await pool.query(
    `UPDATE reservations 
     SET status = $1, requested_table = COALESCE($2, requested_table), updated_at = NOW() 
     WHERE id = $3 AND restaurant_id = $4
     RETURNING *`,
    [payload.status, payload.requested_table || null, id, restaurantId]
  );
  
  if (rows.length === 0) throw new Error('Reservation not found');
  
  const r = rows[0];
  
  if (payload.status === ReservationStatus.SEATED && r.requested_table) {
    // Attempt to update table status to occupied if it was seated
    await pool.query(
      `UPDATE restaurant_tables SET status = 'OCCUPIED' WHERE id = $1 AND restaurant_id = $2`,
      [r.requested_table, restaurantId]
    );
    try {
      const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
      notifyWorkspaceByRestaurantId(restaurantId, 'tablesUpdated');
    } catch (e) {}
  }
  
  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'reservationsUpdated');
  } catch (e) {
    console.error('Failed to notify reservationsUpdated', e);
  }

  return r;
}

export async function updateReservation(
  userId: string,
  role: string,
  id: string,
  payload: any
): Promise<Reservation> {
  const restaurantId = await getRestaurantId(userId, role);
  
  const updates: string[] = [];
  const values: any[] = [id, restaurantId];
  let valIdx = 3;

  const addField = (name: string, value: any) => {
    updates.push(`${name} = $${valIdx}`);
    values.push(value);
    valIdx++;
  };

  if (payload.reservation_date !== undefined) addField('reservation_date', payload.reservation_date);
  if (payload.reservation_time !== undefined) addField('reservation_time', payload.reservation_time);
  if (payload.guest_count !== undefined) addField('guest_count', payload.guest_count);
  if (payload.requested_table !== undefined) addField('requested_table', payload.requested_table || null);
  if (payload.notes !== undefined) addField('notes', payload.notes || null);
  if (payload.status !== undefined) addField('status', payload.status);

  if (updates.length === 0) {
    const { rows } = await pool.query(`SELECT r.*, c.name as customer_name, c.phone_number FROM reservations r JOIN customers c ON r.customer_id = c.id WHERE r.id = $1 AND r.restaurant_id = $2`, [id, restaurantId]);
    return rows[0];
  }

  addField('updated_at', new Date());

  const sql = `UPDATE reservations SET ${updates.join(', ')} WHERE id = $1 AND restaurant_id = $2 RETURNING *`;
  const { rows } = await pool.query(sql, values);
  if (rows.length === 0) throw new Error('Reservation not found');
  
  const r = rows[0];
  
  if (payload.status === ReservationStatus.SEATED && r.requested_table) {
    await pool.query(
      `UPDATE restaurant_tables SET status = 'OCCUPIED' WHERE id = $1 AND restaurant_id = $2`,
      [r.requested_table, restaurantId]
    );
    try {
      const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
      notifyWorkspaceByRestaurantId(restaurantId, 'tablesUpdated');
    } catch (e) {}
  }
  
  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'reservationsUpdated');
  } catch (e) {
    console.error('Failed to notify reservationsUpdated', e);
  }

  // Fetch complete record with customer details for response
  const { rows: completeRecord } = await pool.query(
    `SELECT r.*, c.name as customer_name, c.phone_number 
     FROM reservations r 
     JOIN customers c ON r.customer_id = c.id 
     WHERE r.id = $1 AND r.restaurant_id = $2`,
    [id, restaurantId]
  );

  return completeRecord[0] || r;
}

// --- Waitlist ---

export async function listWaitlist(userId: string, role: string): Promise<WaitlistEntry[]> {
  const restaurantId = await getRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM waitlist_entries WHERE restaurant_id = $1 ORDER BY created_at ASC`,
    [restaurantId]
  );
  return rows;
}

export async function createWaitlistEntry(
  userId: string,
  role: string,
  payload: CreateWaitlistEntryPayload
): Promise<WaitlistEntry> {
  const restaurantId = await getRestaurantId(userId, role);
  
  const { rows } = await pool.query(
    `INSERT INTO waitlist_entries (
      restaurant_id, customer_id, customer_name, phone_number, party_size, estimated_wait_mins, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      restaurantId,
      payload.customer_id || null,
      payload.customer_name || null,
      payload.phone_number || null,
      payload.party_size,
      payload.estimated_wait_mins || 15,
      payload.notes || null,
    ]
  );
  
  return rows[0];
}

export async function updateWaitlistStatus(
  userId: string,
  role: string,
  id: string,
  payload: UpdateWaitlistStatusPayload
): Promise<WaitlistEntry> {
  const restaurantId = await getRestaurantId(userId, role);
  
  const { rows } = await pool.query(
    `UPDATE waitlist_entries 
     SET status = $1, estimated_wait_mins = COALESCE($2, estimated_wait_mins), updated_at = NOW() 
     WHERE id = $3 AND restaurant_id = $4
     RETURNING *`,
    [payload.status, payload.estimated_wait_mins || null, id, restaurantId]
  );
  
  if (rows.length === 0) throw new Error('Waitlist entry not found');
  return rows[0];
}

// --- CRM Intelligence & Recommendations ---

export async function getCRMDashboardMetrics(userId: string, role: string): Promise<any> {
  const restaurantId = await getRestaurantId(userId, role);
  
  const customers = await listCustomers(userId, role);
  
  const totalCustomers = customers.length;
  const vipCount = customers.filter(c => c.segment === 'VIP').length;
  const atRiskCount = customers.filter(c => c.segment === 'At Risk').length;
  
  const { rows: reservations } = await pool.query(
    `SELECT status, COUNT(*) as count FROM reservations WHERE restaurant_id = $1 AND reservation_date >= CURRENT_DATE GROUP BY status`,
    [restaurantId]
  );
  
  const { rows: waitlist } = await pool.query(
    `SELECT COUNT(*) as count FROM waitlist_entries WHERE restaurant_id = $1 AND status = 'WAITING'`,
    [restaurantId]
  );

  let upcomingReservations = 0;
  reservations.forEach((r: any) => {
    if (r.status === 'PENDING' || r.status === 'CONFIRMED') {
      upcomingReservations += parseInt(r.count, 10);
    }
  });

  const waitingCount = parseInt(waitlist[0]?.count || '0', 10);

  // Generate some basic AI insights
  const insights = [];
  
  const upcomingVIPs = customers.filter(c => c.segment === 'VIP' && c.last_visit && (new Date().getTime() - c.last_visit.getTime()) < 1000 * 3600 * 24 * 7); // just visited recently?
  
  if (vipCount > 0) {
    insights.push(`You have ${vipCount} VIP customers. Consider sending them a special offer to maintain loyalty.`);
  }
  if (atRiskCount > 0) {
    insights.push(`${atRiskCount} customers are 'At Risk' (no visit in >60 days). A targeted win-back campaign is recommended.`);
  }

  // Find customers with upcoming birthdays (next 7 days)
  const today = new Date();
  const birthdays = customers.filter(c => {
    if (!c.birthday) return false;
    const bday = new Date(c.birthday);
    const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    const diff = (thisYearBday.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 7;
  });

  if (birthdays.length > 0) {
    insights.push(`${birthdays.length} customers have birthdays in the next 7 days.`);
  }

  return {
    totalCustomers,
    vipCount,
    atRiskCount,
    upcomingReservations,
    waitingCount,
    insights
  };
}
