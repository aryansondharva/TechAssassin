-- Migration: Create leaderboard helper functions
-- Description: Optimized SQL functions for leaderboard queries
-- Requirements: 10.1, 10.2, 10.3, 10.4

-- Function to get user's leaderboard position with context (users above/below)
-- Uses ROW_NUMBER() window function for efficient rank calculation
CREATE OR REPLACE FUNCTION get_user_leaderboard_position(target_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  username VARCHAR,
  avatar_url TEXT,
  total_xp INTEGER,
  user_rank BIGINT,
  rank_name VARCHAR,
  rank_icon TEXT,
  above_id UUID,
  above_username VARCHAR,
  above_avatar TEXT,
  above_xp INTEGER,
  above_rank_name VARCHAR,
  above_rank_icon TEXT,
  below_id UUID,
  below_username VARCHAR,
  below_avatar TEXT,
  below_xp INTEGER,
  below_rank_name VARCHAR,
  below_rank_icon TEXT,
  total_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      p.id,
      p.username,
      p.avatar_url,
      p.total_xp,
      p.current_rank_id,
      rt.name as rank_name,
      rt.icon_url as rank_icon,
      ROW_NUMBER() OVER (ORDER BY p.total_xp DESC) as rank
    FROM profiles p
    LEFT JOIN rank_tiers rt ON p.current_rank_id = rt.id
  ),
  user_position AS (
    SELECT rank FROM ranked_users WHERE id = target_user_id
  ),
  total_count AS (
    SELECT COUNT(*) as count FROM profiles
  )
  SELECT 
    current_user.id,
    current_user.username,
    current_user.avatar_url,
    current_user.total_xp,
    current_user.rank,
    current_user.rank_name,
    current_user.rank_icon,
    user_above.id,
    user_above.username,
    user_above.avatar_url,
    user_above.total_xp,
    user_above.rank_name,
    user_above.rank_icon,
    user_below.id,
    user_below.username,
    user_below.avatar_url,
    user_below.total_xp,
    user_below.rank_name,
    user_below.rank_icon,
    total_count.count
  FROM ranked_users current_user
  CROSS JOIN total_count
  LEFT JOIN ranked_users user_above ON user_above.rank = current_user.rank - 1
  LEFT JOIN ranked_users user_below ON user_below.rank = current_user.rank + 1
  WHERE current_user.id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly leaderboard (XP earned in last 30 days)
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  avatar_url TEXT,
  total_xp INTEGER,
  monthly_xp BIGINT,
  current_rank_id UUID,
  rank_tiers JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.total_xp,
    COALESCE(SUM(xp.amount), 0)::BIGINT as monthly_xp,
    p.current_rank_id,
    CASE 
      WHEN rt.id IS NOT NULL THEN 
        jsonb_build_object(
          'name', rt.name,
          'icon_url', rt.icon_url
        )
      ELSE NULL
    END as rank_tiers
  FROM profiles p
  LEFT JOIN xp_transactions xp ON xp.user_id = p.id 
    AND xp.created_at >= NOW() - INTERVAL '30 days'
  LEFT JOIN rank_tiers rt ON p.current_rank_id = rt.id
  GROUP BY p.id, p.username, p.avatar_url, p.total_xp, p.current_rank_id, rt.id, rt.name, rt.icon_url
  ORDER BY monthly_xp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get weekly leaderboard (XP earned in last 7 days)
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  avatar_url TEXT,
  total_xp INTEGER,
  weekly_xp BIGINT,
  current_rank_id UUID,
  rank_tiers JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.total_xp,
    COALESCE(SUM(xp.amount), 0)::BIGINT as weekly_xp,
    p.current_rank_id,
    CASE 
      WHEN rt.id IS NOT NULL THEN 
        jsonb_build_object(
          'name', rt.name,
          'icon_url', rt.icon_url
        )
      ELSE NULL
    END as rank_tiers
  FROM profiles p
  LEFT JOIN xp_transactions xp ON xp.user_id = p.id 
    AND xp.created_at >= NOW() - INTERVAL '7 days'
  LEFT JOIN rank_tiers rt ON p.current_rank_id = rt.id
  GROUP BY p.id, p.username, p.avatar_url, p.total_xp, p.current_rank_id, rt.id, rt.name, rt.icon_url
  ORDER BY weekly_xp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION get_user_leaderboard_position IS 'Efficiently finds a user''s leaderboard position with users above and below using ROW_NUMBER()';
COMMENT ON FUNCTION get_monthly_leaderboard IS 'Returns leaderboard based on XP earned in the last 30 days';
COMMENT ON FUNCTION get_weekly_leaderboard IS 'Returns leaderboard based on XP earned in the last 7 days';
