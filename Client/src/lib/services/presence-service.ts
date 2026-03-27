import { getRealtimeManager, type PresenceState, type Subscription } from './realtime-manager';
import { createClient } from '@/lib/supabase/client';
import { getOptimisticUpdateManager, type OptimisticUpdateError } from './optimistic-update-manager';

export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

export interface PresenceLocation {
  type: 'page' | 'event';
  id: string;
}

export interface UserPresence {
  status: UserStatus;
  location?: PresenceLocation;
  lastSeen: Date;
  username: string;
  avatarUrl?: string;
  isPending?: boolean; // Indicates optimistic update not yet confirmed
}

// Re-export OptimisticUpdateError for convenience
export type { OptimisticUpdateError } from './optimistic-update-manager';

/**
 * PresenceService - Manages user online status and presence tracking
 * 
 * Responsibilities:
 * - Track user online/away/busy status
 * - Broadcast status changes to all clients
 * - Maintain presence state for all online users
 * - Update last seen timestamps via heartbeat
 * - Count active users per page/event
 */
export class PresenceService {
  private realtimeManager = getRealtimeManager();
  private supabase = createClient();
  private optimisticManager = getOptimisticUpdateManager();
  private currentUserId: string | null = null;
  private currentStatus: UserStatus = 'offline';
  private currentLocation: PresenceLocation | null = null;
  private presenceState: PresenceState = {};
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private presenceSubscription: Subscription | null = null;
  private statusChangeCallbacks: Map<string, Set<(status: UserStatus) => void>> = new Map();
  private presenceChangeCallbacks: Set<(state: PresenceState) => void> = new Set();
  private pendingStatusUpdate: { status: UserStatus; tempId: string } | null = null;

  /**
   * Initialize presence service for current user
   */
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    // Subscribe to presence channel
    this.presenceSubscription = this.realtimeManager.subscribeToPresence((state) => {
      this.presenceState = state;
      this.notifyPresenceChange(state);
    });

    // Listen for connection state changes to handle disconnection
    this.realtimeManager.onConnectionStateChange((state) => {
      if (state === 'disconnected') {
        this.handleDisconnection();
      }
    });

    // Handle page unload/close
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.handleDisconnection();
      });
    }
  }

  /**
   * Update user status with optimistic update
   */
  async updateStatus(status: UserStatus): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('PresenceService not initialized');
    }

    // Store previous state for rollback
    const previousStatus = this.currentStatus;
    const tempId = `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Register pending update
    this.optimisticManager.registerPendingUpdate({
      id: tempId,
      type: 'presence',
      timestamp: new Date(),
      data: { status, userId: this.currentUserId },
    });

    // Optimistic update with pending indicator
    this.currentStatus = status;
    this.pendingStatusUpdate = { status, tempId };

    // Update local presence state with pending flag
    if (this.presenceState[this.currentUserId]) {
      this.presenceState[this.currentUserId] = {
        ...this.presenceState[this.currentUserId],
        status,
        isPending: true,
      };
    }

    // Notify callbacks immediately
    this.notifyStatusChange(this.currentUserId, status);
    this.notifyPresenceChange(this.presenceState);

    try {
      // Send to backend
      const response = await fetch('/api/presence/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUserId,
          status,
          location: this.currentLocation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update status' }));
        throw new Error(errorData.message || 'Failed to update status');
      }

      // Confirm optimistic update - remove pending flag
      this.optimisticManager.confirmUpdate(tempId);
      this.pendingStatusUpdate = null;
      if (this.presenceState[this.currentUserId]) {
        this.presenceState[this.currentUserId] = {
          ...this.presenceState[this.currentUserId],
          isPending: false,
        };
        this.notifyPresenceChange(this.presenceState);
      }
    } catch (error) {
      // Rollback on failure
      this.currentStatus = previousStatus;
      this.pendingStatusUpdate = null;

      // Revert local presence state
      if (this.presenceState[this.currentUserId]) {
        this.presenceState[this.currentUserId] = {
          ...this.presenceState[this.currentUserId],
          status: previousStatus,
          isPending: false,
        };
      }

      // Notify callbacks of rollback
      this.notifyStatusChange(this.currentUserId, previousStatus);
      this.notifyPresenceChange(this.presenceState);

      // Rollback and notify error through centralized manager
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      this.optimisticManager.rollbackUpdate(tempId, {
        type: 'presence',
        tempId,
        message: errorMessage,
        originalData: { status: previousStatus },
      });

      console.error('Failed to update status:', error);
      throw error;
    }
  }

  /**
   * Get current user's status
   */
  getMyStatus(): UserStatus {
    return this.currentStatus;
  }

  /**
   * Get status of a specific user
   */
  getUserStatus(userId: string): UserStatus | null {
    const presence = this.presenceState[userId];
    return presence ? presence.status : null;
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): PresenceState {
    return this.presenceState;
  }

  /**
   * Get count of active users (optionally filtered by location)
   */
  getActiveCount(location?: PresenceLocation): number {
    const users = Object.values(this.presenceState);
    
    if (!location) {
      return users.filter(u => u.status !== 'offline').length;
    }

    return users.filter(u => 
      u.status !== 'offline' &&
      u.location?.type === location.type &&
      u.location?.id === location.id
    ).length;
  }

  /**
   * Get last seen timestamp for a user
   */
  getLastSeen(userId: string): Date | null {
    const presence = this.presenceState[userId];
    return presence ? presence.lastSeen : null;
  }

  /**
   * Format last seen timestamp with relative/absolute time
   * Returns relative time (e.g., "5 minutes ago") for timestamps < 24 hours
   * Returns absolute date for timestamps >= 24 hours
   */
  formatLastSeen(userId: string): string | null {
    const lastSeen = this.getLastSeen(userId);
    if (!lastSeen) {
      return null;
    }

    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // If less than 24 hours, use relative time
    if (diffHours < 24) {
      return this.formatRelativeTime(diffMs);
    }

    // If 24+ hours, use absolute date
    return this.formatAbsoluteDate(lastSeenDate);
  }

  /**
   * Format relative time (e.g., "5 minutes ago", "2 hours ago")
   */
  private formatRelativeTime(diffMs: number): string {
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return diffSeconds === 1 ? '1 second ago' : `${diffSeconds} seconds ago`;
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    } else {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
  }

  /**
   * Format absolute date (e.g., "Jan 15, 2024")
   */
  private formatAbsoluteDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Start tracking presence at a specific location
   */
  trackPresence(location: PresenceLocation): void {
    if (!this.currentUserId) {
      throw new Error('PresenceService not initialized');
    }

    this.currentLocation = location;

    // Start heartbeat timer (update every 30 seconds)
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);

    // Send initial heartbeat
    this.sendHeartbeat();
  }

  /**
   * Stop tracking presence
   */
  stopTracking(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.currentLocation = null;

    // Update status to offline
    if (this.currentUserId) {
      this.updateStatus('offline').catch(console.error);
    }
  }

  /**
   * Subscribe to presence state changes
   */
  onPresenceChange(callback: (state: PresenceState) => void): Subscription {
    this.presenceChangeCallbacks.add(callback);
    
    // Immediately call with current state
    callback(this.presenceState);

    return {
      unsubscribe: () => {
        this.presenceChangeCallbacks.delete(callback);
      },
    };
  }

  /**
   * Subscribe to status changes for a specific user
   */
  onUserStatusChange(userId: string, callback: (status: UserStatus) => void): Subscription {
    if (!this.statusChangeCallbacks.has(userId)) {
      this.statusChangeCallbacks.set(userId, new Set());
    }

    this.statusChangeCallbacks.get(userId)!.add(callback);

    // Immediately call with current status
    const currentStatus = this.getUserStatus(userId);
    if (currentStatus) {
      callback(currentStatus);
    }

    return {
      unsubscribe: () => {
        const callbacks = this.statusChangeCallbacks.get(userId);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            this.statusChangeCallbacks.delete(userId);
          }
        }
      },
    };
  }

  /**
   * Subscribe to optimistic update errors
   * Delegates to centralized OptimisticUpdateManager
   */
  onError(callback: (error: OptimisticUpdateError) => void): Subscription {
    return this.optimisticManager.onError((notification) => {
      if (notification.error.type === 'presence') {
        callback(notification.error);
      }
    });
  }

  /**
   * Cleanup and disconnect
   */
  cleanup(): void {
    this.stopTracking();
    
    if (this.presenceSubscription) {
      this.presenceSubscription.unsubscribe();
      this.presenceSubscription = null;
    }

    this.presenceChangeCallbacks.clear();
    this.statusChangeCallbacks.clear();
  }

  /**
   * Send heartbeat to update last_seen timestamp
   */
  private async sendHeartbeat(): Promise<void> {
    if (!this.currentUserId) {
      return;
    }

    try {
      await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUserId,
          location: this.currentLocation,
        }),
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  /**
   * Notify all presence change callbacks
   */
  private notifyPresenceChange(state: PresenceState): void {
    this.presenceChangeCallbacks.forEach(callback => callback(state));
  }

  /**
   * Notify status change callbacks for a specific user
   */
  private notifyStatusChange(userId: string, status: UserStatus): void {
    const callbacks = this.statusChangeCallbacks.get(userId);
    if (callbacks) {
      callbacks.forEach(callback => callback(status));
    }
  }

  /**
   * Handle disconnection - update status to offline and persist timestamp
   */
  private handleDisconnection(): void {
    if (!this.currentUserId) {
      return;
    }

    // Update local state immediately
    this.currentStatus = 'offline';

    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Persist offline status and last_seen timestamp to database
    // Use sendBeacon for reliability during page unload
    const data = JSON.stringify({
      userId: this.currentUserId,
      status: 'offline',
      location: this.currentLocation,
    });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/presence/update', data);
    } else {
      // Fallback to fetch with keepalive
      fetch('/api/presence/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true,
      }).catch(console.error);
    }
  }
}

// Singleton instance
let presenceServiceInstance: PresenceService | null = null;

/**
 * Get singleton instance of PresenceService
 */
export function getPresenceService(): PresenceService {
  if (!presenceServiceInstance) {
    presenceServiceInstance = new PresenceService();
  }
  return presenceServiceInstance;
}
