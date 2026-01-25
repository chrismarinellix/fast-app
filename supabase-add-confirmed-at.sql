-- Add confirmed_at column to fasting_sessions for long fast verification
-- Run this SQL in Supabase SQL Editor

ALTER TABLE fasting_sessions
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Optional: Add a comment explaining the column
COMMENT ON COLUMN fasting_sessions.confirmed_at IS 'Last time user confirmed they are still fasting (for fasts over 24 hours)';
