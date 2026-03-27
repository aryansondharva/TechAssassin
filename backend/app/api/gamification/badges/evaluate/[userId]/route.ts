/**
 * POST /api/gamification/badges/evaluate/:userId
 * 
 * Trigger manual badge unlock evaluation
 * Authenticate user (own evaluation only)
 * 
 * Requirements: 4.1, 4.2
 */

import { NextResponse } from 'next/server';
import { requireAuthWithClient } from '@/lib/middleware/auth';
import { handleApiError, AuthorizationError, NotFoundError } from '@/lib/errors';
import { BadgeService } from '@/services/badge-service';

/**
 * Trigger badge unlock evaluation for a user
 * Evaluates all active badges and awards any that meet criteria
 * Returns newly unlocked badges
 * User can only evaluate their own badges
 */
export async function POST(
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
    
    // Verify authentication
    const { user } = await requireAuthWithClient();
    
    // Verify user can only evaluate their own badges
    if (user.id !== userId) {
      throw new AuthorizationError('You can only evaluate your own badges');
    }
    
    // Evaluate badge unlocks using Badge Service
    const badgeService = new BadgeService();
    const newlyUnlockedBadges = await badgeService.evaluateBadgeUnlocks(userId, {
      trigger: 'manual',
      metadata: {
        requestedAt: new Date().toISOString()
      }
    });
    
    return NextResponse.json({
      newlyUnlocked: newlyUnlockedBadges,
      count: newlyUnlockedBadges.length,
      message: newlyUnlockedBadges.length > 0 
        ? `Congratulations! You unlocked ${newlyUnlockedBadges.length} new badge(s)!`
        : 'No new badges unlocked at this time.'
    });
  } catch (error) {
    return handleApiError(error);
  }
}
