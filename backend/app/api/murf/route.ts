import { NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/middleware/auth'
import { handleApiError } from '../../../lib/errors'
import { MurfService } from '../../../lib/services/murf-service'

/**
 * POST /api/murf
 * Synthesize speech from text using Murf AI.
 * Required fields in body: text, voiceId
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    await requireAuth()
    
    // Parse request body
    const body = await request.json()
    
    if (!body.text || !body.voiceId) {
      return NextResponse.json(
        { error: 'Missing required fields: text, voiceId' },
        { status: 400 }
      )
    }
    
    // Call Murf AI service
    const result = await MurfService.synthesize(body)
    
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
