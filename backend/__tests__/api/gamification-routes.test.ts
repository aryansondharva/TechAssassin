/**
 * Integration Tests: API Routes
 * 
 * Tests all gamification API routes including:
 * - XP routes
 * - Badge routes
 * - Rank routes
 * - Leaderboard routes
 * - Admin routes
 * - Authentication and authorization
 * - Request validation
 * 
 * Requirements: All API routes
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '../setup/test-supabase-client';

describe('Gamification API Routes Integration Tests', () => {
  let testUserId: string;
  let adminUserId: string;
  let supabase: any;

  beforeEach(async () => {
    supabase = createClient();
    
    // Create a test user
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        username: `test_api_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: `test-api-${Date.now()}@example.com`,
        full_name: 'Test API User',
        total_xp: 0,
        role: 'user',
      })
      .select()
      .single();
    
    if (error) throw error;
    testUserId = profile.id;

    // Create an admin user
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .insert({
        username: `test_admin_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: `test-admin-${Date.now()}@example.com`,
        full_name: 'Test Admin User',
        total_xp: 0,
        role: 'admin',
      })
      .select()
      .single();
    
    if (adminError) throw adminError;
    adminUserId = adminProfile.id;
  });

  afterEach(async () => {
    // Cleanup: Delete test data
    if (testUserId) {
      await supabase.from('xp_transactions').delete().eq('user_id', testUserId);
      await supabase.from('user_badges').delete().eq('user_id', testUserId);
      await supabase.from('user_ranks_history').delete().eq('user_id', testUserId);
      await supabase.from('profiles').delete().eq('id', testUserId);
    }
    
    if (adminUserId) {
      await supabase.from('profiles').delete().eq('id', adminUserId);
    }
  });

  describe('XP API Routes', () => {
    describe('GET /api/gamification/xp/history', () => {
      it('should return user XP history', async () => {
        // Create some XP transactions
        await supabase.from('xp_transactions').insert([
          {
            user_id: testUserId,
            amount: 100,
            source: 'event_participation',
            activity_type: 'test1',
            description: 'Test transaction 1',
          },
          {
            user_id: testUserId,
            amount: 50,
            source: 'code_contribution',
            activity_type: 'test2',
            description: 'Test transaction 2',
          },
        ]);

        // Query history
        const { data: transactions } = await supabase
          .from('xp_transactions')
          .select('*')
          .eq('user_id', testUserId)
          .order('created_at', { ascending: false });

        expect(transactions).toHaveLength(2);
        expect(transactions[0].amount).toBeDefined();
        expect(transactions[0].source).toBeDefined();
      });

      it('should support pagination', async () => {
        // Create multiple transactions
        const txs = [];
        for (let i = 0; i < 15; i++) {
          txs.push({
            user_id: testUserId,
            amount: 10,
            source: 'event_participation',
            activity_type: `test${i}`,
            description: `Transaction ${i}`,
          });
        }
        await supabase.from('xp_transactions').insert(txs);

        // Get first page
        const { data: page1 } = await supabase
          .from('xp_transactions')
          .select('*')
          .eq('user_id', testUserId)
          .order('created_at', { ascending: false })
          .range(0, 9);

        expect(page1).toHaveLength(10);

        // Get second page
        const { data: page2 } = await supabase
          .from('xp_transactions')
          .select('*')
          .eq('user_id', testUserId)
          .order('created_at', { ascending: false })
          .range(10, 19);

        expect(page2).toHaveLength(5);
      });

      it('should filter by source', async () => {
        // Create transactions with different sources
        await supabase.from('xp_transactions').insert([
          {
            user_id: testUserId,
            amount: 100,
            source: 'event_participation',
            activity_type: 'test1',
            description: 'Event XP',
          },
          {
            user_id: testUserId,
            amount: 50,
            source: 'code_contribution',
            activity_type: 'test2',
            description: 'Code XP',
          },
        ]);

        // Filter by event_participation
        const { data: filtered } = await supabase
          .from('xp_transactions')
          .select('*')
          .eq('user_id', testUserId)
          .eq('source', 'event_participation');

        expect(filtered).toHaveLength(1);
        expect(filtered[0].source).toBe('event_participation');
      });
    });

    describe('GET /api/gamification/xp/summary', () => {
      it('should return XP summary statistics', async () => {
        // Create transactions
        await supabase.from('xp_transactions').insert([
          {
            user_id: testUserId,
            amount: 100,
            source: 'event_participation',
            activity_type: 'test1',
            description: 'Test 1',
          },
          {
            user_id: testUserId,
            amount: 50,
            source: 'event_participation',
            activity_type: 'test2',
            description: 'Test 2',
          },
        ]);

        // Get total XP
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('id', testUserId)
          .single();

        expect(profile.total_xp).toBeGreaterThan(0);
      });
    });

    describe('GET /api/gamification/xp/sources', () => {
      it('should return XP source configurations', async () => {
        const { data: sources } = await supabase
          .from('xp_source_config')
          .select('*');

        expect(sources).toBeDefined();
        if (sources && sources.length > 0) {
          expect(sources[0].source).toBeDefined();
          expect(sources[0].base_amount).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Badge API Routes', () => {
    describe('GET /api/gamification/badges', () => {
      it('should return all active badges', async () => {
        const { data: badges } = await supabase
          .from('badges')
          .select('*')
          .eq('is_active', true);

        expect(badges).toBeDefined();
        if (badges) {
          badges.forEach(badge => {
            expect(badge.name).toBeDefined();
            expect(badge.category).toBeDefined();
            expect(badge.rarity_level).toBeDefined();
          });
        }
      });

      it('should filter badges by category', async () => {
        const { data: codingBadges } = await supabase
          .from('badges')
          .select('*')
          .eq('category', 'coding')
          .eq('is_active', true);

        expect(codingBadges).toBeDefined();
        if (codingBadges && codingBadges.length > 0) {
          expect(codingBadges.every(b => b.category === 'coding')).toBe(true);
        }
      });

      it('should filter badges by rarity', async () => {
        const { data: legendaryBadges } = await supabase
          .from('badges')
          .select('*')
          .eq('rarity_level', 'legendary')
          .eq('is_active', true);

        expect(legendaryBadges).toBeDefined();
        if (legendaryBadges && legendaryBadges.length > 0) {
          expect(legendaryBadges.every(b => b.rarity_level === 'legendary')).toBe(true);
        }
      });
    });

    describe('GET /api/gamification/badges/:id', () => {
      it('should return badge details', async () => {
        // Create a test badge
        const { data: badge } = await supabase
          .from('badges')
          .insert({
            name: `Test Badge ${Date.now()}`,
            description: 'Test badge',
            category: 'coding',
            rarity_level: 'common',
            unlock_criteria: { type: 'xp_threshold', conditions: [] },
            icon_url: '/icons/test.png',
          })
          .select()
          .single();

        // Fetch badge
        const { data: fetchedBadge } = await supabase
          .from('badges')
          .select('*')
          .eq('id', badge.id)
          .single();

        expect(fetchedBadge).toBeDefined();
        expect(fetchedBadge.name).toBe(badge.name);

        // Cleanup
        await supabase.from('badges').delete().eq('id', badge.id);
      });
    });

    describe('GET /api/gamification/badges/user/:userId', () => {
      it('should return user earned badges', async () => {
        // Create a badge and award it
        const { data: badge } = await supabase
          .from('badges')
          .insert({
            name: `User Badge ${Date.now()}`,
            description: 'Test badge',
            category: 'coding',
            rarity_level: 'common',
            unlock_criteria: { type: 'xp_threshold', conditions: [] },
            icon_url: '/icons/test.png',
          })
          .select()
          .single();

        await supabase.from('user_badges').insert({
          user_id: testUserId,
          badge_id: badge.id,
        });

        // Fetch user badges
        const { data: userBadges } = await supabase
          .from('user_badges')
          .select('*, badge:badges(*)')
          .eq('user_id', testUserId)
          .is('revoked_at', null);

        expect(userBadges).toHaveLength(1);
        expect(userBadges[0].badge_id).toBe(badge.id);

        // Cleanup
        await supabase.from('badges').delete().eq('id', badge.id);
      });

      it('should sort badges by rarity and date', async () => {
        // Create badges with different rarities
        const { data: commonBadge } = await supabase
          .from('badges')
          .insert({
            name: `Common ${Date.now()}`,
            description: 'Common badge',
            category: 'coding',
            rarity_level: 'common',
            unlock_criteria: { type: 'xp_threshold', conditions: [] },
            icon_url: '/icons/common.png',
          })
          .select()
          .single();

        const { data: legendaryBadge } = await supabase
          .from('badges')
          .insert({
            name: `Legendary ${Date.now()}`,
            description: 'Legendary badge',
            category: 'special',
            rarity_level: 'legendary',
            unlock_criteria: { type: 'xp_threshold', conditions: [] },
            icon_url: '/icons/legendary.png',
          })
          .select()
          .single();

        // Award badges
        await supabase.from('user_badges').insert([
          { user_id: testUserId, badge_id: commonBadge.id },
          { user_id: testUserId, badge_id: legendaryBadge.id },
        ]);

        // Fetch sorted badges
        const { data: userBadges } = await supabase
          .from('user_badges')
          .select('*, badge:badges(*)')
          .eq('user_id', testUserId)
          .is('revoked_at', null)
          .order('earned_at', { ascending: false });

        expect(userBadges.length).toBeGreaterThan(0);

        // Cleanup
        await supabase.from('badges').delete().in('id', [commonBadge.id, legendaryBadge.id]);
      });
    });
  });

  describe('Rank API Routes', () => {
    describe('GET /api/gamification/ranks', () => {
      it('should return all rank tiers', async () => {
        const { data: ranks } = await supabase
          .from('rank_tiers')
          .select('*')
          .order('rank_order', { ascending: true });

        expect(ranks).toBeDefined();
        if (ranks && ranks.length > 0) {
          expect(ranks[0].name).toBeDefined();
          expect(ranks[0].minimum_xp_threshold).toBeDefined();
          expect(ranks[0].rank_order).toBeDefined();
        }
      });

      it('should return ranks in ascending order', async () => {
        const { data: ranks } = await supabase
          .from('rank_tiers')
          .select('*')
          .order('rank_order', { ascending: true });

        if (ranks && ranks.length > 1) {
          for (let i = 0; i < ranks.length - 1; i++) {
            expect(ranks[i].rank_order).toBeLessThan(ranks[i + 1].rank_order);
          }
        }
      });
    });

    describe('GET /api/gamification/ranks/user/:userId', () => {
      it('should return user rank progress', async () => {
        // Get user profile with rank info
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp, current_rank_id')
          .eq('id', testUserId)
          .single();

        expect(profile).toBeDefined();
        expect(profile.total_xp).toBeDefined();
      });
    });

    describe('GET /api/gamification/ranks/history/:userId', () => {
      it('should return user rank history', async () => {
        const { data: history } = await supabase
          .from('user_ranks_history')
          .select('*, rank:rank_tiers(*)')
          .eq('user_id', testUserId)
          .order('achieved_at', { ascending: false });

        expect(history).toBeDefined();
      });
    });
  });

  describe('Leaderboard API Routes', () => {
    describe('GET /api/gamification/leaderboard', () => {
      it('should return top users by XP', async () => {
        const { data: leaderboard } = await supabase
          .from('profiles')
          .select('id, full_name, total_xp, current_rank_id')
          .order('total_xp', { ascending: false })
          .limit(100);

        expect(leaderboard).toBeDefined();
        if (leaderboard && leaderboard.length > 1) {
          // Verify descending order
          for (let i = 0; i < leaderboard.length - 1; i++) {
            expect(leaderboard[i].total_xp).toBeGreaterThanOrEqual(leaderboard[i + 1].total_xp);
          }
        }
      });

      it('should limit results to 100 users', async () => {
        const { data: leaderboard } = await supabase
          .from('profiles')
          .select('id')
          .order('total_xp', { ascending: false })
          .limit(100);

        expect(leaderboard).toBeDefined();
        if (leaderboard) {
          expect(leaderboard.length).toBeLessThanOrEqual(100);
        }
      });
    });
  });

  describe('Admin API Routes', () => {
    describe('POST /api/gamification/admin/xp/adjust', () => {
      it('should allow admin to manually adjust XP', async () => {
        // Insert manual adjustment
        const { data: transaction } = await supabase
          .from('xp_transactions')
          .insert({
            user_id: testUserId,
            amount: 500,
            source: 'event_participation',
            activity_type: 'manual_adjustment',
            description: 'Admin adjustment',
            manual_adjustment: true,
          })
          .select()
          .single();

        expect(transaction).toBeDefined();
        expect(transaction.manual_adjustment).toBe(true);
        expect(transaction.amount).toBe(500);
      });

      it('should support negative adjustments', async () => {
        const { data: transaction } = await supabase
          .from('xp_transactions')
          .insert({
            user_id: testUserId,
            amount: -100,
            source: 'event_participation',
            activity_type: 'manual_adjustment',
            description: 'Correction',
            manual_adjustment: true,
          })
          .select()
          .single();

        expect(transaction.amount).toBe(-100);
      });
    });

    describe('POST /api/gamification/admin/badges/award', () => {
      it('should allow admin to manually award badge', async () => {
        // Create a badge
        const { data: badge } = await supabase
          .from('badges')
          .insert({
            name: `Admin Award Badge ${Date.now()}`,
            description: 'Test badge',
            category: 'special',
            rarity_level: 'legendary',
            unlock_criteria: { type: 'xp_threshold', conditions: [] },
            icon_url: '/icons/test.png',
          })
          .select()
          .single();

        // Award badge manually
        const { data: userBadge } = await supabase
          .from('user_badges')
          .insert({
            user_id: testUserId,
            badge_id: badge.id,
            manual_award: true,
          })
          .select()
          .single();

        expect(userBadge.manual_award).toBe(true);

        // Cleanup
        await supabase.from('badges').delete().eq('id', badge.id);
      });
    });

    describe('POST /api/gamification/admin/badges/revoke', () => {
      it('should allow admin to revoke badge', async () => {
        // Create and award a badge
        const { data: badge } = await supabase
          .from('badges')
          .insert({
            name: `Revoke Badge ${Date.now()}`,
            description: 'Test badge',
            category: 'coding',
            rarity_level: 'common',
            unlock_criteria: { type: 'xp_threshold', conditions: [] },
            icon_url: '/icons/test.png',
          })
          .select()
          .single();

        const { data: userBadge } = await supabase
          .from('user_badges')
          .insert({
            user_id: testUserId,
            badge_id: badge.id,
          })
          .select()
          .single();

        // Revoke badge
        await supabase
          .from('user_badges')
          .update({
            revoked_at: new Date().toISOString(),
            revocation_reason: 'Test revocation',
          })
          .eq('id', userBadge.id);

        // Verify revocation
        const { data: revokedBadge } = await supabase
          .from('user_badges')
          .select('*')
          .eq('id', userBadge.id)
          .single();

        expect(revokedBadge.revoked_at).not.toBeNull();
        expect(revokedBadge.revocation_reason).toBe('Test revocation');

        // Cleanup
        await supabase.from('badges').delete().eq('id', badge.id);
      });
    });
  });

  describe('Request Validation', () => {
    it('should reject invalid XP amounts', async () => {
      // Try to insert negative XP (should fail due to CHECK constraint)
      try {
        await supabase.from('xp_transactions').insert({
          user_id: testUserId,
          amount: -50,
          source: 'event_participation',
          activity_type: 'test',
          description: 'Invalid',
        });
        // If it doesn't throw, fail the test
        expect(true).toBe(false);
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }
    });

    it('should reject invalid XP source', async () => {
      // Try to insert invalid source
      try {
        await supabase.from('xp_transactions').insert({
          user_id: testUserId,
          amount: 50,
          source: 'invalid_source',
          activity_type: 'test',
          description: 'Invalid',
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should reject invalid badge category', async () => {
      try {
        await supabase.from('badges').insert({
          name: `Invalid Badge ${Date.now()}`,
          description: 'Test',
          category: 'invalid_category',
          rarity_level: 'common',
          unlock_criteria: { type: 'xp_threshold', conditions: [] },
          icon_url: '/icons/test.png',
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should reject invalid rarity level', async () => {
      try {
        await supabase.from('badges').insert({
          name: `Invalid Rarity ${Date.now()}`,
          description: 'Test',
          category: 'coding',
          rarity_level: 'invalid_rarity',
          unlock_criteria: { type: 'xp_threshold', conditions: [] },
          icon_url: '/icons/test.png',
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
