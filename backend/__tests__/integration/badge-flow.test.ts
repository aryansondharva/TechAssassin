/**
 * Integration Tests: Badge Unlock Flow
 * 
 * Tests the complete badge unlock flow including:
 * - Activity → badge evaluation → badge award → notification
 * - Duplicate badge prevention
 * - Manual badge awards and revocations
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 13.1, 13.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { badgeService } from '@/services/badge-service';
import { xpService } from '@/services/xp-service';
import { createClient } from '../setup/test-supabase-client';

describe('Badge Unlock Flow Integration Tests', () => {
  let testUserId: string;
  let testBadgeId: string;
  let supabase: any;

  beforeEach(async () => {
    supabase = createClient();
    
    // Create a test user
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        username: `test_badge_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: `test-badge-${Date.now()}@example.com`,
        full_name: 'Test Badge User',
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
      await supabase.from('user_badges').delete().eq('user_id', testUserId);
      await supabase.from('xp_transactions').delete().eq('user_id', testUserId);
      await supabase.from('profiles').delete().eq('id', testUserId);
    }
    
    if (testBadgeId) {
      await supabase.from('badges').delete().eq('id', testBadgeId);
    }
  });

  describe('Badge Unlock Detection', () => {
    it('should automatically unlock badge when criteria is met', async () => {
      // Requirements: 4.1, 4.2
      
      // Create a badge with XP threshold criteria
      const badge = await badgeService.createBadge({
        name: `Test XP Badge ${Date.now()}`,
        description: 'Earn 100 XP',
        category: 'coding',
        rarityLevel: 'common',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [
            { field: 'total_xp', operator: 'gte', value: 100 }
          ]
        },
        iconUrl: 'https://example.com/icons/test-badge.png',
      });
      testBadgeId = badge.id;

      // Award XP to meet the criteria
      await xpService.awardXP({
        userId: testUserId,
        amount: 150,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP award',
      });

      // Evaluate badge unlocks
      const unlockedBadges = await badgeService.evaluateBadgeUnlocks(testUserId, {
        trigger: 'xp_change',
      });

      // Should have unlocked the badge
      expect(unlockedBadges.length).toBeGreaterThan(0);
      const unlockedBadge = unlockedBadges.find(ub => ub.badgeId === badge.id);
      expect(unlockedBadge).toBeDefined();
      expect(unlockedBadge?.badge.name).toBe(badge.name);
    });

    it('should not unlock badge when criteria is not met', async () => {
      // Requirements: 4.1, 4.2
      
      // Create a badge with high XP threshold
      const badge = await badgeService.createBadge({
        name: `Test High XP Badge ${Date.now()}`,
        description: 'Earn 1000 XP',
        category: 'coding',
        rarityLevel: 'rare',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [
            { field: 'total_xp', operator: 'gte', value: 1000 }
          ]
        },
        iconUrl: 'https://example.com/icons/test-badge.png',
      });
      testBadgeId = badge.id;

      // Award XP below the threshold
      await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP award',
      });

      // Evaluate badge unlocks
      const unlockedBadges = await badgeService.evaluateBadgeUnlocks(testUserId, {
        trigger: 'xp_change',
      });

      // Should not have unlocked the badge
      const unlockedBadge = unlockedBadges.find(ub => ub.badgeId === badge.id);
      expect(unlockedBadge).toBeUndefined();
    });

    it('should evaluate composite criteria badges', async () => {
      // Requirements: 4.1, 4.5
      
      // Create a badge with multiple conditions
      const badge = await badgeService.createBadge({
        name: `Test Composite Badge ${Date.now()}`,
        description: 'Earn 100 XP and maintain 3-day streak',
        category: 'community',
        rarityLevel: 'epic',
        unlockCriteria: {
          type: 'composite',
          conditions: [
            { field: 'total_xp', operator: 'gte', value: 100 },
            { field: 'current_streak', operator: 'gte', value: 3 }
          ]
        },
        iconUrl: 'https://example.com/icons/test-badge.png',
      });
      testBadgeId = badge.id;

      // Award XP
      await xpService.awardXP({
        userId: testUserId,
        amount: 150,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP award',
      });

      // Update streak
      await supabase
        .from('profiles')
        .update({ current_streak: 5 })
        .eq('id', testUserId);

      // Evaluate badge unlocks
      const unlockedBadges = await badgeService.evaluateBadgeUnlocks(testUserId, {
        trigger: 'activity',
      });

      // Should have unlocked the badge
      const unlockedBadge = unlockedBadges.find(ub => ub.badgeId === badge.id);
      expect(unlockedBadge).toBeDefined();
    });
  });

  describe('Duplicate Badge Prevention', () => {
    it('should prevent duplicate badge awards', async () => {
      // Requirements: 4.3
      
      // Create a test badge
      const badge = await badgeService.createBadge({
        name: `Test Duplicate Badge ${Date.now()}`,
        description: 'Test badge',
        category: 'coding',
        rarityLevel: 'common',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [
            { field: 'total_xp', operator: 'gte', value: 50 }
          ]
        },
        iconUrl: 'https://example.com/icons/test-badge.png',
      });
      testBadgeId = badge.id;

      // Award badge first time
      const firstAward = await badgeService.awardBadge(testUserId, badge.id, false);
      expect(firstAward).toBeDefined();

      // Try to award the same badge again - should throw error or return existing
      try {
        await badgeService.awardBadge(testUserId, badge.id, false);
        // If it doesn't throw, check that we still only have one badge
        const userBadges = await badgeService.getUserBadges(testUserId);
        const duplicates = userBadges.filter(ub => ub.badgeId === badge.id);
        expect(duplicates).toHaveLength(1);
      } catch (error: any) {
        // Expected to throw error for duplicate
        expect(error.message).toContain('already earned');
      }
    });

    it('should allow re-awarding a revoked badge', async () => {
      // Requirements: 4.3, 13.2
      
      // Create a test badge
      const badge = await badgeService.createBadge({
        name: `Test Revoke Badge ${Date.now()}`,
        description: 'Test badge',
        category: 'coding',
        rarityLevel: 'common',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [
            { field: 'total_xp', operator: 'gte', value: 50 }
          ]
        },
        iconUrl: 'https://example.com/icons/test-badge.png',
      });
      testBadgeId = badge.id;

      // Award badge
      const firstAward = await badgeService.awardBadge(testUserId, badge.id, false);
      expect(firstAward).toBeDefined();

      // Revoke badge
      await badgeService.revokeBadge(firstAward.id, 'Test revocation');

      // Award badge again - should succeed
      const secondAward = await badgeService.awardBadge(testUserId, badge.id, false);
      expect(secondAward).toBeDefined();
      expect(secondAward.id).not.toBe(firstAward.id);
    });
  });

  describe('Manual Badge Operations', () => {
    it('should allow manual badge awards', async () => {
      // Requirements: 13.1
      
      // Create a test badge
      const badge = await badgeService.createBadge({
        name: `Test Manual Badge ${Date.now()}`,
        description: 'Manually awarded badge',
        category: 'special',
        rarityLevel: 'legendary',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [
            { field: 'total_xp', operator: 'gte', value: 10000 }
          ]
        },
        iconUrl: 'https://example.com/icons/test-badge.png',
      });
      testBadgeId = badge.id;

      // Manually award badge (user doesn't meet criteria)
      const userBadge = await badgeService.awardBadge(testUserId, badge.id, true);

      expect(userBadge).toBeDefined();
      expect(userBadge.manualAward).toBe(true);
      expect(userBadge.badgeId).toBe(badge.id);

      // Verify user has the badge
      const userBadges = await badgeService.getUserBadges(testUserId);
      expect(userBadges.some(ub => ub.badgeId === badge.id)).toBe(true);
    });

    it('should allow badge revocation with reason', async () => {
      // Requirements: 13.2
      
      // Create and award a badge
      const badge = await badgeService.createBadge({
        name: `Test Revocation Badge ${Date.now()}`,
        description: 'Test badge',
        category: 'coding',
        rarityLevel: 'common',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [
            { field: 'total_xp', operator: 'gte', value: 50 }
          ]
        },
        iconUrl: 'https://example.com/icons/test-badge.png',
      });
      testBadgeId = badge.id;

      const userBadge = await badgeService.awardBadge(testUserId, badge.id, false);

      // Revoke the badge
      await badgeService.revokeBadge(userBadge.id, 'Awarded in error');

      // Verify badge is revoked
      const { data: revokedBadge } = await supabase
        .from('user_badges')
        .select('*')
        .eq('id', userBadge.id)
        .single();

      expect(revokedBadge.revoked_at).not.toBeNull();
      expect(revokedBadge.revocation_reason).toBe('Awarded in error');

      // Verify badge doesn't appear in active badges
      const userBadges = await badgeService.getUserBadges(testUserId);
      expect(userBadges.some(ub => ub.id === userBadge.id)).toBe(false);
    });

    it('should mark manual awards with flag', async () => {
      // Requirements: 13.1
      
      // Create a test badge
      const badge = await badgeService.createBadge({
        name: `Test Manual Flag Badge ${Date.now()}`,
        description: 'Test badge',
        category: 'special',
        rarityLevel: 'rare',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [
            { field: 'total_xp', operator: 'gte', value: 5000 }
          ]
        },
        iconUrl: 'https://example.com/icons/test-badge.png',
      });
      testBadgeId = badge.id;

      // Award manually
      const manualBadge = await badgeService.awardBadge(testUserId, badge.id, true);
      expect(manualBadge.manualAward).toBe(true);

      // Award automatically (to another user for comparison)
      const { data: anotherUser } = await supabase
        .from('profiles')
        .insert({
          username: `test_auto_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          email: `test-auto-${Date.now()}@example.com`,
          full_name: 'Auto Badge User',
          total_xp: 0,
        })
        .select()
        .single();

      const autoBadge = await badgeService.awardBadge(anotherUser.id, badge.id, false);
      expect(autoBadge.manualAward).toBe(false);

      // Cleanup
      await supabase.from('user_badges').delete().eq('user_id', anotherUser.id);
      await supabase.from('profiles').delete().eq('id', anotherUser.id);
    });
  });

  describe('Badge Progress Tracking', () => {
    it('should calculate badge unlock progress', async () => {
      // Requirements: 4.1, 4.2
      
      // Create a badge with XP threshold
      const badge = await badgeService.createBadge({
        name: `Test Progress Badge ${Date.now()}`,
        description: 'Earn 500 XP',
        category: 'coding',
        rarityLevel: 'rare',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [
            { field: 'total_xp', operator: 'gte', value: 500 }
          ]
        },
        iconUrl: 'https://example.com/icons/test-badge.png',
      });
      testBadgeId = badge.id;

      // Award partial XP
      await xpService.awardXP({
        userId: testUserId,
        amount: 250,
        source: 'event_participation',
        activityType: 'test',
        description: 'Partial XP',
      });

      // Check progress
      const progress = await badgeService.getBadgeProgress(testUserId, badge.id);

      expect(progress.progress).toBe(50); // 250/500 = 50%
      expect(progress.isUnlocked).toBe(false);
      expect(progress.conditions).toHaveLength(1);
      expect(progress.conditions[0].current).toBe(250);
      expect(progress.conditions[0].required).toBe(500);
    });

    it('should show 100% progress when badge is unlocked', async () => {
      // Requirements: 4.1, 4.2
      
      // Create a badge
      const badge = await badgeService.createBadge({
        name: `Test Complete Badge ${Date.now()}`,
        description: 'Earn 100 XP',
        category: 'coding',
        rarityLevel: 'common',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [
            { field: 'total_xp', operator: 'gte', value: 100 }
          ]
        },
        iconUrl: 'https://example.com/icons/test-badge.png',
      });
      testBadgeId = badge.id;

      // Award enough XP
      await xpService.awardXP({
        userId: testUserId,
        amount: 150,
        source: 'event_participation',
        activityType: 'test',
        description: 'Full XP',
      });

      // Check progress
      const progress = await badgeService.getBadgeProgress(testUserId, badge.id);

      expect(progress.progress).toBe(100);
      expect(progress.isUnlocked).toBe(true);
    });
  });

  describe('Badge Retrieval and Sorting', () => {
    it('should retrieve user badges sorted by rarity and date', async () => {
      // Requirements: 5.1, 5.2
      
      // Create badges with different rarities
      const commonBadge = await badgeService.createBadge({
        name: `Common Badge ${Date.now()}`,
        description: 'Common badge',
        category: 'coding',
        rarityLevel: 'common',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [{ field: 'total_xp', operator: 'gte', value: 10 }]
        },
        iconUrl: 'https://example.com/icons/common.png',
      });

      const legendaryBadge = await badgeService.createBadge({
        name: `Legendary Badge ${Date.now()}`,
        description: 'Legendary badge',
        category: 'special',
        rarityLevel: 'legendary',
        unlockCriteria: {
          type: 'xp_threshold',
          conditions: [{ field: 'total_xp', operator: 'gte', value: 10 }]
        },
        iconUrl: 'https://example.com/icons/legendary.png',
      });

      // Award badges
      await badgeService.awardBadge(testUserId, commonBadge.id, false);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      await badgeService.awardBadge(testUserId, legendaryBadge.id, false);

      // Get user badges
      const userBadges = await badgeService.getUserBadges(testUserId);

      // Legendary should come first (higher rarity)
      expect(userBadges[0].badge.rarityLevel).toBe('legendary');

      // Cleanup
      await supabase.from('badges').delete().eq('id', commonBadge.id);
      await supabase.from('badges').delete().eq('id', legendaryBadge.id);
    });
  });
});
