// Database type definitions
// This file will be populated with database types as the schema is implemented

export interface Profile {
  id: string
  username: string
  email: string
  full_name: string | null
  phone: string | null
  aadhaar_number: string | null
  avatar_url: string | null
  github_url: string | null
  bio: string | null
  address: string | null
  education: string | null
  university: string | null
  graduation_year: number | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  max_participants: number
  registration_open: boolean
  image_urls: string[]
  prizes: Record<string, any> | null
  themes: string[]
  created_at: string
}

export interface Registration {
  id: string
  user_id: string
  event_id: string
  team_name: string
  project_idea: string
  status: 'pending' | 'confirmed' | 'waitlisted'
  created_at: string
}

export interface Announcement {
  id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Resource {
  id: string
  title: string
  description: string
  content_url: string
  category: string
  created_at: string
}

export interface Sponsor {
  id: string
  name: string
  logo_url: string
  website_url: string
  tier: 'gold' | 'silver' | 'bronze'
  description: string | null
  created_at: string
}

export interface LeaderboardEntry {
  id: string
  event_id: string
  user_id: string
  score: number
  rank: number
  updated_at: string
  user?: Profile
}

// API Response Types

export interface EventWithParticipants extends Event {
  participant_count: number
  status: 'live' | 'upcoming' | 'past'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  error: string
  details?: any
}

// Supabase Database Type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Profile>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'created_at'>
        Update: Partial<Event>
      }
      registrations: {
        Row: Registration
        Insert: Omit<Registration, 'created_at'>
        Update: Partial<Registration>
      }
      announcements: {
        Row: Announcement
        Insert: Omit<Announcement, 'created_at' | 'updated_at'>
        Update: Partial<Announcement>
      }
      resources: {
        Row: Resource
        Insert: Omit<Resource, 'created_at'>
        Update: Partial<Resource>
      }
      sponsors: {
        Row: Sponsor
        Insert: Omit<Sponsor, 'created_at'>
        Update: Partial<Sponsor>
      }
      leaderboard: {
        Row: LeaderboardEntry
        Insert: Omit<LeaderboardEntry, 'updated_at'>
        Update: Partial<LeaderboardEntry>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
