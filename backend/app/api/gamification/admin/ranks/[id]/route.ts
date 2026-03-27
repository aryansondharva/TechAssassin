/**
 * PUT /api/gamification/admin/ranks/:id
 * 
 * Admin endpoint for updating rank tiers.
 * Triggers recalculation of all user ranks within 60 seconds.
 * 
 * Requirements: 15.2, 15.4
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth, logAdminAction } from '@/middleware/admin-auth';
import { handleApiError } from '@/lib/errors';
import { rankService } from '@/services/rank-service';
import { createClient } from '@/lib/supabase/server';

// Validation schema
const updateRankSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  minimumXpThreshold: z.number().int().min(0).optional(),
  rankOrder: z.number().int().positive().optional(),
  iconUrl: z.string().url().optional(),
  perks: z.record(z.any()).optional()
});

/**
 * PUT handler for updating a rank tier
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const { adminId } = await requireAdminAuth();
    
    const rankId = params.id;
    
    // Parse and validate request body
    const body = await request.json();
    const validated = updateRankSchema.parse(body);
    
    // Update rank tier
    const rankTier = await rankService.updateRankTier(rankId, {
      name: validated.name,
      minimumXpThreshold: validated.minimumXpThreshold,
      rankOrder: validated.rankOrder,
      iconUrl: validated.iconUrl,
      perks: validated.perks
    });
    
    // Log admin action
    await logAdminAction(adminId, 'rank_tier_updated', {
      rank_id: rankId,
      rank_name: rankTier.name,
      updates: validated
    });
    
    // Trigger recalculation of all user ranks
    // This is done asynchronously to avoid blocking the response
    // In production, this would be a background job
    triggerRankRecalculation().catch(error => {
      console.error('Failed to trigger rank recalculation:', error);
    });
    
    return NextResponse.json({
      success: true,
      rankTier,
      message: 'Rank tier updated. User ranks will be recalculated within 60 seconds.'
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Trigger recalculation of all user ranks
 * This runs asynchronously after rank tier updates
 */
async function triggerRankRecalculation(): Promise<void> {
  const supabase = await createClient();
  
  // Get all users with total_xp > 0
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .gt('total_xp', 0);
  
  if (error) {
    throw new Error(`Failed to fetch users for rank recalculation: ${error.message}`);
  }
  
  if (!users || users.length === 0) {
    return;
  }
  
  // Recalculate ranks for all users
  // In production, this would be batched or queued
  const recalculationPromises = users.map(user =>
    rankService.updateUserRank(user.id).catch(error => {
      console.error(`Failed to recalculate rank for user ${user.id}:`, error);
    })
  );
  
  await Promise.all(recalculationPromises);
}
