import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { profileUpdateSchema } from '@/lib/validations/profile'
import { handleApiError, NotFoundError, ConflictError, AuthorizationError, AuthenticationError } from '@/lib/errors'
import { deleteAvatar } from '@/lib/storage/cleanup'
import type { Profile } from '@/types/database'

/**
 * Get a service-role Supabase client (bypasses RLS).
 * Safe to use server-side since the key is never exposed to the browser.
 */
function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

/**
 * GET /api/profile
 * Get current user's own profile (all fields).
 * Uses service-role client — Clerk auth is the gate, not RLS.
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new AuthenticationError('Authentication required')
    }

    const supabase = getAdminClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      // Profile row doesn't exist yet — first login after Clerk, before webhook ran
      throw new NotFoundError('Profile not found. Please log out and log back in to sync your account.')
    }

    return NextResponse.json(profile as Profile)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/profile
 * Update authenticated user's own profile.
 * Uses service-role client scoped to the user's own Clerk ID.
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new AuthenticationError('Authentication required')
    }

    const body = await request.json()

    // Prevent member_id modification (immutable)
    if ('member_id' in body) {
      throw new AuthorizationError('Member ID is unique and cannot be changed.')
    }

    // Prevent is_admin modification
    if ('is_admin' in body) {
      throw new AuthorizationError('Cannot modify admin status.')
    }

    const validatedData = profileUpdateSchema.parse(body)
    const supabase = getAdminClient()

    // Check username uniqueness (if changing)
    if (validatedData.username) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', validatedData.username)
        .neq('id', userId)
        .single()

      if (existingProfile) {
        throw new ConflictError('Username already taken')
      }
    }

    // Perform update — SQL trigger enforces the 2x/month username limit
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...validatedData,
        username: validatedData.username?.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      if (error.message.includes('Username can only be changed twice per month')) {
        throw new ConflictError('You have already changed your username twice this month.')
      }
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Profile not found. Please log out and log back in to sync your account.')
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
    const { userId } = await auth()

    if (!userId) {
      throw new AuthenticationError('Authentication required')
    }

    const supabase = getAdminClient()

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`)
    }

    try {
      await deleteAvatar(userId)
    } catch (cleanupError) {
      console.error('Failed to clean up avatar:', cleanupError)
    }

    return NextResponse.json({ message: 'Profile deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
