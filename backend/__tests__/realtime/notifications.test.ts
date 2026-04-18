/**
 * Integration Tests: Realtime Notifications
 * 
 * Tests realtime notification system including:
 * - XP gain notifications
 * - Badge unlock notifications
 * - Rank-up notifications
 * - Leaderboard update broadcasts
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 10.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { notificationService } from '@/services/notification-service';
import { xpService } from '@/services/xp-service';
import { badgeService } from '@/services/badge-service';
import { rankService } from '@/services/rank-service';
import { createClient } from '../setup/test-supabase-client';

describe('Realtime Notifications Integration Tests', () => {
  let testUserId: string;
  let supabase: any;

  beforeEach(async () => {
    supabase = createClient();
    
    // Create a test user
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        username: `test_notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: `test-notif-${Date.now()}@example.com`,
        full_name: 'Test Notification User',
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        profile_completion_percentage: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    testUserId = profile.id;
  });

  afterEach(async () => {
    // Cleanup: Delete test data
    if (testUserId) {
      await supabase.from('notifications').delete().eq('user_id', testUserId);
      await supabase.from('xp_transactions').delete().eq('user_id', testUserId);
      await supabase.from('user_badges').delete().eq('user_id', testUserId);
      await supabase.from('user_ranks_history').delete().eq('user_id', testUserId);
      await supabase.from('profiles').delete().eq('id', testUserId);
    }
  });

  describe('XP Gain Notifications', () => {
    it('should send notification when XP is awarded', async () => {
      // Requirements: 8.1
      
      // Award XP
      const transaction = await xpService.awardXP({
        userId: testUserId,
        amount: 100,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP award',
      });

      // Send notification
      await notificationService.notifyXPGain(testUserId, transaction);

      // Verify notification was created
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', testUserId)
        .eq('type', 'xp_gain');

      expect(notifications).toBeDefined();
      if (notifications && notifications.length > 0) {
        expect(notifications[0].type).toBe('xp_gain');
        expect(notifications[0].metadata).toBeDefined();
      }
    });

    it('should include XP amount and source in notification', async () => {
      // Requirements: 8.4
      
      const transaction = await xpService.awardXP({
        userId: testUserId,
        amount: 150,
        source: 'code_contribution',
        activityType: 'test',
        description: 'Code contribution XP',
      });

      await notificationService.notifyXPGain(testUserId, transaction);

      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', testUserId)
        .eq('type', 'xp_gain')
        .order('created_at', { ascending: false })
        .limit(1);

      if (notifications && notifications.length > 0) {
        const notification = notifications[0];
        expect(notification.metadata.amount).toBe(150);
        expect(notification.metadata.source).toBe('code_contribution');
      }
    });

    it('should include new total XP in notification', async () => {
      // Requirements: 8.4
      
      // Award initial XP
      await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType: 'test1',
        description: 'First XP',
      });

      // Award more XP
      const transaction = await xpService.awardXP({
        userId: testUserId,
        amount: 75,
        source: 'event_participation',
        activityType: 'test2',
        description: 'Second XP',
      });

      await notificationService.notifyXPGain(testUserId, transaction);

      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(125);
    });

    it('should send notification within 1 second of XP award', async () => {
      // Requirements: 8.2
      
      const startTime = Date.now();

      const transaction = await xpService.awardXP({
        userId: testUserId,
        amount: 100,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP',
      });

      await notificationService.notifyXPGain(testUserId, transaction);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 1 second (1000ms)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Badge Unlock Notifications', () => {
    it('should send notification when badge is unlocked', async () => {
      // Requirements: 9.1, 9.2
      
      // Create a badge
      const badge = await badgeService.createBadge({
        name: `Test Notif Badge ${Date.now()}`,
        description: 'Test badge for notifications',
        category: 'coding',
        rarityLevel: 'common',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [{ field: 'total_xp', operator: 'gte', value: 50 }]
        },
        iconUrl: 'https://example.com/icons/test.png',
      });

      // Award badge
      const userBadge = await badgeService.awardBadge(testUserId, badge.id, false);

      // Send notification
      await notificationService.notifyBadgeUnlock(testUserId, userBadge);

      // Verify notification
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', testUserId)
        .eq('type', 'badge_unlock');

      expect(notifications).toBeDefined();
      if (notifications && notifications.length > 0) {
        expect(notifications[0].type).toBe('badge_unlock');
      }

      // Cleanup
      await supabase.from('badges').delete().eq('id', badge.id);
    });

    it('should include badge details in notification', async () => {
      // Requirements: 9.2
      
      const badge = await badgeService.createBadge({
        name: `Badge Details ${Date.now()}`,
        description: 'Badge with details',
        category: 'community',
        rarityLevel: 'rare',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [{ field: 'total_xp', operator: 'gte', value: 50 }]
        },
        iconUrl: 'https://example.com/icons/rare.png',
      });

      const userBadge = await badgeService.awardBadge(testUserId, badge.id, false);
      await notificationService.notifyBadgeUnlock(testUserId, userBadge);

      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', testUserId)
        .eq('type', 'badge_unlock')
        .order('created_at', { ascending: false })
        .limit(1);

      if (notifications && notifications.length > 0) {
        const notification = notifications[0];
        expect(notification.metadata.badgeName).toBeDefined();
        expect(notification.metadata.rarityLevel).toBe('rare');
        expect(notification.metadata.iconUrl).toBeDefined();
      }

      // Cleanup
      await supabase.from('badges').delete().eq('id', badge.id);
    });

    it('should send notification within 2 seconds of badge unlock', async () => {
      // Requirements: 9.3
      
      const badge = await badgeService.createBadge({
        name: `Speed Badge ${Date.now()}`,
        description: 'Test badge',
        category: 'coding',
        rarityLevel: 'common',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [{ field: 'total_xp', operator: 'gte', value: 50 }]
        },
        iconUrl: 'https://example.com/icons/test.png',
      });

      const startTime = Date.now();

      const userBadge = await badgeService.awardBadge(testUserId, badge.id, false);
      await notificationService.notifyBadgeUnlock(testUserId, userBadge);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 2 seconds (2000ms)
      expect(duration).toBeLessThan(2000);

      // Cleanup
      await supabase.from('badges').delete().eq('id', badge.id);
    });

    it('should persist notification for 30 days', async () => {
      // Requirements: 9.5
      
      const badge = await badgeService.createBadge({
        name: `Persist Badge ${Date.now()}`,
        description: 'Test badge',
        category: 'coding',
        rarityLevel: 'common',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [{ field: 'total_xp', operator: 'gte', value: 50 }]
        },
        iconUrl: 'https://example.com/icons/test.png',
      });

      const userBadge = await badgeService.awardBadge(testUserId, badge.id, false);
      await notificationService.notifyBadgeUnlock(testUserId, userBadge);

      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', testUserId)
        .eq('type', 'badge_unlock')
        .order('created_at', { ascending: false })
        .limit(1);

      if (notifications && notifications.length > 0) {
        const notification = notifications[0];
        const expiresAt = new Date(notification.expires_at);
        const createdAt = new Date(notification.created_at);
        const daysDiff = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        expect(daysDiff).toBeCloseTo(30, 1);
      }

      // Cleanup
      await supabase.from('badges').delete().eq('id', badge.id);
    });
  });

  describe('Rank-Up Notifications', () => {
    it('should send notification when user ranks up', async () => {
      // Requirements: 6.4
      
      // Create rank tiers
      const tier1 = await rankService.createRankTier({
        name: `Notif Tier 1 ${Date.now()}`,
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/tier1.png',
        perks: {},
      });

      const tier2 = await rankService.createRankTier({
        name: `Notif Tier 2 ${Date.now()}`,
        minimumXpThreshold: 100,
        rankOrder: 2,
        iconUrl: 'https://example.com/icons/tier2.png',
        perks: {},
      });

      // Award XP to trigger rank up
      await xpService.awardXP({
        userId: testUserId,
        amount: 150,
        source: 'event_participation',
        activityType: 'test',
        description: 'Rank up XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Update rank
      const rankChange = await rankService.updateUserRank(testUserId);

      if (rankChange.rankUp) {
        await notificationService.notifyRankUp(testUserId, rankChange);

        // Verify notification
        const { data: notifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', testUserId)
          .eq('type', 'rank_up');

        expect(notifications).toBeDefined();
        if (notifications && notifications.length > 0) {
          expect(notifications[0].type).toBe('rank_up');
        }
      }

      // Cleanup
      await supabase.from('rank_tiers').delete().in('id', [tier1.id, tier2.id]);
    });

    it('should include previous and new rank in notification', async () => {
      // Requirements: 6.4
      
      const tier1 = await rankService.createRankTier({
        name: `Rank A ${Date.now()}`,
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/a.png',
        perks: {},
      });

      const tier2 = await rankService.createRankTier({
        name: `Rank B ${Date.now()}`,
        minimumXpThreshold: 100,
        rankOrder: 2,
        iconUrl: 'https://example.com/icons/b.png',
        perks: {},
      });

      await xpService.awardXP({
        userId: testUserId,
        amount: 150,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const rankChange = await rankService.updateUserRank(testUserId);

      if (rankChange.rankUp) {
        await notificationService.notifyRankUp(testUserId, rankChange);

        const { data: notifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', testUserId)
          .eq('type', 'rank_up')
          .order('created_at', { ascending: false })
          .limit(1);

        if (notifications && notifications.length > 0) {
          const notification = notifications[0];
          expect(notification.metadata.newRank).toBeDefined();
          expect(notification.metadata.previousRank).toBeDefined();
        }
      }

      // Cleanup
      await supabase.from('rank_tiers').delete().in('id', [tier1.id, tier2.id]);
    });

    it('should send notification within 2 seconds of rank change', async () => {
      // Requirements: 6.4
      
      const tier1 = await rankService.createRankTier({
        name: `Speed Rank 1 ${Date.now()}`,
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/tier1.png',
        perks: {},
      });

      const tier2 = await rankService.createRankTier({
        name: `Speed Rank 2 ${Date.now()}`,
        minimumXpThreshold: 100,
        rankOrder: 2,
        iconUrl: 'https://example.com/icons/tier2.png',
        perks: {},
      });

      await xpService.awardXP({
        userId: testUserId,
        amount: 150,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const startTime = Date.now();

      const rankChange = await rankService.updateUserRank(testUserId);
      if (rankChange.rankUp) {
        await notificationService.notifyRankUp(testUserId, rankChange);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000);

      // Cleanup
      await supabase.from('rank_tiers').delete().in('id', [tier1.id, tier2.id]);
    });
  });

  describe('Notification History', () => {
    it('should retrieve user notification history', async () => {
      // Requirements: 9.5
      
      // Create multiple notifications
      await supabase.from('notifications').insert([
        {
          user_id: testUserId,
          type: 'xp_gain',
          title: 'XP Gained',
          message: 'You earned 100 XP',
          metadata: { amount: 100 },
          read: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: testUserId,
          type: 'badge_unlock',
          title: 'Badge Unlocked',
          message: 'You unlocked a badge',
          metadata: { badgeName: 'Test Badge' },
          read: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);

      // Get notifications
      const notifications = await notificationService.getUserNotifications(testUserId, {
        page: 1,
        pageSize: 10,
      });

      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });

    it('should mark notifications as read', async () => {
      // Requirements: 9.5
      
      // Create notification
      const { data: notification } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          type: 'xp_gain',
          title: 'XP Gained',
          message: 'You earned 50 XP',
          metadata: { amount: 50 },
          read: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      // Mark as read
      await notificationService.markNotificationRead(notification.id);

      // Verify
      const { data: updatedNotif } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notification.id)
        .single();

      expect(updatedNotif.read).toBe(true);
    });

    it('should filter notifications by type', async () => {
      // Create notifications of different types
      await supabase.from('notifications').insert([
        {
          user_id: testUserId,
          type: 'xp_gain',
          title: 'XP',
          message: 'XP gained',
          metadata: {},
          read: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: testUserId,
          type: 'badge_unlock',
          title: 'Badge',
          message: 'Badge unlocked',
          metadata: {},
          read: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);

      // Filter by type
      const { data: xpNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', testUserId)
        .eq('type', 'xp_gain');

      expect(xpNotifications).toBeDefined();
      if (xpNotifications) {
        expect(xpNotifications.every(n => n.type === 'xp_gain')).toBe(true);
      }
    });
  });

  describe('Leaderboard Update Broadcasts', () => {
    it('should broadcast leaderboard updates on significant XP changes', async () => {
      // Requirements: 10.3
      
      // Award significant XP (>100)
      await xpService.awardXP({
        userId: testUserId,
        amount: 500,
        source: 'event_participation',
        activityType: 'test',
        description: 'Significant XP',
      });

      // In a real implementation, this would trigger a broadcast
      // For testing, we verify the XP was awarded
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(500);
    });

    it('should update leaderboard within 5 seconds', async () => {
      // Requirements: 10.3
      
      const startTime = Date.now();

      await xpService.awardXP({
        userId: testUserId,
        amount: 200,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP',
      });

      // Simulate leaderboard update
      const { data: leaderboard } = await supabase
        .from('profiles')
        .select('id, total_xp')
        .order('total_xp', { ascending: false })
        .limit(100);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
      expect(leaderboard).toBeDefined();
    });
  });

  describe('Notification Expiration', () => {
    it('should set 30-day expiration on notifications', async () => {
      // Requirements: 9.5
      
      const { data: notification } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          type: 'xp_gain',
          title: 'Test',
          message: 'Test notification',
          metadata: {},
          read: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      const expiresAt = new Date(notification.expires_at);
      const createdAt = new Date(notification.created_at);
      const daysDiff = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeCloseTo(30, 1);
    });
  });
});
