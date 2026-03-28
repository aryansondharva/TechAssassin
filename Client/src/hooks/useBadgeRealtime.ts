/**
 * useBadgeRealtime Hook
 * 
 * React hook for subscribing to real-time badge unlock notifications via Supabase Realtime.
 * 
 * Requirements:
 * - 9.1: Badge unlock notification sending
 * - 9.2: Notification includes badge metadata
 * - 9.3: Real-time push notification delivery
 * - 9.4: Modal/toast notification display
 * 
 * Channel: gamification:badges:{userId}
 * Event: badge_unlocked
 * Payload: { badge, userBadge }
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export type BadgeCategory = 'coding' | 'community' | 'events' | 'streaks' | 'mentorship' | 'special';
export type RarityLevel = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarityLevel: RarityLevel;
  iconUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: Date;
  manualAward: boolean;
}

export interface BadgeUnlockedPayload {
  badge: Badge;
  userBadge: UserBadge;
}

export interface BadgeRealtimeCallbacks {
  onBadgeUnlocked?: (payload: BadgeUnlockedPayload) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseBadgeRealtimeReturn {
  isConnected: boolean;
  error: Error | null;
  lastBadgeUnlocked: BadgeUnlockedPayload | null;
  unlockedBadges: BadgeUnlockedPayload[];
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Subscribe to real-time badge unlock notifications for a specific user
 * 
 * @param userId - User ID to subscribe to
 * @param callbacks - Callback functions for badge events
 * @returns Connection state and badge unlock history
 */
export function useBadgeRealtime(
  userId: string | null | undefined,
  callbacks?: BadgeRealtimeCallbacks
): UseBadgeRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastBadgeUnlocked, setLastBadgeUnlocked] = useState<BadgeUnlockedPayload | null>(null);
  const [unlockedBadges, setUnlockedBadges] = useState<BadgeUnlockedPayload[]>([]);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    // Don't subscribe if no userId
    if (!userId) {
      setIsConnected(false);
      return;
    }

    const supabase = supabaseRef.current;
    const channelName = `gamification:badges:${userId}`;

    try {
      // Create and subscribe to badge channel
      const channel = supabase
        .channel(channelName)
        .on('broadcast', { event: 'badge_unlocked' }, (payload) => {
          try {
            const badgePayload = payload.payload as BadgeUnlockedPayload;
            
            // Update local state
            setLastBadgeUnlocked(badgePayload);
            setUnlockedBadges(prev => [...prev, badgePayload]);
            
            // Trigger callback (which should show modal/toast)
            callbacks?.onBadgeUnlocked?.(badgePayload);
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to process badge unlock');
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
      const error = err instanceof Error ? err : new Error('Failed to setup badge subscription');
      setError(error);
      callbacks?.onError?.(error);
    }
  }, [userId, callbacks]);

  return {
    isConnected,
    error,
    lastBadgeUnlocked,
    unlockedBadges
  };
}
