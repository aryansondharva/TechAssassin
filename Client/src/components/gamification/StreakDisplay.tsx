/**
 * Streak Display Component
 * 
 * Shows current streak with fire icon, longest streak, and streak multiplier badge.
 * Fetches streak data from /api/gamification/streaks/:userId
 * 
 * Requirements: 18.6
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap } from 'lucide-react';

interface StreakInfo {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakMultiplier: number;
}

interface StreakDisplayProps {
  userId: string;
  className?: string;
}

export const StreakDisplay = ({
  userId,
  className = '',
}: StreakDisplayProps) => {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStreakInfo();
  }, [userId]);

  const fetchStreakInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/gamification/streaks/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch streak information');
      }

      const data = await response.json();
      setStreakInfo(data);
    } catch (err) {
      console.error('Failed to fetch streak info:', err);
      setError('Failed to load streak information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-24" />
              <div className="h-6 bg-white/10 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !streakInfo) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400 text-sm">{error || 'No streak data available'}</p>
        </div>
      </div>
    );
  }

  const { currentStreak, longestStreak, streakMultiplier } = streakInfo;
  const hasActiveStreak = currentStreak > 0;
  const hasMultiplier = streakMultiplier > 1.0;

  return (
    <div className={`${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6 backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Activity Streak</h3>
          {hasMultiplier && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
            >
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-yellow-500">
                {streakMultiplier}x XP
              </span>
            </motion.div>
          )}
        </div>

        {/* Current Streak Display (Requirement 18.6) */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <motion.div
              animate={hasActiveStreak ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                hasActiveStreak
                  ? 'bg-gradient-to-br from-orange-500/30 to-red-500/30 border-2 border-orange-500/50'
                  : 'bg-white/5 border-2 border-white/10'
              }`}
            >
              <Flame
                className={`w-10 h-10 ${
                  hasActiveStreak ? 'text-orange-500' : 'text-white/30'
                }`}
              />
            </motion.div>
            
            {/* Animated glow effect for active streaks */}
            {hasActiveStreak && (
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
                className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl -z-10"
              />
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Current Streak
            </p>
            <motion.p
              key={currentStreak}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold text-white font-mono"
            >
              {currentStreak}
            </motion.p>
            <p className="text-sm text-white/60">
              {currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        {/* Longest Streak Display (Requirement 18.6) */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/60">Longest Streak</p>
            <p className="text-xl font-bold text-white">
              {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        {/* Streak Multiplier Info */}
        {hasMultiplier && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
          >
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-yellow-500">
                  Streak Bonus Active!
                </p>
                <p className="text-xs text-white/60 mt-1">
                  You're earning {((streakMultiplier - 1) * 100).toFixed(0)}% bonus XP on all activities
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Encouragement message for inactive streaks */}
        {!hasActiveStreak && (
          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/60 text-center">
              Start your streak today! Stay active for 7+ days to earn XP multipliers.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
