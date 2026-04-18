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
 * Generate a UUID from Clerk user ID for database compatibility
 */
function generateUUIDFromClerkId(clerkUserId: string): string {
  // Create a consistent UUID from Clerk user ID
  // This ensures the same Clerk user always gets the same UUID
  const hash = clerkUserId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff
  }, 0)
  
  // Format as UUID
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `${hex.substring(0, 8)}-${hex.substring(0, 4)}-${hex.substring(0, 4)}-${hex.substring(0, 4)}-${hex.substring(0, 12)}`
}

/**
 * Get or create user profile with UUID mapping
 */
async function getOrCreateUserProfile(clerkUserId: string, supabase: SupabaseClient) {
  try {
    // Generate UUID from Clerk user ID
    const uuid = generateUUIDFromClerkId(clerkUserId)
    
    // Get current user info from Clerk
    const user = await currentUser()
    const email = user?.emailAddresses[0]?.emailAddress
    const username = user?.username || `user_${clerkUserId.split('_')[1]?.substring(0, 8) || 'unknown'}`
    
    // Try to find existing profile by generated UUID
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uuid)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError)
    }
    
    if (existingProfile) {
      // Update email if it has changed
      if (existingProfile.email !== email) {
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({ 
            email: email,
            updated_at: new Date().toISOString()
          })
          .eq('id', uuid)
          .select()
          .single()
        
        return updatedProfile
      }
      
      return existingProfile
    } else {
      // Create new profile with generated UUID
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: uuid,
          email: email,
          username: username.toLowerCase(),
          full_name: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || username,
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
      
      console.log(`Created profile for Clerk user ${clerkUserId} with UUID ${uuid}`)
      return newProfile
    }
  } catch (error) {
    console.error('Error in getOrCreateUserProfile:', error)
    throw error
  }
}

/**
 * Verify user session via Clerk and return authenticated user with Supabase client
 * This version handles Clerk user IDs by mapping them to UUIDs
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
    
    return { 
      user: { 
        id: profile.id, // Use the UUID from database
        clerkId: userId, // Keep Clerk ID for reference
        email: profile.email,
        username: profile.username
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
