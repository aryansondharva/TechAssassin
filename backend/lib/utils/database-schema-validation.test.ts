import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Database Schema Validation (Migration Files)', () => {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

  describe('Migration Files Existence', () => {
    it('should have profiles table migration', () => {
      const filePath = join(migrationsDir, '20260207000001_create_profiles_table.sql')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should have events table migration', () => {
      const filePath = join(migrationsDir, '20260207000002_create_events_table.sql')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should have registrations table migration', () => {
      const filePath = join(migrationsDir, '20260207000003_create_registrations_table.sql')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should have announcements table migration', () => {
      const filePath = join(migrationsDir, '20260207000004_create_announcements_table.sql')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should have resources table migration', () => {
      const filePath = join(migrationsDir, '20260207000005_create_resources_table.sql')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should have sponsors table migration', () => {
      const filePath = join(migrationsDir, '20260207000006_create_sponsors_table.sql')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should have leaderboard table migration', () => {
      const filePath = join(migrationsDir, '20260207000007_create_leaderboard_table.sql')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should have profile trigger migration', () => {
      const filePath = join(migrationsDir, '20260207000008_create_profile_trigger.sql')
      expect(existsSync(filePath)).toBe(true)
    })
  })

  describe('Profiles Table Schema', () => {
    const filePath = join(migrationsDir, '20260207000001_create_profiles_table.sql')
    const content = readFileSync(filePath, 'utf-8')

    it('should create profiles table with correct columns', () => {
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.profiles')
      expect(content).toContain('id UUID PRIMARY KEY')
      expect(content).toContain('username TEXT NOT NULL')
      expect(content).toContain('full_name TEXT')
      expect(content).toContain('avatar_url TEXT')
      expect(content).toContain('github_url TEXT')
      expect(content).toContain('skills TEXT[]')
      expect(content).toContain('is_admin BOOLEAN')
      expect(content).toContain('created_at TIMESTAMPTZ')
    })

    it('should have unique constraint on username', () => {
      expect(content).toContain('profiles_username_unique')
      expect(content).toContain('UNIQUE (username)')
    })

    it('should have index on username', () => {
      expect(content).toContain('idx_profiles_username')
      expect(content).toContain('ON public.profiles(username)')
    })

    it('should reference auth.users with cascade delete', () => {
      expect(content).toContain('REFERENCES auth.users(id)')
      expect(content).toContain('ON DELETE CASCADE')
    })
  })

  describe('Events Table Schema', () => {
    const filePath = join(migrationsDir, '20260207000002_create_events_table.sql')
    const content = readFileSync(filePath, 'utf-8')

    it('should create events table with correct columns', () => {
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.events')
      expect(content).toContain('id UUID PRIMARY KEY')
      expect(content).toContain('title TEXT NOT NULL')
      expect(content).toContain('description TEXT NOT NULL')
      expect(content).toContain('start_date TIMESTAMPTZ NOT NULL')
      expect(content).toContain('end_date TIMESTAMPTZ NOT NULL')
      expect(content).toContain('location TEXT NOT NULL')
      expect(content).toContain('max_participants INTEGER NOT NULL')
      expect(content).toContain('registration_open BOOLEAN')
      expect(content).toContain('image_urls TEXT[]')
      expect(content).toContain('prizes JSONB')
      expect(content).toContain('themes TEXT[]')
      expect(content).toContain('created_at TIMESTAMPTZ')
    })

    it('should have check constraint on max_participants', () => {
      expect(content).toContain('CHECK (max_participants > 0)')
    })

    it('should have index on start_date', () => {
      expect(content).toContain('idx_events_start_date')
      expect(content).toContain('ON public.events(start_date)')
    })
  })

  describe('Registrations Table Schema', () => {
    const filePath = join(migrationsDir, '20260207000003_create_registrations_table.sql')
    const content = readFileSync(filePath, 'utf-8')

    it('should create registrations table with correct columns', () => {
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.registrations')
      expect(content).toContain('id UUID PRIMARY KEY')
      expect(content).toContain('user_id UUID NOT NULL')
      expect(content).toContain('event_id UUID NOT NULL')
      expect(content).toContain('team_name TEXT NOT NULL')
      expect(content).toContain('project_idea TEXT NOT NULL')
      expect(content).toContain('status TEXT NOT NULL')
      expect(content).toContain('created_at TIMESTAMPTZ')
    })

    it('should have check constraint on status', () => {
      expect(content).toContain("CHECK (status IN ('pending', 'confirmed', 'waitlisted'))")
    })

    it('should have unique constraint on (user_id, event_id)', () => {
      expect(content).toContain('registrations_user_event_unique')
      expect(content).toContain('UNIQUE (user_id, event_id)')
    })

    it('should have foreign keys with cascade delete', () => {
      expect(content).toContain('REFERENCES public.profiles(id)')
      expect(content).toContain('REFERENCES public.events(id)')
      expect(content).toContain('ON DELETE CASCADE')
    })

    it('should have indexes on event_id and user_id', () => {
      expect(content).toContain('idx_registrations_event_id')
      expect(content).toContain('idx_registrations_user_id')
      expect(content).toContain('ON public.registrations(event_id)')
      expect(content).toContain('ON public.registrations(user_id)')
    })
  })

  describe('Announcements Table Schema', () => {
    const filePath = join(migrationsDir, '20260207000004_create_announcements_table.sql')
    const content = readFileSync(filePath, 'utf-8')

    it('should create announcements table with correct columns', () => {
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.announcements')
      expect(content).toContain('id UUID PRIMARY KEY')
      expect(content).toContain('author_id UUID NOT NULL')
      expect(content).toContain('content TEXT NOT NULL')
      expect(content).toContain('created_at TIMESTAMPTZ')
      expect(content).toContain('updated_at TIMESTAMPTZ')
    })

    it('should have foreign key to profiles with cascade delete', () => {
      expect(content).toContain('REFERENCES public.profiles(id)')
      expect(content).toContain('ON DELETE CASCADE')
    })

    it('should have index on created_at DESC', () => {
      expect(content).toContain('idx_announcements_created_at')
      expect(content).toContain('ON public.announcements(created_at DESC)')
    })
  })

  describe('Resources Table Schema', () => {
    const filePath = join(migrationsDir, '20260207000005_create_resources_table.sql')
    const content = readFileSync(filePath, 'utf-8')

    it('should create resources table with correct columns', () => {
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.resources')
      expect(content).toContain('id UUID PRIMARY KEY')
      expect(content).toContain('title TEXT NOT NULL')
      expect(content).toContain('description TEXT NOT NULL')
      expect(content).toContain('content_url TEXT NOT NULL')
      expect(content).toContain('category TEXT NOT NULL')
      expect(content).toContain('created_at TIMESTAMPTZ')
    })

    it('should have index on category', () => {
      expect(content).toContain('idx_resources_category')
      expect(content).toContain('ON public.resources(category)')
    })
  })

  describe('Sponsors Table Schema', () => {
    const filePath = join(migrationsDir, '20260207000006_create_sponsors_table.sql')
    const content = readFileSync(filePath, 'utf-8')

    it('should create sponsors table with correct columns', () => {
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.sponsors')
      expect(content).toContain('id UUID PRIMARY KEY')
      expect(content).toContain('name TEXT NOT NULL')
      expect(content).toContain('logo_url TEXT NOT NULL')
      expect(content).toContain('website_url TEXT NOT NULL')
      expect(content).toContain('tier TEXT NOT NULL')
      expect(content).toContain('description TEXT')
      expect(content).toContain('created_at TIMESTAMPTZ')
    })

    it('should have check constraint on tier', () => {
      expect(content).toContain("CHECK (tier IN ('gold', 'silver', 'bronze'))")
    })
  })

  describe('Leaderboard Table Schema', () => {
    const filePath = join(migrationsDir, '20260207000007_create_leaderboard_table.sql')
    const content = readFileSync(filePath, 'utf-8')

    it('should create leaderboard table with correct columns', () => {
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.leaderboard')
      expect(content).toContain('id UUID PRIMARY KEY')
      expect(content).toContain('event_id UUID NOT NULL')
      expect(content).toContain('user_id UUID NOT NULL')
      expect(content).toContain('score INTEGER NOT NULL')
      expect(content).toContain('rank INTEGER NOT NULL')
      expect(content).toContain('updated_at TIMESTAMPTZ')
    })

    it('should have check constraints on score and rank', () => {
      expect(content).toContain('CHECK (score >= 0)')
      expect(content).toContain('CHECK (rank >= 0)')
    })

    it('should have foreign keys with cascade delete', () => {
      expect(content).toContain('REFERENCES public.events(id)')
      expect(content).toContain('REFERENCES public.profiles(id)')
      expect(content).toContain('ON DELETE CASCADE')
    })

    it('should have composite index on (event_id, rank)', () => {
      expect(content).toContain('idx_leaderboard_event_rank')
      expect(content).toContain('ON public.leaderboard(event_id, rank)')
    })
  })

  describe('Profile Trigger', () => {
    const filePath = join(migrationsDir, '20260207000008_create_profile_trigger.sql')
    const content = readFileSync(filePath, 'utf-8')

    it('should create handle_new_user function', () => {
      expect(content).toContain('CREATE OR REPLACE FUNCTION public.handle_new_user()')
      expect(content).toContain('RETURNS TRIGGER')
      expect(content).toContain('INSERT INTO public.profiles')
    })

    it('should set default values for new profiles', () => {
      expect(content).toContain('is_admin')
      expect(content).toContain('FALSE')
      expect(content).toContain("'{}'") // Empty array for skills
    })

    it('should create trigger on auth.users', () => {
      expect(content).toContain('CREATE TRIGGER on_auth_user_created')
      expect(content).toContain('AFTER INSERT ON auth.users')
      expect(content).toContain('EXECUTE FUNCTION public.handle_new_user()')
    })
  })
})
