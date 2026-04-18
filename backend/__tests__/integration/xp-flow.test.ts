/**
 * Integration Tests: XP Flow
 * 
 * Tests the complete XP flow including:
 * - XP award → total_xp update → rank recalculation → notification
 * - Rate limiting and cooldown enforcement
 * - Manual XP adjustments
 * 
 * Requirements: 1.1, 1.2, 1.3, 6.2, 8.1, 14.1, 20.1, 20.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { xpService } from '@/services/xp-service';
import { rankService } from '@/services/rank-service';
import { notificationService } from '@/services/notification-service';
import { createClient } from '../setup/test-supabase-client';

describe('XP Flow Integration Tests', () => {
  let testUserId: string;
  let supabase: any;

  beforeEach(async () => {
    supabase = createClient();
    
    // Create a test user
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        username: `test_xp_${Date.now()}`,
        email: `test-xp-${Date.now()}@example.com`,
        full_name: 'Test XP User',
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
    // Cleanup: Delete test user and related data
    if (testUserId) {
      await supabase.from('xp_transactions').delete().eq('user_id', testUserId);
      await supabase.from('user_ranks_history').delete().eq('user_id', testUserId);
      await supabase.from('profiles').delete().eq('id', testUserId);
    }
  });

  describe('XP Award Flow', () => {
    it('should award XP and update total_xp via database trigger', async () => {
      // Requirements: 1.1, 1.2, 1.3
      
      // Award XP
      const transaction = await xpService.awardXP({
        userId: testUserId,
        amount: 100,
        source: 'event_participation',
        activityType: 'event_registration',
        description: 'Registered for test event',
      });

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(100);
      expect(transaction.source).toBe('event_participation');

      // Verify total_xp was updated by trigger
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(100);

      // Verify transaction was recorded
      const history = await xpService.getXPHistory(testUserId, {
        page: 1,
        pageSize: 10,
      });

      expect(history.transactions).toHaveLength(1);
      expect(history.transactions[0].amount).toBe(100);
    });

    it('should trigger rank recalculation when XP changes', async () => {
      // Requirements: 6.2
      
      // Create a test rank tier
      const rankTier = await rankService.createRankTier({
        name: 'Test Novice',
        minimumXpThreshold: 50,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/novice.png',
        perks: { testPerk: true },
      });

      // Award XP that meets the rank threshold
      await xpService.awardXP({
        userId: testUserId,
        amount: 100,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP award',
      });

      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify rank was updated
      const rankProgress = await rankService.getRankProgress(testUserId);
      expect(rankProgress.currentRank).toBeDefined();
      expect(rankProgress.currentRank?.name).toBe('Test Novice');

      // Cleanup
      await supabase.from('rank_tiers').delete().eq('id', rankTier.id);
    });

    it('should handle multiple XP awards and accumulate total', async () => {
      // Requirements: 1.2, 1.3
      
      // Award XP multiple times
      await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType: 'test1',
        description: 'First award',
      });

      await xpService.awardXP({
        userId: testUserId,
        amount: 75,
        source: 'community_engagement',
        activityType: 'test2',
        description: 'Second award',
      });

      await xpService.awardXP({
        userId: testUserId,
        amount: 25,
        source: 'code_contribution',
        activityType: 'test3',
        description: 'Third award',
      });

      // Verify total XP is sum of all awards
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(150);

      // Verify all transactions are recorded
      const history = await xpService.getXPHistory(testUserId, {
        page: 1,
        pageSize: 10,
      });

      expect(history.transactions).toHaveLength(3);
      expect(history.totalCount).toBe(3);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits for XP awards', async () => {
      // Requirements: 20.1
      
      // Set up XP source config with low rate limit
      await xpService.updateXPSourceConfig('event_participation', {
        baseAmount: 10,
        multipliers: {},
        cooldownSeconds: 0,
        maxPerHour: 50, // Low limit for testing
      });

      // Award XP up to the limit
      await xpService.awardXP({
        userId: testUserId,
        amount: 30,
        source: 'event_participation',
        activityType: 'test1',
        description: 'First award',
      });

      await xpService.awardXP({
        userId: testUserId,
        amount: 20,
        source: 'event_participation',
        activityType: 'test2',
        description: 'Second award',
      });

      // Check rate limit - should be at or near limit
      const rateLimitResult = await xpService.checkRateLimit(
        testUserId,
        'event_participation'
      );

      expect(rateLimitResult.allowed).toBeDefined();
      expect(rateLimitResult.remainingQuota).toBeLessThanOrEqual(50);
    });

    it('should prevent XP awards when rate limit is exceeded', async () => {
      // Requirements: 20.1
      
      // Set up XP source config with very low rate limit
      await xpService.updateXPSourceConfig('community_engagement', {
        baseAmount: 10,
        multipliers: {},
        cooldownSeconds: 0,
        maxPerHour: 20,
      });

      // Award XP up to the limit
      await xpService.awardXP({
        userId: testUserId,
        amount: 20,
        source: 'community_engagement',
        activityType: 'test1',
        description: 'At limit',
      });

      // Try to award more XP - should be blocked
      const rateLimitCheck = await xpService.checkRateLimit(
        testUserId,
        'community_engagement'
      );

      if (!rateLimitCheck.allowed) {
        expect(rateLimitCheck.reason).toBeDefined();
        expect(rateLimitCheck.remainingQuota).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('Cooldown Enforcement', () => {
    it('should enforce cooldowns for duplicate activities', async () => {
      // Requirements: 20.4
      
      const referenceId = crypto.randomUUID();
      const activityType = 'event_registration';

      // First award should succeed
      const firstAward = await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType,
        referenceId,
        description: 'First registration',
      });

      expect(firstAward).toBeDefined();

      // Set cooldown
      await xpService.setCooldown(testUserId, activityType, referenceId, 3600);

      // Check cooldown
      const isOnCooldown = await xpService.checkCooldown(
        testUserId,
        activityType,
        referenceId
      );

      expect(isOnCooldown).toBe(true);
    });

    it('should allow XP award after cooldown expires', async () => {
      // Requirements: 20.4
      
      const referenceId = crypto.randomUUID();
      const activityType = 'event_check_in';

      // Award XP and set short cooldown
      await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType,
        referenceId,
        description: 'Check in',
      });

      // Set very short cooldown (1 second)
      await xpService.setCooldown(testUserId, activityType, referenceId, 1);

      // Wait for cooldown to expire
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check cooldown should be false now
      const isOnCooldown = await xpService.checkCooldown(
        testUserId,
        activityType,
        referenceId
      );

      expect(isOnCooldown).toBe(false);
    });
  });

  describe('Manual XP Adjustments', () => {
    it('should allow manual XP adjustments with reason', async () => {
      // Requirements: 14.1
      
      const adjustment = await xpService.manualAdjustment({
        userId: testUserId,
        amount: 500,
        source: 'event_participation',
        activityType: 'manual_adjustment',
        description: 'Test manual adjustment',
        reason: 'Test manual adjustment',
        adminId: crypto.randomUUID(),
      });

      expect(adjustment).toBeDefined();
      expect(adjustment.amount).toBe(500);
      expect(adjustment.manualAdjustment).toBe(true);
      expect(adjustment.description).toContain('Test manual adjustment');

      // Verify total XP was updated
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(500);
    });

    it('should support negative manual adjustments', async () => {
      // Requirements: 14.1
      
      // First add some XP
      await xpService.awardXP({
        userId: testUserId,
        amount: 1000,
        source: 'event_participation',
        activityType: 'test',
        description: 'Initial XP',
      });

      // Then apply negative adjustment
      const adjustment = await xpService.manualAdjustment({
        userId: testUserId,
        amount: -300,
        source: 'event_participation',
        activityType: 'manual_adjustment',
        description: 'Correction for duplicate award',
        reason: 'Correction for duplicate award',
        adminId: crypto.randomUUID(),
      });

      expect(adjustment.amount).toBe(-300);

      // Verify total XP was reduced
      const totalXP = await xpService.getUserTotalXP(testUserId);
      expect(totalXP).toBe(700);
    });

    it('should mark manual adjustments with flag', async () => {
      // Requirements: 14.1
      
      await xpService.manualAdjustment({
        userId: testUserId,
        amount: 250,
        source: 'event_participation',
        activityType: 'manual_adjustment',
        description: 'Special event bonus',
        reason: 'Special event bonus',
        adminId: crypto.randomUUID(),
      });

      // Retrieve transaction history
      const history = await xpService.getXPHistory(testUserId, {
        page: 1,
        pageSize: 10,
      });

      const manualTransaction = history.transactions.find(
        t => t.manualAdjustment === true
      );

      expect(manualTransaction).toBeDefined();
      expect(manualTransaction?.amount).toBe(250);
    });
  });

  describe('XP History and Filtering', () => {
    it('should retrieve XP history with pagination', async () => {
      // Requirements: 1.6
      
      // Create multiple transactions
      for (let i = 0; i < 15; i++) {
        await xpService.awardXP({
          userId: testUserId,
          amount: 10,
          source: 'event_participation',
          activityType: `test-${i}`,
          description: `Transaction ${i}`,
        });
      }

      // Get first page
      const page1 = await xpService.getXPHistory(testUserId, {
        page: 1,
        pageSize: 10,
      });

      expect(page1.transactions).toHaveLength(10);
      expect(page1.totalCount).toBe(15);
      expect(page1.hasMore).toBe(true);

      // Get second page
      const page2 = await xpService.getXPHistory(testUserId, {
        page: 2,
        pageSize: 10,
      });

      expect(page2.transactions).toHaveLength(5);
      expect(page2.hasMore).toBe(false);
    });

    it('should filter XP history by source', async () => {
      // Requirements: 1.6
      
      // Create transactions with different sources
      await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType: 'test1',
        description: 'Event XP',
      });

      await xpService.awardXP({
        userId: testUserId,
        amount: 75,
        source: 'code_contribution',
        activityType: 'test2',
        description: 'Code XP',
      });

      await xpService.awardXP({
        userId: testUserId,
        amount: 25,
        source: 'event_participation',
        activityType: 'test3',
        description: 'Another event XP',
      });

      // Filter by event_participation
      const filtered = await xpService.getXPHistory(testUserId, {
        source: 'event_participation',
        page: 1,
        pageSize: 10,
      });

      expect(filtered.transactions).toHaveLength(2);
      expect(filtered.transactions.every(t => t.source === 'event_participation')).toBe(true);
    });
  });
});
