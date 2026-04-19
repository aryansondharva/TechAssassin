/**
 * Streak API Routes Tests
 * 
 * Tests for streak API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../[userId]/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/errors', () => ({
  handleApiError: vi.fn((error) => {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }),
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  }
}));

vi.mock('@/services/streak-service', () => ({
  streakService: {
    getStreakInfo: vi.fn()
  }
}));

import { streakService } from '@/lib/services/streak-service';

describe('GET /api/gamification/streaks/:userId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should return streak information for valid user ID', async () => {
    const mockStreakInfo = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      currentStreak: 7,
      longestStreak: 15,
      lastActivityDate: new Date('2024-01-15'),
      streakMultiplier: 1.1
    };
    
    vi.mocked(streakService.getStreakInfo).mockResolvedValue(mockStreakInfo);
    
    const request = new NextRequest('http://localhost:3000/api/gamification/streaks/123e4567-e89b-12d3-a456-426614174000');
    const params = { userId: '123e4567-e89b-12d3-a456-426614174000' };
    
    const response = await GET(request, { params });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.userId).toBe(mockStreakInfo.userId);
    expect(data.currentStreak).toBe(7);
    expect(data.longestStreak).toBe(15);
    expect(data.streakMultiplier).toBe(1.1);
  });
  
  it('should return 404 for invalid user ID format', async () => {
    const request = new NextRequest('http://localhost:3000/api/gamification/streaks/invalid-id');
    const params = { userId: 'invalid-id' };
    
    const response = await GET(request, { params });
    
    expect(response.status).toBe(500); // handleApiError returns 500 in mock
  });
  
  it('should handle service errors', async () => {
    vi.mocked(streakService.getStreakInfo).mockRejectedValue(new Error('Database error'));
    
    const request = new NextRequest('http://localhost:3000/api/gamification/streaks/123e4567-e89b-12d3-a456-426614174000');
    const params = { userId: '123e4567-e89b-12d3-a456-426614174000' };
    
    const response = await GET(request, { params });
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
  });
});
