-- Migration: Create user_badges table
-- Description: Tracks badges earned by users with award and revocation details
-- Requirements: 4.3, 13.3, 13.4

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE RESTRICT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  manual_award BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revocation_reason TEXT
);

-- Create partial unique index to ensure a user can only have one active instance of each badge
CREATE UNIQUE INDEX unique_user_badge_active ON user_badges(user_id, badge_id) WHERE revoked_at IS NULL;

-- Create indexes for performance optimization
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- Add comments for documentation
COMMENT ON TABLE user_badges IS 'Tracks badges earned by users with award and revocation details';
COMMENT ON COLUMN user_badges.manual_award IS 'Flag indicating if this badge was manually awarded by an admin';
COMMENT ON COLUMN user_badges.revoked_at IS 'Timestamp when badge was revoked (soft delete)';
COMMENT ON COLUMN user_badges.revocation_reason IS 'Reason provided when badge was revoked';
COMMENT ON INDEX unique_user_badge_active IS 'Ensures a user can only have one active instance of each badge';
