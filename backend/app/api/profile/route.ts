import { NextResponse } from 'next/server'
import { requireAuth, requireAuthWithClient, requireAdmin } from '@/lib/middleware/auth'
import { profileUpdateSchema } from '@/lib/validations/profile'
import { handleApiError, NotFoundError, ConflictError, AuthorizationError } from '@/lib/errors'
import { deleteAvatar } from '@/lib/storage/cleanup'
import type { Profile } from '@/types/database'

/**
 * GET /api/profile
 * Get current user's profile with all fields from local PostgreSQL
 * Returns 404 if profile doesn't exist yet
 * Requirements: 3.5
 */
export async function GET() {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Fetch user's profile from local PostgreSQL
    const { DatabaseService } = await import('@/lib/database.service')
    const db = DatabaseService.getInstance()
    const profile = await db.getProfileById(user.id)
    
    if (!profile) {
      throw new NotFoundError('Profile not found. Please create your profile.')
    }
    
    return NextResponse.json(profile)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile in local PostgreSQL (or create if doesn't exist)
 * Validates input with profileUpdateSchema
 */
export async function PATCH(request: Request) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Parse and validate request body
    const body = await request.json()
    
    // Validate input with Zod schema
    const validatedData = profileUpdateSchema.parse(body)
    
    // Prevent is_admin modification
    if ('is_admin' in body) {
      throw new AuthorizationError('Cannot modify admin status')
    }
    
    const { DatabaseService } = await import('@/lib/database.service')
    const db = DatabaseService.getInstance()
    
    // If username is being updated, check uniqueness in local Postgres
    if (validatedData.username) {
      const existingProfile = await db.queryOne(
        'SELECT id FROM public.profiles WHERE username = $1 AND id != $2',
        [validatedData.username, user.id]
      )
      
      if (existingProfile) {
        throw new ConflictError('Username already taken')
      }
    }
    
    // Upsert profile in local PostgreSQL
    const updatedProfile = await db.upsertProfile({
      id: user.id,
      username: validatedData.username || user.user_metadata.username,
      ...validatedData
    })
    
    if (!updatedProfile) {
      throw new Error('Failed to save profile to database')
    }
    
    return NextResponse.json(updatedProfile)
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
