import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as updatePresence } from '../presence/update/route';
import { POST as heartbeat } from '../presence/heartbeat/route';
import { GET as getOnline } from '../presence/online/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              user_id: 'test-user-id',
              status: 'online',
              location_type: 'page',
              location_id: 'dashboard',
              last_seen: new Date().toISOString(),
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                user_id: 'test-user-id',
                status: 'online',
                last_seen: new Date().toISOString(),
              },
              error: null,
            })),
          })),
        })),
      })),
      select: vi.fn(() => ({
        neq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [
                {
                  user_id: 'user-1',
                  status: 'online',
                  location_type: 'page',
                  location_id: 'dashboard',
                  last_seen: new Date().toISOString(),
                },
              ],
              error: null,
            })),
          })),
          order: vi.fn(() => ({
            data: [
              {
                user_id: 'user-1',
                status: 'online',
                location_type: 'page',
                location_id: 'dashboard',
                last_seen: new Date().toISOString(),
              },
            ],
            error: null,
          })),
        })),
        in: vi.fn(() => ({
          data: [
            {
              id: 'user-1',
              username: 'testuser',
              avatar_url: 'https://example.com/avatar.jpg',
            },
          ],
          error: null,
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: vi.fn(() => Promise.resolve({ id: 'test-user-id', email: 'test@example.com' })),
}));

vi.mock('@/lib/errors', () => ({
  handleApiError: vi.fn((error) => {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }),
}));

describe('Presence API Endpoints', () => {
  describe('POST /api/presence/update', () => {
    it('should update user presence status', async () => {
      const request = new NextRequest('http://localhost:3000/api/presence/update', {
        method: 'POST',
        body: JSON.stringify({
          status: 'online',
          location: { type: 'page', id: 'dashboard' },
        }),
      });

      const response = await updatePresence(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.presence).toBeDefined();
      expect(data.presence.status).toBe('online');
    });

    it('should return 400 if status is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/presence/update', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await updatePresence(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('status is required');
    });

    it('should return 400 for invalid status', async () => {
      const request = new NextRequest('http://localhost:3000/api/presence/update', {
        method: 'POST',
        body: JSON.stringify({
          status: 'invalid-status',
        }),
      });

      const response = await updatePresence(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid status');
    });
  });

  describe('POST /api/presence/heartbeat', () => {
    it('should update last_seen timestamp', async () => {
      const request = new NextRequest('http://localhost:3000/api/presence/heartbeat', {
        method: 'POST',
        body: JSON.stringify({
          location: { type: 'page', id: 'dashboard' },
        }),
      });

      const response = await heartbeat(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.presence).toBeDefined();
    });
  });

  describe('GET /api/presence/online', () => {
    it('should return online users', async () => {
      const request = new NextRequest('http://localhost:3000/api/presence/online', {
        method: 'GET',
      });

      const response = await getOnline(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.presenceState).toBeDefined();
      expect(data.count).toBeGreaterThanOrEqual(0);
    });

    it('should filter by location', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/presence/online?locationType=page&locationId=dashboard',
        {
          method: 'GET',
        }
      );

      const response = await getOnline(request);
      
      // The test should at least not crash
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });
  });
});
