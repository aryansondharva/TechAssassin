/**
 * POST /api/gamification/admin/xp/adjust
 * 
 * Admin endpoint for manual XP adjustments (positive or negative).
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth, logAdminAction } from '@/middleware/admin-auth';
import { handleApiError } from '@/lib/errors';
import { xpService } from '@/services/xp-service';

// Validation schema
const adjustXPSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive(),
  reason: z.string().min(1),
  source: z.enum([
    'event_participation',
    'code_contribution',
    'community_engagement',
    'challenge_completion',
    'helping_others',
    'profile_completion'
  ]).optional().default('community_engagement'),
  activityType: z.string().min(1).optional().default('manual_adjustment')
});

/**
 * POST handler for manual XP adjustment
 */
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const { adminId } = await requireAdminAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const validated = adjustXPSchema.parse(body);
    
    // Create manual XP adjustment
    const transaction = await xpService.manualAdjustment({
      userId: validated.userId,
      amount: validated.amount,
      source: validated.source,
      activityType: validated.activityType,
      description: `Manual XP adjustment by admin: ${validated.reason}`,
      reason: validated.reason,
      adminId
    });
    
    // Log admin action
    await logAdminAction(adminId, 'xp_manual_adjustment', {
      target_user_id: validated.userId,
      amount: validated.amount,
      reason: validated.reason,
      transaction_id: transaction.id
    });
    
    return NextResponse.json({
      success: true,
      transaction
    });
  } catch (error) {
    return handleApiError(error);
  }
}
