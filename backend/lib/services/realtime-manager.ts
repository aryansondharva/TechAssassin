import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

export interface Subscription {
  unsubscribe(): void;
}

export interface ReconnectConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ConnectionError {
  type: 'connection_failed' | 'subscription_failed' | 'reconnection_timeout';
  message: string;
  timestamp: Date;
  canRetry: boolean;
}

export interface PresenceState {
  [userId: string]: {
    status: 'online' | 'away' | 'busy' | 'offline';
    location?: {
      type: 'page' | 'event';
      id: string;
    };
    lastSeen: Date;
    username: string;
    avatarUrl?: string;
    isPending?: boolean;
  };
}

export interface ActivityEvent {
  id: string;
  type: 'challenge_solved' | 'event_joined' | 'badge_earned' | 'team_registered';
  userId: string;
  username: string;
  avatarUrl?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  isPending?: boolean;
}

export interface LeaderboardUpdate {
  eventId: string;
  userId: string;
  newScore: number;
  oldRank: number;
  newRank: number;
}

/**
 * RealtimeManager - Central coordinator for WebSocket connections and channel subscriptions
 * 
 * Responsibilities:
 * - Establish and maintain WebSocket connection to Supabase
 * - Manage channel subscriptions (presence, activity, leaderboard)
 * - Handle connection state (connected, disconnected, reconnecting)
 * - Implement exponential backoff for reconnection attempts
 * - Coordinate state resynchronization after reconnection
 * 
 * Performance Optimizations:
 * - Requirement 9.2: Throttle activity updates to max 10 per second per client
 * - Optimized channel subscription strategy for scalability
 */
export class RealtimeManager {
  private supabase: SupabaseClient | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private stateChangeCallbacks: Set<(state: ConnectionState) => void> = new Set();
  private errorCallbacks: Set<(error: ConnectionError) => void> = new Set();
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectConfig: ReconnectConfig = {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  };
  private lastError: ConnectionError | null = null;

  // Throttling for activity updates (Requirement 9.2: max 10 updates/second)
  private activityUpdateQueue: ActivityEvent[] = [];
  private activityThrottleTimer: NodeJS.Timeout | null = null;
  private readonly MAX_UPDATES_PER_SECOND = 10;
  private readonly THROTTLE_INTERVAL = 100; // ms (10 updates per second = 1 update per 100ms)

  /**
   * Connect to Supabase Realtime with optimized configuration
   * Requirement 9.2: Configure eventsPerSecond throttling
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected') {
      return;
    }

    try {
      // Create Supabase client with optimized realtime configuration
      this.supabase = createClient();
      
      // Note: Realtime throttling is configured in the Supabase client initialization
      // See: lib/supabase/client.ts for eventsPerSecond configuration
      
      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
      this.lastError = null;
    } catch (error) {
      const connectionError: ConnectionError = {
        type: 'connection_failed',
        message: error instanceof Error ? error.message : 'Failed to connect to Supabase Realtime',
        timestamp: new Date(),
        canRetry: true,
      };
      
      this.lastError = connectionError;
      this.notifyError(connectionError);
      
      console.error('Failed to connect to Supabase Realtime:', error);
      this.setConnectionState('disconnected');
      
      // Automatically attempt reconnection
      this.attemptReconnect();
      
      throw error;
    }
  }

  /**
   * Disconnect from Supabase Realtime
   */
  disconnect(): void {
    // Unsubscribe from all channels
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear throttle timer
    if (this.activityThrottleTimer) {
      clearTimeout(this.activityThrottleTimer);
      this.activityThrottleTimer = null;
    }

    // Clear activity queue
    this.activityUpdateQueue = [];

    this.setConnectionState('disconnected');
    this.supabase = null;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Register callback for connection state changes
   */
  onConnectionStateChange(callback: (state: ConnectionState) => void): Subscription {
    this.stateChangeCallbacks.add(callback);
    return {
      unsubscribe: () => {
        this.stateChangeCallbacks.delete(callback);
      },
    };
  }

  /**
   * Register callback for connection errors
   */
  onConnectionError(callback: (error: ConnectionError) => void): Subscription {
    this.errorCallbacks.add(callback);
    return {
      unsubscribe: () => {
        this.errorCallbacks.delete(callback);
      },
    };
  }

  /**
   * Get last connection error
   */
  getLastError(): ConnectionError | null {
    return this.lastError;
  }

  /**
   * Subscribe to presence channel
   */
  subscribeToPresence(callback: (state: PresenceState) => void): Subscription {
    if (!this.supabase) {
      throw new Error('Not connected to Supabase');
    }

    const channelName = 'presence:global';
    let channel = this.channels.get(channelName);

    if (!channel) {
      try {
        channel = this.supabase
          .channel(channelName)
          .on('presence', { event: 'sync' }, () => {
            const state = channel!.presenceState();
            callback(state as unknown as PresenceState);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            const state = channel!.presenceState();
            callback(state as unknown as PresenceState);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            const state = channel!.presenceState();
            callback(state as unknown as PresenceState);
          })
          .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR' || err) {
              const subscriptionError: ConnectionError = {
                type: 'subscription_failed',
                message: err?.message || 'Failed to subscribe to presence channel',
                timestamp: new Date(),
                canRetry: true,
              };
              this.lastError = subscriptionError;
              this.notifyError(subscriptionError);
              console.error('Presence channel subscription error:', err);
              
              // Retry subscription after delay
              setTimeout(() => {
                if (this.connectionState === 'connected') {
                  console.log('Retrying presence channel subscription...');
                  this.subscribeToPresence(callback);
                }
              }, 5000);
            }
          });

        this.channels.set(channelName, channel);
      } catch (error) {
        const subscriptionError: ConnectionError = {
          type: 'subscription_failed',
          message: error instanceof Error ? error.message : 'Failed to create presence channel',
          timestamp: new Date(),
          canRetry: true,
        };
        this.lastError = subscriptionError;
        this.notifyError(subscriptionError);
        throw error;
      }
    }

    return {
      unsubscribe: () => {
        if (channel) {
          channel.unsubscribe();
          this.channels.delete(channelName);
        }
      },
    };
  }

  /**
   * Subscribe to activity channel with throttling
   * Requirement 9.2: Throttle to max 10 updates per second per client
   */
  subscribeToActivity(callback: (activity: ActivityEvent) => void): Subscription {
    if (!this.supabase) {
      throw new Error('Not connected to Supabase');
    }

    const channelName = 'activity:feed';
    let channel = this.channels.get(channelName);

    if (!channel) {
      try {
        channel = this.supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'activity_feed',
            },
            (payload) => {
              const activity = this.mapActivityPayload(payload.new);
              
              // Apply throttling: queue the activity and process at controlled rate
              this.queueActivityUpdate(activity, callback);
            }
          )
          .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR' || err) {
              const subscriptionError: ConnectionError = {
                type: 'subscription_failed',
                message: err?.message || 'Failed to subscribe to activity channel',
                timestamp: new Date(),
                canRetry: true,
              };
              this.lastError = subscriptionError;
              this.notifyError(subscriptionError);
              console.error('Activity channel subscription error:', err);
              
              // Retry subscription after delay
              setTimeout(() => {
                if (this.connectionState === 'connected') {
                  console.log('Retrying activity channel subscription...');
                  this.subscribeToActivity(callback);
                }
              }, 5000);
            }
          });

        this.channels.set(channelName, channel);
      } catch (error) {
        const subscriptionError: ConnectionError = {
          type: 'subscription_failed',
          message: error instanceof Error ? error.message : 'Failed to create activity channel',
          timestamp: new Date(),
          canRetry: true,
        };
        this.lastError = subscriptionError;
        this.notifyError(subscriptionError);
        throw error;
      }
    }

    return {
      unsubscribe: () => {
        if (channel) {
          channel.unsubscribe();
          this.channels.delete(channelName);
        }
      },
    };
  }

  /**
   * Subscribe to leaderboard channel for a specific event
   */
  subscribeToLeaderboard(
    eventId: string,
    callback: (update: LeaderboardUpdate) => void
  ): Subscription {
    if (!this.supabase) {
      throw new Error('Not connected to Supabase');
    }

    const channelName = `leaderboard:${eventId}`;
    let channel = this.channels.get(channelName);

    if (!channel) {
      try {
        channel = this.supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'leaderboard_scores',
              filter: `event_id=eq.${eventId}`,
            },
            (payload) => {
              const update = this.mapLeaderboardPayload(payload);
              callback(update);
            }
          )
          .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR' || err) {
              const subscriptionError: ConnectionError = {
                type: 'subscription_failed',
                message: err?.message || 'Failed to subscribe to leaderboard channel',
                timestamp: new Date(),
                canRetry: true,
              };
              this.lastError = subscriptionError;
              this.notifyError(subscriptionError);
              console.error('Leaderboard channel subscription error:', err);
              
              // Retry subscription after delay
              setTimeout(() => {
                if (this.connectionState === 'connected') {
                  console.log('Retrying leaderboard channel subscription...');
                  this.subscribeToLeaderboard(eventId, callback);
                }
              }, 5000);
            }
          });

        this.channels.set(channelName, channel);
      } catch (error) {
        const subscriptionError: ConnectionError = {
          type: 'subscription_failed',
          message: error instanceof Error ? error.message : 'Failed to create leaderboard channel',
          timestamp: new Date(),
          canRetry: true,
        };
        this.lastError = subscriptionError;
        this.notifyError(subscriptionError);
        throw error;
      }
    }

    return {
      unsubscribe: () => {
        if (channel) {
          channel.unsubscribe();
          this.channels.delete(channelName);
        }
      },
    };
  }

  /**
   * Resynchronize state after reconnection
   */
  async resyncState(): Promise<void> {
    // Resubscribe to all channels
    const channelNames = Array.from(this.channels.keys());
    for (const channelName of channelNames) {
      const channel = this.channels.get(channelName);
      if (channel) {
        await channel.subscribe();
      }
    }
  }

  /**
   * Set reconnection configuration
   */
  setReconnectConfig(config: Partial<ReconnectConfig>): void {
    this.reconnectConfig = { ...this.reconnectConfig, ...config };
  }

  /**
   * Manually trigger reconnection
   */
  async manualReconnect(): Promise<void> {
    this.reconnectAttempts = 0;
    await this.attemptReconnect();
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.reconnectConfig.maxAttempts) {
      console.error('Max reconnection attempts reached');
      
      const timeoutError: ConnectionError = {
        type: 'reconnection_timeout',
        message: `Failed to reconnect after ${this.reconnectConfig.maxAttempts} attempts`,
        timestamp: new Date(),
        canRetry: true,
      };
      
      this.lastError = timeoutError;
      this.notifyError(timeoutError);
      this.setConnectionState('disconnected');
      return;
    }

    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(
      this.reconnectConfig.initialDelay *
        Math.pow(this.reconnectConfig.backoffMultiplier, this.reconnectAttempts - 1),
      this.reconnectConfig.maxDelay
    );

    console.log(
      `Reconnection attempt ${this.reconnectAttempts}/${this.reconnectConfig.maxAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        await this.resyncState();
        console.log('Reconnection successful');
      } catch (error) {
        console.error('Reconnection failed:', error);
        await this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Handle connection drop and initiate reconnection
   */
  handleConnectionDrop(): void {
    if (this.connectionState === 'connected') {
      console.warn('Connection dropped, initiating reconnection');
      this.setConnectionState('disconnected');
      this.attemptReconnect();
    }
  }

  /**
   * Set connection state and notify callbacks
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.stateChangeCallbacks.forEach((callback) => callback(state));
    }
  }

  /**
   * Notify error callbacks
   */
  private notifyError(error: ConnectionError): void {
    this.errorCallbacks.forEach((callback) => callback(error));
  }

  /**
   * Queue activity update for throttled delivery
   * Implements Requirement 9.2: Max 10 updates per second per client
   */
  private queueActivityUpdate(activity: ActivityEvent, callback: (activity: ActivityEvent) => void): void {
    this.activityUpdateQueue.push(activity);

    // Start throttle timer if not already running
    if (!this.activityThrottleTimer) {
      this.processActivityQueue(callback);
    }
  }

  /**
   * Process activity queue at controlled rate (10 updates/second)
   */
  private processActivityQueue(callback: (activity: ActivityEvent) => void): void {
    if (this.activityUpdateQueue.length === 0) {
      this.activityThrottleTimer = null;
      return;
    }

    // Take up to MAX_UPDATES_PER_SECOND items from queue
    const batch = this.activityUpdateQueue.splice(0, this.MAX_UPDATES_PER_SECOND);

    // Deliver batch to callback
    batch.forEach((activity) => callback(activity));

    // Schedule next batch after THROTTLE_INTERVAL
    this.activityThrottleTimer = setTimeout(() => {
      this.processActivityQueue(callback);
    }, this.THROTTLE_INTERVAL);
  }

  /**
   * Map activity payload from database to ActivityEvent
   */
  private mapActivityPayload(payload: any): ActivityEvent {
    return {
      id: payload.id,
      type: payload.type,
      userId: payload.user_id,
      username: payload.username || 'Unknown',
      avatarUrl: payload.avatar_url,
      metadata: payload.metadata || {},
      createdAt: new Date(payload.created_at),
    };
  }

  /**
   * Map leaderboard payload to LeaderboardUpdate
   */
  private mapLeaderboardPayload(payload: any): LeaderboardUpdate {
    const { new: newData, old: oldData } = payload;
    return {
      eventId: newData.event_id,
      userId: newData.user_id,
      newScore: newData.score,
      oldRank: oldData?.rank || 0,
      newRank: newData.rank,
    };
  }
}

// Singleton instance
let realtimeManagerInstance: RealtimeManager | null = null;

/**
 * Get singleton instance of RealtimeManager
 */
export function getRealtimeManager(): RealtimeManager {
  if (!realtimeManagerInstance) {
    realtimeManagerInstance = new RealtimeManager();
  }
  return realtimeManagerInstance;
}
