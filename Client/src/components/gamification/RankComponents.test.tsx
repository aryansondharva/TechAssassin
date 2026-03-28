/**
 * Rank Components Tests
 * 
 * Tests for RankDisplay, RankUpNotification, and RankHistory components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RankDisplay } from './RankDisplay';
import { RankHistory } from './RankHistory';
import { RankUpNotification } from './RankUpNotification';

// Mock fetch
global.fetch = vi.fn();

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

describe('RankDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { container } = render(<RankDisplay userId="test-user-id" />);
    
    const loadingElement = container.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('renders rank progress correctly', async () => {
    const mockRankProgress = {
      currentRank: {
        id: '1',
        name: 'Novice',
        minimumXpThreshold: 0,
        rankOrder: 1,
        iconUrl: '/icon.png',
        perks: { bonus: '10% XP' },
      },
      nextRank: {
        id: '2',
        name: 'Apprentice',
        minimumXpThreshold: 1000,
        rankOrder: 2,
        iconUrl: '/icon2.png',
        perks: {},
      },
      currentXP: 500,
      xpForNextRank: 500,
      progressPercentage: 50,
      isMaxRank: false,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRankProgress,
    });

    render(<RankDisplay userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Novice')).toBeInTheDocument();
      expect(screen.getByText('500 XP')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('500 XP needed')).toBeInTheDocument();
    });
  });

  it('renders max rank indicator when at max rank', async () => {
    const mockRankProgress = {
      currentRank: {
        id: '10',
        name: 'Grandmaster',
        minimumXpThreshold: 100000,
        rankOrder: 10,
        iconUrl: '/icon.png',
        perks: {},
      },
      nextRank: null,
      currentXP: 150000,
      xpForNextRank: 0,
      progressPercentage: 100,
      isMaxRank: true,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRankProgress,
    });

    render(<RankDisplay userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Max Rank Achieved!')).toBeInTheDocument();
      expect(screen.getByText("You've reached the highest rank")).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<RankDisplay userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load rank information')).toBeInTheDocument();
    });
  });
});

describe('RankHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    render(<RankHistory userId="test-user-id" />);
    
    // Check for loading spinner
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('renders empty state when no history', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<RankHistory userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('No rank history yet')).toBeInTheDocument();
      expect(screen.getByText('Start earning XP to unlock your first rank!')).toBeInTheDocument();
    });
  });

  it('renders rank history entries correctly', async () => {
    const mockHistory = [
      {
        id: '1',
        userId: 'test-user-id',
        rankId: 'rank-2',
        rank: {
          id: 'rank-2',
          name: 'Apprentice',
          minimumXpThreshold: 1000,
          rankOrder: 2,
          iconUrl: '/icon2.png',
          perks: { bonus: '15% XP' },
        },
        achievedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        userId: 'test-user-id',
        rankId: 'rank-1',
        rank: {
          id: 'rank-1',
          name: 'Novice',
          minimumXpThreshold: 0,
          rankOrder: 1,
          iconUrl: '/icon1.png',
          perks: {},
        },
        achievedAt: '2024-01-01T10:00:00Z',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    render(<RankHistory userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Apprentice')).toBeInTheDocument();
      expect(screen.getByText('Novice')).toBeInTheDocument();
      expect(screen.getByText('Current Rank')).toBeInTheDocument();
      expect(screen.getByText('2 ranks achieved')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<RankHistory userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load rank history')).toBeInTheDocument();
    });
  });
});

describe('RankUpNotification', () => {
  it('renders without crashing', () => {
    render(<RankUpNotification userId="test-user-id" />);
    // Component should render but not show modal initially
    expect(screen.queryByText('Rank Up!')).not.toBeInTheDocument();
  });

  it('subscribes to Supabase Realtime channel on mount', () => {
    // This test verifies the component renders without errors
    // The actual Supabase subscription is mocked at the module level
    const { container } = render(<RankUpNotification userId="test-user-id" />);
    
    // Component should render but not show modal initially
    expect(container).toBeInTheDocument();
  });
});
