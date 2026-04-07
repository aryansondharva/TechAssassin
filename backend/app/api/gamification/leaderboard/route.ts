/**
 * GET /api/gamification/leaderboard
 * 
 * Get leaderboard rankings with caching
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.6
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { leaderboardCache } from '@/services/leaderboard-cache-service';

// Request validation schema
const leaderboardQuerySchema = z.object({
  period: z.enum(['all-time', 'monthly', 'weekly']).default('all-time'),
  limit: z.coerce.number().int().positive().max(1000).default(100)
});

/**
 * Get leaderboard from cache or database
 */
async function getLeaderboard(period: string, limit: number) {
  // Check cache
  const cached = leaderboardCache.get(period, limit);
  if (cached) {
    return cached;
  }
  
  // Fetch from database
  const supabase = await createClient();
  
  let query = supabase
    .from('profiles')
    .select(`
      id,
      username,
      avatar_url,
      total_xp,
      current_rank_id,
      rank_tiers:current_rank_id (
        name,
        icon_url
      )
    `)
    .order('total_xp', { ascending: false })
    .limit(limit);
  
  // Apply period filtering
  if (period === 'monthly') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    // For monthly, we need to calculate XP from transactions in the last month
    // This requires a different approach - we'll use a subquery
    const { data: monthlyData, error: monthlyError } = await supabase.rpc(
      'get_monthly_leaderboard',
      { limit_count: limit }
    );
    
    if (monthlyError) {
      // Fallback to all-time if function doesn't exist
      console.warn('Monthly leaderboard function not available, falling back to all-time');
    } else if (monthlyData) {
      const result = monthlyData.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1,
        current_rank: entry.rank_tiers
      }));
      
      // Cache the result
      leaderboardCache.set(period, limit, result);
      
      return result;
    }
  } else if (period === 'weekly') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // For weekly, we need to calculate XP from transactions in the last week
    const { data: weeklyData, error: weeklyError } = await supabase.rpc(
      'get_weekly_leaderboard',
      { limit_count: limit }
    );
    
    if (weeklyError) {
      // Fallback to all-time if function doesn't exist
      console.warn('Weekly leaderboard function not available, falling back to all-time');
    } else if (weeklyData) {
      const result = weeklyData.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1,
        current_rank: entry.rank_tiers
      }));
      
      // Cache the result
      leaderboardCache.set(period, limit, result);
      
      return result;
    }
  }
  
  // All-time leaderboard (default)
  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  // Add rank numbers and format response
  const result = (data || []).map((entry, index) => ({
    id: entry.id,
    username: entry.username,
    avatar_url: entry.avatar_url,
    total_xp: entry.total_xp,
    rank: index + 1,
    current_rank: entry.rank_tiers ? {
      name: entry.rank_tiers.name,
      icon_url: entry.rank_tiers.icon_url
    } : null
  }));
  
  // Cache the result
  leaderboardCache.set(period, limit, result);
  
  return result;
}

/**
 * Invalidate cache for specific period or all periods
 * Exported for use by other services (e.g., XP service)
 */
export function invalidateLeaderboardCache(period?: string): void {
  leaderboardCache.invalidate(period);
}

/**
 * GET handler - Fetch leaderboard rankings
 * Public route (no auth required)
 */
export async function GET(request: Request) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const validatedParams = leaderboardQuerySchema.parse({
      period: searchParams.get('period') || 'all-time',
      limit: searchParams.get('limit') || '100'
    });
    
    // Get leaderboard data
    const leaderboard = await getLeaderboard(
      validatedParams.period,
      validatedParams.limit
    );
    
    return NextResponse.json({
      period: validatedParams.period,
      limit: validatedParams.limit,
      count: leaderboard.length,
      leaderboard
    });
  } catch (error) {
    return handleApiError(error);
  }
}
