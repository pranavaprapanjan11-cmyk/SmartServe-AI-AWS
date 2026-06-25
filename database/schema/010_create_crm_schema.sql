-- File: database/schema/010_create_crm_schema.sql
-- PostgreSQL schema for Phase H: Customer CRM & Reservation Intelligence

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  name VARCHAR(150),
  phone_number VARCHAR(50) NOT NULL,
  email VARCHAR(150),
  birthday DATE,
  anniversary DATE,
  notes TEXT,
  preferred_seating VARCHAR(100),
  preferred_dishes JSONB DEFAULT '[]',
  total_visits INTEGER DEFAULT 0,
  total_spend DECIMAL(10,2) DEFAULT 0.00,
  avg_bill_value DECIMAL(10,2) DEFAULT 0.00,
  reward_points INTEGER DEFAULT 0,
  vip_status BOOLEAN DEFAULT false,
  last_visit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (restaurant_id, phone_number)
);

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  requested_table UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, SEATED, COMPLETED, CANCELLED, NO_SHOW
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_table) REFERENCES restaurant_tables(id) ON DELETE SET NULL
);

-- Waitlist Entries Table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  customer_id UUID,
  customer_name VARCHAR(150),
  phone_number VARCHAR(50),
  party_size INTEGER NOT NULL DEFAULT 1,
  estimated_wait_mins INTEGER DEFAULT 15,
  status VARCHAR(50) NOT NULL DEFAULT 'WAITING', -- WAITING, SEATED, LEFT, CANCELLED
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Alter orders table to safely link to customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='customer_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone_number ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_id ON reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_waitlist_restaurant_id ON waitlist_entries(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
