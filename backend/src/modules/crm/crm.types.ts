// File: backend/src/modules/crm/crm.types.ts

export interface Customer {
  id: string;
  restaurant_id: string;
  name?: string;
  phone_number: string;
  email?: string;
  birthday?: Date;
  anniversary?: Date;
  notes?: string;
  preferred_seating?: string;
  preferred_dishes?: any;
  total_visits: number;
  total_spend: number;
  avg_bill_value: number;
  reward_points: number;
  vip_status: boolean;
  last_visit?: Date;
  created_at: Date;
  updated_at: Date;
  segment?: string;
}

export interface CreateCustomerPayload {
  name?: string;
  phone_number: string;
  email?: string;
  birthday?: string;
  anniversary?: string;
  notes?: string;
  preferred_seating?: string;
  preferred_dishes?: any;
}

export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SEATED = 'SEATED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_id: string;
  reservation_date: Date;
  reservation_time: string;
  guest_count: number;
  requested_table?: string;
  status: ReservationStatus | string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateReservationPayload {
  customer_id: string;
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:mm:ss
  guest_count: number;
  requested_table?: string;
  notes?: string;
}

export interface UpdateReservationStatusPayload {
  status: ReservationStatus;
  requested_table?: string;
}

export enum WaitlistStatus {
  WAITING = 'WAITING',
  SEATED = 'SEATED',
  LEFT = 'LEFT',
  CANCELLED = 'CANCELLED',
}

export interface WaitlistEntry {
  id: string;
  restaurant_id: string;
  customer_id?: string;
  customer_name?: string;
  phone_number?: string;
  party_size: number;
  estimated_wait_mins: number;
  status: WaitlistStatus | string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWaitlistEntryPayload {
  customer_id?: string;
  customer_name?: string;
  phone_number?: string;
  party_size: number;
  estimated_wait_mins?: number;
  notes?: string;
}

export interface UpdateWaitlistStatusPayload {
  status: WaitlistStatus;
  estimated_wait_mins?: number;
}
