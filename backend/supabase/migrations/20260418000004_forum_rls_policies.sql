-- Row Level Security policies for forum, channels, and presence tables

-- Helper condition used in policies
-- Admin check used across policies
-- (Repeated inline for clarity; no stored function required)

-- Forum categories
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forum categories are viewable by everyone"
  ON public.forum_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage forum categories"
  ON public.forum_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- Threads
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Threads are viewable by everyone"
  ON public.threads
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create threads"
  ON public.threads
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors or admins can update threads"
  ON public.threads
  FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  )
  WITH CHECK (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "Authors or admins can delete threads"
  ON public.threads
  FOR DELETE
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

-- Replies
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies are viewable by everyone"
  ON public.replies
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON public.replies
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors or admins can update replies"
  ON public.replies
  FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  )
  WITH CHECK (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "Authors or admins can delete replies"
  ON public.replies
  FOR DELETE
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

-- Tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone"
  ON public.tags
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage tags"
  ON public.tags
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

-- Thread tags
ALTER TABLE public.thread_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread tags are viewable by everyone"
  ON public.thread_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Thread authors or admins can tag threads"
  ON public.thread_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.threads t
      WHERE t.id = thread_id AND (
        t.author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
      )
    )
  );

CREATE POLICY "Thread authors or admins can remove tags"
  ON public.thread_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.threads t
      WHERE t.id = thread_id AND (
        t.author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
      )
    )
  );

-- Thread reactions
ALTER TABLE public.thread_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread reactions are viewable by everyone"
  ON public.thread_reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can react to threads"
  ON public.thread_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
  ON public.thread_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channels are viewable by everyone"
  ON public.channels
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can create channels"
  ON public.channels
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "Admins or creators can update channels"
  ON public.channels
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "Admins or creators can delete channels"
  ON public.channels
  FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

-- Channel members
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channel membership viewable by authenticated users"
  ON public.channel_members
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join channels"
  ON public.channel_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave channels"
  ON public.channel_members
  FOR DELETE
  USING (auth.uid() = user_id);

-- Presence tracking
ALTER TABLE public.presence_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Presence is readable by authenticated users"
  ON public.presence_tracking
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can track their own presence"
  ON public.presence_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence"
  ON public.presence_tracking
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
