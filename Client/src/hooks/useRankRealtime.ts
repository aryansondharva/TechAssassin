/**
 * useRankRealtime Hook
 * 
 * React hook for subscribing to real-time rank change notifications via Supabase Realtime.
 * 
 * Requirements:
 * - 6.4: Rank-up notification triggering
 * 
 * Channel: gamification:ranks:{userId}
 * Event: rank_up
 * Payload: { previousRank, newRank, progress }
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface RankTier {
  id: string;
  name: string;
  minimumXpThreshold: number;
  rankOrder: number;
  iconUrl: string;
  perks: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RankProgress {
  currentRank: RankTier | null;
  nextRank: RankTier | null;
  currentXP: number;
  xpForNextRank: number;
  progressPercentage: number;
  isMaxRank: boolean;
}

export interface RankUpPayload {
  previousRank: RankTier | null;
  newRank: RankTier;
  progress: RankProgress;
}

export interface RankRealtimeCallbacks {
  onRankUp?: (payload: RankUpPayload) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseRankRealtimeReturn {
  isConnected: boolean;
  error: Error | null;
  lastRankUp: RankUpPayload | null;
  currentRank: RankTier | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Subscribe to real-time rank change notifications for a specific user
 * 
 * @param userId - User ID to subscribe to
 * @param callbacks - Callback functions for rank events
 * @returns Connection state and latest rank data
 */
export function useRankRealtime(
  userId: string | null | undefined,
  callbacks?: RankRealtimeCallbacks
): UseRankRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRankUp, setLastRankUp] = useState<RankUpPayload | null>(null);
  const [currentRank, setCurrentRank] = useState<RankTier | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    // Don't subscribe if no userId
    if (!userId) {
      setIsConnected(false);
      return;
    }

    const supabase = supabaseRef.current;
    const channelName = `gamification:ranks:${userId}`;

    try {
      // Create and subscribe to rank channel
      const channel = supabase
        .channel(channelName)
        .on('broadcast', { event: 'rank_up' }, (payload) => {
          try {
            const rankPayload = payload.payload as RankUpPayload;
            
            // Update local state
            setLastRankUp(rankPayload);
            setCurrentRank(rankPayload.newRank);
            
            // Trigger callback (which should show rank-up notification)
            callbacks?.onRankUp?.(rankPayload);
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to process rank update');
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
      const error = err instanceof Error ? err : new Error('Failed to setup rank subscription');
      setError(error);
      callbacks?.onError?.(error);
    }
  }, [userId, callbacks]);

  return {
    isConnected,
    error,
    lastRankUp,
    currentRank
  };
}
