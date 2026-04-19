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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  const clerkUser = await currentUser()
  const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase()

  let resolvedUserId = userId

  // Clerk user IDs are non-UUID strings (for example: "user_xxx"), while this
  // codebase stores Supabase profile IDs as UUIDs for relational joins.
  // For Clerk-authenticated requests, resolve the internal Supabase profile ID
  // by the Clerk user's primary email.
  if (!UUID_REGEX.test(userId)) {
    if (!primaryEmail) {
      throw new AuthenticationError('Unable to resolve user email from Clerk session')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', primaryEmail)
      .single()

    // PGRST116 = no rows returned for .single()
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Failed to resolve Supabase profile for Clerk user:', profileError)
      throw new AuthenticationError('Unable to resolve user profile')
    }

    if (profile?.id) {
      resolvedUserId = profile.id
    } else {
      throw new AuthenticationError('User profile not found. Ensure Clerk webhook sync is configured.')
    }
  }
  
  return {
    user: {
      id: resolvedUserId,
      clerk_id: userId,
      email: primaryEmail,
    },
    supabase,
  }
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
