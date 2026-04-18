-- Migration: Create Row Level Security (RLS) policies for gamification tables
-- Description: Set up security policies to control data access for gamification system
-- Requirements: All (security)

-- =============================================================================
-- Enable RLS on all gamification tables
-- =============================================================================

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ranks_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_source_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_cooldowns ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- XP Transactions Policies
-- =============================================================================

-- Users can view their own XP transactions
CREATE POLICY "Users can view own XP transactions"
ON xp_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all XP transactions
CREATE POLICY "Admins can view all XP transactions"
ON xp_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can insert XP transactions (for manual adjustments)
CREATE POLICY "Admins can insert XP transactions"
ON xp_transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Service role can insert XP transactions (for system operations)
-- Note: Service role bypasses RLS, but this policy documents the intent

-- =============================================================================
-- Badges Policies
-- =============================================================================

-- Anyone can view active badges
CREATE POLICY "Anyone can view active badges"
ON badges FOR SELECT
USING (is_active = true);

-- Admins can view all badges (including inactive)
CREATE POLICY "Admins can view all badges"
ON badges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can create badges
CREATE POLICY "Admins can create badges"
ON badges FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can update badges
CREATE POLICY "Admins can update badges"
ON badges FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can delete badges (soft delete via is_active)
CREATE POLICY "Admins can delete badges"
ON badges FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- =============================================================================
-- User Badges Policies
-- =============================================================================

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
ON user_badges FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can view non-revoked badges of other users
CREATE POLICY "Anyone can view non-revoked badges"
ON user_badges FOR SELECT
USING (revoked_at IS NULL);

-- Admins can view all user badges (including revoked)
CREATE POLICY "Admins can view all user badges"
ON user_badges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can insert user badges (for manual awards)
CREATE POLICY "Admins can insert user badges"
ON user_badges FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can update user badges (for revocations)
CREATE POLICY "Admins can update user badges"
ON user_badges FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- =============================================================================
-- Rank Tiers Policies
-- =============================================================================

-- Anyone can view rank tiers
CREATE POLICY "Anyone can view rank tiers"
ON rank_tiers FOR SELECT
USING (true);

-- Admins can create rank tiers
CREATE POLICY "Admins can create rank tiers"
ON rank_tiers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can update rank tiers
CREATE POLICY "Admins can update rank tiers"
ON rank_tiers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can delete rank tiers
CREATE POLICY "Admins can delete rank tiers"
ON rank_tiers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- =============================================================================
-- User Ranks History Policies
-- =============================================================================

-- Users can view their own rank history
CREATE POLICY "Users can view own rank history"
ON user_ranks_history FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can view rank history of other users (for profile display)
CREATE POLICY "Anyone can view rank history"
ON user_ranks_history FOR SELECT
USING (true);

-- Admins can view all rank history
CREATE POLICY "Admins can view all rank history"
ON user_ranks_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- =============================================================================
-- XP Source Config Policies
-- =============================================================================

-- Anyone can view XP source configuration
CREATE POLICY "Anyone can view XP source config"
ON xp_source_config FOR SELECT
USING (true);

-- Admins can create XP source config
CREATE POLICY "Admins can create XP source config"
ON xp_source_config FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can update XP source config
CREATE POLICY "Admins can update XP source config"
ON xp_source_config FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- =============================================================================
-- XP Rate Limits Policies
-- =============================================================================

-- Users can view their own rate limits
CREATE POLICY "Users can view own rate limits"
ON xp_rate_limits FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all rate limits
CREATE POLICY "Admins can view all rate limits"
ON xp_rate_limits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Service role can insert/update rate limits (for system operations)
-- Note: Service role bypasses RLS

-- =============================================================================
-- Activity Cooldowns Policies
-- =============================================================================

-- Users can view their own cooldowns
CREATE POLICY "Users can view own cooldowns"
ON activity_cooldowns FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all cooldowns
CREATE POLICY "Admins can view all cooldowns"
ON activity_cooldowns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Service role can insert/update cooldowns (for system operations)
-- Note: Service role bypasses RLS

-- =============================================================================
-- Comments for documentation
-- =============================================================================

COMMENT ON POLICY "Users can view own XP transactions" ON xp_transactions IS 
  'Users can only view their own XP transaction history';

COMMENT ON POLICY "Anyone can view active badges" ON badges IS 
  'All users can view active badges to see what achievements are available';

COMMENT ON POLICY "Anyone can view non-revoked badges" ON user_badges IS 
  'All users can view non-revoked badges earned by others for profile display';

COMMENT ON POLICY "Anyone can view rank tiers" ON rank_tiers IS 
  'All users can view rank tiers to understand the progression system';

COMMENT ON POLICY "Anyone can view XP source config" ON xp_source_config IS 
  'All users can view XP source configuration to understand how XP is earned';
