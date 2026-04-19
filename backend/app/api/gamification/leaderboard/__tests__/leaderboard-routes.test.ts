/**
 * Tests for Leaderboard API routes
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET as getLeaderboard } from '../route';
import { GET as getUserPosition } from '../position/[userId]/route';
import { leaderboardCache } from '@/lib/services/leaderboard-cache-service';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                username: 'user1',
                avatar_url: 'https://example.com/avatar1.jpg',
                total_xp: 5000,
                current_rank_id: 'rank-1',
                rank_tiers: {
                  name: 'Master',
                  icon_url: 'https://example.com/master.png'
                }
              },
              {
                id: '223e4567-e89b-12d3-a456-426614174001',
                username: 'user2',
                avatar_url: 'https://example.com/avatar2.jpg',
                total_xp: 3000,
                current_rank_id: 'rank-2',
                rank_tiers: {
                  name: 'Expert',
                  icon_url: 'https://example.com/expert.png'
                }
              }
            ],
            error: null
          }))
        }))
      }))
    })),
    rpc: vi.fn((funcName, params) => {
      if (funcName === 'get_user_leaderboard_position') {
        return Promise.resolve({
          data: [{
            user_id: params.target_user_id,
            username: 'user2',
            avatar_url: 'https://example.com/avatar2.jpg',
            total_xp: 3000,
            user_rank: 2,
            rank_name: 'Expert',
            rank_icon: 'https://example.com/expert.png',
            above_id: '123e4567-e89b-12d3-a456-426614174000',
            above_username: 'user1',
            above_avatar: 'https://example.com/avatar1.jpg',
            above_xp: 5000,
            above_rank_name: 'Master',
            above_rank_icon: 'https://example.com/master.png',
            below_id: '323e4567-e89b-12d3-a456-426614174002',
            below_username: 'user3',
            below_avatar: 'https://example.com/avatar3.jpg',
            below_xp: 1000,
            below_rank_name: 'Novice',
            below_rank_icon: 'https://example.com/novice.png',
            total_users: 100
          }],
          error: null
        });
      }
      return Promise.resolve({ data: null, error: new Error('Function not found') });
    })
  }))
}));

describe('Leaderboard API Routes', () => {
  beforeEach(() => {
    // Clear cache before each test
    leaderboardCache.manualRefresh();
  });

  describe('GET /api/gamification/leaderboard', () => {
    it('should return leaderboard with default parameters', async () => {
      const request = new Request('http://localhost:3000/api/gamification/leaderboard');
      const response = await getLeaderboard(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('period', 'all-time');
      expect(data).toHaveProperty('limit', 100);
      expect(data).toHaveProperty('leaderboard');
      expect(Array.isArray(data.leaderboard)).toBe(true);
    });

    it('should return leaderboard with custom limit', async () => {
      const request = new Request('http://localhost:3000/api/gamification/leaderboard?limit=50');
      const response = await getLeaderboard(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(50);
    });

    it('should return leaderboard with period filter', async () => {
      const request = new Request('http://localhost:3000/api/gamification/leaderboard?period=weekly');
      const response = await getLeaderboard(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.period).toBe('weekly');
    });

    it('should include rank numbers in leaderboard entries', async () => {
      const request = new Request('http://localhost:3000/api/gamification/leaderboard');
      const response = await getLeaderboard(request);
      const data = await response.json();

      expect(data.leaderboard[0]).toHaveProperty('rank', 1);
      expect(data.leaderboard[1]).toHaveProperty('rank', 2);
    });

    it('should include user details in leaderboard entries', async () => {
      const request = new Request('http://localhost:3000/api/gamification/leaderboard');
      const response = await getLeaderboard(request);
      const data = await response.json();

      const entry = data.leaderboard[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('username');
      expect(entry).toHaveProperty('avatar_url');
      expect(entry).toHaveProperty('total_xp');
      expect(entry).toHaveProperty('current_rank');
    });

    it('should cache leaderboard results', async () => {
      const request = new Request('http://localhost:3000/api/gamification/leaderboard');
      
      // First request
      await getLeaderboard(request);
      
      // Check cache has entry
      const stats = leaderboardCache.getStats();
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('GET /api/gamification/leaderboard/position/[userId]', () => {
    it('should return user position with context', async () => {
      const userId = '223e4567-e89b-12d3-a456-426614174001';
      const request = new Request(`http://localhost:3000/api/gamification/leaderboard/position/${userId}`);
      const params = Promise.resolve({ userId });
      
      const response = await getUserPosition(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('user');
      expect(data.user.id).toBe(userId);
      expect(data.user).toHaveProperty('rank');
    });

    it('should include user above in response', async () => {
      const userId = '223e4567-e89b-12d3-a456-426614174001';
      const request = new Request(`http://localhost:3000/api/gamification/leaderboard/position/${userId}`);
      const params = Promise.resolve({ userId });
      
      const response = await getUserPosition(request, { params });
      const data = await response.json();

      expect(data).toHaveProperty('user_above');
      expect(data.user_above).not.toBeNull();
      expect(data.user_above).toHaveProperty('username');
      expect(data.user_above).toHaveProperty('total_xp');
    });

    it('should include user below in response', async () => {
      const userId = '223e4567-e89b-12d3-a456-426614174001';
      const request = new Request(`http://localhost:3000/api/gamification/leaderboard/position/${userId}`);
      const params = Promise.resolve({ userId });
      
      const response = await getUserPosition(request, { params });
      const data = await response.json();

      expect(data).toHaveProperty('user_below');
      expect(data.user_below).not.toBeNull();
      expect(data.user_below).toHaveProperty('username');
      expect(data.user_below).toHaveProperty('total_xp');
    });

    it('should return 400 for invalid user ID format', async () => {
      const userId = 'invalid-uuid';
      const request = new Request(`http://localhost:3000/api/gamification/leaderboard/position/${userId}`);
      const params = Promise.resolve({ userId });
      
      const response = await getUserPosition(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('should include total users count', async () => {
      const userId = '223e4567-e89b-12d3-a456-426614174001';
      const request = new Request(`http://localhost:3000/api/gamification/leaderboard/position/${userId}`);
      const params = Promise.resolve({ userId });
      
      const response = await getUserPosition(request, { params });
      const data = await response.json();

      expect(data).toHaveProperty('total_users');
      expect(typeof data.total_users).toBe('number');
    });
  });

  describe('Leaderboard Cache', () => {
    it('should invalidate cache on significant XP change', () => {
      // Add some cache entries
      leaderboardCache.set('all-time', 100, []);
      
      // Significant XP change (>100)
      leaderboardCache.invalidateOnXPChange(150);
      
      // Cache should be cleared
      const stats = leaderboardCache.getStats();
      expect(stats.size).toBe(0);
    });

    it('should not invalidate cache on small XP change', () => {
      // Add some cache entries
      leaderboardCache.set('all-time', 100, []);
      
      // Small XP change (<100)
      leaderboardCache.invalidateOnXPChange(50);
      
      // Cache should still have entries
      const stats = leaderboardCache.getStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should support period-specific invalidation', () => {
      // Add cache entries for different periods
      leaderboardCache.set('all-time', 100, []);
      leaderboardCache.set('weekly', 100, []);
      leaderboardCache.set('monthly', 100, []);
      
      // Invalidate only weekly
      leaderboardCache.invalidate('weekly');
      
      // Check that only weekly was cleared
      const allTime = leaderboardCache.get('all-time', 100);
      const weekly = leaderboardCache.get('weekly', 100);
      const monthly = leaderboardCache.get('monthly', 100);
      
      expect(allTime).not.toBeNull();
      expect(weekly).toBeNull();
      expect(monthly).not.toBeNull();
    });

    it('should provide cache statistics', () => {
      leaderboardCache.set('all-time', 100, [{ id: '1', username: 'test' }]);
      
      const stats = leaderboardCache.getStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('oldestEntry');
      expect(stats).toHaveProperty('newestEntry');
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});
