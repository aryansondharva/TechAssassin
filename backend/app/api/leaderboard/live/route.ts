import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardService } from '../../../../lib/services/leaderboard-service';
import { requireAuth } from '../../../../lib/middleware/auth';
import { handleApiError } from '../../../../lib/errors';

/**
 * POST /api/leaderboard/live
 * Enable or disable live competition mode for an event
 * Requirements: 5.4
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth();
    
    // Parse request body
    const body = await request.json();
    const { eventId, enable } = body;
    
    if (!eventId || typeof enable !== 'boolean') {
      return NextResponse.json(
        { error: 'eventId and enable (boolean) are required' },
        { status: 400 }
      );
    }
    
    const leaderboardService = getLeaderboardService();
    
    if (enable) {
      // Enable live mode
      leaderboardService.enableLiveMode(eventId);
      
      return NextResponse.json({
        success: true,
        message: `Live competition mode enabled for event: ${eventId}`,
        eventId,
        liveMode: true
      });
    } else {
      // Disable live mode
      leaderboardService.disableLiveMode();
      
      return NextResponse.json({
        success: true,
        message: 'Live competition mode disabled',
        liveMode: false
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/leaderboard/live/status
 * Get live competition mode status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    await requireAuth();
    
    // Note: In a real implementation, we would track live mode status
    // For now, we return a placeholder response
    return NextResponse.json({
      liveMode: false,
      message: 'Live mode status endpoint - implementation pending'
    });
  } catch (error) {
    return handleApiError(error);
  }
}