import axios from 'axios'
import { API_BASE } from '../config'

export interface Supplier {
  id: string
  restaurant_id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierPayload {
  id?: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  is_active?: boolean
}

export async function getSuppliers(token: string): Promise<Supplier[]> {
  const response = await axios.get<Supplier[]>(`${API_BASE}/inventory/suppliers`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function getSupplierById(id: string, token: string): Promise<Supplier> {
  const response = await axios.get<Supplier>(`${API_BASE}/inventory/suppliers/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export async function saveSupplier(payload: SupplierPayload, token: string): Promise<Supplier> {
  if (payload.id) {
    const response = await axios.put<Supplier>(
      `${API_BASE}/inventory/suppliers/${payload.id}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  } else {
    const response = await axios.post<Supplier>(
      `${API_BASE}/inventory/suppliers`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  }
}

export async function deleteSupplier(id: string, token: string): Promise<void> {
  await axios.delete(`${API_BASE}/inventory/suppliers/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
