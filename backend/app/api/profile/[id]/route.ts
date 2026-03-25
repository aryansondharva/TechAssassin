import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { handleApiError, NotFoundError } from '../../../../lib/errors'
import type { Profile } from '../../../../types/database'

/**
 * GET /api/profile/[id]
 * Get specific user's public profile
 * Excludes sensitive fields for other users
 * Requirements: 3.6
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !profile) {
      throw new NotFoundError('Profile not found')
    }
    
    // Get current user to determine if this is their own profile
    const { data: { user } } = await supabase.auth.getUser()
    
    // If viewing own profile, return all fields
    if (user && user.id === id) {
      return NextResponse.json(profile as Profile)
    }
    
    // For other users, return public fields only (exclude is_admin)
    const publicProfile = {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      github_url: profile.github_url,
      skills: profile.skills,
      created_at: profile.created_at
    }
    
    return NextResponse.json(publicProfile)
  } catch (error) {
    return handleApiError(error)
  }
}
