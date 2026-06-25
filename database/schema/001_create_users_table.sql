-- File: database/schema/001_create_users_table.sql
-- SQL to create users table expected by the authentication module

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  pin VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Trigger function to automatically seed default categories for new owners
CREATE OR REPLACE FUNCTION seed_default_categories_for_new_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'RESTAURANT_OWNER' THEN
    INSERT INTO menu_categories (restaurant_id, name, description, color_code, icon_emoji, display_order)
    VALUES 
      (NEW.id, 'Beverages', 'Cold and hot drinks', '#3b82f6', '🥤', 1),
      (NEW.id, 'Starters', 'Appetizers and quick bites', '#10b981', '🥟', 2),
      (NEW.id, 'Main Course', 'Main dishes and entrees', '#f59e0b', '🍛', 3),
      (NEW.id, 'Desserts', 'Sweet treats and desserts', '#ec4899', '🍰', 4)
    ON CONFLICT (restaurant_id, name) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_seed_default_categories
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION seed_default_categories_for_new_owner();


