// File: backend/src/modules/ai-operations/aiOperations.types.ts

export enum OperationalEventType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_SENT_TO_KITCHEN = 'ORDER_SENT_TO_KITCHEN',
  ORDER_PREPARING = 'ORDER_PREPARING',
  ORDER_READY = 'ORDER_READY',
  ORDER_SERVED = 'ORDER_SERVED',
  BILL_REQUESTED = 'BILL_REQUESTED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  ORDER_REFUNDED = 'ORDER_REFUNDED',

  TABLE_OCCUPIED = 'TABLE_OCCUPIED',
  TABLE_RESERVED = 'TABLE_RESERVED',
  TABLE_CLEANING = 'TABLE_CLEANING',
  TABLE_AVAILABLE = 'TABLE_AVAILABLE',

  STOCK_REDUCED = 'STOCK_REDUCED',
  LOW_STOCK = 'LOW_STOCK',
  STOCK_REFILLED = 'STOCK_REFILLED',

  INVOICE_GENERATED = 'INVOICE_GENERATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  SPLIT_PAYMENT = 'SPLIT_PAYMENT',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  RECEIPT_PRINTED = 'RECEIPT_PRINTED',

  WAITER_ASSIGNED = 'WAITER_ASSIGNED',
  WAITER_COMPLETED_SERVICE = 'WAITER_COMPLETED_SERVICE',
  CHEF_STARTED_ORDER = 'CHEF_STARTED_ORDER',
  CHEF_COMPLETED_ORDER = 'CHEF_COMPLETED_ORDER',
  AI_INSIGHT_GENERATED = 'AI_INSIGHT_GENERATED',
}

export interface ActivityEvent {
  id: string;
  restaurant_id: string;
  event_type: OperationalEventType;
  description: string;
  payload: any;
  created_at: string;
}

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

export interface AiOperationsDashboardData {
  healthMonitor: HealthMonitor;
  realTimeWall: RealTimeOperationsWall;
  alerts: PriorityAlert[];
  heatmaps: OperationalHeatmaps;
  executiveSnapshot: ExecutiveSnapshot;
  recommendations: OperationalRecommendation[];
}
