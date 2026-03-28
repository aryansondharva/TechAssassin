/**
 * Badge Collection Component
 * 
 * Displays all earned badges for a user.
 * Sorted by rarity (legendary first) then earned_at.
 * Paginate if >10 badges.
 * Show badge count by category.
 * 
 * Requirements: 5.1, 5.2, 5.4, 5.5, 19.3
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BadgeCard, RarityLevel } from './BadgeCard';

interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarityLevel: RarityLevel;
  iconUrl: string;
}

interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: string;
  manualAward: boolean;
}

interface BadgeCollectionProps {
  userId: string;
  pageSize?: number;
  className?: string;
}

interface BadgeCollectionResponse {
  badges: UserBadge[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  categoryCounts: Record<string, number>;
  rarityDistribution: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  coding: 'Coding',
  community: 'Community',
  events: 'Events',
  streaks: 'Streaks',
  mentorship: 'Mentorship',
  special: 'Special',
};

export const BadgeCollection = ({
  userId,
  pageSize = 10,
  className = '',
}: BadgeCollectionProps) => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [rarityDistribution, setRarityDistribution] = useState({
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch badges from API (Requirement 5.1)
  useEffect(() => {
    fetchBadges();
  }, [userId, currentPage, pageSize]);

  const fetchBadges = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/gamification/badges/user/${userId}?page=${currentPage}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }

      const data: BadgeCollectionResponse = await response.json();
      
      setBadges(data.badges);
      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
      setCategoryCounts(data.categoryCounts);
      setRarityDistribution(data.rarityDistribution);
    } catch (err) {
      console.error('Failed to fetch badges:', err);
      setError('Failed to load badges. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Calculate total users for rare achievement indicator
  const calculateRareAchievement = (badge: Badge): boolean => {
    // This would ideally come from the API, but we can estimate based on rarity
    // In a real implementation, the API should provide this data
    return badge.rarityLevel === 'legendary' || badge.rarityLevel === 'epic';
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
          onClick={fetchBadges}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className={`text-center p-12 ${className}`}>
        <Award className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-white/60">No badges earned yet</p>
        <p className="text-sm text-white/40 mt-2">
          Complete activities to unlock your first badge!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Badge Count by Category (Requirement 5.5) */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <h3 className="text-lg font-bold text-white mb-4">Badge Collection</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <div
              key={category}
              className="text-center p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-white/60 uppercase tracking-wider">
                {CATEGORY_LABELS[category] || category}
              </p>
            </div>
          ))}
        </div>

        {/* Rarity Distribution (Requirement 19.3) */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">
            By Rarity
          </p>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-2 bg-gray-500/10 rounded-lg border border-gray-500/20">
              <p className="text-xl font-bold text-gray-400">{rarityDistribution.common}</p>
              <p className="text-xs text-gray-400">Common</p>
            </div>
            <div className="text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-xl font-bold text-blue-400">{rarityDistribution.rare}</p>
              <p className="text-xs text-blue-400">Rare</p>
            </div>
            <div className="text-center p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <p className="text-xl font-bold text-purple-400">{rarityDistribution.epic}</p>
              <p className="text-xs text-purple-400">Epic</p>
            </div>
            <div className="text-center p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-xl font-bold text-yellow-400">{rarityDistribution.legendary}</p>
              <p className="text-xs text-yellow-400">Legendary</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Grid (Requirement 5.2 - sorted by rarity then earned_at) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {badges.map((userBadge, index) => (
            <motion.div
              key={userBadge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <BadgeCard
                badge={userBadge.badge}
                earnedAt={userBadge.earnedAt}
                isRareAchievement={calculateRareAchievement(userBadge.badge)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination (Requirement 5.4 - paginate if >10 badges) */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${
                currentPage === 1
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }
            `}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="text-sm text-white/60">
            Page {currentPage} • {totalCount} total badge{totalCount !== 1 ? 's' : ''}
          </div>

          <button
            onClick={handleNextPage}
            disabled={!hasMore}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${
                !hasMore
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }
            `}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
