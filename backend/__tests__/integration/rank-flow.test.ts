/**
 * Integration Tests: Rank Progression Flow
 * 
 * Tests the complete rank progression flow including:
 * - XP gain → rank calculation → rank history → notification
 * - Rank tier updates triggering recalculation
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.6, 15.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rankService } from '@/services/rank-service';
import { xpService } from '@/services/xp-service';
import { createClient } from '../setup/test-supabase-client';

describe('Rank Progression Flow Integration Tests', () => {
  let testUserId: string;
  let testRankIds: string[] = [];
  let supabase: any;

  beforeEach(async () => {
    supabase = createClient();
    
    // Create a test user
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        username: `test_rank_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: `test-rank-${Date.now()}@example.com`,
        full_name: 'Test Rank User',
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
      await supabase.from('user_ranks_history').delete().eq('user_id', testUserId);
      await supabase.from('xp_transactions').delete().eq('user_id', testUserId);
      await supabase.from('profiles').delete().eq('id', testUserId);
    }
    
    // Cleanup test ranks
    for (const rankId of testRankIds) {
      await supabase.from('rank_tiers').delete().eq('id', rankId);
    }
    testRankIds = [];
  });

  describe('Rank Calculation and Updates', () => {
    it('should calculate correct rank based on XP threshold', async () => {
      // Requirements: 6.2, 6.3
      
      // Create rank tiers
      const novice = await rankService.createRankTier({
        name: `Test Novice ${Date.now()}`,
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/novice.png',
        perks: {},
      });
      testRankIds.push(novice.id);

      const apprentice = await rankService.createRankTier({
        name: `Test Apprentice ${Date.now()}`,
        minimumXpThreshold: 100,
        rankOrder: 2,
        iconUrl: 'https://example.com/icons/apprentice.png',
        perks: {},
      });
      testRankIds.push(apprentice.id);

      const expert = await rankService.createRankTier({
        name: `Test Expert ${Date.now()}`,
        minimumXpThreshold: 500,
        rankOrder: 3,
        iconUrl: 'https://example.com/icons/expert.png',
        perks: {},
      });
      testRankIds.push(expert.id);

      // Award XP to reach Apprentice level
      await xpService.awardXP({
        userId: testUserId,
        amount: 150,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP',
      });

      // Wait for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check rank
      const rank = await rankService.calculateUserRank(testUserId);
      expect(rank).toBeDefined();
      expect(rank?.name).toBe(apprentice.name);
      expect(rank?.minimumXpThreshold).toBe(100);
    });

    it('should update rank when XP increases past threshold', async () => {
      // Requirements: 6.2, 6.4
      
      // Create rank tiers
      const bronze = await rankService.createRankTier({
        name: `Test Bronze ${Date.now()}`,
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/bronze.png',
        perks: {},
      });
      testRankIds.push(bronze.id);

      const silver = await rankService.createRankTier({
        name: `Test Silver ${Date.now()}`,
        minimumXpThreshold: 200,
        rankOrder: 2,
        iconUrl: 'https://example.com/icons/silver.png',
        perks: {},
      });
      testRankIds.push(silver.id);

      // Start with Bronze rank
      await xpService.awardXP({
        userId: testUserId,
        amount: 50,
        source: 'event_participation',
        activityType: 'test1',
        description: 'Initial XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      let currentRank = await rankService.calculateUserRank(testUserId);
      expect(currentRank?.name).toBe(bronze.name);

      // Award more XP to reach Silver
      await xpService.awardXP({
        userId: testUserId,
        amount: 200,
        source: 'event_participation',
        activityType: 'test2',
        description: 'Rank up XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Update rank
      const rankChange = await rankService.updateUserRank(testUserId);
      expect(rankChange.rankUp).toBe(true);
      expect(rankChange.currentRank?.name).toBe(silver.name);
      expect(rankChange.previousRank?.name).toBe(bronze.name);
    });

    it('should select highest qualifying rank', async () => {
      // Requirements: 6.3
      
      // Create multiple rank tiers
      const ranks = [
        { name: `Rank 1 ${Date.now()}`, threshold: 0, order: 1 },
        { name: `Rank 2 ${Date.now()}`, threshold: 100, order: 2 },
        { name: `Rank 3 ${Date.now()}`, threshold: 300, order: 3 },
        { name: `Rank 4 ${Date.now()}`, threshold: 600, order: 4 },
      ];

      for (const r of ranks) {
        const rank = await rankService.createRankTier({
          name: r.name,
          minimumXpThreshold: r.threshold,
          rankOrder: r.order,
          iconUrl: `https://example.com/icons/rank${r.order}.png`,
          perks: {},
        });
        testRankIds.push(rank.id);
      }

      // Award XP that qualifies for Rank 3
      await xpService.awardXP({
        userId: testUserId,
        amount: 450,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Should get Rank 3 (highest qualifying)
      const rank = await rankService.calculateUserRank(testUserId);
      expect(rank?.name).toBe(ranks[2].name);
      expect(rank?.minimumXpThreshold).toBe(300);
    });
  });

  describe('Rank History Tracking', () => {
    it('should record rank changes in history', async () => {
      // Requirements: 6.6
      
      // Create rank tiers
      const tier1 = await rankService.createRankTier({
        name: `History Tier 1 ${Date.now()}`,
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/tier1.png',
        perks: {},
      });
      testRankIds.push(tier1.id);

      const tier2 = await rankService.createRankTier({
        name: `History Tier 2 ${Date.now()}`,
        minimumXpThreshold: 100,
        rankOrder: 2,
        iconUrl: 'https://example.com/icons/tier2.png',
        perks: {},
      });
      testRankIds.push(tier2.id);

      // Award XP to trigger rank change
      await xpService.awardXP({
        userId: testUserId,
        amount: 150,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Get rank history
      const history = await rankService.getUserRankHistory(testUserId);

      // Should have at least one entry
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].rank.name).toBe(tier2.name);
    });

    it('should maintain chronological rank history', async () => {
      // Requirements: 6.6
      
      // Create multiple rank tiers
      const tiers = [];
      for (let i = 1; i <= 3; i++) {
        const tier = await rankService.createRankTier({
          name: `Chrono Tier ${i} ${Date.now()}`,
          minimumXpThreshold: i * 100,
          rankOrder: i,
          iconUrl: `/icons/tier${i}.png`,
          perks: {},
        });
        testRankIds.push(tier.id);
        tiers.push(tier);
      }

      // Progress through ranks
      for (let i = 1; i <= 3; i++) {
        await xpService.awardXP({
          userId: testUserId,
          amount: 100,
          source: 'event_participation',
          activityType: `test${i}`,
          description: `XP award ${i}`,
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Get history
      const history = await rankService.getUserRankHistory(testUserId);

      // Should have multiple entries in chronological order (newest first)
      expect(history.length).toBeGreaterThan(1);
      
      // Verify order (newest first)
      for (let i = 0; i < history.length - 1; i++) {
        const current = new Date(history[i].achievedAt);
        const next = new Date(history[i + 1].achievedAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });

  describe('Rank Progress Calculation', () => {
    it('should calculate progress to next rank', async () => {
      // Requirements: 6.2
      
      // Create rank tiers
      const current = await rankService.createRankTier({
        name: `Progress Current ${Date.now()}`,
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/current.png',
        perks: {},
      });
      testRankIds.push(current.id);

      const next = await rankService.createRankTier({
        name: `Progress Next ${Date.now()}`,
        minimumXpThreshold: 200,
        rankOrder: 2,
        iconUrl: 'https://example.com/icons/next.png',
        perks: {},
      });
      testRankIds.push(next.id);

      // Award partial XP
      await xpService.awardXP({
        userId: testUserId,
        amount: 100,
        source: 'event_participation',
        activityType: 'test',
        description: 'Partial XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Get progress
      const progress = await rankService.getRankProgress(testUserId);

      expect(progress.currentRank?.name).toBe(current.name);
      expect(progress.nextRank?.name).toBe(next.name);
      expect(progress.currentXP).toBe(100);
      expect(progress.xpForNextRank).toBe(200);
      expect(progress.progressPercentage).toBe(50); // 100/200 = 50%
      expect(progress.isMaxRank).toBe(false);
    });

    it('should handle max rank case', async () => {
      // Requirements: 6.2
      
      // Create only one rank tier
      const maxRank = await rankService.createRankTier({
        name: `Max Rank ${Date.now()}`,
        minimumXpThreshold: 100,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/max.png',
        perks: {},
      });
      testRankIds.push(maxRank.id);

      // Award XP to reach max rank
      await xpService.awardXP({
        userId: testUserId,
        amount: 500,
        source: 'event_participation',
        activityType: 'test',
        description: 'Max XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Get progress
      const progress = await rankService.getRankProgress(testUserId);

      expect(progress.currentRank?.name).toBe(maxRank.name);
      expect(progress.nextRank).toBeNull();
      expect(progress.isMaxRank).toBe(true);
      expect(progress.progressPercentage).toBe(100);
    });
  });

  describe('Rank Tier Updates', () => {
    it('should recalculate ranks when tier thresholds change', async () => {
      // Requirements: 15.2
      
      // Create initial rank tiers
      const tier1 = await rankService.createRankTier({
        name: `Update Tier 1 ${Date.now()}`,
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/tier1.png',
        perks: {},
      });
      testRankIds.push(tier1.id);

      const tier2 = await rankService.createRankTier({
        name: `Update Tier 2 ${Date.now()}`,
        minimumXpThreshold: 500,
        rankOrder: 2,
        iconUrl: 'https://example.com/icons/tier2.png',
        perks: {},
      });
      testRankIds.push(tier2.id);

      // Award XP
      await xpService.awardXP({
        userId: testUserId,
        amount: 300,
        source: 'event_participation',
        activityType: 'test',
        description: 'Test XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // User should be at Tier 1
      let rank = await rankService.calculateUserRank(testUserId);
      expect(rank?.name).toBe(tier1.name);

      // Update Tier 2 threshold to be lower
      await rankService.updateRankTier(tier2.id, {
        minimumXpThreshold: 200,
      });

      // Recalculate rank
      await rankService.updateUserRank(testUserId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // User should now be at Tier 2
      rank = await rankService.calculateUserRank(testUserId);
      expect(rank?.name).toBe(tier2.name);
    });

    it('should handle rank tier reordering', async () => {
      // Requirements: 15.2
      
      // Create rank tiers
      const ranks = [];
      for (let i = 1; i <= 3; i++) {
        const rank = await rankService.createRankTier({
          name: `Reorder Rank ${i} ${Date.now()}`,
          minimumXpThreshold: i * 100,
          rankOrder: i,
          iconUrl: `/icons/rank${i}.png`,
          perks: {},
        });
        testRankIds.push(rank.id);
        ranks.push(rank);
      }

      // Get all ranks
      const allRanks = await rankService.getAllRankTiers();
      const testRanks = allRanks.filter(r => testRankIds.includes(r.id));

      // Verify initial order
      expect(testRanks[0].rankOrder).toBeLessThan(testRanks[1].rankOrder);
      expect(testRanks[1].rankOrder).toBeLessThan(testRanks[2].rankOrder);

      // Reorder ranks
      await rankService.reorderRankTiers([ranks[2].id, ranks[0].id, ranks[1].id]);

      // Get ranks again
      const reorderedRanks = await rankService.getAllRankTiers();
      const testReordered = reorderedRanks.filter(r => testRankIds.includes(r.id));

      // Verify new order
      const rank3 = testReordered.find(r => r.id === ranks[2].id);
      const rank1 = testReordered.find(r => r.id === ranks[0].id);
      const rank2 = testReordered.find(r => r.id === ranks[1].id);

      expect(rank3?.rankOrder).toBeLessThan(rank1!.rankOrder);
      expect(rank1?.rankOrder).toBeLessThan(rank2!.rankOrder);
    });
  });

  describe('Rank Notifications', () => {
    it('should indicate when rank-up notification should be sent', async () => {
      // Requirements: 6.4
      
      // Create rank tiers
      const tier1 = await rankService.createRankTier({
        name: `Notify Tier 1 ${Date.now()}`,
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: 'https://example.com/icons/tier1.png',
        perks: {},
      });
      testRankIds.push(tier1.id);

      const tier2 = await rankService.createRankTier({
        name: `Notify Tier 2 ${Date.now()}`,
        minimumXpThreshold: 100,
        rankOrder: 2,
        iconUrl: 'https://example.com/icons/tier2.png',
        perks: {},
      });
      testRankIds.push(tier2.id);

      // Award XP to trigger rank up
      await xpService.awardXP({
        userId: testUserId,
        amount: 150,
        source: 'event_participation',
        activityType: 'test',
        description: 'Rank up XP',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Update rank and check result
      const rankChange = await rankService.updateUserRank(testUserId);

      expect(rankChange.rankUp).toBe(true);
      expect(rankChange.previousRank).toBeDefined();
      expect(rankChange.currentRank).toBeDefined();
      expect(rankChange.currentRank?.name).toBe(tier2.name);
    });
  });
});
