// File: backend/src/modules/menu/menu.service.ts
// Service layer for menu operations: database queries and business logic

import { pool } from '../../database';
import {
  MenuItem,
  MenuCategory,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  CreateMenuCategoryPayload,
  MenuItemWithAnalytics,
  MenuStats,
  MenuItemAnalytics,
} from './menu.types';



// ==================== MENU CATEGORIES ====================

export async function createMenuCategory(
  restaurantId: string,
  payload: CreateMenuCategoryPayload
): Promise<MenuCategory> {
  const sql = `
    INSERT INTO menu_categories (restaurant_id, name, description, color_code, icon_emoji, display_order)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const { rows } = await pool.query(sql, [
    restaurantId,
    payload.name,
    payload.description || null,
    payload.color_code || null,
    payload.icon_emoji || null,
    payload.display_order || 0,
  ]);

  const category = rows[0] as MenuCategory;
  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'menuUpdated');
  } catch (err) {
    console.error('Failed to dispatch menu update notification:', err);
  }
  return category;
}

export async function getCategories(restaurantId: string): Promise<MenuCategory[]> {
  const sql = `
    SELECT * FROM menu_categories
    WHERE restaurant_id = $1 AND is_active = true
    ORDER BY display_order ASC, created_at ASC
  `;

  const { rows } = await pool.query(sql, [restaurantId]);
  return rows as MenuCategory[];
}

// ==================== MENU ITEMS ====================

export async function createMenuItem(
  restaurantId: string,
  payload: CreateMenuItemPayload
): Promise<MenuItemWithAnalytics> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify category exists and belongs to restaurant
    const categoryCheck = await client.query(
      'SELECT id FROM menu_categories WHERE id = $1 AND restaurant_id = $2',
      [payload.category_id, restaurantId]
    );

    if (categoryCheck.rows.length === 0) {
      throw new Error('Category not found or unauthorized');
    }

    const itemSql = `
      INSERT INTO menu_items 
      (restaurant_id, category_id, name, description, price, image_url, is_available, is_bestseller, preparation_time, spice_level, dietary_info, calories, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const { rows: itemRows } = await client.query(itemSql, [
      restaurantId,
      payload.category_id,
      payload.name,
      payload.description || null,
      payload.price,
      payload.image_url || null,
      payload.is_available ?? true,
      payload.is_bestseller ?? false,
      payload.preparation_time || null,
      payload.spice_level || null,
      payload.dietary_info || null,
      payload.calories || null,
      payload.tags || null,
    ]);

    const menuItem = itemRows[0];

    // Create analytics record
    const analyticsSql = `
      INSERT INTO menu_item_analytics (menu_item_id, orders_count, revenue, rating)
      VALUES ($1, 0, 0, 0)
      RETURNING *
    `;

    const { rows: analyticsRows } = await client.query(analyticsSql, [menuItem.id]);

    await client.query('COMMIT');

    try {
      const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
      notifyWorkspaceByRestaurantId(restaurantId, 'menuUpdated');
    } catch (err) {
      console.error('Failed to dispatch menu update notification:', err);
    }

    return {
      ...menuItem,
      analytics: analyticsRows[0] as MenuItemAnalytics,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getMenuItems(restaurantId: string): Promise<MenuItemWithAnalytics[]> {
  const sql = `
    SELECT 
      mi.*,
      json_build_object(
        'id', mia.id,
        'menu_item_id', mia.menu_item_id,
        'orders_count', mia.orders_count,
        'revenue', mia.revenue,
        'rating', mia.rating,
        'last_ordered_at', mia.last_ordered_at
      ) as analytics
    FROM menu_items mi
    LEFT JOIN menu_item_analytics mia ON mi.id = mia.menu_item_id
    WHERE mi.restaurant_id = $1
    ORDER BY mi.created_at DESC
  `;

  const { rows } = await pool.query(sql, [restaurantId]);
  return rows.map((row: any) => ({
    ...row,
    analytics: row.analytics,
  })) as MenuItemWithAnalytics[];
}

export async function getMenuItemById(
  restaurantId: string,
  itemId: string
): Promise<MenuItemWithAnalytics | null> {
  const sql = `
    SELECT 
      mi.*,
      json_build_object(
        'id', mia.id,
        'menu_item_id', mia.menu_item_id,
        'orders_count', mia.orders_count,
        'revenue', mia.revenue,
        'rating', mia.rating,
        'last_ordered_at', mia.last_ordered_at
      ) as analytics
    FROM menu_items mi
    LEFT JOIN menu_item_analytics mia ON mi.id = mia.menu_item_id
    WHERE mi.id = $1 AND mi.restaurant_id = $2
    LIMIT 1
  `;

  const { rows } = await pool.query(sql, [itemId, restaurantId]);
  return rows[0] ? (rows[0] as MenuItemWithAnalytics) : null;
}

export async function updateMenuItem(
  restaurantId: string,
  itemId: string,
  payload: UpdateMenuItemPayload
): Promise<MenuItemWithAnalytics> {
  // Verify item exists
  const existing = await getMenuItemById(restaurantId, itemId);
  if (!existing) throw new Error('Menu item not found');

  // Verify category if updating
  if (payload.category_id) {
    const categoryCheck = await pool.query(
      'SELECT id FROM menu_categories WHERE id = $1 AND restaurant_id = $2',
      [payload.category_id, restaurantId]
    );
    if (categoryCheck.rows.length === 0) {
      throw new Error('Category not found or unauthorized');
    }
  }

  const updates: string[] = [];
  const values: any[] = [itemId, restaurantId];
  let paramCount = 2;

  const mappings: { [key in keyof UpdateMenuItemPayload]: string } = {
    category_id: 'category_id',
    name: 'name',
    description: 'description',
    price: 'price',
    image_url: 'image_url',
    is_available: 'is_available',
    is_bestseller: 'is_bestseller',
    preparation_time: 'preparation_time',
    spice_level: 'spice_level',
    dietary_info: 'dietary_info',
    calories: 'calories',
    tags: 'tags',
  };

  for (const [key, dbColumn] of Object.entries(mappings)) {
    if (key in payload && payload[key as keyof UpdateMenuItemPayload] !== undefined) {
      updates.push(`${dbColumn} = $${++paramCount}`);
      values.push(payload[key as keyof UpdateMenuItemPayload]);
    }
  }

  if (updates.length === 0) throw new Error('No valid fields to update');

  updates.push('updated_at = NOW()');

  const sql = `
    UPDATE menu_items
    SET ${updates.join(', ')}
    WHERE id = $1 AND restaurant_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(sql, values);
  const updated = rows[0];

  const analytics = await pool.query(
    'SELECT * FROM menu_item_analytics WHERE menu_item_id = $1',
    [itemId]
  );

  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'menuUpdated');
  } catch (err) {
    console.error('Failed to dispatch menu update notification:', err);
  }

  return {
    ...updated,
    analytics: analytics.rows[0],
  } as MenuItemWithAnalytics;
}

export async function deleteMenuItem(restaurantId: string, itemId: string): Promise<void> {
  const sql = `DELETE FROM menu_items WHERE id = $1 AND restaurant_id = $2`;
  const result = await pool.query(sql, [itemId, restaurantId]);

  if (result.rowCount === 0) {
    throw new Error('Menu item not found');
  }

  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'menuUpdated');
  } catch (err) {
    console.error('Failed to dispatch menu update notification:', err);
  }
}

export async function toggleMenuItemAvailability(
  restaurantId: string,
  itemId: string,
  isAvailable: boolean
): Promise<MenuItem> {
  const sql = `
    UPDATE menu_items
    SET is_available = $1, updated_at = NOW()
    WHERE id = $2 AND restaurant_id = $3
    RETURNING *
  `;

  const { rows } = await pool.query(sql, [isAvailable, itemId, restaurantId]);

  if (rows.length === 0) {
    throw new Error('Menu item not found');
  }

  try {
    const { notifyWorkspaceByRestaurantId } = require('../workspace/workspace.sse');
    notifyWorkspaceByRestaurantId(restaurantId, 'menuUpdated');
  } catch (err) {
    console.error('Failed to dispatch menu update notification:', err);
  }

  return rows[0] as MenuItem;
}

// ==================== MENU STATISTICS ====================

export async function getMenuStats(restaurantId: string): Promise<MenuStats> {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM menu_items WHERE restaurant_id = $1) as total_items,
      (SELECT COUNT(*) FROM menu_items WHERE restaurant_id = $1 AND is_available = true) as available_items,
      (SELECT COUNT(*) FROM menu_categories WHERE restaurant_id = $1 AND is_active = true) as categories_count,
      (SELECT COALESCE(AVG(price), 0) FROM menu_items WHERE restaurant_id = $1) as average_price,
      (SELECT COUNT(*) FROM menu_items WHERE restaurant_id = $1 AND is_bestseller = true) as bestsellers_count,
      (SELECT COALESCE(SUM(revenue), 0) FROM menu_item_analytics mia
       INNER JOIN menu_items mi ON mia.menu_item_id = mi.id
       WHERE mi.restaurant_id = $1) as total_revenue
  `;

  const { rows } = await pool.query(sql, [restaurantId]);
  const stats = rows[0];

  // Get highest rated item
  const topItemSql = `
    SELECT mi.* FROM menu_items mi
    INNER JOIN menu_item_analytics mia ON mi.id = mia.menu_item_id
    WHERE mi.restaurant_id = $1
    ORDER BY mia.rating DESC, mia.orders_count DESC
    LIMIT 1
  `;

  const { rows: topItemRows } = await pool.query(topItemSql, [restaurantId]);

  return {
    total_items: parseInt(stats.total_items) || 0,
    available_items: parseInt(stats.available_items) || 0,
    categories_count: parseInt(stats.categories_count) || 0,
    average_price: parseFloat(stats.average_price) || 0,
    bestsellers_count: parseInt(stats.bestsellers_count) || 0,
    total_revenue: parseFloat(stats.total_revenue) || 0,
    highest_rated_item: topItemRows[0],
  } as MenuStats;
}

export async function searchMenuItems(
  restaurantId: string,
  query: string,
  categoryId?: string
): Promise<MenuItemWithAnalytics[]> {
  let sql = `
    SELECT 
      mi.*,
      json_build_object(
        'id', mia.id,
        'menu_item_id', mia.menu_item_id,
        'orders_count', mia.orders_count,
        'revenue', mia.revenue,
        'rating', mia.rating,
        'last_ordered_at', mia.last_ordered_at
      ) as analytics
    FROM menu_items mi
    LEFT JOIN menu_item_analytics mia ON mi.id = mia.menu_item_id
    WHERE mi.restaurant_id = $1 AND (
      mi.name ILIKE $2 OR 
      mi.description ILIKE $2 OR 
      mi.tags ILIKE $2
    )
  `;

  const values: any[] = [restaurantId, `%${query}%`];

  if (categoryId) {
    sql += ` AND mi.category_id = $3`;
    values.push(categoryId);
  }

  sql += ` ORDER BY mi.created_at DESC`;

  const { rows } = await pool.query(sql, values);
  return rows as MenuItemWithAnalytics[];
}
