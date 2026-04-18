-- View count tracking for threads using a helper table and function

-- Log of thread views (optional viewer tracking)
CREATE TABLE IF NOT EXISTS public.thread_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thread_views_thread_id ON public.thread_views(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_views_viewer_id ON public.thread_views(viewer_id);

-- Avoid duplicate view rows per viewer per day while still counting anonymous views
CREATE UNIQUE INDEX IF NOT EXISTS idx_thread_views_unique_daily
  ON public.thread_views (thread_id, viewer_id, date_trunc('day', viewed_at));

-- Function to increment thread view_count and optionally log the viewer
CREATE OR REPLACE FUNCTION public.increment_thread_view(p_thread_id UUID, p_viewer_id UUID DEFAULT NULL)
RETURNS public.threads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  thread_record public.threads%ROWTYPE;
BEGIN
  UPDATE public.threads
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = p_thread_id
  RETURNING * INTO thread_record;

  IF thread_record.id IS NOT NULL THEN
    -- Best-effort logging; ignore duplicates for the same viewer per day
    INSERT INTO public.thread_views (thread_id, viewer_id)
    VALUES (p_thread_id, p_viewer_id)
    ON CONFLICT (thread_id, viewer_id, date_trunc('day', viewed_at)) DO NOTHING;
  END IF;

  RETURN thread_record;
END;
$$;

COMMENT ON FUNCTION public.increment_thread_view IS
  'Increments threads.view_count and returns the updated thread. Call via RPC/select to record a view without an extra API round-trip.';

-- RLS for thread_views to protect viewer data
ALTER TABLE public.thread_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread views readable by viewers or admins"
  ON public.thread_views
  FOR SELECT
  USING (
    viewer_id IS NULL
    OR viewer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "Authenticated users can log their own views"
  ON public.thread_views
  FOR INSERT
  WITH CHECK (viewer_id IS NULL OR viewer_id = auth.uid());
