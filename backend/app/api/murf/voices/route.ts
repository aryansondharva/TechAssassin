import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/middleware/auth'
import { handleApiError } from '../../../../lib/errors'
import { MurfService } from '../../../../lib/services/murf-service'

/**
 * GET /api/murf/voices
 * Fetch list of available Murf AI voices.
 */
export async function GET() {
  try {
    // Verify authentication
    await requireAuth()
    
    // Call Murf AI service to list voices
    const voices = await MurfService.listVoices()
    
    return NextResponse.json(voices)
  } catch (error) {
    return handleApiError(error)
  }
}
