import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from 'lucide-react';
import { getLeaderboardService } from '@/lib/services/leaderboard-service';
import type { LeaderboardEntry } from '@/lib/services/leaderboard-service';

interface LiveLeaderboardProps {
  eventId: string;
  currentUserId?: string;
  liveMode?: boolean;
  maxDisplay?: number;
  className?: string;
}

const rankIcons = {
  1: Crown,
  2: Medal,
  3: Award,
};

const rankColors = {
  1: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  2: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  3: 'text-amber-700 bg-amber-700/10 border-amber-700/20',
};

export const LiveLeaderboard = ({
  eventId,
  currentUserId,
  liveMode = false,
  maxDisplay = 10,
  className = '',
}: LiveLeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingRanks, setAnimatingRanks] = useState<Set<string>>(new Set());
  
  const leaderboardService = getLeaderboardService();

  useEffect(() => {
    // Set current user ID
    if (currentUserId) {
      leaderboardService.setCurrentUserId(currentUserId);
    }

    // Enable/disable live mode
    if (liveMode) {
      leaderboardService.enableLiveMode(eventId);
    } else {
      leaderboardService.disableLiveMode();
    }

    // Load initial leaderboard
    loadLeaderboard();

    // Subscribe to real-time updates
    const subscription = leaderboardService.subscribeToLeaderboard(eventId, (update) => {
      handleLeaderboardUpdate(update);
    });

    return () => {
      subscription.unsubscribe();
      leaderboardService.disableLiveMode();
    };
  }, [eventId, currentUserId, liveMode]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await leaderboardService.getLeaderboard(eventId, {
        page: 1,
        pageSize: maxDisplay,
      });
      setEntries(data.entries);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaderboardUpdate = (update: any) => {
    // Reload leaderboard to get updated ranks
    loadLeaderboard();
    
    // Animate the updated user's rank
    setAnimatingRanks((prev) => new Set(prev).add(update.userId));
    setTimeout(() => {
      setAnimatingRanks((prev) => {
        const next = new Set(prev);
        next.delete(update.userId);
        return next;
      });
    }, 300);
  };

  const getRankChangeIcon = (rankChange: 'up' | 'down' | 'same' | null) => {
    if (!rankChange || rankChange === 'same') return <Minus className="w-4 h-4" />;
    if (rankChange === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md ${className}`}>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                Live Leaderboard
              </h3>
              <p className="text-xs text-white/40 font-mono">
                {liveMode ? 'Real-time updates enabled' : 'Standard mode'}
              </p>
            </div>
          </div>
          
          {liveMode && (
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                Live
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Entries */}
      <div className="p-6 space-y-3">
        <AnimatePresence mode="popLayout">
          {entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-white/30 text-sm"
            >
              No entries yet
            </motion.div>
          ) : (
            entries.map((entry) => {
              const RankIcon = rankIcons[entry.rank as 1 | 2 | 3];
              const rankColor = rankColors[entry.rank as 1 | 2 | 3];
              const isAnimating = animatingRanks.has(entry.userId);

              return (
                <motion.div
                  key={entry.userId}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    scale: isAnimating ? [1, 1.02, 1] : 1,
                  }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ 
                    layout: { duration: 0.3 },
                    scale: { duration: 0.3 }
                  }}
                  className={`relative group ${
                    entry.isCurrentUser
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-white/5 hover:bg-white/[0.08] border-white/10 hover:border-white/20'
                  } border rounded-xl p-4 transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                        entry.rank <= 3 ? rankColor : 'text-white/40 bg-white/5'
                      }`}>
                        {RankIcon ? <RankIcon className="w-6 h-6" /> : entry.rank}
                      </div>

                      {/* Avatar */}
                      <img
                        src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userId}`}
                        alt={entry.username}
                        className="w-12 h-12 rounded-full bg-white/5 border border-white/10"
                      />

                      {/* User Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-base font-bold uppercase tracking-tight ${
                            entry.isCurrentUser ? 'text-red-500' : 'text-white'
                          }`}>
                            {entry.username}
                          </h4>
                          {entry.isCurrentUser && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-red-500/20 text-red-500 font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/40 font-mono">
                            Rank #{entry.rank}
                          </span>
                          {entry.rankChange && entry.rankChange !== 'same' && (
                            <div className="flex items-center gap-1">
                              {getRankChangeIcon(entry.rankChange)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-1">
                        Score
                      </div>
                      <div className={`text-2xl font-black font-mono ${
                        entry.isCurrentUser ? 'text-red-500' : 'text-white'
                      }`}>
                        {entry.score}
                      </div>
                    </div>
                  </div>

                  {/* Current user highlight */}
                  {entry.isCurrentUser && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-red-500/50 pointer-events-none"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
