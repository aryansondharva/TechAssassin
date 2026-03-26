import { createClient } from '@/lib/supabase/client';
import { getRealtimeManager } from './realtime-manager';
import { getOptimisticUpdateManager, type OptimisticUpdateError } from './optimistic-update-manager';
import type { LeaderboardEntry } from '../../types/database';

export interface LeaderboardQueryOptions {
  page: number;
  pageSize: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalCount: number;
  currentUserRank?: number;
}

export interface LeaderboardUpdate {
  eventId: string;
  userId: string;
  newScore: number;
  oldRank: number;
  newRank: number;
}

export interface Subscription {
  unsubscribe(): void;
}

// Re-export OptimisticUpdateError for convenience
export type { OptimisticUpdateError } from './optimistic-update-manager';

/**
 * LeaderboardService - Manages real-time leaderboard updates, rank changes, and live competition mode
 * 
 * Responsibilities:
 * - Subscribe to leaderboard score updates
 * - Apply optimistic score updates for current user
 * - Animate rank changes
 * - Highlight current user position
 * - Display rank change indicators
 * - Implement score update batching
 * - Support live competition mode
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.4, 9.4
 */
export class LeaderboardService {
  private supabase = createClient();
  private realtimeManager = getRealtimeManager();
  private optimisticManager = getOptimisticUpdateManager();
  private currentEventId: string | null = null;
  private isLiveMode: boolean = false;
  private updateBatch: Map<string, LeaderboardUpdate> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_WINDOW = 100; // ms
  private pendingUpdates: Map<string, { score: number; tempId: string }> = new Map(); // userId -> pending score with tempId
  private currentUserId: string | null = null;

  /**
   * Get leaderboard entries for an event with pagination
   * Requirements: 5.1, 7.4
   */
  async getLeaderboard(eventId: string, options: LeaderboardQueryOptions): Promise<LeaderboardData> {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;

    // Fetch leaderboard entries with user profiles
    const { data: entries, error, count } = await this.supabase
      .from('leaderboard_scores')
      .select(`
        id,
        event_id,
        user_id,
        score,
        rank,
        previous_rank,
        updated_at,
        user:profiles!leaderboard_scores_user_id_fkey (
          id,
          username,
          avatar_url,
          full_name
        )
      `, { count: 'exact' })
      .eq('event_id', eventId)
      .order('rank', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to get leaderboard: ${error.message}`);
    }

    // Calculate rank changes and mark current user
    const processedEntries = (entries || []).map(entry => {
      const processedEntry: LeaderboardEntry = {
        ...entry,
        rankChange: this.calculateRankChange(entry.rank, entry.previous_rank),
        isCurrentUser: this.currentUserId ? entry.user_id === this.currentUserId : false
      };
      return processedEntry;
    });

    // Get current user rank if logged in
    let currentUserRank: number | undefined;
    if (this.currentUserId) {
      const { data: userEntry } = await this.supabase
        .from('leaderboard_scores')
        .select('rank')
        .eq('event_id', eventId)
        .eq('user_id', this.currentUserId)
        .single();

      currentUserRank = userEntry?.rank || undefined;
    }

    return {
      entries: processedEntries,
      totalCount: count || 0,
      currentUserRank
    };
  }

  /**
   * Get user rank for a specific event
   */
  async getUserRank(eventId: string, userId: string): Promise<number | null> {
    const { data: entry, error } = await this.supabase
      .from('leaderboard_scores')
      .select('rank')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No entry found
      }
      throw new Error(`Failed to get user rank: ${error.message}`);
    }

    return entry.rank;
  }

  /**
   * Update user score (server-confirmed)
   * Requirements: 5.1
   */
  async updateScore(eventId: string, userId: string, score: number): Promise<void> {
    // Check if there's a pending optimistic update
    const pendingUpdate = this.pendingUpdates.get(userId);
    if (pendingUpdate) {
      // Remove from pending updates since we're now doing the real update
      this.pendingUpdates.delete(userId);
    }

    try {
      // Update score in database
      const { error } = await this.supabase
        .from('leaderboard_scores')
        .upsert({
          event_id: eventId,
          user_id: userId,
          score: score,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'event_id,user_id'
        });

      if (error) {
        throw new Error(`Failed to update score: ${error.message}`);
      }

      // Recalculate ranks for the event
      await this.recalculateRanks(eventId);

      // Confirm optimistic update if there was one
      if (pendingUpdate) {
        this.optimisticManager.confirmUpdate(pendingUpdate.tempId);
      }
    } catch (error) {
      // If there was a pending update, rollback and notify error
      if (pendingUpdate) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update score';
        this.optimisticManager.rollbackUpdate(pendingUpdate.tempId, {
          type: 'leaderboard',
          tempId: pendingUpdate.tempId,
          message: errorMessage,
          originalData: { eventId, userId, score: pendingUpdate.score },
        });
      }
      throw error;
    }
  }

  /**
   * Update user score optimistically (immediate UI update)
   * Requirements: 7.4
   */
  updateScoreOptimistic(eventId: string, userId: string, score: number): void {
    // Generate temporary ID for tracking
    const tempId = `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Register pending update
    this.optimisticManager.registerPendingUpdate({
      id: tempId,
      type: 'leaderboard',
      timestamp: new Date(),
      data: { eventId, userId, score },
    });

    // Store pending update with tempId
    this.pendingUpdates.set(userId, { score, tempId });

    // Schedule batched update
    const update: LeaderboardUpdate = {
      eventId,
      userId,
      newScore: score,
      oldRank: 0, // Will be calculated when batch is processed
      newRank: 0  // Will be calculated when batch is processed
    };

    this.scheduleUpdate(update);

    // Send to server in background
    this.updateScore(eventId, userId, score)
      .then(() => {
        // Confirm handled in updateScore
      })
      .catch((error) => {
        // Rollback handled in updateScore
        this.pendingUpdates.delete(userId);
        console.error('Optimistic score update failed:', error);
      });
  }

  /**
   * Subscribe to leaderboard updates for a specific event
   * Requirements: 5.1, 5.2
   */
  subscribeToLeaderboard(eventId: string, callback: (update: LeaderboardUpdate) => void): Subscription {
    this.currentEventId = eventId;
    
    // Subscribe to realtime updates
    const subscription = this.realtimeManager.subscribeToLeaderboard(eventId, (update) => {
      // Process the update (could be batched)
      callback(update);
    });

    return {
      unsubscribe: () => {
        subscription.unsubscribe();
        this.currentEventId = null;
      }
    };
  }

  /**
   * Enable live competition mode for an event
   * Requirements: 5.4
   */
  enableLiveMode(eventId: string): void {
    this.isLiveMode = true;
    this.currentEventId = eventId;
    
    // In live mode, we could reduce throttling or increase update frequency
    // For now, we just set the flag
    console.log(`Live mode enabled for event: ${eventId}`);
  }

  /**
   * Disable live competition mode
   */
  disableLiveMode(): void {
    this.isLiveMode = false;
    this.currentEventId = null;
    console.log('Live mode disabled');
  }

  /**
   * Set current user ID for highlighting
   * Requirements: 5.3
   */
  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Subscribe to optimistic update errors
   * Delegates to centralized OptimisticUpdateManager
   */
  onError(callback: (error: OptimisticUpdateError) => void): Subscription {
    return this.optimisticManager.onError((notification) => {
      if (notification.error.type === 'leaderboard') {
        callback(notification.error);
      }
    });
  }

  /**
   * Check if a user has a pending score update
   */
  hasPendingUpdate(userId: string): boolean {
    return this.pendingUpdates.has(userId);
  }

  /**
   * Get pending score for a user (if any)
   */
  getPendingScore(userId: string): number | null {
    const pending = this.pendingUpdates.get(userId);
    return pending ? pending.score : null;
  }

  /**
   * Calculate rank change indicator
   * Requirements: 5.5
   */
  private calculateRankChange(currentRank: number, previousRank?: number): 'up' | 'down' | 'same' | null {
    if (previousRank === undefined || previousRank === null) {
      return null;
    }

    if (currentRank < previousRank) {
      return 'up'; // Improved rank (lower number is better)
    } else if (currentRank > previousRank) {
      return 'down'; // Worse rank
    } else {
      return 'same';
    }
  }

  /**
   * Schedule update for batching
   * Requirements: 9.4
   */
  private scheduleUpdate(update: LeaderboardUpdate): void {
    this.updateBatch.set(update.userId, update);

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, this.BATCH_WINDOW);
    }
  }

  /**
   * Flush batched updates
   */
  private flushBatch(): void {
    const updates = Array.from(this.updateBatch.values());
    
    if (updates.length > 0) {
      // Process batched updates
      // In a real implementation, this would send batched updates to the server
      // or process them locally for UI updates
      console.log(`Processing ${updates.length} batched leaderboard updates`);
    }

    this.updateBatch.clear();
    this.batchTimer = null;
  }

  /**
   * Recalculate ranks for all entries in an event
   */
  private async recalculateRanks(eventId: string): Promise<void> {
    // Fetch all entries ordered by score descending
    const { data: entries, error: fetchError } = await this.supabase
      .from('leaderboard_scores')
      .select('id, score, rank')
      .eq('event_id', eventId)
      .order('score', { ascending: false })
      .order('id', { ascending: true }); // Secondary sort for consistency

    if (fetchError) {
      throw new Error(`Failed to fetch leaderboard entries: ${fetchError.message}`);
    }

    if (!entries || entries.length === 0) {
      return;
    }

    // Calculate ranks with tie handling
    let currentRank = 1;
    let previousScore: number | null = null;
    let previousRank: number | null = null;

    const updates = entries.map((entry, index) => {
      // Store previous rank before updating
      previousRank = entry.rank;

      // If score is different from previous, update rank to current position + 1
      if (previousScore !== null && entry.score !== previousScore) {
        currentRank = index + 1;
      }

      previousScore = entry.score;

      return {
        id: entry.id,
        rank: currentRank,
        previous_rank: previousRank,
        updated_at: new Date().toISOString()
      };
    });

    // Batch update all ranks
    const { error: updateError } = await this.supabase
      .from('leaderboard_scores')
      .upsert(updates, { onConflict: 'id' });

    if (updateError) {
      throw new Error(`Failed to update ranks: ${updateError.message}`);
    }
  }
}

// Singleton instance
let leaderboardServiceInstance: LeaderboardService | null = null;

/**
 * Get singleton instance of LeaderboardService
 */
export function getLeaderboardService(): LeaderboardService {
  if (!leaderboardServiceInstance) {
    leaderboardServiceInstance = new LeaderboardService();
  }
  return leaderboardServiceInstance;
}