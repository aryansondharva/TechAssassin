import { NextResponse } from 'next/server'
import { verifyPasswordResetOTP } from '../../../../lib/auth/server'
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
    
    // Use custom OTP verification
    const isValid = await verifyPasswordResetOTP(email, otp);
    
    if (!isValid) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification code' 
      }, { status: 400 })
    }
    
    return NextResponse.json({
      message: 'OTP verified successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
