/**
 * OptimisticUpdateManager - Centralized manager for optimistic updates across all services
 * 
 * Provides:
 * - Unified error notification system
 * - Pending update tracking
 * - Rollback coordination
 * - User-facing error messages
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

export interface OptimisticUpdateError {
  type: 'presence' | 'activity' | 'leaderboard';
  tempId: string;
  message: string;
  originalData?: any;
}

export interface PendingUpdate {
  id: string;
  type: 'presence' | 'activity' | 'leaderboard';
  timestamp: Date;
  data: any;
}

export interface ErrorNotification {
  id: string;
  error: OptimisticUpdateError;
  timestamp: Date;
  dismissed: boolean;
}

/**
 * Centralized manager for optimistic updates
 */
export class OptimisticUpdateManager {
  private errorCallbacks: Set<(error: ErrorNotification) => void> = new Set();
  private pendingUpdates: Map<string, PendingUpdate> = new Map();
  private errorHistory: ErrorNotification[] = [];
  private readonly MAX_ERROR_HISTORY = 50;

  /**
   * Register a pending update
   */
  registerPendingUpdate(update: PendingUpdate): void {
    this.pendingUpdates.set(update.id, update);
  }

  /**
   * Confirm a pending update (remove from pending)
   */
  confirmUpdate(id: string): void {
    this.pendingUpdates.delete(id);
  }

  /**
   * Rollback a pending update and notify error
   */
  rollbackUpdate(id: string, error: OptimisticUpdateError): void {
    this.pendingUpdates.delete(id);
    this.notifyError(error);
  }

  /**
   * Get all pending updates
   */
  getPendingUpdates(): PendingUpdate[] {
    return Array.from(this.pendingUpdates.values());
  }

  /**
   * Get pending updates by type
   */
  getPendingUpdatesByType(type: 'presence' | 'activity' | 'leaderboard'): PendingUpdate[] {
    return this.getPendingUpdates().filter(update => update.type === type);
  }

  /**
   * Check if an update is pending
   */
  isPending(id: string): boolean {
    return this.pendingUpdates.has(id);
  }

  /**
   * Subscribe to error notifications
   */
  onError(callback: (error: ErrorNotification) => void): { unsubscribe: () => void } {
    this.errorCallbacks.add(callback);

    return {
      unsubscribe: () => {
        this.errorCallbacks.delete(callback);
      },
    };
  }

  /**
   * Get error history
   */
  getErrorHistory(): ErrorNotification[] {
    return [...this.errorHistory];
  }

  /**
   * Dismiss an error notification
   */
  dismissError(errorId: string): void {
    const error = this.errorHistory.find(e => e.id === errorId);
    if (error) {
      error.dismissed = true;
    }
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: OptimisticUpdateError): string {
    const typeMessages = {
      presence: 'Failed to update your status',
      activity: 'Failed to post activity',
      leaderboard: 'Failed to update your score',
    };

    const baseMessage = typeMessages[error.type] || 'An error occurred';
    
    // Add specific error details if available
    if (error.message) {
      return `${baseMessage}: ${error.message}`;
    }

    return baseMessage;
  }

  /**
   * Notify error callbacks
   */
  private notifyError(error: OptimisticUpdateError): void {
    const notification: ErrorNotification = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      error,
      timestamp: new Date(),
      dismissed: false,
    };

    // Add to history
    this.errorHistory.unshift(notification);

    // Trim history if too long
    if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
      this.errorHistory = this.errorHistory.slice(0, this.MAX_ERROR_HISTORY);
    }

    // Notify callbacks
    this.errorCallbacks.forEach(callback => callback(notification));
  }
}

// Singleton instance
let optimisticUpdateManagerInstance: OptimisticUpdateManager | null = null;

/**
 * Get singleton instance of OptimisticUpdateManager
 */
export function getOptimisticUpdateManager(): OptimisticUpdateManager {
  if (!optimisticUpdateManagerInstance) {
    optimisticUpdateManagerInstance = new OptimisticUpdateManager();
  }
  return optimisticUpdateManagerInstance;
}
