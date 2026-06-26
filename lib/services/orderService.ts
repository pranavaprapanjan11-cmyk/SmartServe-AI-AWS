// File: frontend/src/services/orderService.ts
// API service for order operations. Connected to backend Express CRUD and details timeline.

import axios from 'axios';
import { API_BASE } from '../config';

export enum OrderStatus {
  NEW = 'NEW',
  SENT_TO_KITCHEN = 'SENT_TO_KITCHEN',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  BILL_REQUESTED = 'BILL_REQUESTED',
  CHECKOUT_OPEN = 'CHECKOUT_OPEN',
  ON_HOLD = 'ON_HOLD',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at?: string;
  name?: string;
  image_url?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  waiter_id: string;
  table_number: number;
  guest_count: number;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  waiter_name?: string;
}

export interface CreateOrderItemPayload {
  menu_item_id: string;
  quantity: number;
}

export interface CreateOrderPayload {
  table_number: number;
  guest_count?: number;
  items: CreateOrderItemPayload[];
}

function normalizeOrder(order: any): Order {
  return {
    ...order,
    table_number: Number(order.table_number),
    guest_count: Number(order.guest_count),
    total_amount: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount,
    items: order.items
      ? order.items.map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price,
          subtotal: typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : item.subtotal,
        }))
      : undefined,
  } as Order;
}

export async function createOrder(payload: CreateOrderPayload, token: string): Promise<Order> {
  const res = await axios.post<Order>(`${API_BASE}/orders`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeOrder(res.data);
}

export async function getOrders(token: string): Promise<Order[]> {
  const res = await axios.get<Order[]>(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.map(normalizeOrder);
}

export async function getOrderById(id: string, token: string): Promise<Order> {
  const res = await axios.get<Order>(`${API_BASE}/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeOrder(res.data);
}

export async function getOrdersByTable(tableNumber: number, token: string): Promise<Order[]> {
  const res = await axios.get<Order[]>(`${API_BASE}/orders/table/${tableNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.map(normalizeOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus, token: string): Promise<Order> {
  const res = await axios.put<Order>(
    `${API_BASE}/orders/${id}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return normalizeOrder(res.data);
}

export async function deleteOrder(id: string, token: string): Promise<void> {
  await axios.delete(`${API_BASE}/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateOrderItems(
  id: string,
  items: { menu_item_id: string; quantity: number }[],
  token: string
): Promise<Order> {
  const res = await axios.put<Order>(
    `${API_BASE}/orders/${id}/items`,
    { items },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return normalizeOrder(res.data);
}
