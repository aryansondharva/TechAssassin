/**
 * Badge Progress Component
 * 
 * Display locked badges with progress bars.
 * Show progress percentage for each unlock condition.
 * Sort by progress percentage descending.
 * Allow users to "favorite" badges.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Lock, Star, Loader2, TrendingUp } from 'lucide-react';
import { RarityLevel } from './BadgeCard';

interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarityLevel: RarityLevel;
  iconUrl: string;
}

interface ConditionProgress {
  field: string;
  current: number;
  required: number;
  progress: number; // 0-100
}

interface UnlockProgress {
  badgeId: string;
  progress: number; // 0-100
  conditions: ConditionProgress[];
  isUnlocked: boolean;
}

interface BadgeWithProgress {
  badge: Badge;
  progress: UnlockProgress;
}

interface BadgeProgressProps {
  userId: string;
  className?: string;
}

// Rarity color scheme
const RARITY_COLORS: Record<RarityLevel, { border: string; bg: string; text: string; progress: string }> = {
  common: {
    border: 'border-gray-500/30',
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    progress: 'bg-gray-500',
  },
  rare: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    progress: 'bg-blue-500',
  },
  epic: {
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    progress: 'bg-purple-500',
  },
  legendary: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    progress: 'bg-yellow-500',
  },
};

const FIELD_LABELS: Record<string, string> = {
  total_xp: 'Total XP',
  event_count: 'Events Attended',
  current_streak: 'Current Streak',
  badge_count: 'Badges Earned',
  contribution_count: 'Contributions',
  community_engagement: 'Community Engagement',
};

export const BadgeProgress = ({ userId, className = '' }: BadgeProgressProps) => {
  const [lockedBadges, setLockedBadges] = useState<BadgeWithProgress[]>([]);
  const [favoriteBadges, setFavoriteBadges] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch locked badges with progress (Requirement 12.1)
  useEffect(() => {
    fetchBadgeProgress();
    loadFavorites();
  }, [userId]);

  const fetchBadgeProgress = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gamification/badges/progress/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch badge progress');
      }

      const data = await response.json();
      
      // Sort by progress percentage descending (Requirement 12.4)
      const sorted = data.lockedBadges.sort(
        (a: BadgeWithProgress, b: BadgeWithProgress) => b.progress.progress - a.progress.progress
      );
      
      setLockedBadges(sorted);
    } catch (err) {
      console.error('Failed to fetch badge progress:', err);
      setError('Failed to load badge progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = () => {
    const stored = localStorage.getItem(`badge-favorites-${userId}`);
    if (stored) {
      setFavoriteBadges(new Set(JSON.parse(stored)));
    }
  };

  const toggleFavorite = (badgeId: string) => {
    setFavoriteBadges((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(badgeId)) {
        newFavorites.delete(badgeId);
      } else {
        newFavorites.add(badgeId);
      }
      
      // Persist to localStorage (Requirement 12.5)
      localStorage.setItem(`badge-favorites-${userId}`, JSON.stringify([...newFavorites]));
      
      return newFavorites;
    });
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchBadgeProgress}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (lockedBadges.length === 0) {
    return (
      <div className={`text-center p-12 ${className}`}>
        <Award className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-white/60">All badges unlocked!</p>
        <p className="text-sm text-white/40 mt-2">
          You've earned every available badge. Amazing!
        </p>
      </div>
    );
  }

  // Separate favorites and non-favorites
  const favorites = lockedBadges.filter((b) => favoriteBadges.has(b.badge.id));
  const nonFavorites = lockedBadges.filter((b) => !favoriteBadges.has(b.badge.id));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <h3 className="text-lg font-bold text-white">Favorite Badges</h3>
          </div>
          <div className="space-y-4">
            {favorites.map((badgeWithProgress) => (
              <BadgeProgressCard
                key={badgeWithProgress.badge.id}
                badgeWithProgress={badgeWithProgress}
                isFavorite={true}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Locked Badges */}
      <div>
        {favorites.length > 0 && (
          <h3 className="text-lg font-bold text-white mb-4">Other Badges</h3>
        )}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {nonFavorites.map((badgeWithProgress, index) => (
              <motion.div
                key={badgeWithProgress.badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <BadgeProgressCard
                  badgeWithProgress={badgeWithProgress}
                  isFavorite={false}
                  onToggleFavorite={toggleFavorite}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Badge Progress Card Component
interface BadgeProgressCardProps {
  badgeWithProgress: BadgeWithProgress;
  isFavorite: boolean;
  onToggleFavorite: (badgeId: string) => void;
}

const BadgeProgressCard = ({
  badgeWithProgress,
  isFavorite,
  onToggleFavorite,
}: BadgeProgressCardProps) => {
  const { badge, progress } = badgeWithProgress;
  const rarityStyle = RARITY_COLORS[badge.rarityLevel];

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-md
        ${rarityStyle.border} ${rarityStyle.bg}
        p-6 transition-all duration-300
        hover:scale-[1.02]
      `}
    >
      <div className="flex items-start gap-4">
        {/* Badge Icon */}
        <div
          className={`
            relative w-16 h-16 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${rarityStyle.border} ${rarityStyle.bg}
          `}
        >
          {badge.iconUrl ? (
            <img
              src={badge.iconUrl}
              alt={badge.name}
              className="w-10 h-10 object-contain opacity-50"
            />
          ) : (
            <Lock className={`w-10 h-10 ${rarityStyle.text} opacity-50`} />
          )}
        </div>

        {/* Badge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white">{badge.name}</h4>
              <p className="text-sm text-white/60 line-clamp-2">{badge.description}</p>
            </div>

            {/* Favorite Button (Requirement 12.5) */}
            <button
              onClick={() => onToggleFavorite(badge.id)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <Star
                className={`w-5 h-5 ${
                  isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-white/40'
                }`}
              />
            </button>
          </div>

          {/* Overall Progress (Requirement 12.2) */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60">Overall Progress</span>
              <span className={`font-bold ${rarityStyle.text}`}>
                {Math.round(progress.progress)}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full ${rarityStyle.progress} rounded-full`}
              />
            </div>
          </div>

          {/* Condition Progress (Requirement 12.3) */}
          <div className="space-y-3">
            {progress.conditions.map((condition, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">
                    {FIELD_LABELS[condition.field] || condition.field}
                  </span>
                  <span className="text-white/70 font-mono">
                    {condition.current.toLocaleString()} / {condition.required.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${condition.progress}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-full ${rarityStyle.progress} rounded-full opacity-60`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          {progress.progress >= 75 && (
            <div className="flex items-center gap-2 mt-3 text-xs text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span className="font-bold">Almost there!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
