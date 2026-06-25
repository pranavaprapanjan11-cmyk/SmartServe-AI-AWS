-- Database Migration: Phase G - Inventory Intelligence, Auto Stock Deduction & Financial Reconciliation

-- 1. Alter purchase_order_status enum values (run outside transaction if possible, or handle individually)
-- Note: PostgreSQL does not allow ALTER TYPE ADD VALUE inside transactions.
-- We will run these individually or rely on the JS migration script executing them directly.
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'DELIVERED';

-- 2. Add Expiry tracking columns to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);

-- 3. Add consumption tracking column to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS consumption_logged BOOLEAN NOT NULL DEFAULT false;

-- 4. Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (restaurant_id, menu_item_id)
);

-- 5. Create recipe_ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_required DECIMAL(10,4) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (recipe_id, inventory_item_id)
);

-- 6. Create inventory_wastage table
CREATE TABLE IF NOT EXISTS inventory_wastage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity DECIMAL(10,4) NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  staff_member VARCHAR(150) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create inventory_reconciliations table
CREATE TABLE IF NOT EXISTS inventory_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  staff_member VARCHAR(150) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (restaurant_id, reconciliation_date)
);

-- 8. Create inventory_reconciliation_items table
CREATE TABLE IF NOT EXISTS inventory_reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID NOT NULL REFERENCES inventory_reconciliations(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  opening_stock DECIMAL(10,4) NOT NULL DEFAULT 0,
  purchases DECIMAL(10,4) NOT NULL DEFAULT 0,
  consumption DECIMAL(10,4) NOT NULL DEFAULT 0,
  wastage DECIMAL(10,4) NOT NULL DEFAULT 0,
  expected_stock DECIMAL(10,4) NOT NULL DEFAULT 0,
  actual_stock DECIMAL(10,4) NOT NULL DEFAULT 0,
  variance DECIMAL(10,4) NOT NULL DEFAULT 0,
  cost_impact DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (reconciliation_id, inventory_item_id)
);

-- 9. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item ON recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_restaurant ON recipes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_item ON recipe_ingredients(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_wastage_restaurant ON inventory_wastage(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_wastage_item ON inventory_wastage(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_restaurant ON inventory_reconciliations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_items_item ON inventory_reconciliation_items(inventory_item_id);
