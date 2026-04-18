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
 * Get or create user profile from Clerk user data
 * This handles the complete Clerk -> Supabase integration
 */
async function getOrCreateUserProfile(clerkUserId: string, supabase: SupabaseClient) {
  try {
    // Get current user info from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      throw new AuthenticationError('Clerk user not found')
    }
    
    const email = clerkUser.emailAddresses[0]?.emailAddress
    const username = clerkUser.username || `user_${clerkUserId.substring(6, 14)}`
    const fullName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || username
    
    // Try to find existing profile by clerk_user_id
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError)
      throw fetchError
    }
    
    if (existingProfile) {
      // Update profile if Clerk data has changed
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({ 
          email: email,
          username: username.toLowerCase(),
          full_name: fullName,
          email_verified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          clerk_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', clerkUserId)
        .select()
        .single()
      
      return updatedProfile
    } else {
      // Create new profile with Clerk user data
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(), // Generate UUID for internal use
          clerk_user_id: clerkUserId,
          email: email,
          username: username.toLowerCase(),
          full_name: fullName,
          email_verified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          clerk_created_at: new Date().toISOString(),
          clerk_updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
          profile_completion_percentage: 0
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Error creating profile:', insertError)
        throw insertError
      }
      
      console.log(`Created profile for Clerk user ${clerkUserId}`)
      return newProfile
    }
  } catch (error) {
    console.error('Error in getOrCreateUserProfile:', error)
    throw error
  }
}

/**
 * Verify user session via Clerk and return authenticated user with Supabase client
 * This is the main authentication function for Clerk integration
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
  
  // Get or create user profile
  try {
    const profile = await getOrCreateUserProfile(userId, supabase)
    
    // Set the current clerk user ID in the session for RLS policies
    await supabase.rpc('set_clerk_user_id', { clerk_user_id: userId })
    
    return { 
      user: { 
        id: profile.id, // Use the internal UUID for database operations
        clerkId: userId, // Keep Clerk ID for reference
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        email_verified: profile.email_verified
      }, 
      supabase 
    }
  } catch (error) {
    console.error('Failed to get or create user profile:', error)
    throw new AuthenticationError('Failed to authenticate user')
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

/**
 * Helper function to get current user's clerk ID
 */
export async function getCurrentClerkUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId || null
}

/**
 * Helper function to get current user's profile
 */
export async function getCurrentUserProfile(): Promise<any> {
  const { user } = await requireAuthWithClient()
  return user
}
