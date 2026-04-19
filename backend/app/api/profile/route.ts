import { NextResponse } from 'next/server'
import { requireAuthWithClient } from '@/lib/middleware/auth'
import { profileUpdateSchema } from '@/lib/validations/profile'
import { handleApiError, NotFoundError, ConflictError, AuthorizationError } from '@/lib/errors'
import { deleteAvatar } from '@/lib/storage/cleanup'
import type { Profile } from '@/types/database'

/**
 * GET /api/profile
 * Get current user's profile with all fields
 */
export async function GET() {
  try {
    const { user, supabase } = await requireAuthWithClient()
    
    // Fetch profile including the new member_id and change tracking fields
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Profile not found. Please log in again to sync your account.')
      }
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }
    
    return NextResponse.json(profile as Profile)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile
 */
export async function PATCH(request: Request) {
  try {
    const { user, supabase } = await requireAuthWithClient()
    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)
    
    // Prevent member_id modification (Rule: User cannot change Member ID)
    if ('member_id' in body) {
      throw new AuthorizationError('Member ID is unique and cannot be changed.')
    }
    
    // Prevent is_admin modification
    if ('is_admin' in body) {
      throw new AuthorizationError('Cannot modify admin status')
    }
    
    // Check username uniqueness (if changing)
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
    
    // Perform update
    // The SQL trigger 'trigger_enforce_username_change_limit' will handle the "Twice a month" check
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...validatedData,
        username: validatedData.username?.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) {
      // Check for custom trigger exception
      if (error.message.includes('Username can only be changed twice per month')) {
        throw new ConflictError('You have already changed your username twice this month. Please wait until next month.')
      }
      throw new Error(`Failed to save profile: ${error.message}`)
    }
    
    return NextResponse.json(profile as Profile)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/profile
 */
export async function DELETE() {
  try {
    const { user, supabase } = await requireAuthWithClient()
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)
    
    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`)
    }
    
    try {
      await deleteAvatar(user.id)
    } catch (cleanupError) {
      console.error(`Failed to clean up avatar:`, cleanupError)
    }
    
    return NextResponse.json({ message: 'Profile deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
