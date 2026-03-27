/**
 * Supabase Client Utility
 * 
 * Provides convenient access to Supabase clients for both server-side and client-side usage.
 * This utility is used throughout the gamification system for database operations.
 * 
 * Server-side client: Uses service role key for admin operations (bypasses RLS)
 * Client-side client: Uses anon key for user operations (respects RLS policies)
 */

import { createClient as createServerSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client with service role key
 * Use this for:
 * - Admin operations
 * - Backend services (XP, Badge, Rank services)
 * - Operations that need to bypass RLS
 * 
 * @returns Supabase client with service role privileges
 */
export function getServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Client-side Supabase client with anon key
 * Use this for:
 * - Frontend components
 * - User-facing operations
 * - Operations that should respect RLS policies
 * 
 * @returns Supabase client with anon key
 */
export function getClientSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  })
}

/**
 * Type-safe database query helper
 * Provides better error handling and type inference
 */
export async function executeQuery<T>(
  queryFn: (client: ReturnType<typeof getServerClient>) => Promise<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const client = getServerClient()
    const data = await queryFn(client)
    return { data, error: null }
  } catch (error) {
    console.error('Database query error:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown database error') 
    }
  }
}
