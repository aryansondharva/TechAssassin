import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors';

/**
 * POST /api/leaderboard/update
 * Update user score in leaderboard and recalculate ranks
 * Requirements: 5.1
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth();
    
    // Parse request body
    const body = await request.json();
    const { eventId, userId, score } = body;
    
    // Validate required fields
    if (!eventId || !userId || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'eventId, userId, and score (number) are required' },
        { status: 400 }
      );
    }
    
    // Validate score is non-negative
    if (score < 0) {
      return NextResponse.json(
        { error: 'Score must be non-negative' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get current entry to save previous rank
    const { data: currentEntry } = await supabase
      .from('leaderboard_scores')
      .select('rank, score')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    // Upsert the score
    const { data: updatedEntry, error: upsertError } = await supabase
      .from('leaderboard_scores')
      .upsert({
        event_id: eventId,
        user_id: userId,
        score: score,
        previous_rank: currentEntry?.rank || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (upsertError) {
      console.error('Supabase error upserting score:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update score' },
        { status: 500 }
      );
    }
    
    // Recalculate ranks for the event
    // Get all scores for this event ordered by score descending
    const { data: allScores, error: scoresError } = await supabase
      .from('leaderboard_scores')
      .select('id, user_id, score, rank')
      .eq('event_id', eventId)
      .order('score', { ascending: false })
      .order('updated_at', { ascending: true }); // Tie-breaker: earlier update wins
    
    if (scoresError) {
      console.error('Supabase error fetching scores:', scoresError);
      return NextResponse.json(
        { error: 'Failed to recalculate ranks' },
        { status: 500 }
      );
    }
    
    // Update ranks
    const updates = allScores.map((entry, index) => ({
      id: entry.id,
      rank: index + 1,
      previous_rank: entry.rank
    }));
    
    // Batch update ranks
    for (const update of updates) {
      await supabase
        .from('leaderboard_scores')
        .update({
          rank: update.rank,
          previous_rank: update.previous_rank
        })
        .eq('id', update.id);
    }
    
    // Get the updated entry with new rank
    const { data: finalEntry, error: finalError } = await supabase
      .from('leaderboard_scores')
      .select('rank, score, previous_rank')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    if (finalError) {
      console.error('Supabase error fetching final entry:', finalError);
      return NextResponse.json(
        { error: 'Failed to fetch updated entry' },
        { status: 500 }
      );
    }
    
    // Calculate rank change
    let rankChange: 'up' | 'down' | 'same' | null = null;
    if (finalEntry.rank !== null && finalEntry.previous_rank !== null) {
      if (finalEntry.rank < finalEntry.previous_rank) {
        rankChange = 'up';
      } else if (finalEntry.rank > finalEntry.previous_rank) {
        rankChange = 'down';
      } else {
        rankChange = 'same';
      }
    }
    
    return NextResponse.json({
      success: true,
      eventId,
      userId,
      score: finalEntry.score,
      rank: finalEntry.rank,
      previousRank: finalEntry.previous_rank,
      rankChange
    });
  } catch (error) {
    return handleApiError(error);
  }
}
