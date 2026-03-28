/**
 * Leaderboard Components Tests
 * 
 * Tests for Leaderboard and UserPosition components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Leaderboard } from './Leaderboard';
import { UserPosition } from './UserPosition';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { container } = render(<Leaderboard />);
    
    const loadingElement = container.querySelector('.animate-spin');
    expect(loadingElement).toBeTruthy();
    expect(screen.getByText(/Loading leaderboard/i)).toBeDefined();
  });

  it('fetches and displays leaderboard data', async () => {
    const mockLeaderboard = [
      {
        id: 'user-1',
        username: 'TopPlayer',
        avatar_url: null,
        total_xp: 10000,
        rank: 1,
        current_rank: { name: 'Master', icon_url: '/icon.png' },
      },
      {
        id: 'user-2',
        username: 'SecondPlace',
        avatar_url: null,
        total_xp: 8000,
        rank: 2,
        current_rank: { name: 'Expert', icon_url: '/icon.png' },
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        period: 'all-time',
        limit: 100,
        count: 2,
        leaderboard: mockLeaderboard,
      }),
    });

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('TopPlayer')).toBeDefined();
      expect(screen.getByText('SecondPlace')).toBeDefined();
      expect(screen.getByText('10,000')).toBeDefined();
      expect(screen.getByText('8,000')).toBeDefined();
    });
  });

  it('handles error state', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load leaderboard/i)).toBeDefined();
    });
  });

  it('displays period filter tabs', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        period: 'all-time',
        limit: 100,
        count: 0,
        leaderboard: [],
      }),
    });

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('All Time')).toBeDefined();
      expect(screen.getByText('This Month')).toBeDefined();
      expect(screen.getByText('This Week')).toBeDefined();
    });
  });
});

describe('UserPosition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { container } = render(<UserPosition userId="test-user-id" />);
    
    const loadingElement = container.querySelector('.animate-spin');
    expect(loadingElement).toBeTruthy();
    expect(screen.getByText(/Loading your position/i)).toBeDefined();
  });

  it('fetches and displays user position with context', async () => {
    const mockPositionData = {
      user: {
        id: 'user-2',
        username: 'CurrentUser',
        avatar_url: null,
        total_xp: 5000,
        rank: 2,
        current_rank: { name: 'Expert', icon_url: '/icon.png' },
      },
      user_above: {
        id: 'user-1',
        username: 'TopPlayer',
        avatar_url: null,
        total_xp: 6000,
        rank: 1,
        current_rank: { name: 'Master', icon_url: '/icon.png' },
      },
      user_below: {
        id: 'user-3',
        username: 'ThirdPlace',
        avatar_url: null,
        total_xp: 4000,
        rank: 3,
        current_rank: { name: 'Advanced', icon_url: '/icon.png' },
      },
      total_users: 100,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPositionData,
    });

    render(<UserPosition userId="user-2" />);

    await waitFor(() => {
      expect(screen.getByText('CurrentUser')).toBeDefined();
      expect(screen.getByText('TopPlayer')).toBeDefined();
      expect(screen.getByText('ThirdPlace')).toBeDefined();
      expect(screen.getByText(/Ranked #2 out of 100 users/i)).toBeDefined();
    });
  });

  it('handles user not found error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(<UserPosition userId="non-existent-user" />);

    await waitFor(() => {
      expect(screen.getByText(/User not found in leaderboard/i)).toBeDefined();
    });
  });

  it('highlights current user row', async () => {
    const mockPositionData = {
      user: {
        id: 'user-1',
        username: 'CurrentUser',
        avatar_url: null,
        total_xp: 5000,
        rank: 1,
        current_rank: null,
      },
      user_above: null,
      user_below: {
        id: 'user-2',
        username: 'SecondPlace',
        avatar_url: null,
        total_xp: 4000,
        rank: 2,
        current_rank: null,
      },
      total_users: 50,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPositionData,
    });

    render(<UserPosition userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('(You)')).toBeDefined();
    });
  });
});
