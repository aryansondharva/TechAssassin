-- Migration: Create Real-Time Presence & Activity System
-- Date: 2026-03-26
-- Description: Creates tables for presence tracking, activity feed, and enhanced leaderboard

-- ============================================================================
-- 1. PRESENCE TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS presence_tracking (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('online', 'away', 'busy', 'offline')) DEFAULT 'offline',
  location_type VARCHAR(20) CHECK (location_type IN ('page', 'event')),
  location_id VARCHAR(255),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_status ON presence_tracking(status);
CREATE INDEX IF NOT EXISTS idx_presence_location ON presence_tracking(location_type, location_id);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence_tracking(last_seen);
CREATE INDEX IF NOT EXISTS idx_presence_updated_at ON presence_tracking(updated_at);

COMMENT ON TABLE presence_tracking IS 'Tracks user online status and location';
COMMENT ON COLUMN presence_tracking.status IS 'User status: online, away, busy, or offline';

-- ============================================================================
-- 2. ACTIVITY FEED TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('challenge_solved', 'event_joined', 'badge_earned', 'team_registered')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_feed(type);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type_created ON activity_feed(type, created_at DESC);

COMMENT ON TABLE activity_feed IS 'Stores user activity events';

-- ============================================================================
-- 3. LEADERBOARD SCORES TABLE (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  previous_rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_event ON leaderboard_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_scores(event_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_scores(event_id, score DESC);

COMMENT ON TABLE leaderboard_scores IS 'Stores user scores and rankings';

-- ============================================================================
-- 4. ENABLE SUPABASE REALTIME
-- ============================================================================

DO $$
BEGIN
  -- Check if publication exists, create if not
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add tables to publication safely
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'presence_tracking'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE presence_tracking;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'activity_feed'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'leaderboard_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard_scores;
  END IF;
END $$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE presence_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for clean recreation
DROP POLICY IF EXISTS "Authenticated users can view presence" ON presence_tracking;
DROP POLICY IF EXISTS "Users can update own presence" ON presence_tracking;
DROP POLICY IF EXISTS "Authenticated users can view activities" ON activity_feed;
DROP POLICY IF EXISTS "Users can create own activities" ON activity_feed;
DROP POLICY IF EXISTS "Authenticated users can view leaderboard" ON leaderboard_scores;
DROP POLICY IF EXISTS "Admins can update leaderboard" ON leaderboard_scores;

-- Presence policies
CREATE POLICY "Authenticated users can view presence"
  ON presence_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own presence"
  ON presence_tracking FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Activity policies
CREATE POLICY "Authenticated users can view activities"
  ON activity_feed FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own activities"
  ON activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Leaderboard policies
CREATE POLICY "Authenticated users can view leaderboard"
  ON leaderboard_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update leaderboard"
  ON leaderboard_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
      AND public.profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
      AND public.profiles.is_admin = true
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_presence_timestamp ON presence_tracking;
CREATE TRIGGER trigger_update_presence_timestamp
  BEFORE UPDATE ON presence_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_presence_timestamp();

CREATE OR REPLACE FUNCTION update_leaderboard_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leaderboard_timestamp ON leaderboard_scores;
CREATE TRIGGER trigger_update_leaderboard_timestamp
  BEFORE UPDATE ON leaderboard_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_timestamp();
