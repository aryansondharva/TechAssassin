-- Volunteer Mentor Program MVP schema

-- Profile fields for mentor opt-in and visibility
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_mentor_available BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS mentor_experience_level TEXT CHECK (mentor_experience_level IN ('junior', 'mid', 'senior', 'expert')),
ADD COLUMN IF NOT EXISTS mentor_languages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mentor_timezone TEXT,
ADD COLUMN IF NOT EXISTS mentor_focus_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mentor_availability TEXT,
ADD COLUMN IF NOT EXISTS mentor_visibility TEXT DEFAULT 'public' CHECK (mentor_visibility IN ('public', 'community', 'private')),
ADD COLUMN IF NOT EXISTS is_mentor_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS mentor_total_sessions INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS mentor_rating NUMERIC(3,2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS mentor_rating_count INTEGER DEFAULT 0 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_mentor_available ON public.profiles(is_mentor_available);
CREATE INDEX IF NOT EXISTS idx_profiles_mentor_rating ON public.profiles(mentor_rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_mentor_timezone ON public.profiles(mentor_timezone);

-- Mentor help requests
CREATE TABLE IF NOT EXISTS public.mentor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beginner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  goal TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
  session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'call', 'pair_programming')),
  preferred_time_slots TEXT[] DEFAULT '{}',
  preferred_schedule_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'canceled', 'completed')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_requests_beginner_id ON public.mentor_requests(beginner_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_mentor_id ON public.mentor_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_status ON public.mentor_requests(status);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_created_at ON public.mentor_requests(created_at DESC);

-- Mentor sessions
CREATE TABLE IF NOT EXISTS public.mentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.mentor_requests(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  beginner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ,
  mentor_notes TEXT,
  beginner_notes TEXT,
  mentor_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
  beginner_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor_id ON public.mentor_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_beginner_id ON public.mentor_sessions(beginner_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_completed_at ON public.mentor_sessions(completed_at DESC);

-- Session feedback (1 rating per rater per session)
CREATE TABLE IF NOT EXISTS public.mentor_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mentor_sessions(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_feedback_rated_user_id ON public.mentor_feedback(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_feedback_session_id ON public.mentor_feedback(session_id);

-- Abuse reporting
CREATE TABLE IF NOT EXISTS public.mentor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.mentor_requests(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_reports_status ON public.mentor_reports(status);
CREATE INDEX IF NOT EXISTS idx_mentor_reports_reported_user_id ON public.mentor_reports(reported_user_id);

-- Block list
CREATE TABLE IF NOT EXISTS public.mentor_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(blocker_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_blocks_blocker_id ON public.mentor_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_mentor_blocks_blocked_user_id ON public.mentor_blocks(blocked_user_id);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.update_mentor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mentor_requests_updated_at_trigger ON public.mentor_requests;
CREATE TRIGGER update_mentor_requests_updated_at_trigger
  BEFORE UPDATE ON public.mentor_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mentor_updated_at();

DROP TRIGGER IF EXISTS update_mentor_sessions_updated_at_trigger ON public.mentor_sessions;
CREATE TRIGGER update_mentor_sessions_updated_at_trigger
  BEFORE UPDATE ON public.mentor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mentor_updated_at();

-- RLS
ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_blocks ENABLE ROW LEVEL SECURITY;

-- Mentor requests policies
DROP POLICY IF EXISTS "Users can create mentor requests for themselves" ON public.mentor_requests;
CREATE POLICY "Users can create mentor requests for themselves" ON public.mentor_requests
  FOR INSERT
  WITH CHECK (auth.uid() = beginner_id);

DROP POLICY IF EXISTS "Participants can view mentor requests" ON public.mentor_requests;
CREATE POLICY "Participants can view mentor requests" ON public.mentor_requests
  FOR SELECT
  USING (
    auth.uid() = beginner_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Participants can update mentor requests" ON public.mentor_requests;
CREATE POLICY "Participants can update mentor requests" ON public.mentor_requests
  FOR UPDATE
  USING (
    auth.uid() = beginner_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  )
  WITH CHECK (
    auth.uid() = beginner_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

-- Mentor sessions policies
DROP POLICY IF EXISTS "Participants can view mentor sessions" ON public.mentor_sessions;
CREATE POLICY "Participants can view mentor sessions" ON public.mentor_sessions
  FOR SELECT
  USING (
    auth.uid() = beginner_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Participants can create mentor sessions" ON public.mentor_sessions;
CREATE POLICY "Participants can create mentor sessions" ON public.mentor_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = beginner_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Participants can update mentor sessions" ON public.mentor_sessions;
CREATE POLICY "Participants can update mentor sessions" ON public.mentor_sessions
  FOR UPDATE
  USING (
    auth.uid() = beginner_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  )
  WITH CHECK (
    auth.uid() = beginner_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

-- Mentor feedback policies
DROP POLICY IF EXISTS "Participants can view mentor feedback" ON public.mentor_feedback;
CREATE POLICY "Participants can view mentor feedback" ON public.mentor_feedback
  FOR SELECT
  USING (
    auth.uid() = rater_id
    OR auth.uid() = rated_user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Users can create mentor feedback for themselves" ON public.mentor_feedback;
CREATE POLICY "Users can create mentor feedback for themselves" ON public.mentor_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

DROP POLICY IF EXISTS "Users can update their own mentor feedback" ON public.mentor_feedback;
CREATE POLICY "Users can update their own mentor feedback" ON public.mentor_feedback
  FOR UPDATE
  USING (auth.uid() = rater_id)
  WITH CHECK (auth.uid() = rater_id);

-- Mentor reports policies
DROP POLICY IF EXISTS "Users can create their own mentor reports" ON public.mentor_reports;
CREATE POLICY "Users can create their own mentor reports" ON public.mentor_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Reporters and admins can view mentor reports" ON public.mentor_reports;
CREATE POLICY "Reporters and admins can view mentor reports" ON public.mentor_reports
  FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Admins can update mentor reports" ON public.mentor_reports;
CREATE POLICY "Admins can update mentor reports" ON public.mentor_reports
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

-- Block policies
DROP POLICY IF EXISTS "Users can manage their own blocks" ON public.mentor_blocks;
CREATE POLICY "Users can manage their own blocks" ON public.mentor_blocks
  FOR ALL
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);
