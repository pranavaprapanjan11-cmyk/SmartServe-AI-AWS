import axios from 'axios';
import { API_BASE } from '../config';

export interface RevenueMetrics {
  today: number;
  week: number;
  month: number;
  total: number;
}

export interface OrdersMetrics {
  today: number;
  completed: number;
  pending: number;
  cancelled: number;
  total: number;
  averageOrderValue: number;
}

export interface MenuItemMetrics {
  id: string;
  name: string;
  sold: number;
  revenue: number;
}

export interface KitchenMetrics {
  averagePrepTimeMinutes: number;
  delayedOrders: number;
}

export interface InventoryMetrics {
  lowStockItems: number;
  inventoryAlerts: number;
  totalItems: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface OrderTrendPoint {
  label: string;
  count: number;
}

export interface InventoryHealthPoint {
  label: string;
  value: number;
}

export interface HealthScore {
  score: number;
  label: string;
  grade: string;
  revenueScore: number;
  fulfillmentScore: number;
  inventoryScore: number;
}

export interface TableRevenuePoint {
  tableNumber: number;
  revenue: number;
}

export interface SectionRevenuePoint {
  section: string;
  revenue: number;
}

export interface TableTurnoverPoint {
  tableNumber: number;
  avgDuration: number;
}

export interface WaiterPerformancePoint {
  waiterName: string;
  ordersCount: number;
  revenue: number;
  avgServiceDuration: number;
  tablesServed: number;
}

export interface TableAnalytics {
  revenueByTable: TableRevenuePoint[];
  revenueBySection: SectionRevenuePoint[];
  dailyOccupancyPercent: number;
  peakOccupancy: number;
  avgOccupancyDuration: number;
  avgTurnoverTime: number;
  fastestTurnoverTable: TableTurnoverPoint | null;
  slowestTurnoverTable: TableTurnoverPoint | null;
  avgGuestCount: number;
  mostFrequentlyUsedTable: { tableNumber: number; orderCount: number } | null;
  waiterPerformance: WaiterPerformancePoint[];
}

export interface CategoryPerformancePoint {
  category: string;
  sold: number;
  revenue: number;
}

export interface AnalyticsDashboard {
  revenue: RevenueMetrics;
  orders: OrdersMetrics;
  menu: {
    topSellingItem: MenuItemMetrics | null;
    lowestSellingItem: MenuItemMetrics | null;
    highestRevenueItem: MenuItemMetrics | null;
  };
  kitchen: KitchenMetrics;
  inventory: InventoryMetrics;
  healthScore: HealthScore;
  revenueTrend: ChartPoint[];
  ordersTrend: OrderTrendPoint[];
  topSellingItems: MenuItemMetrics[];
  leastSellingItems: MenuItemMetrics[];
  categoryPerformance: CategoryPerformancePoint[];
  inventoryHealth: InventoryHealthPoint[];
  tableAnalytics?: TableAnalytics;
}

export async function fetchAnalyticsDashboard(token?: string): Promise<AnalyticsDashboard> {
  const t = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
  const url = `${API_BASE}/analytics/dashboard`;
  if (!t) {
    throw new Error('Token is required for analytics requests');
  }

  const response = await axios.get<AnalyticsDashboard>(url, {
    headers: { Authorization: `Bearer ${t}` },
  });
  return response.data;
}
