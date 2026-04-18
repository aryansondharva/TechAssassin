-- Migration: Create badges table
-- Description: Stores badge definitions with unlock criteria and metadata
-- Requirements: 3.1, 3.2, 3.3, 3.4

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'coding',
    'community',
    'events',
    'streaks',
    'mentorship',
    'special'
  )),
  rarity_level VARCHAR(20) NOT NULL CHECK (rarity_level IN (
    'common',
    'rare',
    'epic',
    'legendary'
  )),
  unlock_criteria JSONB NOT NULL,
  icon_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_rarity_level ON badges(rarity_level);
CREATE INDEX idx_badges_is_active ON badges(is_active);

-- Add comments for documentation
COMMENT ON TABLE badges IS 'Stores achievement badge definitions with unlock criteria and metadata';
COMMENT ON COLUMN badges.category IS 'Badge category: coding, community, events, streaks, mentorship, special';
COMMENT ON COLUMN badges.rarity_level IS 'Badge rarity: common, rare, epic, legendary';
COMMENT ON COLUMN badges.unlock_criteria IS 'JSON structure defining conditions required to unlock this badge';
COMMENT ON COLUMN badges.is_active IS 'Whether this badge is currently active and can be earned';
