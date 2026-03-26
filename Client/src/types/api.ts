/**
 * TypeScript types for TechAssassin Backend API
 * 
 * These types match the backend database schema and API responses.
 * Keep these in sync with backend/types/database.ts
 */

// ============================================================================
// Database Models
// ============================================================================

export interface Profile {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  aadhaar_number: string | null;
  avatar_url: string | null;
  github_url: string | null;
  bio: string | null;
  address: string | null;
  education: string | null;
  university: string | null;
  graduation_year: number | null;
  interests: string[] | null;
  banner_url: string | null;
  is_email_public: boolean;
  is_phone_public: boolean;
  is_address_public: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants: number;
  registration_open: boolean;
  image_urls: string[];
  prizes: Record<string, any> | null;
  themes: string[];
  created_at: string;
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  team_name: string;
  project_idea: string;
  status: 'pending' | 'confirmed' | 'waitlisted';
  created_at: string;
}

export interface Announcement {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile; // Joined data
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  content_url: string;
  category: string;
  created_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url: string;
  tier: 'gold' | 'silver' | 'bronze';
  description: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  event_id: string;
  user_id: string;
  score: number;
  rank: number;
  updated_at: string;
  user?: Profile; // Joined data
}

// ============================================================================
// API Response Types
// ============================================================================

export interface EventWithParticipants extends Event {
  participant_count: number;
  status: 'live' | 'upcoming' | 'past';
}

export interface RegistrationWithEvent extends Registration {
  event?: Event;
}

export interface RegistrationWithUser extends Registration {
  user?: Profile;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  details?: any;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  message: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  aadhaar_number?: string;
  avatar_url?: string;
  github_url?: string;
  bio?: string;
  address?: string;
  education?: string;
  university?: string;
  graduation_year?: number;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Profile;
  token: string;
}

export interface ResetPasswordRequest {
  email: string;
}

// ============================================================================
// Profile Types
// ============================================================================

export interface ProfileUpdateRequest {
  username?: string;
  full_name?: string;
  bio?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  skills?: string[];
  university?: string;
  education?: string;
  graduation_year?: number;
  phone?: string;
  address?: string;
  interests?: string[];
  banner_url?: string;
}

export interface AvatarUploadResponse {
  avatar_url: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface EventCreateRequest {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants: number;
  registration_open?: boolean;
  prizes?: Record<string, any>;
  themes?: string[];
}

export interface EventUpdateRequest extends Partial<EventCreateRequest> {}

export interface EventFilterParams {
  status?: 'live' | 'upcoming' | 'past';
  page?: number;
  limit?: number;
}

export interface EventImageUploadResponse {
  image_urls: string[];
}

// ============================================================================
// Registration Types
// ============================================================================

export interface RegistrationCreateRequest {
  event_id: string;
  team_name: string;
  project_idea: string;
}

export interface RegistrationUpdateRequest {
  status: 'pending' | 'confirmed' | 'waitlisted';
}

// ============================================================================
// Announcement Types
// ============================================================================

export interface AnnouncementCreateRequest {
  content: string;
}

export interface AnnouncementUpdateRequest {
  content: string;
}

export interface AnnouncementListParams {
  page?: number;
  limit?: number;
}

// ============================================================================
// Resource Types
// ============================================================================

export interface ResourceCreateRequest {
  title: string;
  description: string;
  content_url: string;
  category: string;
}

export interface ResourceUpdateRequest extends Partial<ResourceCreateRequest> {}

export interface ResourceFilterParams {
  category?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Sponsor Types
// ============================================================================

export interface SponsorCreateRequest {
  name: string;
  logo_url: string;
  website_url: string;
  tier: 'gold' | 'silver' | 'bronze';
  description?: string;
}

export interface SponsorUpdateRequest extends Partial<SponsorCreateRequest> {}

export interface SponsorLogoUploadResponse {
  logo_url: string;
}

// ============================================================================
// Leaderboard Types
// ============================================================================

export interface LeaderboardUpdateRequest {
  event_id: string;
  user_id: string;
  score: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type EventStatus = 'live' | 'upcoming' | 'past';
export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted';
export type SponsorTier = 'gold' | 'silver' | 'bronze';
