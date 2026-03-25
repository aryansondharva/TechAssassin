import { createClient } from '../supabase/server'
import type { LeaderboardEntry } from '../../types/database'

/**
 * Recalculate ranks for all entries in an event's leaderboard
 * Ranks are assigned based on scores in descending order (highest score = rank 1)
 * Ties are handled consistently - entries with the same score get the same rank
 * Requirements: 10.2
 * 
 * @param eventId - UUID of the event
 * @returns void
 * @throws Error if database operation fails
 * 
 * @example
 * Scores: [100, 90, 90, 80] -> Ranks: [1, 2, 2, 4]
 */
export async function recalculateRanks(eventId: string): Promise<void> {
  const supabase = await createClient()
  
  // Fetch all leaderboard entries for the event, ordered by score descending
  const { data: entries, error: fetchError } = await supabase
    .from('leaderboard')
    .select('id, score')
    .eq('event_id', eventId)
    .order('score', { ascending: false })
    .order('id', { ascending: true }) // Secondary sort for consistency
  
  if (fetchError) {
    throw new Error(`Failed to fetch leaderboard entries: ${fetchError.message}`)
  }
  
  if (!entries || entries.length === 0) {
    return // No entries to rank
  }
  
  // Calculate ranks with tie handling
  let currentRank = 1
  let previousScore: number | null = null
  
  const updates = entries.map((entry: { id: string; score: number }, index: number) => {
    // If score is different from previous, update rank to current position + 1
    if (previousScore !== null && entry.score !== previousScore) {
      currentRank = index + 1
    }
    
    previousScore = entry.score
    
    return {
      id: entry.id,
      rank: currentRank,
      updated_at: new Date().toISOString()
    }
  })
  
  // Batch update all ranks in the database (more efficient than individual updates)
  // Note: Supabase doesn't support batch updates directly, but we can use upsert
  const { error: updateError } = await supabase
    .from('leaderboard')
    .upsert(updates, { onConflict: 'id' })
  
  if (updateError) {
    throw new Error(`Failed to update ranks: ${updateError.message}`)
  }
}

/**
 * Get leaderboard entries for an event with participant profile information
 * Requirements: 10.3, 10.4, 10.5
 * 
 * @param eventId - UUID of the event
 * @returns Array of leaderboard entries with user profiles, ordered by rank ascending
 */
export async function getLeaderboard(eventId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()
  
  const { data: entries, error } = await supabase
    .from('leaderboard')
    .select(`
      id,
      event_id,
      user_id,
      score,
      rank,
      updated_at,
      user:profiles!leaderboard_user_id_fkey (
        id,
        username,
        avatar_url,
        full_name
      )
    `)
    .eq('event_id', eventId)
    .order('rank', { ascending: true })
  
  if (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`)
  }
  
  return (entries as any) || []
}

/**
 * Upsert a leaderboard entry (create or update)
 * If an entry exists for the user and event, update the score
 * Otherwise, create a new entry
 * Requirements: 10.1, 10.2
 * 
 * @param data - Object containing event_id, user_id, and score
 * @returns The created or updated leaderboard entry
 */
export async function upsertLeaderboardEntry(data: {
  event_id: string
  user_id: string
  score: number
}): Promise<LeaderboardEntry> {
  const supabase = await createClient()
  
  // Upsert the entry (update if exists, insert if not)
  const { data: entry, error } = await supabase
    .from('leaderboard')
    .upsert(
      {
        event_id: data.event_id,
        user_id: data.user_id,
        score: data.score,
        rank: 0, // Temporary rank, will be recalculated
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'event_id,user_id',
        ignoreDuplicates: false
      }
    )
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to upsert leaderboard entry: ${error.message}`)
  }
  
  if (!entry) {
    throw new Error('Failed to create leaderboard entry')
  }
  
  // Recalculate ranks for the entire event
  await recalculateRanks(data.event_id)
  
  // Fetch the updated entry with the new rank
  const { data: updatedEntry, error: fetchError } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('id', entry.id)
    .single()
  
  if (fetchError || !updatedEntry) {
    throw new Error('Failed to fetch updated leaderboard entry')
  }
  
  return updatedEntry
}
