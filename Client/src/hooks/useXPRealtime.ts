/**
 * useXPRealtime Hook
 * 
 * React hook for subscribing to real-time XP updates via Supabase Realtime.
 * 
 * Requirements:
 * - 8.1: Real-time XP update broadcasting
 * - 8.2: Profile page XP subscription and refresh
 * - 8.3: WebSocket/Server-Sent Events for real-time updates
 * - 8.4: Visual notification for XP gains
 * 
 * Channel: gamification:xp:{userId}
 * Event: xp_gained
 * Payload: { amount, source, newTotal, transaction }
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export type XPSource = 
  | 'event_participation'
  | 'code_contribution'
  | 'community_engagement'
  | 'challenge_completion'
  | 'helping_others'
  | 'profile_completion';

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  source: XPSource;
  activityType: string;
  referenceId?: string;
  description: string;
  manualAdjustment: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface XPGainedPayload {
  amount: number;
  source: XPSource;
  newTotal: number;
  transaction: XPTransaction;
}

export interface XPRealtimeCallbacks {
  onXPGained?: (payload: XPGainedPayload) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseXPRealtimeReturn {
  isConnected: boolean;
  error: Error | null;
  totalXP: number | null;
  lastUpdate: XPGainedPayload | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Subscribe to real-time XP updates for a specific user
 * 
 * @param userId - User ID to subscribe to
 * @param callbacks - Callback functions for XP events
 * @returns Connection state and latest XP data
 */
export function useXPRealtime(
  userId: string | null | undefined,
  callbacks?: XPRealtimeCallbacks
): UseXPRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalXP, setTotalXP] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<XPGainedPayload | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    // Don't subscribe if no userId
    if (!userId) {
      setIsConnected(false);
      return;
    }

    const supabase = supabaseRef.current;
    const channelName = `gamification:xp:${userId}`;

    try {
      // Create and subscribe to XP channel
      const channel = supabase
        .channel(channelName)
        .on('broadcast', { event: 'xp_gained' }, (payload) => {
          try {
            const xpPayload = payload.payload as XPGainedPayload;
            
            // Update local state
            setTotalXP(xpPayload.newTotal);
            setLastUpdate(xpPayload);
            
            // Trigger callback
            callbacks?.onXPGained?.(xpPayload);
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to process XP update');
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
      const error = err instanceof Error ? err : new Error('Failed to setup XP subscription');
      setError(error);
      callbacks?.onError?.(error);
    }
  }, [userId, callbacks]);

  return {
    isConnected,
    error,
    totalXP,
    lastUpdate
  };
}
