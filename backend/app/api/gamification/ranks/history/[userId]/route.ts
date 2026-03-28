/**
 * GET /api/gamification/ranks/history/:userId
 * 
 * Get user's rank progression history
 * Public route (no auth required)
 * 
 * Requirements: 6.6
 */

import { NextResponse } from 'next/server';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { RankService } from '@/services/rank-service';

/**
 * Get user's rank progression history
 * Returns rank changes with timestamps
 * Sorted by achieved_at descending
 */
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new NotFoundError('Invalid user ID format');
    }
    
    // Get rank history using Rank Service
    const rankService = new RankService();
    const rankHistory = await rankService.getUserRankHistory(userId);
    
    return NextResponse.json(rankHistory);
  } catch (error) {
    return handleApiError(error);
  }
}
