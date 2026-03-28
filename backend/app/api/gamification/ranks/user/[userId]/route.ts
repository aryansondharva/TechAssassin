/**
 * GET /api/gamification/ranks/user/:userId
 * 
 * Get user's current rank and progress
 * Public route (no auth required)
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { NextResponse } from 'next/server';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { RankService } from '@/services/rank-service';

/**
 * Get user's current rank and progress
 * Returns current rank, next rank, XP needed, progress percentage
 * Handles max rank case
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
    
    // Get rank progress using Rank Service
    const rankService = new RankService();
    const rankProgress = await rankService.getRankProgress(userId);
    
    return NextResponse.json(rankProgress);
  } catch (error) {
    return handleApiError(error);
  }
}
