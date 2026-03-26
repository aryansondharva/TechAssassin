import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { handleApiError } from '../../../../lib/errors'

/**
 * POST /api/auth/magic-link
 * Request Magic Link (Email OTP)
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      message: 'Magic link / OTP sent to your email'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
