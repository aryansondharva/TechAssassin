import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { signinSchema } from '../../../../lib/validations/auth'
import { handleApiError } from '../../../../lib/errors'

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
        throw new Error('Invalid email or password')
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email before signing in')
      }
      throw new Error(`Signin failed: ${error.message}`)
    }
    
    if (!data.user || !data.session) {
      throw new Error('Signin failed: No user or session data returned')
    }
    
    // Return user and session
    return NextResponse.json({
      user: data.user,
      session: data.session
    })
  } catch (error) {
    return handleApiError(error)
  }
}
