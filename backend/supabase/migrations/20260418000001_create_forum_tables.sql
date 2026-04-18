-- Create forum tables for categories, threads, replies, tags, and reactions

-- Categories
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Threads
CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES public.forum_categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  solved_reply_id UUID,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Replies (supports one-level nesting via parent_reply_id)
CREATE TABLE IF NOT EXISTS public.replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES public.replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add solved reply foreign key after replies exist
ALTER TABLE public.threads
  ADD CONSTRAINT threads_solved_reply_id_fkey
  FOREIGN KEY (solved_reply_id) REFERENCES public.replies(id) ON DELETE SET NULL;

-- Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Thread-tags junction
CREATE TABLE IF NOT EXISTS public.thread_tags (
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (thread_id, tag_id)
);

-- Thread reactions (emoji-based)
CREATE TABLE IF NOT EXISTS public.thread_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (thread_id, user_id, emoji)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forum_categories_slug ON public.forum_categories(slug);

CREATE INDEX IF NOT EXISTS idx_threads_category ON public.threads(category_id);
CREATE INDEX IF NOT EXISTS idx_threads_author ON public.threads(author_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON public.threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_last_activity ON public.threads(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_replies_thread ON public.replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent ON public.replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_replies_author ON public.replies(author_id);

CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_thread_tags_thread ON public.thread_tags(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_tags_tag ON public.thread_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_thread_reactions_thread ON public.thread_reactions(thread_id);
