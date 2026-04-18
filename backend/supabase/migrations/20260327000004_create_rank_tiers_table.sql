-- Migration: Create rank_tiers table
-- Description: Defines rank tiers with XP thresholds and progression order
-- Requirements: 6.1, 6.3, 15.3

CREATE TABLE IF NOT EXISTS rank_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  minimum_xp_threshold INTEGER NOT NULL UNIQUE CHECK (minimum_xp_threshold >= 0),
  rank_order INTEGER NOT NULL UNIQUE CHECK (rank_order > 0),
  icon_url TEXT NOT NULL,
  perks JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_rank_tiers_minimum_xp_threshold ON rank_tiers(minimum_xp_threshold);
CREATE INDEX idx_rank_tiers_rank_order ON rank_tiers(rank_order);

-- Add comments for documentation
COMMENT ON TABLE rank_tiers IS 'Defines rank tiers with XP thresholds and progression order for the Assassin Rank system';
COMMENT ON COLUMN rank_tiers.minimum_xp_threshold IS 'Minimum total XP required to achieve this rank';
COMMENT ON COLUMN rank_tiers.rank_order IS 'Order of this rank in the progression system (1 = lowest, higher = better)';
COMMENT ON COLUMN rank_tiers.perks IS 'JSON object containing rank-specific perks and benefits';
