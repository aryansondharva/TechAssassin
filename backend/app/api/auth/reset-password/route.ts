import { NextResponse } from 'next/server'
import { resetPasswordWithOTP } from '../../../../lib/auth/server'
import { handleApiError } from '../../../../lib/errors'

/**
 * POST /api/auth/reset-password
 * Update user password after 6-digit OTP verification
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { email, otp, password } = body;
    
    if (!email || !otp || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Update the password using the OTP verification flow
    await resetPasswordWithOTP(email, otp, password);
    
    return NextResponse.json({
      message: 'Password updated successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
