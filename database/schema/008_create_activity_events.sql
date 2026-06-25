-- File: database/schema/008_create_activity_events.sql
-- PostgreSQL schema for Phase F: Centralized Operations Event Logging

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  description TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexing for high-performance dashboard reads
CREATE INDEX IF NOT EXISTS idx_activity_events_restaurant ON activity_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_type ON activity_events(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_events_created ON activity_events(created_at DESC);
