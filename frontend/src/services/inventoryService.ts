// Verified and connected to backend inventory items, recipes, suppliers, wastage, and reconciliations.
import axios from 'axios'
import { API_BASE } from '../config'

export interface InventoryItem {
  id: string
  restaurant_id: string
  name: string
  description?: string
  unit: string
  quantity_on_hand: number
  reorder_threshold: number
  is_active: boolean
  expiry_date?: string
  supplier_id?: string
  created_at: string
  updated_at: string
}

export interface CreateInventoryItemPayload {
  name: string
  description?: string
  unit: string
  quantity_on_hand: number
  reorder_threshold: number
  is_active?: boolean
}

export interface UpdateInventoryItemPayload extends Partial<CreateInventoryItemPayload> {}

export interface MenuItemRecipeLine {
  inventory_item_id: string
  quantity_required: number
}

export interface MenuItemRecipe {
  id: string
  menu_item_id: string
  inventory_item_id: string
  quantity_required: number
  inventory_item_name: string
  inventory_item_unit: string
}

function normalizeInventoryItem(raw: any): InventoryItem {
  return {
    ...raw,
    quantity_on_hand: typeof raw.quantity_on_hand === 'string' ? parseFloat(raw.quantity_on_hand) : raw.quantity_on_hand,
    reorder_threshold: typeof raw.reorder_threshold === 'string' ? parseFloat(raw.reorder_threshold) : raw.reorder_threshold,
  }
}

function normalizeRecipeLine(raw: any): MenuItemRecipe {
  return {
    ...raw,
    quantity_required: typeof raw.quantity_required === 'string' ? parseFloat(raw.quantity_required) : raw.quantity_required,
  }
}

export async function getInventoryItems(token: string): Promise<InventoryItem[]> {
  const response = await axios.get<InventoryItem[]>(`${API_BASE}/inventory`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data.map(normalizeInventoryItem)
}

export async function getInventoryItemById(id: string, token: string): Promise<InventoryItem> {
  const response = await axios.get<InventoryItem>(`${API_BASE}/inventory/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return normalizeInventoryItem(response.data)
}

export async function createInventoryItem(
  payload: CreateInventoryItemPayload,
  token: string
): Promise<InventoryItem> {
  const response = await axios.post<InventoryItem>(`${API_BASE}/inventory`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return normalizeInventoryItem(response.data)
}

export async function updateInventoryItem(
  id: string,
  payload: UpdateInventoryItemPayload,
  token: string
): Promise<InventoryItem> {
  const response = await axios.put<InventoryItem>(`${API_BASE}/inventory/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return normalizeInventoryItem(response.data)
}

export async function deleteInventoryItem(id: string, token: string): Promise<void> {
  await axios.delete(`${API_BASE}/inventory/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getLowStockItems(token: string): Promise<InventoryItem[]> {
  const response = await axios.get<InventoryItem[]>(`${API_BASE}/inventory/low-stock`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data.map(normalizeInventoryItem)
}

export async function getRecipeForMenuItem(menuItemId: string, token: string): Promise<MenuItemRecipe[]> {
  const response = await axios.get<MenuItemRecipe[]>(`${API_BASE}/inventory/recipes/menu-item/${menuItemId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data.map(normalizeRecipeLine)
}

export async function saveRecipeForMenuItem(
  menuItemId: string,
  recipe: MenuItemRecipeLine[],
  token: string
): Promise<MenuItemRecipe[]> {
  const response = await axios.post<MenuItemRecipe[]>(
    `${API_BASE}/inventory/recipes/menu-item/${menuItemId}`,
    { recipe },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data.map(normalizeRecipeLine)
}

export async function getInventoryForecast(token: string): Promise<any[]> {
  const response = await axios.get(`${API_BASE}/inventory/forecast`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function getWastageList(token: string): Promise<any[]> {
  const response = await axios.get(`${API_BASE}/inventory/wastage`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function createWastage(payload: any, token: string): Promise<any> {
  const response = await axios.post(`${API_BASE}/inventory/wastage`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function getWastageAnalytics(token: string): Promise<any> {
  const response = await axios.get(`${API_BASE}/inventory/wastage/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function remakeOrderItem(orderId: string, itemId: string, reason: string, token: string): Promise<any> {
  const response = await axios.post(
    `${API_BASE}/inventory/orders/${orderId}/items/${itemId}/remake`,
    { reason },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data
}

export async function getReconciliations(token: string): Promise<any[]> {
  const response = await axios.get(`${API_BASE}/inventory/reconciliations`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function getLatestReconciliation(token: string): Promise<any | null> {
  const response = await axios.get(`${API_BASE}/inventory/reconciliations/latest`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function submitReconciliation(payload: any, token: string): Promise<any> {
  const response = await axios.post(`${API_BASE}/inventory/reconciliations`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function getReconciliationAuditForm(token: string): Promise<any[]> {
  const response = await axios.get(`${API_BASE}/inventory/reconciliations/audit-form`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function getTransactions(token: string): Promise<any[]> {
  const response = await axios.get(`${API_BASE}/inventory/transactions`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}



