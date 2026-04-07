/**
 * POST /api/gamification/admin/badges/award
 * 
 * Admin endpoint for manually awarding badges to users.
 * 
 * Requirements: 13.1, 13.3
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth, logAdminAction } from '@/middleware/admin-auth';
import { handleApiError } from '@/lib/errors';
import { badgeService } from '@/services/badge-service';

// Validation schema
const awardBadgeSchema = z.object({
  userId: z.string().uuid(),
  badgeId: z.string().uuid()
});

/**
 * POST handler for manually awarding a badge
 */
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const { adminId } = await requireAdminAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const validated = awardBadgeSchema.parse(body);
    
    // Award badge with manual flag
    const userBadge = await badgeService.awardBadge(
      validated.userId,
      validated.badgeId,
      true // manual award
    );
    
    // Log to audit trail
    await logAdminAction(adminId, 'badge_manually_awarded', {
      target_user_id: validated.userId,
      badge_id: validated.badgeId,
      badge_name: userBadge.badge.name,
      user_badge_id: userBadge.id
    });
    
    return NextResponse.json({
      success: true,
      userBadge
    });
  } catch (error) {
    return handleApiError(error);
  }
}
