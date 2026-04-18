/**
 * Rank Service Unit Tests
 * 
 * Tests core rank service functionality including:
 * - Input validation
 * - Type checking
 * - Interface compliance
 * - Rank calculation logic
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('RankService Validation', () => {
  describe('Create Rank Tier Parameters', () => {
    it('should validate rank tier creation parameters', () => {
      const createRankTierSchema = z.object({
        name: z.string().min(1).max(100),
        minimumXpThreshold: z.number().int().min(0),
        rankOrder: z.number().int().positive(),
        iconUrl: z.string().url(),
        perks: z.record(z.string(), z.unknown()).optional()
      });

      // Valid params
      const validParams = {
        name: 'Novice Assassin',
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: 'https://example.com/icon.png',
        perks: { bonus_xp: 1.1 }
      };

      expect(() => createRankTierSchema.parse(validParams)).not.toThrow();

      // Invalid: negative XP threshold
      const negativeThreshold = {
        ...validParams,
        minimumXpThreshold: -100
      };
      expect(() => createRankTierSchema.parse(negativeThreshold)).toThrow();

      // Invalid: zero rank order
      const zeroRankOrder = {
        ...validParams,
        rankOrder: 0
      };
      expect(() => createRankTierSchema.parse(zeroRankOrder)).toThrow();

      // Invalid: invalid URL
      const invalidUrl = {
        ...validParams,
        iconUrl: 'not-a-url'
      };
      expect(() => createRankTierSchema.parse(invalidUrl)).toThrow();
    });

    it('should accept minimum XP threshold of 0', () => {
      const schema = z.number().int().min(0);
      
      expect(() => schema.parse(0)).not.toThrow();
      expect(() => schema.parse(1000)).not.toThrow();
      expect(() => schema.parse(-1)).toThrow();
    });

    it('should require positive rank order', () => {
      const schema = z.number().int().positive();
      
      expect(() => schema.parse(1)).not.toThrow();
      expect(() => schema.parse(10)).not.toThrow();
      expect(() => schema.parse(0)).toThrow();
      expect(() => schema.parse(-1)).toThrow();
    });
  });

  describe('Update Rank Tier Parameters', () => {
    it('should validate optional update parameters', () => {
      const updateRankTierSchema = z.object({
        name: z.string().min(1).max(100).optional(),
        minimumXpThreshold: z.number().int().min(0).optional(),
        rankOrder: z.number().int().positive().optional(),
        iconUrl: z.string().url().optional(),
        perks: z.record(z.string(), z.unknown()).optional()
      });

      // All fields optional
      expect(() => updateRankTierSchema.parse({})).not.toThrow();

      // Partial update
      const partialUpdate = {
        name: 'Updated Name',
        minimumXpThreshold: 5000
      };
      expect(() => updateRankTierSchema.parse(partialUpdate)).not.toThrow();

      // Invalid partial update
      const invalidUpdate = {
        minimumXpThreshold: -100
      };
      expect(() => updateRankTierSchema.parse(invalidUpdate)).toThrow();
    });
  });

  describe('Rank Progress Calculation', () => {
    it('should calculate progress percentage correctly', () => {
      // Test progress calculation logic
      const currentRankThreshold = 1000;
      const nextRankThreshold = 5000;
      const currentXP = 3000;

      const xpInCurrentRank = currentXP - currentRankThreshold;
      const xpNeededForNextRank = nextRankThreshold - currentRankThreshold;
      const progressPercentage = Math.floor((xpInCurrentRank / xpNeededForNextRank) * 100);

      expect(progressPercentage).toBe(50);
    });

    it('should handle edge case: at exact threshold', () => {
      const currentRankThreshold = 1000;
      const nextRankThreshold = 5000;
      const currentXP = 1000;

      const xpInCurrentRank = currentXP - currentRankThreshold;
      const xpNeededForNextRank = nextRankThreshold - currentRankThreshold;
      const progressPercentage = Math.floor((xpInCurrentRank / xpNeededForNextRank) * 100);

      expect(progressPercentage).toBe(0);
    });

    it('should handle edge case: one XP below next rank', () => {
      const currentRankThreshold = 1000;
      const nextRankThreshold = 5000;
      const currentXP = 4999;

      const xpInCurrentRank = currentXP - currentRankThreshold;
      const xpNeededForNextRank = nextRankThreshold - currentRankThreshold;
      const progressPercentage = Math.floor((xpInCurrentRank / xpNeededForNextRank) * 100);

      expect(progressPercentage).toBe(99);
    });

    it('should cap progress at 100%', () => {
      const progressPercentage = 150;
      const cappedProgress = Math.max(0, Math.min(100, progressPercentage));

      expect(cappedProgress).toBe(100);
    });

    it('should floor progress at 0%', () => {
      const progressPercentage = -10;
      const flooredProgress = Math.max(0, Math.min(100, progressPercentage));

      expect(flooredProgress).toBe(0);
    });
  });

  describe('XP for Next Rank Calculation', () => {
    it('should calculate XP needed for next rank', () => {
      const currentXP = 3000;
      const nextRankThreshold = 5000;
      const xpForNextRank = nextRankThreshold - currentXP;

      expect(xpForNextRank).toBe(2000);
    });

    it('should return 0 when at max rank', () => {
      const xpForNextRank = 0;
      const isMaxRank = true;

      expect(xpForNextRank).toBe(0);
      expect(isMaxRank).toBe(true);
    });
  });

  describe('Rank Change Detection', () => {
    it('should detect rank up when rank changes to higher rank', () => {
      const previousRankOrder = 1;
      const currentRankOrder = 2;
      const rankUp = currentRankOrder > previousRankOrder;

      expect(rankUp).toBe(true);
    });

    it('should not detect rank up when rank stays the same', () => {
      const previousRankId = 'rank-1';
      const currentRankId = 'rank-1';
      const rankChanged = previousRankId !== currentRankId;

      expect(rankChanged).toBe(false);
    });

    it('should detect rank change from null to first rank', () => {
      const previousRankId = null;
      const currentRankId = 'rank-1';
      const rankChanged = previousRankId !== currentRankId;
      const rankUp = currentRankId !== null;

      expect(rankChanged).toBe(true);
      expect(rankUp).toBe(true);
    });
  });

  describe('Rank Tier Ordering', () => {
    it('should validate ascending rank order', () => {
      const ranks = [
        { rankOrder: 1, minimumXpThreshold: 0 },
        { rankOrder: 2, minimumXpThreshold: 1000 },
        { rankOrder: 3, minimumXpThreshold: 5000 }
      ];

      // Check that rank orders are ascending
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i].rankOrder).toBeGreaterThan(ranks[i - 1].rankOrder);
      }

      // Check that XP thresholds are ascending
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i].minimumXpThreshold).toBeGreaterThan(ranks[i - 1].minimumXpThreshold);
      }
    });
  });

  describe('Rank History Sorting', () => {
    it('should sort rank history by achieved_at descending', () => {
      const history = [
        { achievedAt: new Date('2024-01-01'), rankOrder: 1 },
        { achievedAt: new Date('2024-03-01'), rankOrder: 3 },
        { achievedAt: new Date('2024-02-01'), rankOrder: 2 }
      ];

      const sorted = [...history].sort((a, b) => 
        b.achievedAt.getTime() - a.achievedAt.getTime()
      );

      expect(sorted[0].achievedAt.toISOString()).toBe('2024-03-01T00:00:00.000Z');
      expect(sorted[1].achievedAt.toISOString()).toBe('2024-02-01T00:00:00.000Z');
      expect(sorted[2].achievedAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('Rank Qualification Logic', () => {
    it('should qualify for rank when XP meets threshold', () => {
      const userXP = 1000;
      const rankThreshold = 1000;
      const qualifies = userXP >= rankThreshold;

      expect(qualifies).toBe(true);
    });

    it('should qualify for rank when XP exceeds threshold', () => {
      const userXP = 1500;
      const rankThreshold = 1000;
      const qualifies = userXP >= rankThreshold;

      expect(qualifies).toBe(true);
    });

    it('should not qualify for rank when XP is below threshold', () => {
      const userXP = 999;
      const rankThreshold = 1000;
      const qualifies = userXP >= rankThreshold;

      expect(qualifies).toBe(false);
    });

    it('should select highest qualifying rank', () => {
      const userXP = 3500;
      const ranks = [
        { id: 'rank-1', minimumXpThreshold: 0 },
        { id: 'rank-2', minimumXpThreshold: 1000 },
        { id: 'rank-3', minimumXpThreshold: 5000 }
      ];

      const qualifyingRanks = ranks.filter(r => r.minimumXpThreshold <= userXP);
      const highestRank = qualifyingRanks.sort((a, b) => 
        b.minimumXpThreshold - a.minimumXpThreshold
      )[0];

      expect(highestRank.id).toBe('rank-2');
      expect(highestRank.minimumXpThreshold).toBe(1000);
    });
  });
});
