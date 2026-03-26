import { getRealtimeManager, type ActivityEvent, type Subscription } from './realtime-manager';
import { createClient } from '@/lib/supabase/client';
import { getOptimisticUpdateManager, type OptimisticUpdateError } from './optimistic-update-manager';

export type ActivityType = 'challenge_solved' | 'event_joined' | 'badge_earned' | 'team_registered';

export interface ActivityMetadata {
  challengeName?: string;
  eventName?: string;
  badgeName?: string;
  teamName?: string;
  [key: string]: any;
}

export interface CreateActivityInput {
  type: ActivityType;
  userId: string;
  metadata: ActivityMetadata;
}

export interface ActivityFilter {
  type?: ActivityType;
  userId?: string;
}

export interface ActivityQueryOptions {
  page: number;
  pageSize: number;
  filter?: ActivityFilter;
}

export interface ActivityPage {
  activities: ActivityEvent[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Re-export OptimisticUpdateError for convenience
export type { OptimisticUpdateError } from './optimistic-update-manager';

/**
 * ActivityService - Manages real-time activity feed
 * 
 * Responsibilities:
 * - Create and broadcast activity events
 * - Subscribe to activity updates
 * - Filter activities by type and user
 * - Paginate activity history
 * - Apply optimistic updates with rollback
 */
export class ActivityService {
  private realtimeManager = getRealtimeManager();
  private supabase = createClient();
  private optimisticManager = getOptimisticUpdateManager();
  private activitySubscription: Subscription | null = null;
  private activityCallbacks: Set<(activity: ActivityEvent) => void> = new Set();
  private pendingActivities: Map<string, ActivityEvent> = new Map();
  private currentFilter: ActivityFilter | null = null;
  private updateQueue: ActivityEvent[] = [];
  private isProcessing: boolean = false;
  private readonly MAX_UPDATES_PER_SECOND = 10;
  private readonly BATCH_INTERVAL = 100; // ms

  /**
   * Initialize activity service
   */
  async initialize(): Promise<void> {
    // Subscribe to activity channel
    this.activitySubscription = this.realtimeManager.subscribeToActivity((activity) => {
      this.handleActivityUpdate(activity);
    });
  }

  /**
   * Create activity with server confirmation
   */
  async createActivity(activity: CreateActivityInput, retryCount: number = 0): Promise<ActivityEvent> {
    // Validate activity type
    this.validateActivityType(activity.type);

    try {
      // Send to backend API
      const response = await fetch('/api/activity/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create activity');
      }

      const serverActivity: ActivityEvent = await response.json();
      return serverActivity;
    } catch (error) {
      // Implement retry logic for transient errors
      const maxRetries = 3;
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
      
      if (retryCount < maxRetries && this.isRetryableError(error)) {
        console.warn(`Activity creation failed, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})...`);
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.createActivity(activity, retryCount + 1);
      }
      
      console.error('Failed to create activity after retries:', error);
      throw error;
    }
  }

  /**
   * Check if error is retryable (network errors, timeouts, 5xx errors)
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Network errors, timeouts, and server errors are retryable
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('fetch failed') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('502')
      );
    }
    return false;
  }

  /**
   * Create activity with optimistic update for immediate UI feedback
   */
  createActivityOptimistic(activity: CreateActivityInput): string {
    // Validate activity type
    this.validateActivityType(activity.type);

    // Generate temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Register pending update
    this.optimisticManager.registerPendingUpdate({
      id: tempId,
      type: 'activity',
      timestamp: new Date(),
      data: activity,
    });

    // Create optimistic activity with pending flag
    const optimisticActivity: ActivityEvent = {
      id: tempId,
      type: activity.type,
      userId: activity.userId,
      username: 'Loading...', // Will be replaced by server response
      metadata: activity.metadata,
      createdAt: new Date(),
      isPending: true,
    };

    // Store in pending map
    this.pendingActivities.set(tempId, optimisticActivity);

    // Notify subscribers immediately
    this.notifySubscribers(optimisticActivity);

    // Send to server in background
    this.createActivity(activity)
      .then((serverActivity) => {
        // Confirm optimistic update
        this.optimisticManager.confirmUpdate(tempId);
        
        // Remove optimistic version
        this.pendingActivities.delete(tempId);
        
        // Notify subscribers with server version (isPending: false)
        this.notifySubscribers({
          ...serverActivity,
          isPending: false,
        });
      })
      .catch((error) => {
        // Rollback optimistic update
        this.pendingActivities.delete(tempId);
        
        // Rollback and notify error through centralized manager
        const errorMessage = error instanceof Error ? error.message : 'Failed to create activity';
        this.optimisticManager.rollbackUpdate(tempId, {
          type: 'activity',
          tempId,
          message: errorMessage,
          originalData: activity,
        });

        console.error('Optimistic activity creation failed:', error);
      });

    return tempId;
  }

  /**
   * Get activities with filtering and pagination
   */
  async getActivities(options: ActivityQueryOptions): Promise<ActivityPage> {
    const { page, pageSize, filter } = options;
    const offset = (page - 1) * pageSize;

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (filter?.type) {
        params.append('type', filter.type);
      }

      if (filter?.userId) {
        params.append('userId', filter.userId);
      }

      // Fetch from API
      const response = await fetch(`/api/activity/feed?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      
      return {
        activities: data.activities.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
        })),
        totalCount: data.totalCount,
        page: data.page,
        pageSize: data.pageSize,
        hasMore: data.hasMore,
      };
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      throw error;
    }
  }

  /**
   * Get single activity by ID
   */
  async getActivityById(id: string): Promise<ActivityEvent | null> {
    try {
      const response = await fetch(`/api/activity/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch activity');
      }

      const activity = await response.json();
      return {
        ...activity,
        createdAt: new Date(activity.createdAt),
      };
    } catch (error) {
      console.error('Failed to fetch activity:', error);
      throw error;
    }
  }

  /**
   * Subscribe to activity creation events
   */
  onActivityCreated(callback: (activity: ActivityEvent) => void): Subscription {
    this.activityCallbacks.add(callback);

    return {
      unsubscribe: () => {
        this.activityCallbacks.delete(callback);
      },
    };
  }

  /**
   * Subscribe to optimistic update errors
   * Delegates to centralized OptimisticUpdateManager
   */
  onError(callback: (error: OptimisticUpdateError) => void): Subscription {
    return this.optimisticManager.onError((notification) => {
      if (notification.error.type === 'activity') {
        callback(notification.error);
      }
    });
  }

  /**
   * Set activity filter
   */
  setFilter(filter: ActivityFilter): void {
    this.currentFilter = filter;
  }

  /**
   * Clear activity filter
   */
  clearFilter(): void {
    this.currentFilter = null;
  }

  /**
   * Get current filter
   */
  getFilter(): ActivityFilter | null {
    return this.currentFilter;
  }

  /**
   * Cleanup and disconnect
   */
  cleanup(): void {
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = null;
    }

    this.activityCallbacks.clear();
    this.pendingActivities.clear();
    this.updateQueue = [];
  }

  /**
   * Validate activity type
   */
  private validateActivityType(type: string): void {
    const validTypes: ActivityType[] = [
      'challenge_solved',
      'event_joined',
      'badge_earned',
      'team_registered',
    ];

    if (!validTypes.includes(type as ActivityType)) {
      throw new Error(`Invalid activity type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Handle activity update from realtime channel
   */
  private handleActivityUpdate(activity: ActivityEvent): void {
    // Add to throttle queue
    this.updateQueue.push(activity);
    this.processQueue();
  }

  /**
   * Process update queue with throttling
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Take up to MAX_UPDATES_PER_SECOND items
    const batch = this.updateQueue.splice(0, this.MAX_UPDATES_PER_SECOND);

    // Notify subscribers for each activity in batch
    for (const activity of batch) {
      this.notifySubscribers(activity);
    }

    // Wait for BATCH_INTERVAL before processing next batch
    setTimeout(() => {
      this.isProcessing = false;
      this.processQueue();
    }, this.BATCH_INTERVAL);
  }

  /**
   * Notify all subscribers of new activity
   */
  private notifySubscribers(activity: ActivityEvent): void {
    this.activityCallbacks.forEach((callback) => callback(activity));
  }
}

// Singleton instance
let activityServiceInstance: ActivityService | null = null;

/**
 * Get singleton instance of ActivityService
 */
export function getActivityService(): ActivityService {
  if (!activityServiceInstance) {
    activityServiceInstance = new ActivityService();
  }
  return activityServiceInstance;
}
