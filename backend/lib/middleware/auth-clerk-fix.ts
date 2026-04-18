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
 * Create a user mapping between Clerk and Supabase
 * This handles the UUID vs TEXT ID issue
 */
async function createOrUpdateUserMapping(clerkUserId: string, supabase: SupabaseClient) {
  try {
    // Get current user info from Clerk
    const user = await currentUser()
    
    // Try to find existing profile by email first
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', user?.emailAddresses[0]?.emailAddress)
      .single()
    
    if (existingProfile) {
      // Update existing profile to use Clerk user ID
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({ id: clerkUserId })
        .eq('id', existingProfile.id)
        .select()
        .single()
      
      return updatedProfile
    } else {
      // Create new profile with Clerk user ID
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: clerkUserId,
          email: user?.emailAddresses[0]?.emailAddress,
          username: user?.username || `user_${clerkUserId.split('_')[1]?.substring(0, 8) || 'unknown'}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
          profile_completion_percentage: 0
        })
        .select()
        .single()
      
      return newProfile
    }
  } catch (error) {
    console.error('Error creating user mapping:', error)
    throw error
  }
}

/**
 * Verify user session via Clerk and return authenticated user with Supabase client
 * Handles Clerk user ID vs Supabase UUID mismatch
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
  
  // Create or update user mapping
  try {
    await createOrUpdateUserMapping(userId, supabase)
  } catch (error) {
    console.error('Failed to create user mapping:', error)
    // Continue anyway - the profile might exist
  }
  
  return { 
    user: { 
      id: userId, // Use Clerk user ID
      email: (await currentUser())?.emailAddresses[0]?.emailAddress
    }, 
    supabase 
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
