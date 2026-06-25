-- File: database/schema/002_create_menu_schema.sql
-- PostgreSQL schema for menu management system

-- Ensure UUID generation extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Menu Categories Table
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color_code VARCHAR(7),
  icon_emoji VARCHAR(10),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(restaurant_id, name)
);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  category_id UUID NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_bestseller BOOLEAN DEFAULT false,
  preparation_time INTEGER DEFAULT 0,
  spice_level INTEGER DEFAULT 0,
  dietary_info VARCHAR(50),
  calories INTEGER,
  tags TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
);

-- Menu Item Analytics Table
CREATE TABLE IF NOT EXISTS menu_item_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL,
  orders_count INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  last_ordered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX idx_menu_item_analytics_menu_item_id ON menu_item_analytics(menu_item_id);
