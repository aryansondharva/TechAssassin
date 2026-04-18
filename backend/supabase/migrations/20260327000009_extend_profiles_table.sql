-- Migration: Extend profiles table with gamification columns
-- Description: Adds XP, rank, streak, and profile completion tracking to user profiles
-- Requirements: 1.2, 6.5, 16.2, 18.1, 18.4, 18.6

-- Add gamification columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_rank_id UUID REFERENCES rank_tiers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE,
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_current_rank_id ON profiles(current_rank_id);
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON profiles(current_streak DESC);

-- Add comments for documentation
COMMENT ON COLUMN profiles.total_xp IS 'Cumulative total XP earned by the user across all activities';
COMMENT ON COLUMN profiles.current_rank_id IS 'Foreign key to the user''s current rank tier';
COMMENT ON COLUMN profiles.current_streak IS 'Number of consecutive days the user has been active';
COMMENT ON COLUMN profiles.longest_streak IS 'Longest consecutive day streak the user has achieved';
COMMENT ON COLUMN profiles.last_activity_date IS 'Date of the user''s last activity for streak tracking';
COMMENT ON COLUMN profiles.profile_completion_percentage IS 'Percentage of profile fields completed (0-100)';
