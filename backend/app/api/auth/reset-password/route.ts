import { NextResponse } from 'next/server'
import { resetPassword } from '../../../../lib/auth/server'
import { updatePasswordSchema } from '../../../../lib/validations/auth'
import { handleApiError } from '../../../../lib/errors'

/**
 * POST /api/auth/reset-password
 * Update user password after OTP verification or via recovery link
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { password } = updatePasswordSchema.parse(body)
    
    // Update the password
    // This assumes the user is already authenticated (Supabase handles session via cookies after recovery)
    await resetPassword(password)
    
    return NextResponse.json({
      message: 'Password updated successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
