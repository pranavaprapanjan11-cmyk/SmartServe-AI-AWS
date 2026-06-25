// File: frontend/src/services/tableService.ts
// API service for restaurant table operations

import axios from 'axios';
import { API_BASE } from '../config';

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: number;
  capacity: number;
  status: TableStatus;
  current_order_id?: string | null;
  section?: string;
  shape?: string;
  position_x: number;
  position_y: number;
  reserved_for?: string | null;
  reserved_phone?: string | null;
  reservation_time?: string | null;
  last_occupied_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTablePayload {
  table_number: number;
  capacity: number;
  section?: string;
  shape?: string;
  position_x?: number;
  position_y?: number;
}

export interface UpdateTablePayload {
  capacity?: number;
  status?: TableStatus;
  current_order_id?: string | null;
  section?: string;
  shape?: string;
  position_x?: number;
  position_y?: number;
}

export interface ReservationPayload {
  reserved_for: string;
  reserved_phone: string;
  reservation_time: string;
}

function normalizeTable(table: any): RestaurantTable {
  return {
    ...table,
    table_number: Number(table.table_number),
    capacity: Number(table.capacity),
    position_x: Number(table.position_x || 0),
    position_y: Number(table.position_y || 0),
  } as RestaurantTable;
}

export async function getTables(token: string): Promise<RestaurantTable[]> {
  const res = await axios.get<RestaurantTable[]>(`${API_BASE}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.map(normalizeTable);
}

export async function createTable(payload: CreateTablePayload, token: string): Promise<RestaurantTable> {
  const res = await axios.post<RestaurantTable>(`${API_BASE}/tables`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeTable(res.data);
}

export async function updateTable(id: string, payload: UpdateTablePayload, token: string): Promise<RestaurantTable> {
  const res = await axios.put<RestaurantTable>(`${API_BASE}/tables/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeTable(res.data);
}

export async function deleteTable(id: string, token: string): Promise<void> {
  await axios.delete(`${API_BASE}/tables/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function reserveTable(id: string, payload: ReservationPayload, token: string): Promise<RestaurantTable> {
  const res = await axios.post<RestaurantTable>(`${API_BASE}/tables/${id}/reserve`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeTable(res.data);
}

export async function editReservation(id: string, payload: ReservationPayload, token: string): Promise<RestaurantTable> {
  const res = await axios.put<RestaurantTable>(`${API_BASE}/tables/${id}/reserve`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeTable(res.data);
}

export async function cancelReservation(id: string, token: string): Promise<RestaurantTable> {
  const res = await axios.delete<RestaurantTable>(`${API_BASE}/tables/${id}/reserve`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeTable(res.data);
}
