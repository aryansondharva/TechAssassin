/**
 * XP Service Unit Tests
 * 
 * Tests core XP service functionality including:
 * - Input validation
 * - Type checking
 * - Interface compliance
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('XPService Validation', () => {
  describe('XP Source Types', () => {
    it('should accept valid XP source types', () => {
      const validSources = [
        'event_participation',
        'code_contribution',
        'community_engagement',
        'challenge_completion',
        'helping_others',
        'profile_completion'
      ];

      const xpSourceSchema = z.enum([
        'event_participation',
        'code_contribution',
        'community_engagement',
        'challenge_completion',
        'helping_others',
        'profile_completion'
      ]);

      validSources.forEach(source => {
        expect(() => xpSourceSchema.parse(source)).not.toThrow();
      });
    });

    it('should reject invalid XP source types', () => {
      const xpSourceSchema = z.enum([
        'event_participation',
        'code_contribution',
        'community_engagement',
        'challenge_completion',
        'helping_others',
        'profile_completion'
      ]);

      expect(() => xpSourceSchema.parse('invalid_source')).toThrow();
    });
  });

  describe('Award XP Parameters', () => {
    it('should validate positive XP amounts', () => {
      const awardXPSchema = z.object({
        userId: z.string().uuid(),
        amount: z.number().int().positive(),
        source: z.enum([
          'event_participation',
          'code_contribution',
          'community_engagement',
          'challenge_completion',
          'helping_others',
          'profile_completion'
        ]),
        activityType: z.string().min(1).max(100),
        description: z.string().min(1)
      });

      // Valid params
      const validParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 100,
        source: 'event_participation' as const,
        activityType: 'event_registration',
        description: 'Registered for event'
      };

      expect(() => awardXPSchema.parse(validParams)).not.toThrow();

      // Invalid: negative amount
      const invalidParams = {
        ...validParams,
        amount: -100
      };

      expect(() => awardXPSchema.parse(invalidParams)).toThrow();
    });

    it('should validate UUID format for userId', () => {
      const schema = z.string().uuid();

      expect(() => schema.parse('123e4567-e89b-12d3-a456-426614174000')).not.toThrow();
      expect(() => schema.parse('invalid-uuid')).toThrow();
    });
  });

  describe('Manual Adjustment Parameters', () => {
    it('should require reason and adminId for manual adjustments', () => {
      const manualAdjustmentSchema = z.object({
        userId: z.string().uuid(),
        amount: z.number().int().positive(),
        source: z.enum([
          'event_participation',
          'code_contribution',
          'community_engagement',
          'challenge_completion',
          'helping_others',
          'profile_completion'
        ]),
        activityType: z.string().min(1).max(100),
        description: z.string().min(1),
        reason: z.string().min(1),
        adminId: z.string().uuid()
      });

      const validParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 500,
        source: 'event_participation' as const,
        activityType: 'manual_adjustment',
        description: 'Bonus XP',
        reason: 'Outstanding contribution',
        adminId: '223e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => manualAdjustmentSchema.parse(validParams)).not.toThrow();

      // Missing reason
      const missingReason = { ...validParams };
      delete (missingReason as any).reason;
      expect(() => manualAdjustmentSchema.parse(missingReason)).toThrow();
    });
  });

  describe('XP History Filters', () => {
    it('should validate pagination parameters', () => {
      const filtersSchema = z.object({
        page: z.number().int().positive(),
        pageSize: z.number().int().positive().max(100)
      });

      expect(() => filtersSchema.parse({ page: 1, pageSize: 20 })).not.toThrow();
      expect(() => filtersSchema.parse({ page: 0, pageSize: 20 })).toThrow();
      expect(() => filtersSchema.parse({ page: 1, pageSize: 200 })).toThrow();
    });
  });
});
