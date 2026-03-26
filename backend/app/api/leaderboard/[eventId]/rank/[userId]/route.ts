import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/leaderboard/:eventId/rank/:userId
 * Get user's rank in a specific event leaderboard
 * Requirements: 5.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; userId: string } }
) {
  try {
    // Verify authentication
    await requireAuth();
    
    const { eventId, userId } = params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }
    
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get user's leaderboard entry
    const { data: entry, error } = await supabase
      .from('leaderboard_scores')
      .select('rank, score, previous_rank, updated_at')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No entry found for this user
        return NextResponse.json(
          { 
            rank: null,
            message: 'User has no entry in this leaderboard'
          },
          { status: 200 }
        );
      }
      
      console.error('Supabase error fetching user rank:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user rank' },
        { status: 500 }
      );
    }
    
    // Calculate rank change
    let rankChange: 'up' | 'down' | 'same' | null = null;
    if (entry.rank !== null && entry.previous_rank !== null) {
      if (entry.rank < entry.previous_rank) {
        rankChange = 'up';
      } else if (entry.rank > entry.previous_rank) {
        rankChange = 'down';
      } else {
        rankChange = 'same';
      }
    }
    
    return NextResponse.json({
      rank: entry.rank,
      score: entry.score,
      previousRank: entry.previous_rank,
      rankChange,
      updatedAt: entry.updated_at
    });
  } catch (error) {
    return handleApiError(error);
  }
}
