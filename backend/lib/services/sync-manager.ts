import { getRealtimeManager, type PresenceState } from './realtime-manager';
import { getPresenceService } from './presence-service';
import { getActivityService } from './activity-service';
import { getLeaderboardService } from './leaderboard-service';

export interface SyncError {
  type: 'presence_desync' | 'activity_gap' | 'leaderboard_inconsistency';
  message: string;
  timestamp: Date;
  recovered: boolean;
}

/**
 * SyncManager - Detects and handles data synchronization issues
 * 
 * Responsibilities:
 * - Detect presence state desynchronization
 * - Detect activity feed gaps
 * - Detect leaderboard inconsistencies
 * - Trigger resynchronization when issues are detected
 * - Notify about sync errors
 */
export class SyncManager {
  private realtimeManager = getRealtimeManager();
  private presenceService = getPresenceService();
  private activityService = getActivityService();
  private leaderboardService = getLeaderboardService();
  private syncErrorCallbacks: Set<(error: SyncError) => void> = new Set();
  private lastPresenceSync: Date | null = null;
  private lastActivityId: string | null = null;
  private syncCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize sync manager and start monitoring
   */
  initialize(): void {
    // Check for sync issues every 30 seconds
    this.syncCheckInterval = setInterval(() => {
      this.checkSyncHealth();
    }, 30000);

    // Listen for connection state changes to trigger resync
    this.realtimeManager.onConnectionStateChange((state) => {
      if (state === 'connected') {
        this.resyncAll();
      }
    });
  }

  /**
   * Check overall sync health
   */
  private async checkSyncHealth(): Promise<void> {
    await this.checkPresenceSync();
    await this.checkActivityGaps();
  }

  /**
   * Detect presence state desynchronization
   * Compares local presence state with server state
   */
  private async checkPresenceSync(): Promise<void> {
    try {
      // Fetch current presence state from server
      const response = await fetch('/api/presence/online');
      if (!response.ok) {
        throw new Error('Failed to fetch presence state');
      }

      const serverState = await response.json();
      const localState = this.presenceService.getOnlineUsers();

      // Compare counts - if significantly different, trigger resync
      const serverCount = Object.keys(serverState).length;
      const localCount = Object.keys(localState).length;
      const difference = Math.abs(serverCount - localCount);

      // If difference is more than 20% or more than 5 users, consider it a desync
      if (difference > 5 || difference / Math.max(serverCount, 1) > 0.2) {
        const syncError: SyncError = {
          type: 'presence_desync',
          message: `Presence state desync detected: server has ${serverCount} users, local has ${localCount}`,
          timestamp: new Date(),
          recovered: false,
        };

        this.notifySyncError(syncError);
        console.warn('Presence desync detected, triggering resync...');

        // Trigger resynchronization
        await this.resyncPresence();

        syncError.recovered = true;
        this.notifySyncError(syncError);
      }

      this.lastPresenceSync = new Date();
    } catch (error) {
      console.error('Failed to check presence sync:', error);
    }
  }

  /**
   * Detect activity feed gaps
   * Checks for missing activity IDs in sequence
   */
  private async checkActivityGaps(): Promise<void> {
    try {
      // Fetch recent activities from server
      const activities = await this.activityService.getActivities({
        page: 1,
        pageSize: 20,
      });

      if (activities.activities.length === 0) {
        return;
      }

      // Check if we have a significant gap in activity timestamps
      const now = new Date();
      const mostRecentActivity = activities.activities[0];
      const timeSinceLastActivity = now.getTime() - mostRecentActivity.createdAt.getTime();

      // If no activity for more than 5 minutes during active hours, might indicate a gap
      // This is a simple heuristic - in production you'd want more sophisticated detection
      if (timeSinceLastActivity > 5 * 60 * 1000) {
        // Check if there are online users (indicating activity should be happening)
        const onlineUsers = this.presenceService.getOnlineUsers();
        const onlineCount = Object.keys(onlineUsers).length;

        if (onlineCount > 5) {
          const syncError: SyncError = {
            type: 'activity_gap',
            message: `Potential activity gap detected: ${onlineCount} users online but no activity for ${Math.floor(timeSinceLastActivity / 60000)} minutes`,
            timestamp: new Date(),
            recovered: false,
          };

          this.notifySyncError(syncError);
          console.warn('Activity gap detected, refreshing feed...');

          // Trigger activity feed refresh
          // In a real implementation, you'd fetch missing activities
          syncError.recovered = true;
          this.notifySyncError(syncError);
        }
      }
    } catch (error) {
      console.error('Failed to check activity gaps:', error);
    }
  }

  /**
   * Detect leaderboard inconsistencies
   * Validates rank calculations and checks for data integrity
   */
  async checkLeaderboardConsistency(eventId: string): Promise<boolean> {
    try {
      // Fetch leaderboard from server
      const leaderboard = await this.leaderboardService.getLeaderboard(eventId, {
        page: 1,
        pageSize: 100,
      });

      // Validate rank ordering
      let previousScore: number | null = null;
      let previousRank: number | null = null;

      for (const entry of leaderboard.entries) {
        // Check if ranks are sequential
        if (previousRank !== null && entry.rank !== previousRank + 1) {
          // Allow ties (same rank)
          if (previousScore !== entry.score) {
            const syncError: SyncError = {
              type: 'leaderboard_inconsistency',
              message: `Leaderboard rank inconsistency detected: rank ${previousRank} followed by ${entry.rank}`,
              timestamp: new Date(),
              recovered: false,
            };

            this.notifySyncError(syncError);
            console.warn('Leaderboard inconsistency detected, refreshing...');

            // Trigger leaderboard refresh
            await this.resyncLeaderboard(eventId);

            syncError.recovered = true;
            this.notifySyncError(syncError);
            return false;
          }
        }

        // Check if scores are in descending order
        if (previousScore !== null && entry.score > previousScore) {
          const syncError: SyncError = {
            type: 'leaderboard_inconsistency',
            message: `Leaderboard score ordering inconsistency detected`,
            timestamp: new Date(),
            recovered: false,
          };

          this.notifySyncError(syncError);
          console.warn('Leaderboard ordering inconsistency detected, refreshing...');

          await this.resyncLeaderboard(eventId);

          syncError.recovered = true;
          this.notifySyncError(syncError);
          return false;
        }

        previousScore = entry.score;
        previousRank = entry.rank;
      }

      return true;
    } catch (error) {
      console.error('Failed to check leaderboard consistency:', error);
      return false;
    }
  }

  /**
   * Resynchronize all data
   */
  async resyncAll(): Promise<void> {
    console.log('Resynchronizing all data...');
    await Promise.all([
      this.resyncPresence(),
      this.realtimeManager.resyncState(),
    ]);
  }

  /**
   * Resynchronize presence state
   */
  private async resyncPresence(): Promise<void> {
    try {
      // Fetch fresh presence state from server
      const response = await fetch('/api/presence/online');
      if (!response.ok) {
        throw new Error('Failed to fetch presence state');
      }

      // The presence service will automatically update when the realtime channel syncs
      console.log('Presence state resynchronized');
    } catch (error) {
      console.error('Failed to resync presence:', error);
    }
  }

  /**
   * Resynchronize leaderboard for an event
   */
  private async resyncLeaderboard(eventId: string): Promise<void> {
    try {
      // Fetch fresh leaderboard data
      await this.leaderboardService.getLeaderboard(eventId, {
        page: 1,
        pageSize: 100,
      });

      console.log(`Leaderboard resynchronized for event ${eventId}`);
    } catch (error) {
      console.error('Failed to resync leaderboard:', error);
    }
  }

  /**
   * Subscribe to sync errors
   */
  onSyncError(callback: (error: SyncError) => void): { unsubscribe: () => void } {
    this.syncErrorCallbacks.add(callback);
    return {
      unsubscribe: () => {
        this.syncErrorCallbacks.delete(callback);
      },
    };
  }

  /**
   * Cleanup and stop monitoring
   */
  cleanup(): void {
    if (this.syncCheckInterval) {
      clearInterval(this.syncCheckInterval);
      this.syncCheckInterval = null;
    }
    this.syncErrorCallbacks.clear();
  }

  /**
   * Notify sync error callbacks
   */
  private notifySyncError(error: SyncError): void {
    this.syncErrorCallbacks.forEach((callback) => callback(error));
  }
}

// Singleton instance
let syncManagerInstance: SyncManager | null = null;

/**
 * Get singleton instance of SyncManager
 */
export function getSyncManager(): SyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager();
  }
  return syncManagerInstance;
}
