import axios from 'axios'
import { API_BASE } from '../config'

export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DELIVERED' | 'CANCELLED'

export interface PurchaseOrderLine {
  id?: string
  purchase_order_id?: string
  inventory_item_id: string
  inventory_item_name?: string
  unit?: string
  quantity: number
  unit_price: number
  total_cost?: number
}

export interface PurchaseOrder {
  id: string
  restaurant_id: string
  supplier_id: string
  supplier_name?: string
  status: PurchaseOrderStatus
  order_date: string
  received_date?: string
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
  ordered_items: PurchaseOrderLine[]
}

export interface CreatePurchaseOrderPayload {
  supplier_id: string
  ordered_items: {
    inventory_item_id: string
    quantity: number
    unit_price: number
  }[]
  notes?: string
  status?: PurchaseOrderStatus
}

export async function getPurchaseOrders(token: string): Promise<PurchaseOrder[]> {
  const response = await axios.get<PurchaseOrder[]>(`${API_BASE}/inventory/purchase-orders`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function getPurchaseOrderById(id: string, token: string): Promise<PurchaseOrder> {
  const response = await axios.get<PurchaseOrder>(`${API_BASE}/inventory/purchase-orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function createPurchaseOrder(payload: CreatePurchaseOrderPayload, token: string): Promise<PurchaseOrder> {
  const response = await axios.post<PurchaseOrder>(
    `${API_BASE}/inventory/purchase-orders`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus,
  token: string
): Promise<PurchaseOrder> {
  const response = await axios.put<PurchaseOrder>(
    `${API_BASE}/inventory/purchase-orders/${id}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data
}

export async function deletePurchaseOrder(id: string, token: string): Promise<void> {
  await axios.delete(`${API_BASE}/inventory/purchase-orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
