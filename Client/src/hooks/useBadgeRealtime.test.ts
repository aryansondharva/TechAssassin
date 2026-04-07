/**
 * Unit tests for useBadgeRealtime hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBadgeRealtime } from './useBadgeRealtime';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        callback('SUBSCRIBED');
        return {};
      })
    })),
    removeChannel: vi.fn()
  }))
}));

describe('useBadgeRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useBadgeRealtime(null));
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastBadgeUnlocked).toBeNull();
    expect(result.current.unlockedBadges).toEqual([]);
  });

  it('should connect when userId is provided', async () => {
    const { result } = renderHook(() => useBadgeRealtime('user-123'));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should not connect when userId is null', () => {
    const { result } = renderHook(() => useBadgeRealtime(null));
    
    expect(result.current.isConnected).toBe(false);
  });

  it('should call onBadgeUnlocked callback when badge is unlocked', async () => {
    const onBadgeUnlocked = vi.fn();
    const { result } = renderHook(() => 
      useBadgeRealtime('user-123', { onBadgeUnlocked })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(onBadgeUnlocked).not.toHaveBeenCalled();
  });

  it('should accumulate unlocked badges in state', () => {
    const { result } = renderHook(() => useBadgeRealtime('user-123'));
    
    expect(result.current.unlockedBadges).toEqual([]);
  });

  it('should handle connection errors gracefully', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => 
      useBadgeRealtime('user-123', { onError })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should cleanup subscription on unmount', () => {
    const { unmount } = renderHook(() => useBadgeRealtime('user-123'));
    
    unmount();
  });

  it('should resubscribe when userId changes', async () => {
    const { result, rerender } = renderHook(
      ({ userId }) => useBadgeRealtime(userId),
      { initialProps: { userId: 'user-123' } }
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    rerender({ userId: 'user-456' });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });
});
