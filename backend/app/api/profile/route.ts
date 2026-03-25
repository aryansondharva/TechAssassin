import { NextResponse } from 'next/server'
import { requireAuth, requireAuthWithClient, requireAdmin } from '@/lib/middleware/auth'
import { profileUpdateSchema } from '@/lib/validations/profile'
import { handleApiError, NotFoundError, ConflictError, AuthorizationError } from '@/lib/errors'
import { deleteAvatar } from '@/lib/storage/cleanup'
import type { Profile } from '@/types/database'

/**
 * GET /api/profile
 * Get current user's profile with all fields
 * Returns 404 if profile doesn't exist yet
 * Requirements: 3.5
 */
export async function GET() {
  try {
    // Verify authentication and get client
    const { user, supabase } = await requireAuthWithClient()
    
    // Fetch user's profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      // Check if profile doesn't exist
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Profile not found. Please create your profile.')
      }
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }
    
    if (!profile) {
      throw new NotFoundError('Profile not found. Please create your profile.')
    }
    
    return NextResponse.json(profile as Profile)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile (or create if doesn't exist)
 * Validates input with profileUpdateSchema
 * Checks username uniqueness
 * Prevents is_admin modification
 * Requirements: 3.1, 3.2, 3.4, 3.7
 */
export async function PATCH(request: Request) {
  try {
    // Verify authentication and get client
    const { user, supabase } = await requireAuthWithClient()
    
    // Parse and validate request body
    const body = await request.json()
    
    // Validate input with Zod schema
    const validatedData = profileUpdateSchema.parse(body)
    
    // Prevent is_admin modification
    if ('is_admin' in body) {
      throw new AuthorizationError('Cannot modify admin status')
    }
    
    // If username is being updated, check uniqueness
    if (validatedData.username) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', validatedData.username)
        .neq('id', user.id)
        .single()
      
      if (existingProfile) {
        throw new ConflictError('Username already taken')
      }
    }
    
    // Check if profile exists
    const { data: existingUserProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    
    let updatedProfile
    let error
    
    if (existingUserProfile) {
      // Update existing profile
      const result = await supabase
        .from('profiles')
        .update(validatedData)
        .eq('id', user.id)
        .select()
        .single()
      
      updatedProfile = result.data
      error = result.error
    } else {
      // Create new profile
      const result = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          ...validatedData
        })
        .select()
        .single()
      
      updatedProfile = result.data
      error = result.error
    }
    
    if (error) {
      throw new Error(`Failed to save profile: ${error.message}`)
    }
    
    return NextResponse.json(updatedProfile as Profile)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/profile
 * Delete current user's profile
 * Cleans up avatar from storage
 * Requirements: 15.7
 */
export async function DELETE() {
  try {
    // Verify authentication and get client
    const { user, supabase } = await requireAuthWithClient()
    
    // Delete profile from database
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)
    
    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`)
    }
    
    // Clean up avatar from storage
    // Handle cleanup errors gracefully (log but don't fail deletion)
    try {
      await deleteAvatar(user.id)
    } catch (cleanupError) {
      console.error(`Failed to clean up avatar for user ${user.id}:`, cleanupError)
      // Continue - profile deletion was successful
    }
    
    return NextResponse.json(
      { message: 'Profile deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
