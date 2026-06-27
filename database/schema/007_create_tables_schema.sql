-- File: database/schema/007_create_tables_schema.sql
-- PostgreSQL schema for Phase D: Table Management System

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create Restaurant Tables Table
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  table_number INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
  current_order_id UUID, -- Will be set to order ID when occupied, and NULL when cleared
  section VARCHAR(50) DEFAULT 'Main Hall', -- Main Hall, VIP, Outdoor, Family Area, Rooftop
  shape VARCHAR(20) DEFAULT 'square', -- rectangle, round, square
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 80,
  height INTEGER DEFAULT 80,
  rotation INTEGER DEFAULT 0,
  reserved_for VARCHAR(100),
  reserved_phone VARCHAR(20),
  reservation_time TIMESTAMP WITH TIME ZONE,
  last_occupied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (restaurant_id, table_number)
);

-- Add table_id to orders table safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='table_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_current_order_id ON restaurant_tables(current_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
