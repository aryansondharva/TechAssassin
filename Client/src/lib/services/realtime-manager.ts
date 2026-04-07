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
 */
export class RealtimeManager {
  private supabase: SupabaseClient | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private stateChangeCallbacks: Set<(state: ConnectionState) => void> = new Set();
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectConfig: ReconnectConfig = {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  };

  /**
   * Connect to Supabase Realtime
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected') {
      return;
    }

    try {
      this.supabase = createClient();
      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Failed to connect to Supabase Realtime:', error);
      this.setConnectionState('disconnected');
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
   * Subscribe to presence channel
   */
  subscribeToPresence(callback: (state: PresenceState) => void): Subscription {
    if (!this.supabase) {
      throw new Error('Not connected to Supabase');
    }

    const channelName = 'presence:global';
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = this.supabase
        .channel(channelName)
        .on('presence', { event: 'sync' }, () => {
          const state = channel!.presenceState();
          callback(state as PresenceState);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          const state = channel!.presenceState();
          callback(state as PresenceState);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          const state = channel!.presenceState();
          callback(state as PresenceState);
        })
        .subscribe();

      this.channels.set(channelName, channel);
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
   * Subscribe to activity channel
   */
  subscribeToActivity(callback: (activity: ActivityEvent) => void): Subscription {
    if (!this.supabase) {
      throw new Error('Not connected to Supabase');
    }

    const channelName = 'activity:feed';
    let channel = this.channels.get(channelName);

    if (!channel) {
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
            callback(activity);
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);
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
        .subscribe();

      this.channels.set(channelName, channel);
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
