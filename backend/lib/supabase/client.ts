import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

/**
 * Client-side Supabase client for use in React components
 * Uses cookies for session management
 * Automatically handles authentication state
 * 
 * Performance Optimizations:
 * - Requirement 9.2: Configure eventsPerSecond throttling for realtime
 * 
 * Gamification System:
 * - Supports real-time XP updates, badge unlocks, and rank changes
 * - Configured for optimal performance with gamification features
 */
export const createClient = () => {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10, // Throttle to 10 events/second (Requirement 9.2)
        },
      },
    }
  )
}
