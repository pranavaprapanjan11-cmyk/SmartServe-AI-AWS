import { Pool } from 'pg';
import { getRestaurantId } from '../orders/orders.service';
import {
  AnalyticsDashboard,
  ChartPoint,
  HealthScore,
  InventoryHealthPoint,
  MenuItemMetrics,
} from './analytics.types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function safeNumber(value: any): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function getHealthScore(score: number): { score: number; label: string; grade: string } {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped >= 95) {
    return { score: clamped, label: 'Excellent', grade: 'Excellent' };
  }
  if (clamped >= 80) {
    return { score: clamped, label: 'Good', grade: 'Good' };
  }
  if (clamped >= 60) {
    return { score: clamped, label: 'Needs Attention', grade: 'Needs Attention' };
  }
  return { score: clamped, label: 'Critical', grade: 'Critical' };
}

export async function getAnalyticsDashboard(userId: string, role: string): Promise<AnalyticsDashboard> {
  const restaurantId = await getRestaurantId(userId, role);

  const revenueResult = await pool.query(
    `SELECT
      COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS today,
      COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'), 0) AS week,
      COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0) AS month,
      COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE restaurant_id = $1`,
    [restaurantId]
  );

  const ordersResult = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS today,
      COUNT(*) FILTER (WHERE status IN ('SERVED','PAID')) AS completed,
      COUNT(*) FILTER (WHERE status IN ('NEW','SENT_TO_KITCHEN','PREPARING','READY')) AS pending,
      COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled,
      COUNT(*) AS total,
      COALESCE(AVG(total_amount), 0) AS average_order_value
    FROM orders
    WHERE restaurant_id = $1`,
    [restaurantId]
  );

  const menuRows = await pool.query(
    `SELECT mi.id, mi.name,
      COALESCE(SUM(oi.quantity), 0) AS sold,
      COALESCE(SUM(oi.subtotal), 0) AS revenue
    FROM menu_items mi
    LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
    WHERE mi.restaurant_id = $1
    GROUP BY mi.id, mi.name`,
    [restaurantId]
  );

  const kitchenResult = await pool.query(
    `SELECT
      COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60), 0) AS average_prep_time_minutes,
      COALESCE(COUNT(*) FILTER (WHERE status = 'PREPARING' AND created_at < NOW() - INTERVAL '20 minutes'), 0) AS delayed_orders
    FROM orders
    WHERE restaurant_id = $1
      AND status IN ('PREPARING','READY','SERVED','PAID')`,
    [restaurantId]
  );

  const inventoryResult = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE quantity_on_hand <= reorder_threshold) AS low_stock_items,
      COUNT(*) AS total_items
    FROM inventory_items
    WHERE restaurant_id = $1`,
    [restaurantId]
  );

  const alertResult = await pool.query(
    `SELECT COUNT(*) AS inventory_alerts
    FROM inventory_alerts
    WHERE restaurant_id = $1
      AND is_active = true`,
    [restaurantId]
  );

  const revenueTrendRows = await pool.query(
    `SELECT to_char(day, 'Dy') AS label,
      COALESCE(SUM(p.amount), 0) AS value
    FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS day
    LEFT JOIN payments p ON p.restaurant_id = $1 AND p.created_at::date = day
    GROUP BY day
    ORDER BY day`,
    [restaurantId]
  );

  const ordersTrendRows = await pool.query(
    `SELECT to_char(day, 'Dy') AS label,
      COALESCE(COUNT(o.*), 0) AS count
    FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS day
    LEFT JOIN orders o ON o.restaurant_id = $1 AND o.created_at::date = day
    GROUP BY day
    ORDER BY day`,
    [restaurantId]
  );

  const topItemRows = await pool.query(
    `SELECT mi.id, mi.name,
      COALESCE(SUM(oi.quantity), 0) AS sold,
      COALESCE(SUM(oi.subtotal), 0) AS revenue
    FROM menu_items mi
    LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
    WHERE mi.restaurant_id = $1
    GROUP BY mi.id, mi.name
    ORDER BY COALESCE(SUM(oi.quantity), 0) DESC NULLS LAST
    LIMIT 5`,
    [restaurantId]
  );

  const leastItemRows = await pool.query(
    `SELECT mi.id, mi.name,
      COALESCE(SUM(oi.quantity), 0) AS sold,
      COALESCE(SUM(oi.subtotal), 0) AS revenue
    FROM menu_items mi
    LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
    WHERE mi.restaurant_id = $1
    GROUP BY mi.id, mi.name
    ORDER BY COALESCE(SUM(oi.quantity), 0) ASC NULLS FIRST
    LIMIT 5`,
    [restaurantId]
  );

  const categoryPerfRows = await pool.query(
    `SELECT mc.name AS category,
      COALESCE(SUM(oi.quantity), 0) AS sold,
      COALESCE(SUM(oi.subtotal), 0) AS revenue
    FROM menu_categories mc
    LEFT JOIN menu_items mi ON mi.category_id = mc.id
    LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
    WHERE mc.restaurant_id = $1
    GROUP BY mc.id, mc.name
    ORDER BY revenue DESC`,
    [restaurantId]
  );

  const orderRow = ordersResult.rows[0] || {};
  const revenueRow = revenueResult.rows[0] || {};
  const kitchenRow = kitchenResult.rows[0] || {};
  const inventoryRow = inventoryResult.rows[0] || {};
  const alertRow = alertResult.rows[0] || {};

  const revenue = {
    today: safeNumber(revenueRow.today),
    week: safeNumber(revenueRow.week),
    month: safeNumber(revenueRow.month),
    total: safeNumber(revenueRow.total),
  };

  const orders = {
    today: safeNumber(orderRow.today),
    completed: safeNumber(orderRow.completed),
    pending: safeNumber(orderRow.pending),
    cancelled: safeNumber(orderRow.cancelled),
    total: safeNumber(orderRow.total),
    averageOrderValue: safeNumber(orderRow.average_order_value),
  };

  const menuItems: MenuItemMetrics[] = menuRows.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    sold: safeNumber(row.sold),
    revenue: safeNumber(row.revenue),
  }));

  const sortedBySold = [...menuItems].sort((a, b) => b.sold - a.sold || b.name.localeCompare(a.name));
  const sortedByRevenue = [...menuItems].sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
  const lowestSelling = [...menuItems].sort((a, b) => a.sold - b.sold || a.name.localeCompare(b.name));

  const kitchen = {
    averagePrepTimeMinutes: safeNumber(kitchenRow.average_prep_time_minutes),
    delayedOrders: safeNumber(kitchenRow.delayed_orders),
  };

  const totalItems = safeNumber(inventoryRow.total_items);
  const lowStockItems = safeNumber(inventoryRow.low_stock_items);
  const inventory = {
    lowStockItems,
    inventoryAlerts: safeNumber(alertRow.inventory_alerts),
    totalItems,
  };

  const weekRevenue = revenue.week;
  const totalOrders = orders.completed + orders.pending + orders.cancelled;
  const completedRatio = totalOrders > 0 ? orders.completed / totalOrders : 0.5;
  const kitchenHealthRatio = orders.completed + kitchen.delayedOrders > 0 ? 1 - kitchen.delayedOrders / (orders.completed + kitchen.delayedOrders) : 0.5;
  const inventoryHealthRatio = totalItems > 0 ? 1 - lowStockItems / totalItems : 0.5;
  const revenueHealthRatio = Math.min(1, weekRevenue / 5000);

  const revenueScore = Math.min(25, Math.round(revenueHealthRatio * 25));
  const ordersScore = Math.min(25, Math.round(completedRatio * 25));
  const kitchenScore = Math.min(25, Math.round(kitchenHealthRatio * 25));
  const inventoryScore = Math.min(25, Math.round(inventoryHealthRatio * 25));

  const healthScore = {
    ...getHealthScore(revenueScore + ordersScore + kitchenScore + inventoryScore),
    revenueScore: Math.min(100, Math.round(revenueHealthRatio * 100)),
    fulfillmentScore: Math.min(100, Math.round(completedRatio * 100)),
    inventoryScore: Math.min(100, Math.round(inventoryHealthRatio * 100)),
  };

  // Fetch Table Revenue by Table
  const revenueByTableRes = await pool.query(
    `SELECT COALESCE(o.table_number, 0) as table_number, COALESCE(SUM(o.total_amount), 0) as revenue
     FROM orders o
     WHERE o.restaurant_id = $1 AND o.status = 'PAID'
     GROUP BY o.table_number
     ORDER BY revenue DESC`,
    [restaurantId]
  );

  // Fetch Table Revenue by Section
  const revenueBySectionRes = await pool.query(
    `SELECT COALESCE(t.section, 'Main Hall') as section, COALESCE(SUM(o.total_amount), 0) as revenue
     FROM orders o
     LEFT JOIN restaurant_tables t ON o.table_id = t.id OR (o.table_number = t.table_number AND o.restaurant_id = t.restaurant_id)
     WHERE o.restaurant_id = $1 AND o.status = 'PAID'
     GROUP BY t.section
     ORDER BY revenue DESC`,
    [restaurantId]
  );

  // Fetch Average Turnover / Duration
  const turnoverRes = await pool.query(
    `SELECT 
       COALESCE(AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60), 0) as avg_turnover_minutes
     FROM orders o
     WHERE o.restaurant_id = $1 AND o.status = 'PAID'`,
    [restaurantId]
  );

  // Fetch Table Turnover ranking (Fastest / Slowest)
  const turnoverRankingRes = await pool.query(
    `SELECT 
       o.table_number,
       COALESCE(AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60), 0) as avg_duration
     FROM orders o
     WHERE o.restaurant_id = $1 AND o.status = 'PAID'
     GROUP BY o.table_number
     ORDER BY avg_duration ASC`,
    [restaurantId]
  );

  // Fetch Guest metrics
  const guestAndFreqRes = await pool.query(
    `SELECT 
       COALESCE(AVG(o.guest_count), 0) as avg_guest_count,
       o.table_number,
       COUNT(*) as order_count
     FROM orders o
     WHERE o.restaurant_id = $1
     GROUP BY o.table_number
     ORDER BY order_count DESC`,
    [restaurantId]
  );

  // Fetch Current Occupancy stats
  const occupiedRes = await pool.query(
    `SELECT 
       COUNT(*) FILTER (WHERE status = 'OCCUPIED') as occupied,
       COUNT(*) as total
     FROM restaurant_tables
     WHERE restaurant_id = $1`,
    [restaurantId]
  );

  // Fetch Waiter Performance stats
  const waiterPerfRes = await pool.query(
    `SELECT 
       u.name as waiter_name,
       COUNT(o.id) as orders_count,
       COALESCE(SUM(o.total_amount), 0) as revenue,
       COALESCE(AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60), 0) as avg_service_duration,
       COUNT(DISTINCT o.table_number) as tables_served
     FROM orders o
     JOIN users u ON o.waiter_id = u.id
     WHERE o.restaurant_id = $1
     GROUP BY u.name
     ORDER BY revenue DESC`,
    [restaurantId]
  );

  const occupiedCount = safeNumber(occupiedRes.rows[0]?.occupied || 0);
  const totalTables = safeNumber(occupiedRes.rows[0]?.total || 0);
  const dailyOccupancyPercent = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0;
  const peakOccupancy = totalTables > 0 ? Math.max(occupiedCount, Math.round(totalTables * 0.75)) : 0;
  
  const avgTurnover = Math.round(safeNumber(turnoverRes.rows[0]?.avg_turnover_minutes || 0));

  const rankingRows = turnoverRankingRes.rows;
  const fastestTurnoverTable = rankingRows.length > 0 ? {
    tableNumber: safeNumber(rankingRows[0].table_number),
    avgDuration: Math.round(safeNumber(rankingRows[0].avg_duration))
  } : null;
  const slowestTurnoverTable = rankingRows.length > 1 ? {
    tableNumber: safeNumber(rankingRows[rankingRows.length - 1].table_number),
    avgDuration: Math.round(safeNumber(rankingRows[rankingRows.length - 1].avg_duration))
  } : (rankingRows.length === 1 ? {
    tableNumber: safeNumber(rankingRows[0].table_number),
    avgDuration: Math.round(safeNumber(rankingRows[0].avg_duration))
  } : null);

  let totalGuests = 0;
  let totalOrderCounts = 0;
  guestAndFreqRes.rows.forEach(r => {
    totalGuests += safeNumber(r.avg_guest_count) * safeNumber(r.order_count);
    totalOrderCounts += safeNumber(r.order_count);
  });
  const avgGuestCount = totalOrderCounts > 0 ? parseFloat((totalGuests / totalOrderCounts).toFixed(1)) : 0;
  const mostUsed = guestAndFreqRes.rows[0];
  const mostFrequentlyUsedTable = mostUsed ? {
    tableNumber: safeNumber(mostUsed.table_number),
    orderCount: safeNumber(mostUsed.order_count)
  } : null;

  const tableAnalytics = {
    revenueByTable: revenueByTableRes.rows.map((r: any) => ({
      tableNumber: safeNumber(r.table_number),
      revenue: safeNumber(r.revenue)
    })),
    revenueBySection: revenueBySectionRes.rows.map((r: any) => ({
      section: r.section,
      revenue: safeNumber(r.revenue)
    })),
    dailyOccupancyPercent,
    peakOccupancy,
    avgOccupancyDuration: avgTurnover,
    avgTurnoverTime: avgTurnover,
    fastestTurnoverTable,
    slowestTurnoverTable,
    avgGuestCount,
    mostFrequentlyUsedTable,
    waiterPerformance: waiterPerfRes.rows.map((r: any) => ({
      waiterName: r.waiter_name,
      ordersCount: safeNumber(r.orders_count),
      revenue: safeNumber(r.revenue),
      avgServiceDuration: Math.round(safeNumber(r.avg_service_duration)),
      tablesServed: safeNumber(r.tables_served)
    }))
  };

  return {
    revenue,
    orders,
    menu: {
      topSellingItem: sortedBySold[0] ?? null,
      lowestSellingItem: lowestSelling[0] ?? null,
      highestRevenueItem: sortedByRevenue[0] ?? null,
    },
    kitchen,
    inventory,
    healthScore,
    revenueTrend: revenueTrendRows.rows.map((row: any) => ({ label: row.label, value: safeNumber(row.value) })),
    ordersTrend: ordersTrendRows.rows.map((row: any) => ({ label: row.label, count: safeNumber(row.count) })),
    topSellingItems: topItemRows.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      sold: safeNumber(row.sold),
      revenue: safeNumber(row.revenue),
    })),
    leastSellingItems: leastItemRows.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      sold: safeNumber(row.sold),
      revenue: safeNumber(row.revenue),
    })),
    categoryPerformance: categoryPerfRows.rows.map((row: any) => ({
      category: row.category,
      sold: safeNumber(row.sold),
      revenue: safeNumber(row.revenue),
    })),
    inventoryHealth: [
      { label: 'Low Stock', value: lowStockItems },
      { label: 'Healthy Stock', value: Math.max(0, totalItems - lowStockItems) },
    ],
    tableAnalytics,
  };
}
