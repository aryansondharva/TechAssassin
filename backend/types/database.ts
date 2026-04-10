// Database type definitions
// This file will be populated with database types as the schema is implemented

export interface Profile {
  id: string
  username: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  gender: string | null
  tshirt_size: string | null
  phone: string | null
  aadhaar_number: string | null
  avatar_url: string | null
  github_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  portfolio_url: string | null
  bio: string | null
  readme: string | null
  address: string | null
  dietary_preference: string | null
  allergies: string | null
  has_education: boolean
  education: string | null
  university: string | null
  degree_type: string | null
  graduation_year: number | null
  graduation_month: string | null
  roles: string[] | null
  resume_url: string | null
  has_experience: boolean
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  is_admin: boolean
  total_xp: number
  current_rank_id: string | null
  current_streak: number
  longest_streak: number
  profile_completion_percentage: number
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
  checked_in_at: string | null
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
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
        Relationships: []
      }
      events: {
        Row: Event
        Insert: Partial<Event>
        Update: Partial<Event>
        Relationships: []
      }
      registrations: {
        Row: Registration
        Insert: Partial<Registration>
        Update: Partial<Registration>
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: Announcement
        Insert: Partial<Announcement>
        Update: Partial<Announcement>
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      resources: {
        Row: Resource
        Insert: Partial<Resource>
        Update: Partial<Resource>
        Relationships: []
      }
      sponsors: {
        Row: Sponsor
        Insert: Partial<Sponsor>
        Update: Partial<Sponsor>
        Relationships: []
      }
      leaderboard: {
        Row: LeaderboardEntry
        Insert: Partial<LeaderboardEntry>
        Update: Partial<LeaderboardEntry>
        Relationships: [
          {
            foreignKeyName: "leaderboard_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
