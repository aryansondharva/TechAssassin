/**
 * Gamification Realtime Hooks
 * 
 * Central export file for all gamification realtime hooks.
 * 
 * These hooks provide real-time subscriptions to gamification events:
 * - XP gains and updates
 * - Badge unlocks
 * - Rank changes
 * - Leaderboard position updates
 */

export { useXPRealtime } from './useXPRealtime';
export type {
  XPSource,
  XPTransaction,
  XPGainedPayload,
  XPRealtimeCallbacks,
  UseXPRealtimeReturn
} from './useXPRealtime';

export { useBadgeRealtime } from './useBadgeRealtime';
export type {
  BadgeCategory,
  RarityLevel,
  Badge,
  UserBadge,
  BadgeUnlockedPayload,
  BadgeRealtimeCallbacks,
  UseBadgeRealtimeReturn
} from './useBadgeRealtime';

export { useRankRealtime } from './useRankRealtime';
export type {
  RankTier,
  RankProgress,
  RankUpPayload,
  RankRealtimeCallbacks,
  UseRankRealtimeReturn
} from './useRankRealtime';

export { useLeaderboardRealtime } from './useLeaderboardRealtime';
export type {
  LeaderboardUpdatePayload,
  LeaderboardRealtimeCallbacks,
  UseLeaderboardRealtimeReturn
} from './useLeaderboardRealtime';
