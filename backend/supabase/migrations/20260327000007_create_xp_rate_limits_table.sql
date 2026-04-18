-- Migration: Create xp_rate_limits table
-- Description: Tracks XP earning rates per user per source per hour for rate limiting
-- Requirements: 20.1, 20.2, 20.3

CREATE TABLE IF NOT EXISTS xp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  hour_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT unique_user_source_hour UNIQUE (user_id, source, hour_bucket)
);

-- Create indexes for performance optimization
CREATE INDEX idx_xp_rate_limits_user_id ON xp_rate_limits(user_id);
CREATE INDEX idx_xp_rate_limits_hour_bucket ON xp_rate_limits(hour_bucket);

-- Add comments for documentation
COMMENT ON TABLE xp_rate_limits IS 'Tracks XP earning rates per user per source per hour for rate limiting and fraud detection';
COMMENT ON COLUMN xp_rate_limits.hour_bucket IS 'Timestamp truncated to the hour (e.g., 2026-03-27 14:00:00)';
COMMENT ON COLUMN xp_rate_limits.xp_earned IS 'Total XP earned from this source in this hour bucket';
COMMENT ON COLUMN xp_rate_limits.transaction_count IS 'Number of XP transactions from this source in this hour bucket';
