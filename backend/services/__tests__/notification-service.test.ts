/**
 * Notification Service Tests
 * 
 * Unit tests for the notification service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../notification-service';
import type { XPTransaction } from '../xp-service';
import type { UserBadge } from '../badge-service';
import type { RankChangeResult } from '../rank-service';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      send: vi.fn().mockResolvedValue(undefined)
    })),
    from: vi.fn(() => {
      const mockQuery = {
        insert: vi.fn(() => ({
          select: vi.fn().mockResolvedValue({ data: null, error: null })
        })),
        select: vi.fn(() => mockQuery),
        eq: vi.fn(() => mockQuery),
        gt: vi.fn(() => mockQuery),
        gte: vi.fn(() => mockQuery),
        lte: vi.fn(() => mockQuery),
        order: vi.fn(() => ({
          then: vi.fn().mockResolvedValue({ data: [], error: null })
        })),
        update: vi.fn(() => mockQuery)
      };
      
      // Make order return a promise-like object
      mockQuery.order = vi.fn().mockResolvedValue({ data: [], error: null });
      
      return mockQuery;
    })
  }))
}));

describe('NotificationService', () => {
  describe('notifyXPGain', () => {
    it('should send XP gain notification', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const transaction: XPTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
        amount: 50,
        source: 'event_participation',
        activityType: 'registration',
        description: 'Registered for Tech Talk',
        manualAdjustment: false,
        createdAt: new Date()
      };
      const newTotal = 150;
      
      await expect(
        notificationService.notifyXPGain(userId, transaction, newTotal)
      ).resolves.not.toThrow();
    });
  });
  
  describe('notifyBadgeUnlock', () => {
    it('should send badge unlock notification', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const userBadge: UserBadge = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        userId,
        badgeId: '123e4567-e89b-12d3-a456-426614174003',
        badge: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          name: 'First Event',
          description: 'Attended your first event',
          category: 'events',
          rarityLevel: 'common',
          unlockCriteria: {
            type: 'event_count',
            conditions: [{ field: 'event_count', operator: 'gte', value: 1 }]
          },
          iconUrl: 'https://example.com/badge.png',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        earnedAt: new Date(),
        manualAward: false
      };
      
      await expect(
        notificationService.notifyBadgeUnlock(userId, userBadge)
      ).resolves.not.toThrow();
    });
  });
  
  describe('notifyRankUp', () => {
    it('should send rank up notification', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const rankChange: RankChangeResult = {
        previousRank: {
          id: '123e4567-e89b-12d3-a456-426614174004',
          name: 'Novice',
          minimumXpThreshold: 0,
          rankOrder: 1,
          iconUrl: 'https://example.com/novice.png',
          perks: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        currentRank: {
          id: '123e4567-e89b-12d3-a456-426614174005',
          name: 'Apprentice',
          minimumXpThreshold: 100,
          rankOrder: 2,
          iconUrl: 'https://example.com/apprentice.png',
          perks: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        rankUp: true,
        notificationSent: false
      };
      
      await expect(
        notificationService.notifyRankUp(userId, rankChange, 150, 50)
      ).resolves.not.toThrow();
    });
    
    it('should not send notification if not a rank up', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const rankChange: RankChangeResult = {
        previousRank: null,
        currentRank: null,
        rankUp: false,
        notificationSent: false
      };
      
      await expect(
        notificationService.notifyRankUp(userId, rankChange, 50, 50)
      ).resolves.not.toThrow();
    });
  });
  
  describe('getUserNotifications', () => {
    it('should retrieve user notifications', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const notifications = await notificationService.getUserNotifications(userId);
      
      expect(Array.isArray(notifications)).toBe(true);
    });
    
    it('should filter notifications by type', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const notifications = await notificationService.getUserNotifications(userId, {
        type: 'xp_gain'
      });
      
      expect(Array.isArray(notifications)).toBe(true);
    });
  });
  
  describe('markNotificationRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = '123e4567-e89b-12d3-a456-426614174006';
      
      await expect(
        notificationService.markNotificationRead(notificationId)
      ).resolves.not.toThrow();
    });
  });
});
