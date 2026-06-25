// File: backend/src/modules/tables/tables.types.ts

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
