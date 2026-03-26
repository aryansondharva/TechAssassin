import { NextResponse } from 'next/server'
import { requestPasswordReset } from '../../../../lib/auth/server'
import { resetPasswordSchema } from '../../../../lib/validations/auth'
import { handleApiError } from '../../../../lib/errors'

/**
 * POST /api/auth/forgot-password
 * Send password reset email to user
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = resetPasswordSchema.parse(body)
    
    await requestPasswordReset(email)
    
    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
