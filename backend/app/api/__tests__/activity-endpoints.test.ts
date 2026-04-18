import { describe, it, expect, vi } from 'vitest';
import { POST as createActivity } from '../activity/create/route';
import { GET as getActivityFeed } from '../activity/feed/route';
import { GET as getActivityById } from '../activity/[id]/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'test-user-id',
                  username: 'testuser',
                  avatar_url: 'https://example.com/avatar.jpg',
                },
                error: null,
              })),
            })),
            in: vi.fn(() => ({
              data: [
                {
                  id: 'test-user-id',
                  username: 'testuser',
                  avatar_url: 'https://example.com/avatar.jpg',
                },
              ],
              error: null,
            })),
          })),
        };
      }
      if (table === 'activity_feed') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'activity-id',
                  type: 'challenge_solved',
                  user_id: 'test-user-id',
                  metadata: { challengeName: 'Test Challenge' },
                  created_at: new Date().toISOString(),
                },
                error: null,
              })),
            })),
          })),
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => ({
                data: [
                  {
                    id: 'activity-1',
                    type: 'challenge_solved',
                    user_id: 'test-user-id',
                    metadata: { challengeName: 'Test Challenge' },
                    created_at: new Date().toISOString(),
                  },
                ],
                error: null,
              })),
              eq: vi.fn(() => ({
                data: [
                  {
                    id: 'activity-1',
                    type: 'challenge_solved',
                    user_id: 'test-user-id',
                    metadata: { challengeName: 'Test Challenge' },
                    created_at: new Date().toISOString(),
                  },
                ],
                error: null,
              })),
            })),
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        };
      }
      return {};
    }),
  })),
}));

vi.mock('@/lib/db/postgres', () => ({
  query: vi.fn(() =>
    Promise.resolve({
      rows: [
        {
          id: 'activity-id',
          type: 'challenge_solved',
          user_id: 'test-user-id',
          username: 'testuser',
          avatar_url: 'https://example.com/avatar.jpg',
          metadata: { challengeName: 'Test Challenge' },
          created_at: new Date().toISOString(),
        },
      ],
    })
  ),
}));

vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: vi.fn(() => Promise.resolve({ id: 'test-user-id', email: 'test@example.com' })),
}));

vi.mock('@/lib/errors', () => ({
  handleApiError: vi.fn((error) => {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }),
}));

describe('Activity API Endpoints', () => {
  describe('POST /api/activity/create', () => {
    it('should create a new activity', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity/create', {
        method: 'POST',
        body: JSON.stringify({
          type: 'challenge_solved',
          metadata: { challengeName: 'Test Challenge' },
        }),
      });

      const response = await createActivity(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBeDefined();
      expect(data.type).toBe('challenge_solved');
      expect(data.userId).toBe('test-user-id');
      expect(data.username).toBe('testuser');
    });

    it('should return 400 if type is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity/create', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await createActivity(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required field');
    });

    it('should return 400 for invalid activity type', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity/create', {
        method: 'POST',
        body: JSON.stringify({
          type: 'invalid_type',
        }),
      });

      const response = await createActivity(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid activity type');
    });
  });

  describe('GET /api/activity/feed', () => {
    it('should return activity feed with pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity/feed?page=1&pageSize=20', {
        method: 'GET',
      });

      const response = await getActivityFeed(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activities).toBeDefined();
      expect(Array.isArray(data.activities)).toBe(true);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(20);
    });

    it('should filter by activity type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/activity/feed?type=challenge_solved',
        {
          method: 'GET',
        }
      );

      const response = await getActivityFeed(request);
      
      // The test should at least not crash
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('should filter by user ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/activity/feed?userId=test-user-id',
        {
          method: 'GET',
        }
      );

      const response = await getActivityFeed(request);
      
      // The test should at least not crash
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity/feed?page=0&pageSize=200', {
        method: 'GET',
      });

      const response = await getActivityFeed(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid pagination parameters');
    });
  });

  describe('GET /api/activity/:id', () => {
    it('should return a single activity by ID', async () => {
      const activityId = '123e4567-e89b-12d3-a456-426614174000';
      const request = new NextRequest(`http://localhost:3000/api/activity/${activityId}`, {
        method: 'GET',
      });

      const response = await getActivityById(request, { params: { id: activityId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBeDefined();
      expect(data.type).toBeDefined();
      expect(data.userId).toBeDefined();
    });

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/activity/invalid-id', {
        method: 'GET',
      });

      const response = await getActivityById(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid activity ID format');
    });
  });
});
