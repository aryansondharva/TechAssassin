import { NextResponse } from 'next/server'
import { signUp } from '@/lib/auth/server'
import { signupSchema } from '@/lib/validations/auth'
import { handleApiError } from '@/lib/errors'

/**
 * POST /api/auth/signup
 * Create new user account with email and password
 * Uses local PostgreSQL database instead of Supabase
 * Requirements: 2.1, 2.2
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = signupSchema.parse(body)
    
    // Create user account
    const result = await signUp(validatedData)
    
    // Return user and session
    return NextResponse.json(
      {
        user: result.user,
        session: result.token
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
