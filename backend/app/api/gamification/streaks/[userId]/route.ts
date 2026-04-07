/**
 * Streak API Route
 * 
 * GET /api/gamification/streaks/:userId
 * 
 * Returns user's current streak, longest streak, and streak multiplier.
 * Public route (no authentication required).
 * 
 * Requirements:
 * - 18.6: Display current_streak and longest_streak on profile page
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { streakService } from '@/services/streak-service';

/**
 * GET /api/gamification/streaks/:userId
 * 
 * Get user's streak information
 * 
 * Requirements: 18.6
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Validate userId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new NotFoundError('Invalid user ID format');
    }
    
    // Get streak information
    const streakInfo = await streakService.getStreakInfo(userId);
    
    return NextResponse.json({
      userId: streakInfo.userId,
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      lastActivityDate: streakInfo.lastActivityDate,
      streakMultiplier: streakInfo.streakMultiplier
    });
  } catch (error) {
    return handleApiError(error);
  }
}
