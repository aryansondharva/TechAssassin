import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Authentication error thrown when user is not authenticated
 */
export class AuthenticationError extends Error {
  statusCode = 401
  
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization error thrown when user lacks required permissions
 */
export class AuthorizationError extends Error {
  statusCode = 403
  
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Result of authentication including user and authenticated client
 */
export interface AuthResult {
  user: any
  supabase: SupabaseClient
}

/**
 * Verify user session via Clerk and return authenticated user with Supabase client
 * Throws AuthenticationError (401) if not authenticated
 */
export async function requireAuthWithClient(): Promise<AuthResult> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new AuthenticationError('Authentication required')
  }
  
  // Create a Supabase client with the service role key for admin operations
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  )
  
  return { user: { id: userId }, supabase }
}

/**
 * Verify user session and return authenticated user
 * Throws AuthenticationError (401) if not authenticated
 */
export async function requireAuth(): Promise<any> {
  const { user } = await requireAuthWithClient()
  return user
}

/**
 * Verify user has admin privileges
 * Throws AuthorizationError (403) if user is not an admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  // Use service role to check admin status
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()
  
  if (error || !profile) {
    throw new AuthorizationError('Unable to verify admin status')
  }
  
  if (!profile.is_admin) {
    throw new AuthorizationError('Admin access required')
  }
}