import axios from 'axios'
import { API_BASE } from '../config'

export interface SalesForecast {
  todayRevenue: number
  yesterdayRevenue: number
  weeklyRevenue: number
  predictedTomorrowRevenue: number
  predictedWeeklyRevenue: number
  revenueTrend: string | null
}

export interface InventoryForecastItem {
  item: string
  daysRemaining: number
  risk: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface MenuInsights {
  bestSeller: {
    name: string
    quantitySold: number
    revenue: number
  } | null
  worstSeller: {
    name: string
    quantitySold: number
    revenue: number
  } | null
  highestRevenueItem: {
    name: string
    quantitySold: number
    revenue: number
  } | null
  totalQuantitySold: number
  peakSalesPeriod: string | null
}

export interface Recommendation {
  recommendation: string
  reason: string
}

export interface HealthScoreResponse {
  score: number
  status: string
}

function getAuthHeader(token?: string) {
  if (!token) throw new Error('Token is required')
  return { Authorization: `Bearer ${token}` }
}

export async function fetchSalesForecast(token: string): Promise<SalesForecast> {
  const res = await axios.get<SalesForecast>(`${API_BASE}/ai/sales-forecast`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

export async function fetchInventoryForecast(token: string): Promise<InventoryForecastItem[]> {
  const res = await axios.get<InventoryForecastItem[]>(`${API_BASE}/ai/inventory-forecast`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

export async function fetchMenuInsights(token: string): Promise<MenuInsights> {
  const res = await axios.get<MenuInsights>(`${API_BASE}/ai/menu-insights`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

export async function fetchRecommendations(token: string): Promise<Recommendation[]> {
  const res = await axios.get<Recommendation[]>(`${API_BASE}/ai/recommendations`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

export async function fetchHealthScore(token: string): Promise<HealthScoreResponse> {
  const res = await axios.get<HealthScoreResponse>(`${API_BASE}/ai/health-score`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

export async function sendAiChatMessage(message: string, history: any[], token: string): Promise<string> {
  const res = await axios.post<{ response: string }>(
    `${API_BASE}/ai/chat`,
    { message, history },
    { headers: getAuthHeader(token) }
  )
  return res.data.response
}

export async function fetchAiSummary(token: string): Promise<string> {
  const res = await axios.get<{ summary: string }>(`${API_BASE}/ai/summary`, {
    headers: getAuthHeader(token),
  })
  return res.data.summary
}

export async function fetchAiReport(token: string): Promise<any> {
  const res = await axios.get<any>(`${API_BASE}/ai/report`, {
    headers: getAuthHeader(token),
  })
  return res.data
}

