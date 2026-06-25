-- PostgreSQL schema for Module 7: Inventory Management

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enumerated types for inventory constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_transaction_type') THEN
    CREATE TYPE inventory_transaction_type AS ENUM (
      'STOCK_IN',
      'STOCK_OUT',
      'ADJUSTMENT',
      'WASTE'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_alert_type') THEN
    CREATE TYPE inventory_alert_type AS ENUM (
      'LOW_STOCK',
      'OUT_OF_STOCK'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_order_status') THEN
    CREATE TYPE purchase_order_status AS ENUM (
      'DRAFT',
      'PENDING',
      'RECEIVED',
      'CANCELLED'
    );
  END IF;
END$$;

-- Inventory Categories Table
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (restaurant_id, name)
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  name VARCHAR(150) NOT NULL,
  contact_name VARCHAR(150),
  phone VARCHAR(50),
  email VARCHAR(150),
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (restaurant_id, name)
);

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  category_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  unit VARCHAR(50) NOT NULL DEFAULT 'units',
  quantity_on_hand DECIMAL(10,4) NOT NULL DEFAULT 0,
  reorder_threshold DECIMAL(10,4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT chk_inventory_quantity_non_negative CHECK (quantity_on_hand >= 0),
  CONSTRAINT chk_inventory_reorder_threshold_non_negative CHECK (reorder_threshold >= 0),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES inventory_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  UNIQUE (restaurant_id, name)
);

-- Menu Item Ingredients Table
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  menu_item_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL,
  quantity_required DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  UNIQUE (menu_item_id, inventory_item_id)
);

-- Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL,
  order_id UUID,
  change_amount DECIMAL(10,4) NOT NULL,
  transaction_type inventory_transaction_type NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Inventory Alerts Table
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL,
  alert_type inventory_alert_type NOT NULL,
  threshold DECIMAL(10,4) NOT NULL DEFAULT 0,
  message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
  ,UNIQUE (restaurant_id, inventory_item_id, alert_type)
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  status purchase_order_status NOT NULL DEFAULT 'DRAFT',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_date DATE,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
);

-- Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL,
  quantity DECIMAL(10,4) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
  ,UNIQUE (purchase_order_id, inventory_item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_categories_restaurant_id ON inventory_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_name ON inventory_categories(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_restaurant_id ON suppliers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_restaurant_id ON inventory_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier_id ON inventory_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_restaurant_id ON menu_item_ingredients(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_menu_item_id ON menu_item_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_inventory_item_id ON menu_item_ingredients(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_item_id ON inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_order_id ON inventory_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_restaurant_id ON inventory_transactions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_inventory_item_id ON inventory_alerts(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_alert_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_is_active ON inventory_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_restaurant_id ON purchase_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_inventory_item_id ON purchase_order_items(inventory_item_id);
