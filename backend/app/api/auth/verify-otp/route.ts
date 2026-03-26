import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { verifyOtpSchema } from '../../../../lib/validations/auth'
import { handleApiError } from '../../../../lib/errors'

/**
 * POST /api/auth/verify-otp
 * Verify 6-digit OTP for password reset
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, otp } = verifyOtpSchema.parse(body)
    
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    })
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      message: 'OTP verified successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
