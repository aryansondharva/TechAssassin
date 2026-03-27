/**
 * POST /api/gamification/admin/badges/revoke
 * 
 * Admin endpoint for revoking badges from users.
 * 
 * Requirements: 13.2, 13.4, 13.5
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth, logAdminAction } from '@/middleware/admin-auth';
import { handleApiError } from '@/lib/errors';
import { badgeService } from '@/services/badge-service';

// Validation schema
const revokeBadgeSchema = z.object({
  userBadgeId: z.string().uuid(),
  reason: z.string().min(1)
});

/**
 * POST handler for revoking a badge
 */
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const { adminId } = await requireAdminAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const validated = revokeBadgeSchema.parse(body);
    
    // Revoke badge (soft delete with reason)
    await badgeService.revokeBadge(
      validated.userBadgeId,
      validated.reason
    );
    
    // Log to audit trail
    await logAdminAction(adminId, 'badge_revoked', {
      user_badge_id: validated.userBadgeId,
      reason: validated.reason
    });
    
    return NextResponse.json({
      success: true,
      message: 'Badge revoked successfully'
    });
  } catch (error) {
    return handleApiError(error);
  }
}
