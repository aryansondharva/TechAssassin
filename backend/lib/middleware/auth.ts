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
  user: {
    id: string
    clerkId: string
    email?: string
  }
  supabase: SupabaseClient
}

/**
 * Verify user session via Clerk and return authenticated user with Supabase client.
 * This handles the Clerk -> Supabase connection by passing the Clerk JWT token.
 */
export async function requireAuthWithClient(): Promise<AuthResult> {
  const { userId, getToken } = await auth()
  
  if (!userId) {
    throw new AuthenticationError('Authentication required')
  }
  
  // Get the Clerk JWT for Supabase (using the 'supabase' template)
  const token = await getToken({ template: 'supabase' })

  if (!token) {
    throw new AuthenticationError('Failed to retrieve Clerk JWT for Supabase. Ensure you have created the "supabase" JWT template in the Clerk Dashboard.')
  }

  // Initialize Supabase client with the Clerk JWT token
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false
      }
    }
  )

  const clerkUser = await currentUser()
  const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase()
  
  return {
    user: {
      id: userId,
      clerkId: userId,
      email: primaryEmail,
    },
    supabase,
  }
}

/**
 * Verify user session and return authenticated user object
 * Throws AuthenticationError (401) if not authenticated
 */
export async function requireAuth(): Promise<any> {
  const { user } = await requireAuthWithClient()
  return user
}

/**
 * Verify user has admin privileges in Supabase
 * Throws AuthorizationError (403) if user is not an admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  // Use service role to check admin status (requires bypassing RLS)
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
    console.error('Admin verification failed:', error)
    throw new AuthorizationError('Unable to verify admin status')
  }
  
  if (!profile.is_admin) {
    throw new AuthorizationError('Admin access required')
  }
}
