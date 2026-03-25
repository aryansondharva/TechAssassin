import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '../../../../lib/services/leaderboard'
import { requireAuth } from '../../../../lib/middleware/auth'
import { handleApiError } from '../../../../lib/errors'

/**
 * GET /api/leaderboard/[eventId]
 * Get leaderboard entries for an event with participant profile information
 * Requires authentication
 * Requirements: 10.3, 10.4, 10.5
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Verify authentication
    await requireAuth()
    
    const { eventId } = params
    
    // Get leaderboard entries with user profiles
    const entries = await getLeaderboard(eventId)
    
    return NextResponse.json(entries)
  } catch (error) {
    return handleApiError(error)
  }
}
