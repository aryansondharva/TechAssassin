import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardService } from '../../../../lib/services/leaderboard-service';
import { requireAuth } from '../../../../lib/middleware/auth';
import { handleApiError } from '../../../../lib/errors';
import { realtimeLeaderboardUpdateSchema, leaderboardQuerySchema } from '../../../../lib/validations/leaderboard';

/**
 * POST /api/leaderboard/realtime
 * Create or update a leaderboard entry with real-time support
 * Supports optimistic updates and real-time broadcasting
 * Requirements: 5.1, 7.4
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = realtimeLeaderboardUpdateSchema.parse(body);
    
    const leaderboardService = getLeaderboardService();
    
    // Set current user for highlighting
    leaderboardService.setCurrentUserId(user.id);
    
    if (validatedData.is_optimistic) {
      // Apply optimistic update (immediate UI feedback)
      leaderboardService.updateScoreOptimistic(
        validatedData.event_id,
        validatedData.user_id,
        validatedData.score
      );
      
      return NextResponse.json({
        success: true,
        message: 'Optimistic update applied',
        isOptimistic: true
      }, { status: 202 }); // 202 Accepted for optimistic updates
    } else {
      // Apply server-confirmed update
      await leaderboardService.updateScore(
        validatedData.event_id,
        validatedData.user_id,
        validatedData.score
      );
      
      return NextResponse.json({
        success: true,
        message: 'Score updated successfully'
      }, { status: 200 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/leaderboard/realtime
 * Get leaderboard with real-time features (pagination, current user highlighting, rank changes)
 * Requirements: 5.1, 5.3, 5.5, 7.4
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // Validate query parameters
    const queryParams = leaderboardQuerySchema.parse({ page, pageSize });
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId query parameter is required' },
        { status: 400 }
      );
    }
    
    const leaderboardService = getLeaderboardService();
    
    // Set current user for highlighting
    leaderboardService.setCurrentUserId(user.id);
    
    // Get leaderboard with real-time features
    const leaderboardData = await leaderboardService.getLeaderboard(
      eventId,
      {
        page: queryParams.page,
        pageSize: queryParams.pageSize
      }
    );
    
    return NextResponse.json(leaderboardData);
  } catch (error) {
    return handleApiError(error);
  }
}