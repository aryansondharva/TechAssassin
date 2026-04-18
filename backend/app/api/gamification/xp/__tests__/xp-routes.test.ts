/**
 * XP API Routes Tests
 * 
 * Tests for XP API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as awardXP } from '../award/route';
import { GET as getHistory } from '../history/route';
import { GET as getSummary } from '../summary/route';
import { GET as getSources } from '../sources/route';

// Mock dependencies
vi.mock('@/lib/middleware/auth', () => ({
  requireAuthWithClient: vi.fn(),
  requireAdmin: vi.fn()
}));

vi.mock('@/lib/errors', () => ({
  handleApiError: vi.fn((error) => {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  })
}));

vi.mock('@/services/xp-service', () => ({
  XPService: vi.fn().mockImplementation(() => ({
    awardXP: vi.fn(),
    getXPHistory: vi.fn(),
    getXPSummary: vi.fn()
  }))
}));

vi.mock('@/lib/supabase', () => ({
  getServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }))
}));

describe('XP API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/gamification/xp/award', () => {
    it('should require authentication', async () => {
      const { requireAuthWithClient } = await import('@/lib/middleware/auth');
      (requireAuthWithClient as any).mockRejectedValue(new Error('Authentication required'));

      const request = new Request('http://localhost/api/gamification/xp/award', {
        method: 'POST',
        body: JSON.stringify({
          userId: '123e4567-e89b-12d3-a456-426614174000',
          amount: 100,
          source: 'event_participation',
          activityType: 'registration',
          description: 'Test XP award'
        })
      });

      const response = await awardXP(request);
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/gamification/xp/history', () => {
    it('should require authentication', async () => {
      const { requireAuthWithClient } = await import('@/lib/middleware/auth');
      (requireAuthWithClient as any).mockRejectedValue(new Error('Authentication required'));

      const request = new Request('http://localhost/api/gamification/xp/history?page=1&pageSize=20');
      const response = await getHistory(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/gamification/xp/summary', () => {
    it('should require authentication', async () => {
      const { requireAuthWithClient } = await import('@/lib/middleware/auth');
      (requireAuthWithClient as any).mockRejectedValue(new Error('Authentication required'));

      const request = new Request('http://localhost/api/gamification/xp/summary');
      const response = await getSummary(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/gamification/xp/sources', () => {
    it('should return all XP source configurations without authentication', async () => {
      const request = new Request('http://localhost/api/gamification/xp/sources');
      const response = await getSources(request);
      
      expect(response.status).toBe(200);
    });
  });
});
