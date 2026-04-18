-- Migration: Create xp_source_config table
-- Description: Stores configuration for XP sources including base amounts, multipliers, and rate limits
-- Requirements: 2.1, 2.2, 2.3, 2.4

CREATE TABLE IF NOT EXISTS xp_source_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL UNIQUE CHECK (source IN (
    'event_participation',
    'code_contribution',
    'community_engagement',
    'challenge_completion',
    'helping_others',
    'profile_completion'
  )),
  base_amount INTEGER NOT NULL CHECK (base_amount > 0),
  multipliers JSONB DEFAULT '{}',
  cooldown_seconds INTEGER NOT NULL DEFAULT 0,
  max_per_hour INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE xp_source_config IS 'Stores configuration for XP sources including base amounts, multipliers, cooldowns, and rate limits';
COMMENT ON COLUMN xp_source_config.source IS 'XP source category matching xp_transactions.source enum';
COMMENT ON COLUMN xp_source_config.base_amount IS 'Base XP amount awarded for this activity type';
COMMENT ON COLUMN xp_source_config.multipliers IS 'JSON object containing multiplier rules (e.g., {"first_place": 2.0, "streak_7_days": 1.1})';
COMMENT ON COLUMN xp_source_config.cooldown_seconds IS 'Minimum seconds between duplicate activity XP awards';
COMMENT ON COLUMN xp_source_config.max_per_hour IS 'Maximum XP that can be earned from this source per hour';
