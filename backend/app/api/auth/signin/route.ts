import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { signinSchema } from '../../../../lib/validations/auth'
import { handleApiError } from '../../../../lib/errors'
import { AuthenticationError } from '../../../../lib/middleware/auth'

/**
 * POST /api/auth/signin
 * Authenticate user with email and password
 * Requirements: 2.1, 2.2
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { email, password } = signinSchema.parse(body)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      // Handle specific Supabase Auth errors
      if (error.message.includes('Invalid login credentials')) {
        throw new AuthenticationError('Invalid email or password')
      }
      if (error.message.includes('Email not confirmed')) {
        throw new AuthenticationError('Please verify your email before signing in')
      }
      throw error // Let handleApiError handle other Supabase errors
    }
    
    if (!data.user || !data.session) {
      throw new AuthenticationError('Signin failed: No user or session data returned')
    }
    
    // Fetch user's profile from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    // Return user (profile) and token
    return NextResponse.json({
      user: profile || data.user, // Fallback to supabase user if profile not found
      token: data.session.access_token
    })
  } catch (error) {
    return handleApiError(error)
  }
}
