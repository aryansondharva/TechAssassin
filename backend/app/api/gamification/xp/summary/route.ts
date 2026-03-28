/**
 * GET /api/gamification/xp/summary
 * 
 * Get XP summary statistics (daily, weekly, monthly totals)
 * 
 * Requirements: 11.5
 */

import { NextResponse } from 'next/server';
import { requireAuthWithClient } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { XPService } from '@/services/xp-service';

/**
 * Get XP summary for authenticated user
 * Returns daily, weekly, and monthly XP totals
 */
export async function GET(request: Request) {
  try {
    // Verify authentication
    const { user } = await requireAuthWithClient();
    
    // Get XP summary using XP Service
    const xpService = new XPService();
    const summary = await xpService.getXPSummary(user.id);
    
    return NextResponse.json(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
