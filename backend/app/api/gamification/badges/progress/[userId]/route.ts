/**
 * GET /api/gamification/badges/progress/:userId
 * 
 * Get locked badges with progress percentages
 * Authenticate user (own progress only)
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import { NextResponse } from 'next/server';
import { requireAuthWithClient } from '@/lib/middleware/auth';
import { handleApiError, AuthorizationError, NotFoundError } from '@/lib/errors';
import { BadgeService } from '@/services/badge-service';

/**
 * Get badge unlock progress for a user
 * Shows locked badges with progress percentages
 * Sorted by progress percentage descending
 * User can only view their own progress
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
    
    // Verify authentication
    const { user } = await requireAuthWithClient();
    
    // Verify user can only view their own progress
    if (user.id !== userId) {
      throw new AuthorizationError('You can only view your own badge progress');
    }
    
    // Get locked badges with progress using Badge Service
    const badgeService = new BadgeService();
    const lockedBadges = await badgeService.getLockedBadges(userId);
    
    return NextResponse.json({
      lockedBadges,
      totalCount: lockedBadges.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}
