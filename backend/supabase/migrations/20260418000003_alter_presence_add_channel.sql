-- Ensure presence tracking supports channel-scoped presence

-- Create presence_tracking table if it does not exist
CREATE TABLE IF NOT EXISTS public.presence_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add channel_id to scope presence to a channel/room
ALTER TABLE public.presence_tracking
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE;

-- Indexes to support presence queries
CREATE INDEX IF NOT EXISTS idx_presence_tracking_user_id ON public.presence_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_tracking_status ON public.presence_tracking(status);
CREATE INDEX IF NOT EXISTS idx_presence_tracking_last_seen ON public.presence_tracking(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_presence_tracking_channel_id ON public.presence_tracking(channel_id);
