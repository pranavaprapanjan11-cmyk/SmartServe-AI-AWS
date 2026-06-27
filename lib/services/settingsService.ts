import axios from 'axios'
import { API_BASE } from '../config'

export interface RestaurantSettingsPayload {
  restaurant_name: string
  logo_url?: string
  address?: string
  contact_number?: string
  gst_number?: string
  branch_name?: string
  email?: string
  website?: string
  upi_id?: string
  tax_percent?: number
  currency?: string
  theme?: string
  compact_mode?: boolean
  high_contrast?: boolean
  animations_enabled?: boolean
}

export interface PrinterSettingsPayload {
  printer_name: string
  connection_type: 'USB' | 'Bluetooth' | 'Network'
  paper_width: string
  is_default: boolean
  status: string
  last_tested_at?: string
}

export async function fetchRestaurantSettings(token: string) {
  const res = await axios.get(`${API_BASE}/settings/restaurant`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function saveRestaurantSettings(token: string, payload: RestaurantSettingsPayload) {
  const res = await axios.put(`${API_BASE}/settings/restaurant`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function fetchPrinterSettings(token: string) {
  const res = await axios.get(`${API_BASE}/settings/printers`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function updatePrinterSettings(token: string, id: string, payload: PrinterSettingsPayload) {
  const res = await axios.put(`${API_BASE}/settings/printers/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function createPrinterSettings(token: string, payload: PrinterSettingsPayload) {
  const res = await axios.post(`${API_BASE}/settings/printers`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}
