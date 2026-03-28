import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/middleware/auth';
import { createClient } from '../../../../../lib/supabase/server';
import { handleApiError, NotFoundError, ValidationError } from '../../../../../lib/errors';
import { xpService } from '../../../../../services/xp-service';

/**
 * POST /api/events/[id]/award-placement-xp
 * Award bonus XP based on placement rankings in event leaderboard
 * Requirements: 17.4
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication (admin only)
    const user = await requireAuth();
    
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      throw new ValidationError('Only administrators can award placement XP');
    }
    
    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (eventError || !event) {
      throw new NotFoundError('Event not found');
    }
    
    // Get XP source config for event_participation to get multipliers
    const sourceConfig = await xpService.getXPSourceConfig('event_participation');
    
    // Default placement multipliers if not configured
    const placementMultipliers: Record<number, number> = sourceConfig?.multipliers?.placement || {
      1: 3.0,  // 1st place: 3x bonus
      2: 2.0,  // 2nd place: 2x bonus
      3: 1.5,  // 3rd place: 1.5x bonus
      4: 1.25, // 4th place: 1.25x bonus
      5: 1.25  // 5th place: 1.25x bonus
    };
    
    // Get leaderboard entries with rankings
    const { data: leaderboardEntries, error: leaderboardError } = await supabase
      .from('leaderboard')
      .select('id, user_id, event_id, rank, score')
      .eq('event_id', params.id)
      .order('rank', { ascending: true });
    
    if (leaderboardError) {
      throw new Error(`Failed to get leaderboard: ${leaderboardError.message}`);
    }
    
    if (!leaderboardEntries || leaderboardEntries.length === 0) {
      return NextResponse.json({
        message: 'No leaderboard entries found for this event',
        awardedCount: 0
      });
    }
    
    // Award bonus XP based on placement (Requirements: 17.4)
    const baseAmount = 100; // Base bonus amount
    const results = await Promise.allSettled(
      leaderboardEntries.map(async (entry) => {
        // Only award bonus to top placements that have a multiplier
        const multiplier = placementMultipliers[entry.rank];
        if (!multiplier) {
          return { success: false, userId: entry.user_id, reason: 'No multiplier for rank' };
        }
        
        const bonusAmount = Math.floor(baseAmount * multiplier);
        
        try {
          await xpService.awardXP({
            userId: entry.user_id,
            amount: bonusAmount,
            source: 'event_participation',
            activityType: 'placement_bonus',
            referenceId: event.id,
            description: `Placement bonus for ${entry.rank}${getRankSuffix(entry.rank)} place in event: ${event.title}`,
            metadata: {
              eventId: event.id,
              eventTitle: event.title,
              rank: entry.rank,
              score: entry.score,
              multiplier: multiplier,
              leaderboardId: entry.id
            }
          });
          return { success: true, userId: entry.user_id, rank: entry.rank, amount: bonusAmount };
        } catch (error) {
          console.error(`Failed to award placement XP to user ${entry.user_id}:`, error);
          return { success: false, userId: entry.user_id, rank: entry.rank, error };
        }
      })
    );
    
    const successResults = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    );
    
    const successCount = successResults.length;
    const totalXPAwarded = successResults.reduce(
      (sum, r) => sum + (r.status === 'fulfilled' && r.value.success ? r.value.amount : 0),
      0
    );
    
    return NextResponse.json({
      message: `Awarded placement bonus XP to ${successCount} participants.`,
      totalParticipants: leaderboardEntries.length,
      awardedCount: successCount,
      failedCount: leaderboardEntries.length - successCount,
      totalXPAwarded
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Helper function to get rank suffix (1st, 2nd, 3rd, etc.)
 */
function getRankSuffix(rank: number): string {
  if (rank === 1) return 'st';
  if (rank === 2) return 'nd';
  if (rank === 3) return 'rd';
  return 'th';
}
