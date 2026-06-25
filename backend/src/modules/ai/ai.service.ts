import { Pool } from 'pg';
import { getRestaurantId } from '../orders/orders.service';
import {
  HealthScoreResponse,
  InventoryForecastItem,
  MenuInsights,
  Recommendation,
  SalesForecast,
} from './ai.types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function safeNumber(value: any): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampScore(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)));
}

export async function getSalesForecast(userId: string, role: string): Promise<SalesForecast> {
  const restaurantId = await getRestaurantId(userId, role);

  const query = `
    SELECT
      series_day::date AS day,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE restaurant_id = $1 AND created_at::date = series_day) AS revenue,
      (SELECT COALESCE(COUNT(*), 0) FROM orders WHERE restaurant_id = $1 AND created_at::date = series_day) AS order_count
    FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day') AS series_day
    ORDER BY series_day
  `;

  const { rows } = await pool.query(query, [restaurantId]);
  const daily = rows.map((row: any) => ({
    day: row.day,
    revenue: safeNumber(row.revenue),
    orders: safeNumber(row.order_count),
  }));

  const todayRevenue = daily.length > 0 ? daily[daily.length - 1].revenue : 0;
  const yesterdayRevenue = daily.length > 1 ? daily[daily.length - 2].revenue : 0;
  const weeklyRevenue = daily.slice(-7).reduce((sum, row) => sum + row.revenue, 0);
  const recentDaily = daily.slice(-7).map((row) => row.revenue);
  const averageDailyRevenue = average(daily.slice(0, -1).map((row) => row.revenue));

  const predictedTomorrowRevenue = Math.max(0, averageDailyRevenue);
  const predictedWeeklyRevenue = Math.max(0, average(recentDaily) * 7);

  // Compare first 7 days vs last 7 days to calculate trend
  const firstWeekRevenue = daily.slice(0, 7).reduce((sum, row) => sum + row.revenue, 0);
  const secondWeekRevenue = daily.slice(7, 14).reduce((sum, row) => sum + row.revenue, 0);
  let revenueTrend = 'Stable';
  if (firstWeekRevenue > 0) {
    const change = ((secondWeekRevenue - firstWeekRevenue) / firstWeekRevenue) * 100;
    if (change > 5) {
      revenueTrend = `Increasing (+${change.toFixed(1)}%)`;
    } else if (change < -5) {
      revenueTrend = `Decreasing (${change.toFixed(1)}%)`;
    }
  } else if (secondWeekRevenue > 0) {
    revenueTrend = 'Increasing (New Sales Activity)';
  }

  return {
    todayRevenue,
    yesterdayRevenue,
    weeklyRevenue,
    predictedTomorrowRevenue: parseFloat(predictedTomorrowRevenue.toFixed(2)),
    predictedWeeklyRevenue: parseFloat(predictedWeeklyRevenue.toFixed(2)),
    revenueTrend,
  };
}

export async function getInventoryForecast(userId: string, role: string): Promise<InventoryForecastItem[]> {
  const restaurantId = await getRestaurantId(userId, role);

  const query = `
    SELECT
      ii.id,
      ii.name,
      ii.quantity_on_hand,
      ii.reorder_threshold,
      COALESCE(SUM(oi.quantity * mii.quantity_required), 0) AS total_used
    FROM inventory_items ii
    LEFT JOIN menu_item_ingredients mii ON mii.inventory_item_id = ii.id AND mii.restaurant_id = ii.restaurant_id
    LEFT JOIN order_items oi ON oi.menu_item_id = mii.menu_item_id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.restaurant_id = ii.restaurant_id AND o.created_at >= CURRENT_DATE - INTERVAL '13 days'
    WHERE ii.restaurant_id = $1
    GROUP BY ii.id, ii.name, ii.quantity_on_hand, ii.reorder_threshold
    ORDER BY ii.name ASC
  `;

  const { rows } = await pool.query(query, [restaurantId]);

  return rows.map((row: any) => {
    const quantityOnHand = safeNumber(row.quantity_on_hand);
    const totalUsed = safeNumber(row.total_used);
    const avgDailyUsage = totalUsed / 14;
    const daysRemaining = avgDailyUsage > 0 ? quantityOnHand / avgDailyUsage : 999;
    const roundedDays = Math.round(daysRemaining * 100) / 100;

    let risk: InventoryForecastItem['risk'] = 'LOW';
    if (quantityOnHand <= safeNumber(row.reorder_threshold) || roundedDays <= 3) {
      risk = 'HIGH';
    } else if (roundedDays <= 7) {
      risk = 'MEDIUM';
    }

    return {
      item: row.name,
      daysRemaining: Number(roundedDays.toFixed(2)),
      risk,
    };
  });
}

export async function getMenuInsights(userId: string, role: string): Promise<MenuInsights> {
  const restaurantId = await getRestaurantId(userId, role);

  const query = `
    SELECT
      mi.id,
      mi.name,
      COALESCE(SUM(oi.quantity), 0) AS quantity_sold,
      COALESCE(SUM(oi.subtotal), 0) AS revenue
    FROM menu_items mi
    LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
    WHERE mi.restaurant_id = $1
    GROUP BY mi.id, mi.name
    ORDER BY mi.name ASC
  `;

  const { rows } = await pool.query(query, [restaurantId]);
  const items = rows.map((row: any) => ({
    name: row.name,
    quantitySold: safeNumber(row.quantity_sold),
    revenue: safeNumber(row.revenue),
  }));

  const totalQuantitySold = items.reduce((sum, item) => sum + item.quantitySold, 0);
  const bestSeller = items.reduce<MenuInsights['bestSeller']>((best, item) => {
    if (!best || item.quantitySold > best.quantitySold) return item;
    return best;
  }, null as any);

  const worstSeller = items.reduce<MenuInsights['worstSeller']>((worst, item) => {
    if (!worst || item.quantitySold < worst.quantitySold) return item;
    return worst;
  }, null as any);

  const highestRevenueItem = items.reduce<MenuInsights['highestRevenueItem']>((highest, item) => {
    if (!highest || item.revenue > highest.revenue) return item;
    return highest;
  }, null as any);

  // Peak sales period calculation
  const peakHourRes = await pool.query(
    `SELECT EXTRACT(HOUR FROM created_at) AS hour, COUNT(*) AS count
     FROM orders
     WHERE restaurant_id = $1
     GROUP BY hour
     ORDER BY count DESC
     LIMIT 1`,
    [restaurantId]
  );
  let peakSalesPeriod = 'No Orders Logged';
  if (peakHourRes.rows.length > 0) {
    const hr = safeNumber(peakHourRes.rows[0].hour);
    const startStr = `${hr.toString().padStart(2, '0')}:00`;
    const endStr = `${((hr + 1) % 24).toString().padStart(2, '0')}:00`;
    peakSalesPeriod = `${startStr} - ${endStr}`;
  }

  return {
    bestSeller,
    worstSeller,
    highestRevenueItem,
    totalQuantitySold,
    peakSalesPeriod,
  };
}

export async function getRecommendations(userId: string, role: string): Promise<Recommendation[]> {
  const restaurantId = await getRestaurantId(userId, role);
  const [inventoryRows, menuInsights, salesForecast] = await Promise.all([
    pool.query(
      `SELECT name, quantity_on_hand, reorder_threshold FROM inventory_items WHERE restaurant_id = $1 ORDER BY name ASC`,
      [restaurantId]
    ),
    getMenuInsights(userId, role),
    getSalesForecast(userId, role),
  ]);

  const lowStockItems = inventoryRows.rows.filter((row: any) => safeNumber(row.quantity_on_hand) <= safeNumber(row.reorder_threshold));
  const recommendations: Recommendation[] = [];

  if (lowStockItems.length > 0) {
    const itemNames = lowStockItems.map((item: any) => item.name).slice(0, 3).join(', ');
    recommendations.push({
      recommendation: `Increase stock of ${itemNames}`,
      reason: 'Several inventory items are at or below their reorder threshold.',
    });
  }

  if (menuInsights.bestSeller && menuInsights.bestSeller.quantitySold > 0) {
    recommendations.push({
      recommendation: `Promote ${menuInsights.bestSeller.name}`,
      reason: `${menuInsights.bestSeller.name} is the highest selling item and can drive higher revenue when highlighted.`,
    });
  }

  if (menuInsights.worstSeller && menuInsights.totalQuantitySold > 0 && menuInsights.worstSeller.quantitySold < menuInsights.totalQuantitySold * 0.05) {
    recommendations.push({
      recommendation: `Promote ${menuInsights.worstSeller.name}`,
      reason: 'This menu item is selling below 5% of total volume and may benefit from a promotion.',
    });
  }

  if (salesForecast.predictedTomorrowRevenue > salesForecast.weeklyRevenue / 7 * 1.1) {
    recommendations.push({
      recommendation: 'Prepare for higher demand tomorrow',
      reason: 'Tomorrow’s sales forecast is above the weekly daily average.',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      recommendation: 'Monitor menu and stock levels weekly',
      reason: 'No urgent actions were identified; keep tracking sales and inventory trends.',
    });
  }

  return recommendations.slice(0, 5);
}

export async function getHealthScore(userId: string, role: string): Promise<HealthScoreResponse> {
  const restaurantId = await getRestaurantId(userId, role);

  const [salesForecast, ordersResult, inventoryResult, menuResult] = await Promise.all([
    getSalesForecast(userId, role),
    pool.query(
      `SELECT COUNT(*) AS total_orders FROM orders WHERE restaurant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 days'`,
      [restaurantId]
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE quantity_on_hand <= reorder_threshold) AS low_stock_items, COUNT(*) AS total_items FROM inventory_items WHERE restaurant_id = $1`,
      [restaurantId]
    ),
    pool.query(
      `SELECT 
         (SELECT COALESCE(COUNT(DISTINCT menu_item_id), 0) FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE mi.restaurant_id = $1) AS items_with_sales,
         (SELECT COALESCE(COUNT(*), 0) FROM menu_items WHERE restaurant_id = $1) AS total_items`,
      [restaurantId]
    ),
  ]);

  const totalOrders = safeNumber(ordersResult.rows[0]?.total_orders);
  const inventoryRow = inventoryResult.rows[0] || { low_stock_items: 0, total_items: 0 };
  const lowStockItems = safeNumber(inventoryRow.low_stock_items);
  const totalInventoryItems = safeNumber(inventoryRow.total_items) || 1;
  const menuRow = menuResult.rows[0] || { items_with_sales: 0, total_items: 0 };
  const itemsWithSales = safeNumber(menuRow.items_with_sales);
  const totalMenuItems = safeNumber(menuRow.total_items) || 1;

  const revenueScore = clampScore((salesForecast.weeklyRevenue / 5000) * 30, 30);
  const orderScore = clampScore((totalOrders / 50) * 25, 25);
  const inventoryScore = clampScore(((totalInventoryItems - lowStockItems) / totalInventoryItems) * 25, 25);
  const menuScore = clampScore((itemsWithSales / totalMenuItems) * 20, 20);

  const totalScore = revenueScore + orderScore + inventoryScore + menuScore;
  const normalizedScore = Math.round(Math.max(0, Math.min(100, totalScore)));
  let status = 'Critical';
  if (normalizedScore >= 90) status = 'Excellent';
  else if (normalizedScore >= 75) status = 'Healthy';
  else if (normalizedScore >= 60) status = 'Needs Attention';

  return { score: normalizedScore, status };
}

export async function getLiveContext(userId: string, role: string): Promise<any> {
  const restaurantId = await getRestaurantId(userId, role);

  const userWsRes = await pool.query(
    'SELECT workspace_id FROM users WHERE id = $1 LIMIT 1',
    [userId]
  );
  const workspaceId = userWsRes.rows[0]?.workspace_id;
  if (!workspaceId) {
    throw new Error('User does not belong to a workspace');
  }

  const [
    workspaceRes,
    ordersRes,
    paymentsRes,
    menuItemsRes,
    categoriesRes,
    inventoryRes,
    reservationsRes,
    employeesRes,
    tablesRes,
    crmRes,
    recentOrdersRes
  ] = await Promise.all([
    pool.query('SELECT id, workspace_code, workspace_name, owner_id FROM workspaces WHERE id = $1', [workspaceId]),
    pool.query('SELECT id, table_number, guest_count, status, total_amount, created_at FROM orders WHERE workspace_id = $1 AND created_at >= CURRENT_DATE', [workspaceId]),
    pool.query('SELECT id, amount, payment_method, status FROM payments WHERE workspace_id = $1 AND status = \'PAID\' AND created_at >= CURRENT_DATE', [workspaceId]),
    pool.query('SELECT id, name, price, is_available FROM menu_items WHERE workspace_id = $1', [workspaceId]),
    pool.query('SELECT id, name FROM menu_categories WHERE workspace_id = $1', [workspaceId]),
    pool.query('SELECT id, name, quantity_on_hand, reorder_threshold, unit FROM inventory_items WHERE workspace_id = $1', [workspaceId]),
    pool.query('SELECT id, guest_count, reservation_date, reservation_time, status, requested_table FROM reservations WHERE workspace_id = $1 AND reservation_date = CURRENT_DATE', [workspaceId]),
    pool.query('SELECT id, name, role, position FROM employees WHERE workspace_id = $1', [workspaceId]),
    pool.query('SELECT id, table_number, capacity, status FROM restaurant_tables WHERE workspace_id = $1', [workspaceId]),
    pool.query('SELECT id, name, email, reward_points FROM customers WHERE workspace_id = $1', [workspaceId]),
    pool.query(`
      SELECT o.id, o.table_number, o.guest_count, o.status, o.total_amount, o.created_at,
             (SELECT json_agg(json_build_object('name', mi.name, 'quantity', oi.quantity)) 
              FROM order_items oi 
              JOIN menu_items mi ON oi.menu_item_id = mi.id 
              WHERE oi.order_id = o.id) as items
      FROM orders o
      WHERE o.workspace_id = $1
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [workspaceId])
  ]);

  const workspace = workspaceRes.rows[0] || {};
  const todayOrders = ordersRes.rows;
  const todayRevenue = paymentsRes.rows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const menuItems = menuItemsRes.rows;
  const categories = categoriesRes.rows;
  const inventoryItems = inventoryRes.rows;
  const todayReservations = reservationsRes.rows;
  const employees = employeesRes.rows;
  const tables = tablesRes.rows;
  const customers = crmRes.rows;
  const recentOrders = recentOrdersRes.rows;

  const lowStockItems = inventoryItems.filter((i: any) => Number(i.quantity_on_hand) <= Number(i.reorder_threshold));
  const activeTables = tables.filter((t: any) => t.status === 'OCCUPIED');
  const pendingOrders = todayOrders.filter((o: any) => ['NEW', 'SENT_TO_KITCHEN', 'PREPARING'].includes(o.status));
  const kitchenQueue = todayOrders.filter((o: any) => ['SENT_TO_KITCHEN', 'PREPARING', 'READY'].includes(o.status));

  const metrics = {
    today_revenue: todayRevenue,
    today_orders_count: todayOrders.length,
    active_orders_count: pendingOrders.length,
    occupied_tables_count: activeTables.length,
    low_stock_items_count: lowStockItems.length,
    today_reservations_count: todayReservations.length,
    total_customers_count: customers.length,
    total_employees_count: employees.length
  };

  const now = new Date();

  return {
    workspace,
    current_date: now.toISOString().split('T')[0],
    current_time: now.toLocaleTimeString([], { hour12: false }),
    dashboard_metrics: metrics,
    orders: {
      today_orders_count: todayOrders.length,
      recent: recentOrders,
      pending: pendingOrders,
      kitchen_queue: kitchenQueue
    },
    revenue: {
      today: todayRevenue,
      payment_methods: paymentsRes.rows.reduce((acc: any, p: any) => {
        acc[p.payment_method] = (acc[p.payment_method] || 0) + parseFloat(p.amount || 0);
        return acc;
      }, {})
    },
    menu: {
      categories_count: categories.length,
      items_count: menuItems.length,
      categories: categories.map(c => c.name),
      items: menuItems.slice(0, 30)
    },
    inventory: {
      total_items_count: inventoryItems.length,
      low_stock: lowStockItems,
      all_items: inventoryItems.slice(0, 30)
    },
    reservations: {
      today: todayReservations
    },
    employees: employees,
    crm: {
      total_customers: customers.length,
      recent: customers.slice(0, 10)
    },
    active_tables: activeTables
  };
}

export async function getChatResponse(
  userId: string,
  role: string,
  message: string,
  history: any[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }

  const context = await getLiveContext(userId, role);

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch (e) {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    const systemInstruction = `
You are the SmartServe-AI Assistant, a highly skilled restaurant management and business analyst AI.
You have access to the current restaurant's live context data.

Strict Guidelines:
1. You must answer questions using ONLY the current workspace data provided in the context.
2. Never leak or expose another workspace's information.
3. If a question is about data not present in the context, tell the user that you don't have access to that information.
4. Keep responses highly professional, clean, structured, and use Markdown for formatting (bold text, bullet points, code blocks where appropriate).
5. Never invent or hallucinate metrics. If the revenue is 0, then it is 0.

Live Context:
${JSON.stringify(context, null, 2)}
`;

    const limitedHistory = history.slice(-10).map((h: any) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));

    const chat = model.startChat({
      history: limitedHistory,
    });

    const prompt = `${systemInstruction}\n\nUser Question: ${message}`;
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  } catch (err: any) {
    console.error('Gemini API call failed:', err);
    if (err?.status === 429 || err?.message?.includes('quota')) {
      return 'AI Assistant is temporarily unavailable: API quota exceeded. Please try again later.';
    }
    return 'AI Assistant is temporarily unavailable.';
  }
}

export async function getAiSummary(userId: string, role: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const context = await getLiveContext(userId, role);

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch (e) {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    const prompt = `
You are the SmartServe-AI Business Analyst. Generate a detailed "Daily Business Report" for this restaurant using ONLY the following live context data:

Context:
${JSON.stringify(context, null, 2)}

Requirements:
Generate a structured report in Markdown. Include sections for:
1. Executive Summary: High-level overview of today's performance.
2. Financials: Revenue totals and breakdown by payment method.
3. Operations: Orders count, active orders, and table occupancy.
4. Inventory Alert: Low stock items, reorder suggestions.
5. Reservation Summary: Today's guest reservations.
6. Employee & CRM: Active employee count, customer highlights.
7. AI Business Recommendations: 3-5 concrete, actionable tips based on this data.
8. Restaurant Health Score: Highlight a score from 0-100 and its rating (Excellent/Good/Needs Attention/Critical) and explain the rating.

Ensure the tone is analytical, professional, and clear.
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err: any) {
    console.error('Gemini summary generation failed:', err);
    return 'AI Summary generation is temporarily unavailable.';
  }
}

export async function getAiReport(userId: string, role: string): Promise<any> {
  const context = await getLiveContext(userId, role);
  const summaryMarkdown = await getAiSummary(userId, role);
  
  return {
    generated_at: new Date().toISOString(),
    metrics: context.dashboard_metrics,
    summary: summaryMarkdown
  };
}

