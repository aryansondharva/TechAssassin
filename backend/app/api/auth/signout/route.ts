import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { handleApiError } from '../../../../lib/errors'

/**
 * POST /api/auth/signout
 * Sign out current user and invalidate session
 * Requirements: 2.10
 */
export async function POST() {
  try {
    // Get Supabase client
    const supabase = await createClient()
    
    // Sign out user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(`Signout failed: ${error.message}`)
    }
    
    // Return success message
    return NextResponse.json({
      message: 'Signed out successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
