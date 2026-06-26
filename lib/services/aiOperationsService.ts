// File: frontend/src/services/aiOperationsService.ts
import axios from 'axios';
import { API_BASE } from '../config';

export interface CategoryScore {
  score: number;
  label: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
}

export interface HealthMonitor {
  overallScore: number;
  revenueHealth: CategoryScore;
  kitchenHealth: CategoryScore;
  billingHealth: CategoryScore;
  inventoryHealth: CategoryScore;
  tableUtilization: CategoryScore;
  staffPerformance: CategoryScore;
}

export interface RealTimeOperationsWall {
  tablesOccupied: number;
  tablesAvailable: number;
  tablesCleaning: number;
  ordersActive: number;
  ordersDelayed: number;
  kitchenLoadPercent: number;
  pendingBills: number;
  revenueToday: number;
}

export interface PriorityAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFORMATION';
  category: 'Inventory' | 'Billing' | 'Kitchen' | 'Tables' | 'System';
  message: string;
  timestamp: string;
}

export interface TableHeatmapPoint {
  tableNumber: number;
  usageCount: number;
  revenue: number;
  avgDurationMinutes: number;
}

export interface TimeHeatmapPoint {
  hourLabel: string;
  orderCount: number;
  revenue: number;
  avgPrepTimeMinutes: number;
}

export interface OperationalHeatmaps {
  tables: TableHeatmapPoint[];
  hours: TimeHeatmapPoint[];
}

export interface ExecutiveSnapshot {
  revenueToday: number;
  ordersToday: number;
  guestsServed: number;
  tableUtilizationPercent: number;
  inventoryAlertsCount: number;
  refundsTodayCount: number;
  refundsTodayAmount: number;
  summary: {
    bestPerformingWaiter: string;
    bestPerformingTable: number;
    mostPopularMenuItem: string;
    highestRevenueCategory: string;
  };
}

export interface OperationalRecommendation {
  id: string;
  recommendation: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ActivityEvent {
  id: string;
  restaurant_id: string;
  event_type: string;
  description: string;
  payload: any;
  created_at: string;
}

export interface AiOperationsDashboardData {
  healthMonitor: HealthMonitor;
  realTimeWall: RealTimeOperationsWall;
  alerts: PriorityAlert[];
  heatmaps: OperationalHeatmaps;
  executiveSnapshot: ExecutiveSnapshot;
  recommendations: OperationalRecommendation[];
}

function getAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchOperationsAnalytics(token: string): Promise<AiOperationsDashboardData> {
  const res = await axios.get<AiOperationsDashboardData>(`${API_BASE}/ai-operations/analytics`, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function fetchOperationsEvents(token: string): Promise<ActivityEvent[]> {
  const res = await axios.get<ActivityEvent[]>(`${API_BASE}/ai-operations/events`, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function logManualEvent(
  token: string,
  payload: { eventType: string; description: string; payload?: any }
): Promise<ActivityEvent> {
  const res = await axios.post<ActivityEvent>(`${API_BASE}/ai-operations/events`, payload, {
    headers: getAuthHeader(token),
  });
  return res.data;
}
