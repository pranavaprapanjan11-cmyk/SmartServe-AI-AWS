-- File: database/schema/011_create_workspaces_schema.sql
-- Migration to support Multi-Workspace Architecture

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_code VARCHAR(50) UNIQUE NOT NULL,
  workspace_name VARCHAR(255) NOT NULL,
  owner_id UUID, -- Will point to users(id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Helper to add workspace_id column
CREATE OR REPLACE FUNCTION add_workspace_id_column(tbl_name text) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = tbl_name AND column_name = 'workspace_id'
  ) THEN
    EXECUTE 'ALTER TABLE ' || quote_ident(tbl_name) || ' ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply workspace_id to target tables
SELECT add_workspace_id_column('users');
SELECT add_workspace_id_column('employees');
SELECT add_workspace_id_column('orders');
SELECT add_workspace_id_column('restaurant_tables');
SELECT add_workspace_id_column('customers');
SELECT add_workspace_id_column('reservations');
SELECT add_workspace_id_column('waitlist_entries');
SELECT add_workspace_id_column('inventory_categories');
SELECT add_workspace_id_column('suppliers');
SELECT add_workspace_id_column('inventory_items');
SELECT add_workspace_id_column('menu_item_ingredients');
SELECT add_workspace_id_column('inventory_transactions');
SELECT add_workspace_id_column('purchase_orders');
SELECT add_workspace_id_column('inventory_alerts');
SELECT add_workspace_id_column('restaurant_settings');
SELECT add_workspace_id_column('printer_settings');
SELECT add_workspace_id_column('invoices');
SELECT add_workspace_id_column('payments');
SELECT add_workspace_id_column('activity_events');
SELECT add_workspace_id_column('menu_categories');
SELECT add_workspace_id_column('menu_items');

-- Employee secondary tables
SELECT add_workspace_id_column('attendance');
SELECT add_workspace_id_column('shifts');
SELECT add_workspace_id_column('employee_shifts');
SELECT add_workspace_id_column('leave_requests');
SELECT add_workspace_id_column('salary');
SELECT add_workspace_id_column('performance_reviews');
SELECT add_workspace_id_column('disciplinary_actions');

DROP FUNCTION add_workspace_id_column(text);

-- Trigger function to automatically populate workspace_id based on restaurant_id
CREATE OR REPLACE FUNCTION populate_workspace_id_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.restaurant_id IS NOT NULL THEN
    NEW.workspace_id := (SELECT workspace_id FROM users WHERE id = NEW.restaurant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper to create trigger on a table
CREATE OR REPLACE FUNCTION add_workspace_trigger(tbl_name text) RETURNS void AS $$
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS trigger_populate_workspace_id ON ' || quote_ident(tbl_name);
  EXECUTE 'CREATE TRIGGER trigger_populate_workspace_id BEFORE INSERT ON ' || quote_ident(tbl_name) || ' FOR EACH ROW EXECUTE FUNCTION populate_workspace_id_trigger_fn()';
END;
$$ LANGUAGE plpgsql;

SELECT add_workspace_trigger('employees');
SELECT add_workspace_trigger('orders');
SELECT add_workspace_trigger('restaurant_tables');
SELECT add_workspace_trigger('customers');
SELECT add_workspace_trigger('reservations');
SELECT add_workspace_trigger('waitlist_entries');
SELECT add_workspace_trigger('inventory_categories');
SELECT add_workspace_trigger('suppliers');
SELECT add_workspace_trigger('inventory_items');
SELECT add_workspace_trigger('menu_item_ingredients');
SELECT add_workspace_trigger('inventory_transactions');
SELECT add_workspace_trigger('purchase_orders');
SELECT add_workspace_trigger('inventory_alerts');
SELECT add_workspace_trigger('restaurant_settings');
SELECT add_workspace_trigger('printer_settings');
SELECT add_workspace_trigger('invoices');
SELECT add_workspace_trigger('payments');
SELECT add_workspace_trigger('activity_events');
SELECT add_workspace_trigger('menu_categories');
SELECT add_workspace_trigger('menu_items');
SELECT add_workspace_trigger('attendance');
SELECT add_workspace_trigger('shifts');
SELECT add_workspace_trigger('employee_shifts');
SELECT add_workspace_trigger('leave_requests');
SELECT add_workspace_trigger('salary');
SELECT add_workspace_trigger('performance_reviews');
SELECT add_workspace_trigger('disciplinary_actions');

DROP FUNCTION add_workspace_trigger(text);
