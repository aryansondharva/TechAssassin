/**
 * Rank Display Component
 * 
 * Shows current rank name and icon with visual progress bar toward next rank.
 * Displays XP progress percentage and exact XP amount needed for next rank.
 * Handles max rank case with "Max Rank" indicator.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Crown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RankTier {
  id: string;
  name: string;
  minimumXpThreshold: number;
  rankOrder: number;
  iconUrl: string;
  perks: Record<string, any>;
}

interface RankProgress {
  currentRank: RankTier | null;
  nextRank: RankTier | null;
  currentXP: number;
  xpForNextRank: number;
  progressPercentage: number;
  isMaxRank: boolean;
}

interface RankDisplayProps {
  userId: string;
  className?: string;
  showProgress?: boolean;
}

export const RankDisplay = ({
  userId,
  className = '',
  showProgress = true,
}: RankDisplayProps) => {
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRankProgress();
  }, [userId]);

  const fetchRankProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/gamification/ranks/user/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rank progress');
      }

      const data = await response.json();
      setRankProgress(data);
    } catch (err) {
      console.error('Failed to fetch rank progress:', err);
      setError('Failed to load rank information');
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

  if (error || !rankProgress) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400 text-sm">{error || 'No rank data available'}</p>
        </div>
      </div>
    );
  }

  const { currentRank, nextRank, currentXP, xpForNextRank, progressPercentage, isMaxRank } = rankProgress;

  return (
    <div className={`${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-md"
      >
        {/* Current Rank Display (Requirements 7.1) */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-500/30 flex items-center justify-center">
              {currentRank?.iconUrl ? (
                <img
                  src={currentRank.iconUrl}
                  alt={currentRank.name}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <Trophy className="w-10 h-10 text-purple-400" />
              )}
            </div>
            {isMaxRank && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center"
              >
                <Crown className="w-4 h-4 text-yellow-900" />
              </motion.div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Current Rank
            </p>
            <h3 className="text-2xl font-bold text-white">
              {currentRank?.name || 'Unranked'}
            </h3>
            <p className="text-sm text-white/60">
              {currentXP.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* Max Rank Indicator (Requirement 7.4) */}
        {isMaxRank ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-500" />
              <div>
                <p className="text-sm font-bold text-yellow-500">Max Rank Achieved!</p>
                <p className="text-xs text-white/60">You've reached the highest rank</p>
              </div>
            </div>
          </motion.div>
        ) : (
          showProgress && nextRank && (
            <>
              {/* Progress Bar (Requirement 7.5) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Progress to {nextRank.name}</span>
                  <span className="font-bold text-white">
                    {progressPercentage}%
                  </span>
                </div>

                {/* Visual Progress Bar (Requirement 7.2, 7.5) */}
                <div className="relative">
                  <Progress 
                    value={progressPercentage} 
                    className="h-3 bg-white/10"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                  />
                </div>

                {/* XP Needed Display (Requirement 7.3) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <TrendingUp className="w-4 h-4" />
                    <span>Next Rank: {nextRank.name}</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {xpForNextRank.toLocaleString()} XP needed
                  </div>
                </div>
              </div>
            </>
          )
        )}

        {/* Rank Perks (if available) */}
        {currentRank?.perks && Object.keys(currentRank.perks).length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
              Rank Perks
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(currentRank.perks).map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-1 rounded-md bg-purple-500/20 border border-purple-500/30 text-xs text-purple-300"
                >
                  {String(value)}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
