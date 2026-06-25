// File: backend/src/modules/billing/billing.types.ts

import { Order, OrderStatus } from '../orders/orders.types';

export type PaymentMethodType = 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card';
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'FAILED';

export interface PendingBillingOrder extends Order {
  invoice_exists: boolean;
}

export interface CreateInvoicePayload {
  order_id: string;
  tax_percent: number;
  discount_amount: number;
}

export interface BillingMetrics {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  averageBill: number;
  outstandingBalance: number;
  totalInvoices: number;
  paidInvoices: number;
}

export interface InvoiceRecord {
  id: string;
  restaurant_id: string;
  order_id: string;
  invoice_number: string;
  issue_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  gst_number?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  restaurant_id: string;
  order_id: string;
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethodType;
  status: PaymentStatus;
  transaction_reference?: string;
  created_at: string;
  updated_at: string;
}
