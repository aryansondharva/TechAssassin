-- Migration: Create user_ranks_history table
-- Description: Tracks historical rank changes for users
-- Requirements: 6.6

CREATE TABLE IF NOT EXISTS user_ranks_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank_id UUID NOT NULL REFERENCES rank_tiers(id) ON DELETE RESTRICT,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_user_ranks_history_user_id ON user_ranks_history(user_id);
CREATE INDEX idx_user_ranks_history_achieved_at ON user_ranks_history(achieved_at DESC);

-- Add comments for documentation
COMMENT ON TABLE user_ranks_history IS 'Tracks historical rank changes for users to show progression over time';
COMMENT ON COLUMN user_ranks_history.achieved_at IS 'Timestamp when the user achieved this rank';
