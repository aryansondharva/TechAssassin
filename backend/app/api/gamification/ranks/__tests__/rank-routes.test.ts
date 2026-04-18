/**
 * Rank API Routes Tests
 * 
 * Tests for Rank API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getRanks } from '../route';
import { GET as getUserRank } from '../user/[userId]/route';
import { GET as getRankHistory } from '../history/[userId]/route';

// Mock dependencies
vi.mock('@/lib/errors', () => ({
  handleApiError: vi.fn((error) => {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }),
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404;
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  }
}));

vi.mock('@/services/rank-service', () => ({
  RankService: vi.fn().mockImplementation(() => ({
    getAllRankTiers: vi.fn().mockResolvedValue([]),
    getRankProgress: vi.fn().mockResolvedValue({
      currentRank: null,
      nextRank: null,
      currentXP: 0,
      xpForNextRank: 0,
      progressPercentage: 0,
      isMaxRank: false
    }),
    getUserRankHistory: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'Not found' }
          }))
        }))
      }))
    }))
  }))
}));

describe('Rank API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/gamification/ranks', () => {
    it('should return all rank tiers without authentication', async () => {
      const request = new Request('http://localhost/api/gamification/ranks');
      const response = await getRanks();
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/gamification/ranks/user/:userId', () => {
    it('should return user rank progress for valid UUID', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const request = new Request(`http://localhost/api/gamification/ranks/user/${userId}`);
      const response = await getUserRank(request, { params: { userId } });
      
      expect(response.status).toBe(200);
    });

    it('should reject invalid UUID format', async () => {
      const request = new Request('http://localhost/api/gamification/ranks/user/invalid-uuid');
      const response = await getUserRank(request, {
        params: { userId: 'invalid-uuid' }
      });
      
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/gamification/ranks/history/:userId', () => {
    it('should return user rank history for valid UUID', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const request = new Request(`http://localhost/api/gamification/ranks/history/${userId}`);
      const response = await getRankHistory(request, { params: { userId } });
      
      expect(response.status).toBe(200);
    });

    it('should reject invalid UUID format', async () => {
      const request = new Request('http://localhost/api/gamification/ranks/history/invalid-uuid');
      const response = await getRankHistory(request, {
        params: { userId: 'invalid-uuid' }
      });
      
      expect(response.status).toBe(500);
    });
  });
});
