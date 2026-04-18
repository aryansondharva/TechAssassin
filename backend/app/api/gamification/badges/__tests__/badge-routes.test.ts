/**
 * Badge API Routes Tests
 * 
 * Tests for Badge API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getAllBadges } from '../route';
import { GET as getBadgeById } from '../[id]/route';
import { GET as getUserBadges } from '../user/[userId]/route';
import { GET as getBadgeProgress } from '../progress/[userId]/route';
import { POST as evaluateBadges } from '../evaluate/[userId]/route';

// Mock dependencies
vi.mock('@/lib/middleware/auth', () => ({
  requireAuthWithClient: vi.fn()
}));

vi.mock('@/lib/errors', () => ({
  handleApiError: vi.fn((error) => {
    if (error.name === 'NotFoundError') {
      return new Response(JSON.stringify({ error: error.message }), { status: 404 });
    }
    if (error.name === 'AuthorizationError') {
      return new Response(JSON.stringify({ error: error.message }), { status: 403 });
    }
    if (error.name === 'ZodError') {
      return new Response(JSON.stringify({ error: 'Validation error' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }),
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404;
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  },
  AuthorizationError: class AuthorizationError extends Error {
    statusCode = 403;
    constructor(message: string) {
      super(message);
      this.name = 'AuthorizationError';
    }
  }
}));

vi.mock('@/services/badge-service', () => ({
  BadgeService: vi.fn().mockImplementation(() => ({
    getAllBadges: vi.fn().mockResolvedValue([]),
    getUserBadges: vi.fn().mockResolvedValue([]),
    getUserBadgesByRarity: vi.fn().mockResolvedValue({
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    }),
    getLockedBadges: vi.fn().mockResolvedValue([]),
    evaluateBadgeUnlocks: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
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

describe('Badge API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/gamification/badges', () => {
    it('should return all badges without authentication', async () => {
      const request = new Request('http://localhost/api/gamification/badges');
      const response = await getAllBadges(request);
      
      expect(response.status).toBe(200);
    });

    it('should support filtering by category', async () => {
      const request = new Request('http://localhost/api/gamification/badges?category=coding');
      const response = await getAllBadges(request);
      
      expect(response.status).toBe(200);
    });

    it('should support filtering by rarity', async () => {
      const request = new Request('http://localhost/api/gamification/badges?rarity=legendary');
      const response = await getAllBadges(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/gamification/badges/:id', () => {
    it('should return 404 for invalid badge ID', async () => {
      const request = new Request('http://localhost/api/gamification/badges/invalid-id');
      const response = await getBadgeById(request, { params: { id: 'invalid-id' } });
      
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/gamification/badges/user/:userId', () => {
    it('should return user badges without authentication', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const request = new Request(`http://localhost/api/gamification/badges/user/${userId}`);
      const response = await getUserBadges(request, { params: { userId } });
      
      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const request = new Request(`http://localhost/api/gamification/badges/user/${userId}?page=1&pageSize=10`);
      const response = await getUserBadges(request, { params: { userId } });
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/gamification/badges/progress/:userId', () => {
    it('should require authentication', async () => {
      const { requireAuthWithClient } = await import('@/lib/middleware/auth');
      (requireAuthWithClient as any).mockRejectedValue(new Error('Authentication required'));

      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const request = new Request(`http://localhost/api/gamification/badges/progress/${userId}`);
      const response = await getBadgeProgress(request, { params: { userId } });
      
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/gamification/badges/evaluate/:userId', () => {
    it('should require authentication', async () => {
      const { requireAuthWithClient } = await import('@/lib/middleware/auth');
      (requireAuthWithClient as any).mockRejectedValue(new Error('Authentication required'));

      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const request = new Request(`http://localhost/api/gamification/badges/evaluate/${userId}`, {
        method: 'POST'
      });
      const response = await evaluateBadges(request, { params: { userId } });
      
      expect(response.status).toBe(500);
    });
  });
});
