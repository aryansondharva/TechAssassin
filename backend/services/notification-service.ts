/**
 * Notification Service
 * 
 * Core service for managing real-time notifications for XP, badge, and rank events
 * using Supabase Realtime.
 * 
 * Requirements:
 * - 8.1, 8.2, 8.3: Real-time XP, badge, and rank notifications
 * - 9.1, 9.2, 9.3, 9.4: Notification delivery and formatting
 * - 6.4: Rank-up notifications
 * - 4.4: Badge unlock notifications
 */

import { createClient } from '@/lib/supabase/server';
import type { XPTransaction } from './xp-service';
import type { UserBadge } from './badge-service';
import type { RankChangeResult } from './rank-service';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type NotificationType = 'xp_gain' | 'badge_unlock' | 'rank_up';

export interface XPNotificationPayload {
  type: 'xp_gain';
  userId: string;
  amount: number;
  source: string;
  description: string;
  newTotal: number;
  transaction: XPTransaction;
  timestamp: Date;
}

export interface BadgeNotificationPayload {
  type: 'badge_unlock';
  userId: string;
  badge: {
    id: string;
    name: string;
    description: string;
    category: string;
    rarityLevel: string;
    iconUrl: string;
  };
  earnedAt: Date;
  timestamp: Date;
}

export interface RankNotificationPayload {
  type: 'rank_up';
  userId: string;
  previousRank: {
    id: string;
    name: string;
    iconUrl: string;
  } | null;
  newRank: {
    id: string;
    name: string;
    iconUrl: string;
    minimumXpThreshold: number;
  };
  progress: {
    currentXP: number;
    progressPercentage: number;
  };
  timestamp: Date;
}

export type NotificationPayload = 
  | XPNotificationPayload 
  | BadgeNotificationPayload 
  | RankNotificationPayload;

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// Notification Service Class
// ============================================================================

export class NotificationService {
  /**
   * Notify user of XP gain via Supabase Realtime
   * 
   * Requirements: 8.1, 8.2, 8.4, 9.1, 9.2
   * 
   * @param userId - User ID to notify
   * @param transaction - XP transaction details
   * @param newTotal - User's new total XP
   */
  async notifyXPGain(
    userId: string,
    transaction: XPTransaction,
    newTotal: number
  ): Promise<void> {
    const supabase = await createClient();
    
    // Format XP notification payload
    const payload: XPNotificationPayload = {
      type: 'xp_gain',
      userId,
      amount: transaction.amount,
      source: transaction.source,
      description: transaction.description,
      newTotal,
      transaction,
      timestamp: new Date()
    };
    
    // Persist notification to database
    const title = `+${transaction.amount} XP`;
    const message = transaction.description;
    
    await this.persistNotification(
      userId,
      'xp_gain',
      title,
      message,
      {
        amount: transaction.amount,
        source: transaction.source,
        newTotal,
        transactionId: transaction.id
      }
    );
    
    // Broadcast to user's XP channel
    const channelName = `gamification:xp:${userId}`;
    
    try {
      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'xp_gained',
        payload
      });
    } catch (error) {
      console.error(`Failed to send XP notification to user ${userId}:`, error);
      // Don't throw - notification failure shouldn't break XP award
    }
  }
  
  /**
   * Notify user of badge unlock via Supabase Realtime
   * 
   * Requirements: 8.2, 8.4, 9.1, 9.2, 9.4, 4.4
   * 
   * @param userId - User ID to notify
   * @param userBadge - User badge details
   */
  async notifyBadgeUnlock(userId: string, userBadge: UserBadge): Promise<void> {
    const supabase = await createClient();
    
    // Format badge notification payload
    const payload: BadgeNotificationPayload = {
      type: 'badge_unlock',
      userId,
      badge: {
        id: userBadge.badge.id,
        name: userBadge.badge.name,
        description: userBadge.badge.description,
        category: userBadge.badge.category,
        rarityLevel: userBadge.badge.rarityLevel,
        iconUrl: userBadge.badge.iconUrl
      },
      earnedAt: userBadge.earnedAt,
      timestamp: new Date()
    };
    
    // Persist notification to database
    const title = `Badge Unlocked: ${userBadge.badge.name}`;
    const message = userBadge.badge.description;
    
    await this.persistNotification(
      userId,
      'badge_unlock',
      title,
      message,
      {
        badgeId: userBadge.badge.id,
        badgeName: userBadge.badge.name,
        category: userBadge.badge.category,
        rarityLevel: userBadge.badge.rarityLevel,
        iconUrl: userBadge.badge.iconUrl
      }
    );
    
    // Broadcast to user's badge channel
    const channelName = `gamification:badges:${userId}`;
    
    try {
      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'badge_unlocked',
        payload
      });
    } catch (error) {
      console.error(`Failed to send badge notification to user ${userId}:`, error);
      // Don't throw - notification failure shouldn't break badge award
    }
  }
  
  /**
   * Notify user of rank change via Supabase Realtime
   * 
   * Requirements: 8.3, 8.4, 9.1, 9.2, 9.4, 6.4
   * 
   * @param userId - User ID to notify
   * @param rankChange - Rank change details
   * @param currentXP - User's current total XP
   * @param progressPercentage - Progress to next rank
   */
  async notifyRankUp(
    userId: string,
    rankChange: RankChangeResult,
    currentXP: number,
    progressPercentage: number
  ): Promise<void> {
    const supabase = await createClient();
    
    // Only notify if it's actually a rank up
    if (!rankChange.rankUp || !rankChange.currentRank) {
      return;
    }
    
    // Format rank notification payload
    const payload: RankNotificationPayload = {
      type: 'rank_up',
      userId,
      previousRank: rankChange.previousRank ? {
        id: rankChange.previousRank.id,
        name: rankChange.previousRank.name,
        iconUrl: rankChange.previousRank.iconUrl
      } : null,
      newRank: {
        id: rankChange.currentRank.id,
        name: rankChange.currentRank.name,
        iconUrl: rankChange.currentRank.iconUrl,
        minimumXpThreshold: rankChange.currentRank.minimumXpThreshold
      },
      progress: {
        currentXP,
        progressPercentage
      },
      timestamp: new Date()
    };
    
    // Persist notification to database
    const title = `Rank Up: ${rankChange.currentRank.name}`;
    const previousRankName = rankChange.previousRank?.name || 'Unranked';
    const message = `Congratulations! You've advanced from ${previousRankName} to ${rankChange.currentRank.name}`;
    
    await this.persistNotification(
      userId,
      'rank_up',
      title,
      message,
      {
        previousRankId: rankChange.previousRank?.id,
        previousRankName,
        newRankId: rankChange.currentRank.id,
        newRankName: rankChange.currentRank.name,
        newRankIconUrl: rankChange.currentRank.iconUrl,
        currentXP,
        progressPercentage
      }
    );
    
    // Broadcast to user's rank channel
    const channelName = `gamification:ranks:${userId}`;
    
    try {
      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'rank_up',
        payload
      });
    } catch (error) {
      console.error(`Failed to send rank notification to user ${userId}:`, error);
      // Don't throw - notification failure shouldn't break rank update
    }
  }
  
  /**
   * Get user's notification history with filtering
   * 
   * Requirements: 9.5
   * 
   * @param userId - User ID
   * @param filters - Optional filters for type, read status, date range
   * @returns Array of notifications
   */
  async getUserNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<Notification[]> {
    const supabase = await createClient();
    
    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString()); // Only non-expired
    
    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.read !== undefined) {
      query = query.eq('read', filters.read);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }
    
    // Order by created_at descending
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get user notifications: ${error.message}`);
    }
    
    return (data || []).map(this.mapNotificationFromDB);
  }
  
  /**
   * Mark a notification as read
   * 
   * Requirements: 9.5
   * 
   * @param notificationId - Notification ID
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }
  
  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  
  /**
   * Persist notification to database
   * 
   * Requirements: 9.5
   * 
   * @param userId - User ID
   * @param type - Notification type
   * @param title - Notification title
   * @param message - Notification message
   * @param metadata - Additional metadata
   */
  private async persistNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        metadata,
        read: false
      });
    
    if (error) {
      console.error(`Failed to persist notification for user ${userId}:`, error);
      // Don't throw - persistence failure shouldn't break the main operation
    }
  }
  
  /**
   * Map database notification record to Notification interface
   */
  private mapNotificationFromDB(dbRecord: any): Notification {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      type: dbRecord.type,
      title: dbRecord.title,
      message: dbRecord.message,
      metadata: dbRecord.metadata || {},
      read: dbRecord.read,
      createdAt: new Date(dbRecord.created_at),
      expiresAt: new Date(dbRecord.expires_at)
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const notificationService = new NotificationService();
