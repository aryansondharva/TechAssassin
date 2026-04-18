-- Migration: Create xp_transactions table
-- Description: Tracks all XP earning and spending transactions for users
-- Requirements: 1.1, 1.2, 1.4, 1.5

CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  source VARCHAR(50) NOT NULL CHECK (source IN (
    'event_participation',
    'code_contribution',
    'community_engagement',
    'challenge_completion',
    'helping_others',
    'profile_completion'
  )),
  activity_type VARCHAR(100) NOT NULL,
  reference_id UUID,
  description TEXT NOT NULL,
  manual_adjustment BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created_at ON xp_transactions(created_at DESC);
CREATE INDEX idx_xp_transactions_source ON xp_transactions(source);
CREATE INDEX idx_xp_transactions_reference_id ON xp_transactions(reference_id) WHERE reference_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON TABLE xp_transactions IS 'Tracks all XP earning and spending transactions for users in the gamification system';
COMMENT ON COLUMN xp_transactions.source IS 'Category of activity that generated XP: event_participation, code_contribution, community_engagement, challenge_completion, helping_others, profile_completion';
COMMENT ON COLUMN xp_transactions.manual_adjustment IS 'Flag indicating if this was a manual admin adjustment';
COMMENT ON COLUMN xp_transactions.metadata IS 'Additional context data stored as JSON';
