import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { resetPasswordSchema } from '../../../../lib/validations/auth'
import { handleApiError } from '../../../../lib/errors'

/**
 * POST /api/auth/reset-password
 * Send password reset email to user
 * Returns success regardless of whether email exists (security best practice)
 * Requirements: 2.6
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { email } = resetPasswordSchema.parse(body)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Request password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm`
    })
    
    // Log error but don't expose it to prevent email enumeration
    if (error) {
      console.error('Password reset error:', error.message)
    }
    
    // Always return success to prevent email enumeration
    // Don't reveal whether the email exists in the system
    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
