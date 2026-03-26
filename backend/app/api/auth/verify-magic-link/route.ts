import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { ensureUserProfile } from '../../../../lib/auth/server'
import { handleApiError } from '../../../../lib/errors'

/**
 * POST /api/auth/verify-magic-link
 * Verify OTP from magic-link request and return authentication response
 */
export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()
    
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    
    if (error) {
      throw error
    }
    
    if (!data.user || !data.session) {
      throw new Error('Not authenticated')
    }
    
    // Sync local profile
    // If it's a new user, generating a username based on email
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_')
    const user = await ensureUserProfile(data.user, username)
    
    return NextResponse.json({
      user,
      token: data.session.access_token,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
