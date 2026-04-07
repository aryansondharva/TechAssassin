/**
 * Leaderboard Component
 * 
 * Displays top 100 users by total XP with rank, username, avatar, total XP, and current rank.
 * Supports filtering by period (all-time, monthly, weekly).
 * Subscribes to Supabase Realtime for live updates.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.6
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, Loader2, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RankTier {
  name: string;
  icon_url: string;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  total_xp: number;
  rank: number;
  current_rank: RankTier | null;
}

interface LeaderboardProps {
  className?: string;
  defaultPeriod?: 'all-time' | 'monthly' | 'weekly';
  limit?: number;
}

type Period = 'all-time' | 'monthly' | 'weekly';

const PERIOD_LABELS: Record<Period, string> = {
  'all-time': 'All Time',
  'monthly': 'This Month',
  'weekly': 'This Week',
};

export const Leaderboard = ({
  className = '',
  defaultPeriod = 'all-time',
  limit = 100,
}: LeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient();

  // Fetch leaderboard data
  const fetchLeaderboard = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(
        `/api/gamification/leaderboard?period=${period}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch on mount and when period changes
  useEffect(() => {
    fetchLeaderboard();
  }, [period, limit]);

  // Subscribe to Supabase Realtime for live leaderboard updates (Requirement 10.3)
  useEffect(() => {
    const channel = supabase
      .channel('gamification:leaderboard')
      .on('broadcast', { event: 'leaderboard_update' }, (payload) => {
        const { userId, newRank, totalXP } = payload.payload as {
          userId: string;
          newRank: number;
          totalXP: number;
        };

        // Update leaderboard entry if user is in current view
        setLeaderboard((prev) => {
          const existingIndex = prev.findIndex((entry) => entry.id === userId);
          
          if (existingIndex !== -1) {
            // User exists in leaderboard, update their data
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              total_xp: totalXP,
            };
            
            // Re-sort and recalculate ranks
            updated.sort((a, b) => b.total_xp - a.total_xp);
            return updated.map((entry, index) => ({
              ...entry,
              rank: index + 1,
            }));
          }
          
          // User not in current view, just refresh
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Get rank icon based on position
  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="w-6 h-6 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="w-6 h-6 text-gray-400" />;
    } else if (rank === 3) {
      return <Medal className="w-6 h-6 text-orange-600" />;
    }
    return <Award className="w-5 h-5 text-white/40" />;
  };

  // Get rank styling based on position
  const getRankStyle = (rank: number) => {
    if (rank === 1) {
      return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
    } else if (rank === 2) {
      return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
    } else if (rank === 3) {
      return 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/30';
    }
    return 'bg-white/5 border-white/10';
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-white/60">Loading leaderboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-md overflow-hidden">
        {/* Header with period filter */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-purple-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
                <p className="text-sm text-white/60">Top {limit} users</p>
              </div>
            </div>

            <button
              onClick={() => fetchLeaderboard(true)}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
              title="Refresh leaderboard"
            >
              <RefreshCw className={`w-5 h-5 text-white/60 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Period filter tabs (Requirement 10.5) */}
          <div className="flex gap-2">
            {(['all-time', 'monthly', 'weekly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    period === p
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }
                `}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard entries */}
        <div className="divide-y divide-white/10">
          <AnimatePresence mode="popLayout">
            {leaderboard.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center text-white/60"
              >
                No leaderboard data available
              </motion.div>
            ) : (
              leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.02 }}
                  className={`
                    p-4 border transition-all hover:bg-white/5
                    ${getRankStyle(entry.rank)}
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank number and icon */}
                    <div className="flex items-center justify-center w-12">
                      {entry.rank <= 3 ? (
                        getRankIcon(entry.rank)
                      ) : (
                        <span className="text-lg font-bold text-white/40">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* User avatar */}
                    <div className="relative">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.username}
                          className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {entry.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-white truncate">
                        {entry.username}
                      </p>
                      {entry.current_rank && (
                        <div className="flex items-center gap-2 mt-1">
                          {entry.current_rank.icon_url && (
                            <img
                              src={entry.current_rank.icon_url}
                              alt={entry.current_rank.name}
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          <span className="text-xs text-white/60">
                            {entry.current_rank.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* XP display */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-white font-mono">
                        {entry.total_xp.toLocaleString()}
                      </p>
                      <p className="text-xs text-white/40">XP</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
