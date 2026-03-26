import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { handleApiError, NotFoundError } from '../../../../../lib/errors'
import type { Profile } from '../../../../../types/database'

/**
 * GET /api/profile/user/[username]
 * Get specific user's public profile by username
 * Respects privacy settings for fields like email, phone, and address
 */
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error || !profile) {
      throw new NotFoundError('Profile not found')
    }
    
    // Get current user to determine if this is their own profile
    const { data: { user } } = await supabase.auth.getUser()
    
    // If viewing own profile, return all fields
    if (user && user.id === profile.id) {
      return NextResponse.json(profile as Profile)
    }
    
    // Privacy Logic: filter fields based on flags
    const publicProfile: any = {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      banner_url: profile.banner_url,
      bio: profile.bio,
      skills: profile.skills,
      interests: profile.interests,
      university: profile.university,
      education: profile.education,
      graduation_year: profile.graduation_year,
      github_url: profile.github_url,
      linkedin_url: profile.linkedin_url,
      portfolio_url: profile.portfolio_url,
      created_at: profile.created_at
    }

    // Only include sensitive fields if user has opted to make them public
    if (profile.is_email_public) {
      publicProfile.email = profile.email
    }
    if (profile.is_phone_public) {
      publicProfile.phone = profile.phone
    }
    if (profile.is_address_public) {
      publicProfile.address = profile.address
    }
    
    return NextResponse.json(publicProfile)
  } catch (error) {
    return handleApiError(error)
  }
}
