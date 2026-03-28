/**
 * GET /api/gamification/badges/user/:userId
 * 
 * Get all earned badges for a user
 * Public route (no auth required)
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { BadgeService } from '@/services/badge-service';

// Query parameter validation schema
const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).default('20')
});

/**
 * Get user's earned badges
 * Sorted by rarity (legendary first) then earned_at
 * Supports pagination for >10 badges
 * Includes badge category counts
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
    
    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20'
    };
    
    const validatedQuery = paginationSchema.parse(queryParams);
    
    // Get user badges using Badge Service
    const badgeService = new BadgeService();
    const allUserBadges = await badgeService.getUserBadges(userId);
    
    // Get badge category counts
    const categoryCounts: Record<string, number> = {};
    for (const userBadge of allUserBadges) {
      const category = userBadge.badge.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
    
    // Get rarity distribution
    const rarityDistribution = await badgeService.getUserBadgesByRarity(userId);
    
    // Apply pagination
    const startIndex = (validatedQuery.page - 1) * validatedQuery.pageSize;
    const endIndex = startIndex + validatedQuery.pageSize;
    const paginatedBadges = allUserBadges.slice(startIndex, endIndex);
    
    return NextResponse.json({
      badges: paginatedBadges,
      totalCount: allUserBadges.length,
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize,
      hasMore: endIndex < allUserBadges.length,
      categoryCounts,
      rarityDistribution
    });
  } catch (error) {
    return handleApiError(error);
  }
}
