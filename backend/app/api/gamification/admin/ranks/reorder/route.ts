/**
 * POST /api/gamification/admin/ranks/reorder
 * 
 * Admin endpoint for reordering rank tiers.
 * 
 * Requirements: 15.1
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth, logAdminAction } from '@/middleware/admin-auth';
import { handleApiError } from '@/lib/errors';
import { rankService } from '@/services/rank-service';

// Validation schema
const reorderRanksSchema = z.object({
  rankIds: z.array(z.string().uuid()).min(1)
});

/**
 * POST handler for reordering rank tiers
 */
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const { adminId } = await requireAdminAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const validated = reorderRanksSchema.parse(body);
    
    // Reorder rank tiers
    await rankService.reorderRankTiers(validated.rankIds);
    
    // Log admin action
    await logAdminAction(adminId, 'ranks_reordered', {
      new_order: validated.rankIds
    });
    
    return NextResponse.json({
      success: true,
      message: 'Rank tiers reordered successfully'
    });
  } catch (error) {
    return handleApiError(error);
  }
}
