// File: backend/src/modules/menu/menu.types.ts
// TypeScript types and interfaces for Menu Management module

export enum DietaryInfo {
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
  GLUTEN_FREE = 'GLUTEN_FREE',
  DAIRY_FREE = 'DAIRY_FREE',
  NUT_FREE = 'NUT_FREE',
  HALAL = 'HALAL',
  KOSHER = 'KOSHER',
}

export enum SpiceLevel {
  NONE = 0,
  MILD = 1,
  MEDIUM = 2,
  HOT = 3,
  EXTRA_HOT = 4,
}

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
}

export interface MenuItemAnalytics {
  id: string;
  menu_item_id: string;
  orders_count: number;
  revenue: number;
  rating: number;
  last_ordered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItemWithAnalytics extends MenuItem {
  analytics?: MenuItemAnalytics;
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
  dietary_info?: DietaryInfo;
  calories?: number;
  tags?: string;
}

export interface UpdateMenuItemPayload {
  category_id?: string;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_available?: boolean;
  is_bestseller?: boolean;
  preparation_time?: number;
  spice_level?: number;
  dietary_info?: DietaryInfo;
  calories?: number;
  tags?: string;
}

export interface CreateMenuCategoryPayload {
  name: string;
  description?: string;
  color_code?: string;
  icon_emoji?: string;
  display_order?: number;
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
