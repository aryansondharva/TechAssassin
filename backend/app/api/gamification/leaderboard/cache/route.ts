/**
 * POST /api/gamification/leaderboard/cache
 * 
 * Manual cache refresh for admins
 * 
 * Requirements: 10.3
 */

import { NextResponse } from 'next/server';
import { requireAuthWithClient, requireAdmin } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { leaderboardCache } from '@/services/leaderboard-cache-service';

/**
 * POST handler - Manually refresh leaderboard cache
 * Admin only
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const { user } = await requireAuthWithClient();
    
    // Verify admin privileges
    await requireAdmin(user.id);
    
    // Manual cache refresh
    leaderboardCache.manualRefresh();
    
    return NextResponse.json({
      success: true,
      message: 'Leaderboard cache cleared successfully'
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET handler - Get cache statistics
 * Admin only
 */
export async function GET(request: Request) {
  try {
    // Verify authentication
    const { user } = await requireAuthWithClient();
    
    // Verify admin privileges
    await requireAdmin(user.id);
    
    // Get cache stats
    const stats = leaderboardCache.getStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        oldestEntry: stats.oldestEntry ? new Date(stats.oldestEntry).toISOString() : null,
        newestEntry: stats.newestEntry ? new Date(stats.newestEntry).toISOString() : null
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
