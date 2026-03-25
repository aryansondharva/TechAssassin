import { createClient } from '../supabase/server'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import type { User } from '@supabase/supabase-js'

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
  user: User
  supabase: SupabaseClient
}

/**
 * Verify user session and return authenticated user with Supabase client
 * Supports both cookie-based and Bearer token authentication
 * Throws AuthenticationError (401) if not authenticated
 * 
 * @returns Authenticated user object and Supabase client
 * @throws {AuthenticationError} When user is not authenticated
 * 
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const { user, supabase } = await requireAuthWithClient()
 *   // User is authenticated, use supabase client for queries
 * }
 * ```
 */
export async function requireAuthWithClient(): Promise<AuthResult> {
  // First, try to get the Authorization header
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Extract token from Bearer header
    const token = authHeader.substring(7)
    
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
    
    // Get user with the token using anon key client
    const anonClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )
    
    const { data: { user }, error } = await anonClient.auth.getUser(token)
    
    if (error || !user) {
      throw new AuthenticationError('Invalid or expired token')
    }
    
    return { user, supabase }
  }
  
  // Fall back to cookie-based authentication
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new AuthenticationError('Authentication required')
  }
  
  return { user, supabase }
}

/**
 * Verify user session and return authenticated user
 * Supports both cookie-based and Bearer token authentication
 * Throws AuthenticationError (401) if not authenticated
 * 
 * @returns Authenticated user object
 * @throws {AuthenticationError} When user is not authenticated
 * 
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const user = await requireAuth()
 *   // User is authenticated, proceed with logic
 * }
 * ```
 */
export async function requireAuth(): Promise<User> {
  const { user } = await requireAuthWithClient()
  return user
}

/**
 * Verify user has admin privileges
 * Throws AuthorizationError (403) if user is not an admin
 * 
 * @param userId - The user ID to check for admin status
 * @throws {AuthorizationError} When user is not an admin
 * 
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const user = await requireAuth()
 *   await requireAdmin(user.id)
 *   // User is admin, proceed with admin operation
 * }
 * ```
 */
export async function requireAdmin(userId: string): Promise<void> {
  const supabase = await createClient()
  
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