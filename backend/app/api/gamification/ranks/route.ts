/**
 * GET /api/gamification/ranks
 * 
 * Get all rank tiers
 * Public route (no auth required)
 * 
 * Requirements: 6.1, 15.5
 */

import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { RankService } from '@/services/rank-service';

/**
 * Get all rank tiers
 * Sorted by rank_order ascending
 * Includes minimum_xp_threshold, perks, icons
 */
export async function GET() {
  try {
    // Get all rank tiers using Rank Service
    const rankService = new RankService();
    const ranks = await rankService.getAllRankTiers();
    
    return NextResponse.json(ranks);
  } catch (error) {
    return handleApiError(error);
  }
}
