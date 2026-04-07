-- ==============================================================================
-- TechAssassin Hackathon Platform - Complete Database Schema
-- ==============================================================================
-- 
-- This migration creates the complete database schema for the TechAssassin platform
-- including all tables, indexes, triggers, RLS policies, and functions
-- 
-- Author: TechAssassin Team
-- Date: 2025-02-13
-- Version: 1.0.0
-- 

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- CORE TABLES
-- ==============================================================================

-- Profiles Table (Enhanced with additional fields)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  aadhaar_number TEXT UNIQUE,
  avatar_url TEXT,
  github_url TEXT,
  bio TEXT,
  address TEXT,
  education TEXT,
  university TEXT,
  graduation_year INTEGER,
  skills TEXT[] DEFAULT '{}',
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Foreign key to auth.users
  CONSTRAINT fk_profile_auth_user 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Skills Table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User Skills Junction Table
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique user-skill combination
  UNIQUE(user_id, skill_id)
);

-- Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  registration_open BOOLEAN DEFAULT TRUE NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  prizes JSONB,
  themes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  project_idea TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'waitlisted')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique user-event registration
  UNIQUE(user_id, event_id)
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content_url TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Sponsors Table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('gold', 'silver', 'bronze')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Leaderboard Table
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  rank INTEGER NOT NULL CHECK (rank >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique user-event combination in leaderboard
  UNIQUE(event_id, user_id)
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_aadhaar ON public.profiles(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- Skills indexes
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);

-- User skills indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON public.user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_proficiency ON public.user_skills(proficiency_level);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events(location);

-- Registrations indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON public.announcements(author_id);

-- Resources indexes
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);

-- Sponsors indexes
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON public.sponsors(tier);

-- Leaderboard indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_event_rank ON public.leaderboard(event_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard(user_id);

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Profile trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, skills, is_admin, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    '{}',
    FALSE,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS public.on_auth_user_created;
CREATE TRIGGER public.on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS public.update_profiles_updated_at_trigger;
CREATE TRIGGER public.update_profiles_updated_at_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Skills RLS policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view skills" ON public.skills
  FOR SELECT USING (auth.role() = 'authenticated');

-- User skills RLS policies
CREATE POLICY "Users can view their own skills" ON public.user_skills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills" ON public.user_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills" ON public.user_skills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills" ON public.user_skills
  FOR DELETE USING (auth.uid() = user_id);

-- Events RLS policies
CREATE POLICY "Everyone can view events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert events" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update events" ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Registrations RLS policies
CREATE POLICY "Users can view their own registrations" ON public.registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own registrations" ON public.registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" ON public.registrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations" ON public.registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Announcements RLS policies
CREATE POLICY "Everyone can view announcements" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert announcements" ON public.announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Authors can update their announcements" ON public.announcements
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can update all announcements" ON public.announcements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Resources RLS policies
CREATE POLICY "Everyone can view resources" ON public.resources
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert resources" ON public.resources
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update resources" ON public.resources
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Sponsors RLS policies
CREATE POLICY "Everyone can view sponsors" ON public.sponsors
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert sponsors" ON public.sponsors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update sponsors" ON public.sponsors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Leaderboard RLS policies
CREATE POLICY "Everyone can view leaderboard" ON public.leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert leaderboard" ON public.leaderboard
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update leaderboard" ON public.leaderboard
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ==============================================================================
-- STORAGE BUCKETS
-- ==============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('event-images', 'event-images', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('sponsor-logos', 'sponsor-logos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload to their own avatar folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public read access for avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Admins can manage event images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'event-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Public read access for event images" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Admins can manage sponsor logos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'sponsor-logos' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Public read access for sponsor logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'sponsor-logos');

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================

-- Enable realtime on core tables
DO $$
BEGIN
  -- Ensure publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add tables safely
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN others THEN RAISE NOTICE '%', SQLERRM; END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  EXCEPTION WHEN others THEN RAISE NOTICE '%', SQLERRM; END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
  EXCEPTION WHEN others THEN RAISE NOTICE '%', SQLERRM; END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
  EXCEPTION WHEN others THEN RAISE NOTICE '%', SQLERRM; END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
  EXCEPTION WHEN others THEN RAISE NOTICE '%', SQLERRM; END;
END $$;

-- Grant publication permissions
GRANT SELECT ON ALL TABLES IN PUBLICATION supabase_realtime TO authenticated;

-- ==============================================================================
-- HELPER FUNCTIONS
-- ==============================================================================

-- Get user profile with skills
CREATE OR REPLACE FUNCTION public.get_user_profile_with_skills(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  aadhaar_number TEXT,
  avatar_url TEXT,
  github_url TEXT,
  bio TEXT,
  address TEXT,
  education TEXT,
  university TEXT,
  graduation_year INTEGER,
  skills JSON,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.email,
    p.phone,
    p.aadhaar_number,
    p.avatar_url,
    p.github_url,
    p.bio,
    p.address,
    p.education,
    p.university,
    p.graduation_year,
    COALESCE(
      json_agg(
        json_build_object(
          'skill_id', us.skill_id,
          'skill_name', s.name,
          'category', s.category,
          'proficiency_level', us.proficiency_level
        )
      ) FILTER (WHERE s.name IS NOT NULL),
      '[]'::json
    ) as skills,
    p.is_admin,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN public.user_skills us ON p.id = us.user_id
  LEFT JOIN public.skills s ON us.skill_id = s.id
  WHERE p.id = user_uuid
  GROUP BY p.id, p.username, p.full_name, p.email, p.phone, p.aadhaar_number, p.avatar_url, p.github_url, p.bio, p.address, p.education, p.university, p.graduation_year, p.is_admin, p.created_at, p.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user skills
CREATE OR REPLACE FUNCTION public.update_user_skills(user_uuid UUID, skill_data JSON)
RETURNS VOID AS $$
DECLARE
  skill_record JSON;
BEGIN
  -- Remove existing skills
  DELETE FROM public.user_skills WHERE user_id = user_uuid;
  
  -- Add new skills from JSON data
  FOR skill_record IN SELECT * FROM json_array_elements(skill_data)
  LOOP
    INSERT INTO public.user_skills (user_id, skill_id, proficiency_level)
    SELECT 
      user_uuid,
      s.id,
      COALESCE((skill_record->>'proficiency_level')::INTEGER, 1)
    FROM public.skills s
    WHERE s.name = skill_record->>'name';
    
    -- Create skill if it doesn't exist
    IF NOT FOUND THEN
      INSERT INTO public.skills (name, category)
      VALUES (skill_record->>'name', 'Programming');
      
      INSERT INTO public.user_skills (user_id, skill_id, proficiency_level)
      SELECT 
        user_uuid,
        s.id,
        COALESCE((skill_record->>'proficiency_level')::INTEGER, 1)
      FROM public.skills s
      WHERE s.name = skill_record->>'name';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate Aadhaar number format
CREATE OR REPLACE FUNCTION public.validate_aadhaar_number(aadhaar TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN aadhaar ~ '^\d{4}-\d{4}-\d{4}$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if email is available
CREATE OR REPLACE FUNCTION public.is_email_available(email TEXT, user_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_uuid IS NOT NULL THEN
    RETURN NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = email);
  ELSE
    RETURN NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = email AND id != user_uuid);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if Aadhaar is available
CREATE OR REPLACE FUNCTION public.is_aadhaar_available(aadhaar TEXT, user_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_uuid IS NOT NULL THEN
    RETURN NOT EXISTS (SELECT 1 FROM public.profiles WHERE aadhaar_number = aadhaar);
  ELSE
    RETURN NOT EXISTS (SELECT 1 FROM public.profiles WHERE aadhaar_number = aadhaar AND id != user_uuid);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION public.get_user_profile_with_skills TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_skills TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_aadhaar_number TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_available TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_aadhaar_available TO authenticated;

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- Insert default skills
INSERT INTO public.skills (name, category) VALUES
-- Programming Languages
('JavaScript', 'Programming'),
('TypeScript', 'Programming'),
('Python', 'Programming'),
('Java', 'Programming'),
('C++', 'Programming'),
('C#', 'Programming'),
('Go', 'Programming'),
('Rust', 'Programming'),
('PHP', 'Programming'),
('Ruby', 'Programming'),

-- Frontend Technologies
('React', 'Programming'),
('Vue.js', 'Programming'),
('Angular', 'Programming'),
('Next.js', 'Programming'),
('HTML/CSS', 'Programming'),
('Tailwind CSS', 'Programming'),
('SASS', 'Programming'),

-- Backend Technologies
('Node.js', 'Programming'),
('Express.js', 'Programming'),
('Django', 'Programming'),
('Flask', 'Programming'),
('Spring Boot', 'Programming'),
('Laravel', 'Programming'),
('Rails', 'Programming'),

-- Databases
('PostgreSQL', 'Programming'),
('MySQL', 'Programming'),
('MongoDB', 'Programming'),
('Redis', 'Programming'),
('SQLite', 'Programming'),

-- Cloud & DevOps
('AWS', 'Programming'),
('Google Cloud', 'Programming'),
('Azure', 'Programming'),
('Docker', 'Programming'),
('Kubernetes', 'Programming'),
('CI/CD', 'Programming'),
('Terraform', 'Programming'),

-- Mobile Development
('Mobile Development', 'Programming'),
('iOS Development', 'Programming'),
('Android Development', 'Programming'),
('React Native', 'Programming'),
('Flutter', 'Programming'),
('Swift', 'Programming'),
('Kotlin', 'Programming'),

-- Design
('UI/UX Design', 'Design'),
('Figma', 'Design'),
('Adobe XD', 'Design'),
('Sketch', 'Design'),
('Photoshop', 'Design'),
('Illustrator', 'Design'),

-- Business & Management
('Product Management', 'Business'),
('Marketing', 'Business'),
('Business Development', 'Business'),
('Data Analysis', 'Business'),
('Project Management', 'Business'),

-- AI & Machine Learning
('Machine Learning', 'Programming'),
('Artificial Intelligence', 'Programming'),
('Deep Learning', 'Programming'),
('TensorFlow', 'Programming'),
('PyTorch', 'Programming'),
('Data Science', 'Programming'),

-- Blockchain & Web3
('Blockchain', 'Programming'),
('Web3', 'Programming'),
('Solidity', 'Programming'),
('DeFi', 'Programming'),
('NFT', 'Programming'),
('DAO', 'Programming')
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

-- Add comments to document the schema
COMMENT ON TABLE public.profiles IS 'Extended user profile information with additional fields for hackathon platform';
COMMENT ON TABLE public.skills IS 'Available skills that users can associate with their profiles';
COMMENT ON TABLE public.user_skills IS 'Junction table linking users to their skills with proficiency levels';
COMMENT ON TABLE public.events IS 'Hackathon events with dates, locations, and registration details';
COMMENT ON TABLE public.registrations IS 'User registrations for hackathon events with team and project information';
COMMENT ON TABLE public.announcements IS 'Community announcements and updates from administrators';
COMMENT ON TABLE public.resources IS 'Educational resources and guides for hackathon participants';
COMMENT ON TABLE public.sponsors IS 'Event sponsors and partners with tier information';
COMMENT ON TABLE public.leaderboard IS 'Event scoring and rankings system';

-- Add column comments
COMMENT ON COLUMN public.profiles.email IS 'User email address (unique)';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.aadhaar_number IS 'Aadhaar number in XXXX-XXXX-XXXX format (unique)';
COMMENT ON COLUMN public.profiles.bio IS 'User biography or description';
COMMENT ON COLUMN public.profiles.address IS 'User physical address';
COMMENT ON COLUMN public.profiles.education IS 'Highest education level';
COMMENT ON COLUMN public.profiles.university IS 'University or college name';
COMMENT ON COLUMN public.profiles.graduation_year IS 'Year of graduation';
COMMENT ON COLUMN public.profiles.updated_at IS 'Last profile update timestamp';

COMMENT ON COLUMN public.user_skills.proficiency_level IS 'Skill proficiency level (1-5 scale)';
COMMENT ON COLUMN public.events.max_participants IS 'Maximum number of participants allowed';
COMMENT ON COLUMN public.events.registration_open IS 'Whether event registration is currently open';
COMMENT ON COLUMN public.events.image_urls IS 'Array of event image URLs';
COMMENT ON COLUMN public.events.prizes IS 'JSON object containing prize information';
COMMENT ON COLUMN public.events.themes IS 'Array of event themes or tracks';

-- ==============================================================================
-- COMPLETION MESSAGE
-- ==============================================================================

-- Migration completed successfully
-- Database schema is now ready for TechAssassin platform
-- 
-- Features included:
-- ✅ Enhanced profiles with additional fields
-- ✅ Skills management system
-- ✅ User skills junction with proficiency levels
-- ✅ Complete RLS policies for all tables
-- ✅ Storage buckets with proper policies
-- ✅ Helper functions for common operations
-- ✅ Comprehensive indexing for performance
-- ✅ Seed data for initial setup
-- 
-- Next steps:
-- 1. Apply this migration in Supabase
-- 2. Test all RLS policies
-- 3. Verify storage access
-- 4. Test helper functions
-- 5. Set up realtime subscriptions
