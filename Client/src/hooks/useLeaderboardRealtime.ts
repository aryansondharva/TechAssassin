/**
 * useLeaderboardRealtime Hook
 * 
 * React hook for subscribing to real-time leaderboard updates via Supabase Realtime.
 * 
 * Requirements:
 * - 10.3: Leaderboard updates within 5 seconds of XP changes
 * 
 * Channel: gamification:leaderboard (global channel)
 * Event: leaderboard_update
 * Payload: { userId, newRank, totalXP }
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface LeaderboardUpdatePayload {
  userId: string;
  newRank: number;
  totalXP: number;
  username?: string;
  avatarUrl?: string;
  rankName?: string;
}

export interface LeaderboardRealtimeCallbacks {
  onLeaderboardUpdate?: (payload: LeaderboardUpdatePayload) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseLeaderboardRealtimeReturn {
  isConnected: boolean;
  error: Error | null;
  lastUpdate: LeaderboardUpdatePayload | null;
  updates: LeaderboardUpdatePayload[];
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Subscribe to real-time leaderboard updates (global channel)
 * 
 * Note: This is a global channel, not user-specific. All users subscribe to the same channel
 * to receive leaderboard position changes in real-time.
 * 
 * @param callbacks - Callback functions for leaderboard events
 * @returns Connection state and update history
 */
export function useLeaderboardRealtime(
  callbacks?: LeaderboardRealtimeCallbacks
): UseLeaderboardRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<LeaderboardUpdatePayload | null>(null);
  const [updates, setUpdates] = useState<LeaderboardUpdatePayload[]>([]);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channelName = 'gamification:leaderboard';

    try {
      // Create and subscribe to global leaderboard channel
      const channel = supabase
        .channel(channelName)
        .on('broadcast', { event: 'leaderboard_update' }, (payload) => {
          try {
            const leaderboardPayload = payload.payload as LeaderboardUpdatePayload;
            
            // Update local state
            setLastUpdate(leaderboardPayload);
            setUpdates(prev => {
              // Keep only last 50 updates to prevent memory issues
              const newUpdates = [...prev, leaderboardPayload];
              return newUpdates.slice(-50);
            });
            
            // Trigger callback
            callbacks?.onLeaderboardUpdate?.(leaderboardPayload);
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to process leaderboard update');
            setError(error);
            callbacks?.onError?.(error);
          }
        })
        .subscribe((status) => {
          const connected = status === 'SUBSCRIBED';
          setIsConnected(connected);
          callbacks?.onConnectionChange?.(connected);
          
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            const error = new Error(`Channel subscription failed: ${status}`);
            setError(error);
            callbacks?.onError?.(error);
          }
        });

      channelRef.current = channel;

      // Cleanup function
      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        setIsConnected(false);
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to setup leaderboard subscription');
      setError(error);
      callbacks?.onError?.(error);
    }
  }, [callbacks]);

  return {
    isConnected,
    error,
    lastUpdate,
    updates
  };
}
