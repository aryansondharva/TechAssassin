/**
 * StreakDisplay Component Tests
 * 
 * Tests for StreakDisplay component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StreakDisplay } from './StreakDisplay';

// Mock fetch
global.fetch = vi.fn();

describe('StreakDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { container } = render(<StreakDisplay userId="test-user-id" />);
    
    const loadingElement = container.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('renders streak information correctly with active streak', async () => {
    const mockStreakInfo = {
      userId: 'test-user-id',
      currentStreak: 15,
      longestStreak: 30,
      lastActivityDate: '2024-01-15',
      streakMultiplier: 1.2,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStreakInfo,
    });

    render(<StreakDisplay userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('days')).toBeInTheDocument();
      expect(screen.getByText('30 days')).toBeInTheDocument();
      expect(screen.getByText('1.2x XP')).toBeInTheDocument();
      expect(screen.getByText('Streak Bonus Active!')).toBeInTheDocument();
    });
  });

  it('renders streak information correctly with no active streak', async () => {
    const mockStreakInfo = {
      userId: 'test-user-id',
      currentStreak: 0,
      longestStreak: 10,
      lastActivityDate: null,
      streakMultiplier: 1.0,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStreakInfo,
    });

    render(<StreakDisplay userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('10 days')).toBeInTheDocument();
      expect(screen.getByText('Start your streak today! Stay active for 7+ days to earn XP multipliers.')).toBeInTheDocument();
    });
  });

  it('displays correct multiplier badge for 7+ day streak', async () => {
    const mockStreakInfo = {
      userId: 'test-user-id',
      currentStreak: 7,
      longestStreak: 7,
      lastActivityDate: '2024-01-15',
      streakMultiplier: 1.1,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStreakInfo,
    });

    render(<StreakDisplay userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('1.1x XP')).toBeInTheDocument();
      expect(screen.getByText("You're earning 10% bonus XP on all activities")).toBeInTheDocument();
    });
  });

  it('displays singular "day" for streak of 1', async () => {
    const mockStreakInfo = {
      userId: 'test-user-id',
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: '2024-01-15',
      streakMultiplier: 1.0,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStreakInfo,
    });

    render(<StreakDisplay userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('day')).toBeInTheDocument();
      expect(screen.getByText('1 day')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<StreakDisplay userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load streak information')).toBeInTheDocument();
    });
  });

  it('handles API error response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(<StreakDisplay userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load streak information')).toBeInTheDocument();
    });
  });

  it('applies custom className prop', () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { container } = render(<StreakDisplay userId="test-user-id" className="custom-class" />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });
});
