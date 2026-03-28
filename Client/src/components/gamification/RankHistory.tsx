/**
 * Rank History Component
 * 
 * Displays user's rank progression timeline.
 * Shows rank changes with timestamps.
 * Fetches from /api/gamification/ranks/history/:userId
 * 
 * Requirements: 6.6
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RankTier {
  id: string;
  name: string;
  minimumXpThreshold: number;
  rankOrder: number;
  iconUrl: string;
  perks: Record<string, any>;
}

interface RankHistoryEntry {
  id: string;
  userId: string;
  rankId: string;
  rank: RankTier;
  achievedAt: string;
}

interface RankHistoryProps {
  userId: string;
  className?: string;
  maxHeight?: string;
}

export const RankHistory = ({
  userId,
  className = '',
  maxHeight = '400px',
}: RankHistoryProps) => {
  const [history, setHistory] = useState<RankHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRankHistory();
  }, [userId]);

  const fetchRankHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/gamification/ranks/history/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rank history');
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch rank history:', err);
      setError('Failed to load rank history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm">No rank history yet</p>
            <p className="text-white/40 text-xs mt-1">
              Start earning XP to unlock your first rank!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Rank Progression</h3>
            <p className="text-xs text-white/60">
              {history.length} rank{history.length !== 1 ? 's' : ''} achieved
            </p>
          </div>
        </div>

        {/* Timeline */}
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-4 pr-4">
            {history.map((entry, index) => {
              const achievedDate = new Date(entry.achievedAt);
              const isLatest = index === 0;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Timeline connector */}
                  {index < history.length - 1 && (
                    <div className="absolute left-8 top-16 w-0.5 h-full bg-gradient-to-b from-purple-500/50 to-transparent" />
                  )}

                  {/* Entry card */}
                  <div
                    className={`
                      relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200
                      ${
                        isLatest
                          ? 'bg-purple-500/20 border-purple-500/40 shadow-lg shadow-purple-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }
                    `}
                  >
                    {/* Rank Icon */}
                    <div
                      className={`
                        relative flex-shrink-0 w-16 h-16 rounded-full border-2 flex items-center justify-center
                        ${
                          isLatest
                            ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-purple-400'
                            : 'bg-white/10 border-white/20'
                        }
                      `}
                    >
                      {entry.rank.iconUrl ? (
                        <img
                          src={entry.rank.iconUrl}
                          alt={entry.rank.name}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <Trophy
                          className={`w-10 h-10 ${
                            isLatest ? 'text-purple-400' : 'text-white/60'
                          }`}
                        />
                      )}

                      {/* Latest indicator */}
                      {isLatest && (
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="absolute inset-0 rounded-full bg-purple-500/30 blur-md"
                        />
                      )}
                    </div>

                    {/* Rank Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-base font-bold text-white">
                            {entry.rank.name}
                          </h4>
                          {isLatest && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-500/50 text-xs font-bold text-purple-300 mt-1">
                              Current Rank
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-white/60 flex-shrink-0">
                          <Calendar className="w-3 h-3" />
                          <span>{format(achievedDate, 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      <p className="text-sm text-white/60">
                        Required {entry.rank.minimumXpThreshold.toLocaleString()} XP
                      </p>

                      {/* Rank Perks */}
                      {entry.rank.perks && Object.keys(entry.rank.perks).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(entry.rank.perks).slice(0, 3).map(([key, value]) => (
                            <span
                              key={key}
                              className="px-2 py-1 rounded-md bg-purple-500/20 border border-purple-500/30 text-xs text-purple-300"
                            >
                              {String(value)}
                            </span>
                          ))}
                          {Object.keys(entry.rank.perks).length > 3 && (
                            <span className="px-2 py-1 rounded-md bg-white/10 border border-white/20 text-xs text-white/60">
                              +{Object.keys(entry.rank.perks).length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Stats Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {history[0]?.rank.rankOrder || 0}
              </p>
              <p className="text-xs text-white/60">Current Rank Level</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {history.length}
              </p>
              <p className="text-xs text-white/60">Total Ranks Achieved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
