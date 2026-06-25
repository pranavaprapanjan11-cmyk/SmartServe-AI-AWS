import axios from 'axios'
import { PaymentMethodType } from '../types/foundation'
import { API_BASE } from '../config'

export interface BillableOrderItem {
  id: string
  menu_item_id: string
  name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface BillableOrder {
  id: string
  table_number: number
  guest_count: number
  status: string
  total_amount: number
  created_at: string
  waiter_name?: string
  invoice_exists: boolean
  items: BillableOrderItem[]
}

export interface InvoicePayload {
  order_id: string
  tax_percent: number
  discount_amount: number
}

export interface InvoiceRecord {
  id: string
  restaurant_id: string
  order_id: string
  invoice_number: string
  issue_date: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  gst_number?: string
  status: string
  created_at: string
  updated_at: string
}

export interface PaymentPayload {
  invoice_id: string
  amount: number
  payment_method: PaymentMethodType
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'FAILED'
  transaction_reference?: string
}

export interface BillingMetrics {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  averageBill: number
  outstandingBalance: number
  totalInvoices: number
  paidInvoices: number
}

export async function fetchBillableOrders(token: string): Promise<BillableOrder[]> {
  const res = await axios.get<BillableOrder[]>(`${API_BASE}/billing/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function createInvoice(token: string, payload: InvoicePayload): Promise<InvoiceRecord> {
  const res = await axios.post<InvoiceRecord>(`${API_BASE}/billing/invoices`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function fetchInvoiceByOrder(token: string, orderId: string): Promise<InvoiceRecord> {
  const res = await axios.get<InvoiceRecord>(`${API_BASE}/billing/invoices/order/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function submitPayment(token: string, payload: PaymentPayload) {
  const res = await axios.post(`${API_BASE}/billing/payments`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function fetchBillingMetrics(token: string): Promise<BillingMetrics> {
  const res = await axios.get<BillingMetrics>(`${API_BASE}/billing/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function fetchInvoices(token: string): Promise<InvoiceRecord[]> {
  const res = await axios.get<InvoiceRecord[]>(`${API_BASE}/billing/invoices`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function fetchPayments(token: string): Promise<any[]> {
  const res = await axios.get<any[]>(`${API_BASE}/billing/payments`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function refundInvoice(token: string, invoiceId: string): Promise<any> {
  const res = await axios.post(`${API_BASE}/billing/invoices/${invoiceId}/refund`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function validateManagerPin(pin: string, token: string): Promise<{ approved: boolean; managerName?: string; role?: string }> {
  const res = await axios.post(`${API_BASE}/auth/validate-manager-pin`, { pin }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}
