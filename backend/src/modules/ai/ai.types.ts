export interface SalesForecast {
  todayRevenue: number;
  yesterdayRevenue: number;
  weeklyRevenue: number;
  predictedTomorrowRevenue: number;
  predictedWeeklyRevenue: number;
  revenueTrend: string | null;
}

export interface InventoryForecastItem {
  item: string;
  daysRemaining: number;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MenuItemInsight {
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface MenuInsights {
  bestSeller: MenuItemInsight | null;
  worstSeller: MenuItemInsight | null;
  highestRevenueItem: MenuItemInsight | null;
  totalQuantitySold: number;
  peakSalesPeriod: string | null;
}

export interface Recommendation {
  recommendation: string;
  reason: string;
}

export interface HealthScoreResponse {
  score: number;
  status: string;
}
