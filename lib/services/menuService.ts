// File: frontend/src/services/menuService.ts
// API service for menu operations

import axios from 'axios';
import { API_BASE } from '../config';

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  color_code?: string;
  icon_emoji?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemAnalytics {
  id: string;
  menu_item_id: string;
  orders_count: number;
  revenue: number;
  rating: number;
  last_ordered_at?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_bestseller: boolean;
  preparation_time?: number;
  spice_level?: number;
  dietary_info?: string;
  calories?: number;
  tags?: string;
  created_at: string;
  updated_at: string;
  analytics?: MenuItemAnalytics;
}

export interface MenuStats {
  total_items: number;
  available_items: number;
  categories_count: number;
  average_price: number;
  bestsellers_count: number;
  total_revenue: number;
  highest_rated_item?: MenuItem;
}

export interface CreateMenuItemPayload {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available?: boolean;
  is_bestseller?: boolean;
  preparation_time?: number;
  spice_level?: number;
  dietary_info?: string;
  calories?: number;
  tags?: string;
}

export interface UpdateMenuItemPayload extends Partial<CreateMenuItemPayload> {}

function normalizeMenuItem(item: any): MenuItem {
  return {
    ...item,
    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
    preparation_time: item.preparation_time != null ? Number(item.preparation_time) : undefined,
    spice_level: item.spice_level != null ? Number(item.spice_level) : undefined,
    calories: item.calories != null ? Number(item.calories) : undefined,
    is_available: Boolean(item.is_available),
    is_bestseller: Boolean(item.is_bestseller),
    analytics: item.analytics
      ? {
          ...item.analytics,
          orders_count: Number(item.analytics.orders_count),
          revenue: Number(item.analytics.revenue),
          rating: Number(item.analytics.rating),
          last_ordered_at: item.analytics.last_ordered_at || undefined,
        }
      : undefined,
  } as MenuItem
}

// ==================== MENU ITEMS ====================

export async function createMenuItem(payload: CreateMenuItemPayload, token: string): Promise<MenuItem> {
  const res = await axios.post<MenuItem>(`${API_BASE}/menu`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeMenuItem(res.data);
}

export async function getMenuItems(token: string): Promise<MenuItem[]> {
  const res = await axios.get<MenuItem[]>(`${API_BASE}/menu`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.map(normalizeMenuItem);
}

export async function getMenuItemById(id: string, token: string): Promise<MenuItem> {
  const res = await axios.get<MenuItem>(`${API_BASE}/menu/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeMenuItem(res.data);
}

export async function updateMenuItem(
  id: string,
  payload: UpdateMenuItemPayload,
  token: string
): Promise<MenuItem> {
  const res = await axios.put<MenuItem>(`${API_BASE}/menu/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return normalizeMenuItem(res.data);
}

export async function deleteMenuItem(id: string, token: string): Promise<void> {
  await axios.delete(`${API_BASE}/menu/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function toggleMenuItemAvailability(
  id: string,
  isAvailable: boolean,
  token: string
): Promise<MenuItem> {
  const res = await axios.patch<MenuItem>(
    `${API_BASE}/menu/${id}/availability`,
    { is_available: isAvailable },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

// ==================== CATEGORIES ====================

export async function getCategories(token: string): Promise<MenuCategory[]> {
  const res = await axios.get<MenuCategory[]>(`${API_BASE}/menu/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createMenuCategory(
  payload: { name: string; description?: string; color_code?: string; icon_emoji?: string; display_order?: number },
  token: string
): Promise<MenuCategory> {
  const res = await axios.post<MenuCategory>(`${API_BASE}/menu/categories`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ==================== STATISTICS ====================

export async function getMenuStats(token: string): Promise<MenuStats> {
  const res = await axios.get<MenuStats>(`${API_BASE}/menu/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ==================== SEARCH ====================

export async function searchMenuItems(
  query: string,
  categoryId?: string,
  token?: string
): Promise<MenuItem[]> {
  if (!token) {
    throw new Error('Token is required for search');
  }

  const params = new URLSearchParams({ q: query });
  if (categoryId) params.append('category_id', categoryId);

  const res = await axios.get<MenuItem[]>(`${API_BASE}/menu/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.map(normalizeMenuItem);
}
