/**
 * POST /api/gamification/admin/ranks
 * 
 * Admin endpoint for creating new rank tiers.
 * 
 * Requirements: 15.1, 15.3
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth, logAdminAction } from '@/middleware/admin-auth';
import { handleApiError } from '@/lib/errors';
import { rankService } from '@/services/rank-service';

// Validation schema
const createRankSchema = z.object({
  name: z.string().min(1).max(100),
  minimumXpThreshold: z.number().int().min(0),
  rankOrder: z.number().int().positive(),
  iconUrl: z.string().url(),
  perks: z.record(z.any()).optional()
});

/**
 * POST handler for creating a new rank tier
 */
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const { adminId } = await requireAdminAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const validated = createRankSchema.parse(body);
    
    // Create rank tier (validates unique and ascending thresholds)
    const rankTier = await rankService.createRankTier({
      name: validated.name,
      minimumXpThreshold: validated.minimumXpThreshold,
      rankOrder: validated.rankOrder,
      iconUrl: validated.iconUrl,
      perks: validated.perks
    });
    
    // Log admin action
    await logAdminAction(adminId, 'rank_tier_created', {
      rank_id: rankTier.id,
      rank_name: rankTier.name,
      minimum_xp_threshold: rankTier.minimumXpThreshold,
      rank_order: rankTier.rankOrder
    });
    
    return NextResponse.json({
      success: true,
      rankTier
    });
  } catch (error) {
    return handleApiError(error);
  }
}
