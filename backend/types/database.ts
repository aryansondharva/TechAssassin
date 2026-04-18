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

export interface ForumCategory {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Thread {
  id: string
  title: string
  content: string
  category_id: string | null
  author_id: string
  view_count: number
  reply_count: number
  solved_reply_id: string | null
  is_locked: boolean
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface Reply {
  id: string
  thread_id: string
  author_id: string
  parent_reply_id: string | null
  content: string
  is_solution: boolean
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface ThreadTag {
  thread_id: string
  tag_id: string
  created_at: string
}

export interface ThreadReaction {
  id: string
  thread_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface Channel {
  id: string
  name: string
  slug: string
  description: string | null
  type: 'text' | 'voice' | 'mission'
  created_by: string | null
  created_at: string
}

export interface ChannelMember {
  id: string
  channel_id: string
  user_id: string
  role: 'member' | 'moderator' | 'owner'
  joined_at: string
}

export interface PresenceTracking {
  id: string
  user_id: string
  status: 'online' | 'offline'
  channel_id: string | null
  last_seen: string
  metadata: Record<string, any> | null
}

export interface ThreadView {
  id: string
  thread_id: string
  viewer_id: string | null
  viewed_at: string
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
      },
      forum_categories: {
        Row: ForumCategory
        Insert: Partial<ForumCategory>
        Update: Partial<ForumCategory>
        Relationships: []
      },
      threads: {
        Row: Thread
        Insert: Partial<Thread>
        Update: Partial<Thread>
        Relationships: [
          {
            foreignKeyName: "threads_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_solved_reply_id_fkey"
            columns: ["solved_reply_id"]
            referencedRelation: "replies"
            referencedColumns: ["id"]
          }
        ]
      },
      replies: {
        Row: Reply
        Insert: Partial<Reply>
        Update: Partial<Reply>
        Relationships: [
          {
            foreignKeyName: "replies_thread_id_fkey"
            columns: ["thread_id"]
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            referencedRelation: "replies"
            referencedColumns: ["id"]
          }
        ]
      },
      tags: {
        Row: Tag
        Insert: Partial<Tag>
        Update: Partial<Tag>
        Relationships: []
      },
      thread_tags: {
        Row: ThreadTag
        Insert: Partial<ThreadTag>
        Update: Partial<ThreadTag>
        Relationships: [
          {
            foreignKeyName: "thread_tags_thread_id_fkey"
            columns: ["thread_id"]
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      },
      thread_reactions: {
        Row: ThreadReaction
        Insert: Partial<ThreadReaction>
        Update: Partial<ThreadReaction>
        Relationships: [
          {
            foreignKeyName: "thread_reactions_thread_id_fkey"
            columns: ["thread_id"]
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_reactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      channels: {
        Row: Channel
        Insert: Partial<Channel>
        Update: Partial<Channel>
        Relationships: [
          {
            foreignKeyName: "channels_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      channel_members: {
        Row: ChannelMember
        Insert: Partial<ChannelMember>
        Update: Partial<ChannelMember>
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      presence_tracking: {
        Row: PresenceTracking
        Insert: Partial<PresenceTracking>
        Update: Partial<PresenceTracking>
        Relationships: [
          {
            foreignKeyName: "presence_tracking_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presence_tracking_channel_id_fkey"
            columns: ["channel_id"]
            referencedRelation: "channels"
            referencedColumns: ["id"]
          }
        ]
      },
      thread_views: {
        Row: ThreadView
        Insert: Partial<ThreadView>
        Update: Partial<ThreadView>
        Relationships: [
          {
            foreignKeyName: "thread_views_thread_id_fkey"
            columns: ["thread_id"]
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_views_viewer_id_fkey"
            columns: ["viewer_id"]
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
