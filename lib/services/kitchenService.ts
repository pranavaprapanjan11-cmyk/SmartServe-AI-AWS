import axios from 'axios';
import * as orderService from './orderService';
import { API_BASE } from '../config';

export async function getKitchenOrders(token: string) {
  const res = await axios.get(`${API_BASE}/kitchen/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function startCooking(orderId: string, token: string) {
  const res = await axios.put(
    `${API_BASE}/kitchen/orders/${orderId}/start-cooking`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function markReady(orderId: string, token: string) {
  const res = await axios.put(
    `${API_BASE}/kitchen/orders/${orderId}/ready`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function markServed(orderId: string, token: string) {
  const res = await axios.put(
    `${API_BASE}/kitchen/orders/${orderId}/served`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export function elapsedMinutes(order: orderService.Order) {
  try {
    const then = new Date(order.created_at).getTime();
    const now = Date.now();
    return Math.floor((now - then) / 60000);
  } catch (e) {
    return 0;
  }
}

export function averagePrepMinutes(orders: orderService.Order[]) {
  const samples = orders.filter(
    (o) => o.status === orderService.OrderStatus.READY || o.status === orderService.OrderStatus.SERVED
  );
  if (samples.length === 0) return 0;
  const total = samples.reduce((acc, o) => {
    const then = new Date(o.created_at).getTime();
    const updated = new Date(o.updated_at || o.created_at).getTime();
    return acc + Math.max(0, Math.floor((updated - then) / 60000));
  }, 0);
  return Math.round(total / samples.length);
}

export default {
  getKitchenOrders,
  startCooking,
  markReady,
  markServed,
  elapsedMinutes,
  averagePrepMinutes,
};
