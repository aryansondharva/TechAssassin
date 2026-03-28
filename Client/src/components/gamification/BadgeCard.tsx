/**
 * Badge Card Component
 * 
 * Displays badge icon, name, description with rarity level color coding.
 * Shows earned_at timestamp for earned badges.
 * Shows "Rare Achievement" indicator for badges earned by <5% of users.
 * 
 * Requirements: 5.3, 19.1, 19.2, 19.5
 */

import { motion } from 'framer-motion';
import { Award, Clock, Star } from 'lucide-react';
import { format } from 'date-fns';

export type RarityLevel = 'common' | 'rare' | 'epic' | 'legendary';

export interface BadgeCardProps {
  badge: {
    id: string;
    name: string;
    description: string;
    category: string;
    rarityLevel: RarityLevel;
    iconUrl: string;
  };
  earnedAt?: Date | string;
  isRareAchievement?: boolean;
  className?: string;
}

// Rarity color scheme (Requirement 19.2)
const RARITY_COLORS: Record<RarityLevel, { border: string; bg: string; text: string; glow: string }> = {
  common: {
    border: 'border-gray-500/30',
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    glow: 'shadow-gray-500/20',
  },
  rare: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  epic: {
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  legendary: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/20',
  },
};

const RARITY_LABELS: Record<RarityLevel, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const BadgeCard = ({
  badge,
  earnedAt,
  isRareAchievement = false,
  className = '',
}: BadgeCardProps) => {
  const rarityStyle = RARITY_COLORS[badge.rarityLevel];
  const earnedDate = earnedAt ? (typeof earnedAt === 'string' ? new Date(earnedAt) : earnedAt) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className={`relative ${className}`}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl border backdrop-blur-md
          ${rarityStyle.border} ${rarityStyle.bg}
          ${earnedAt ? `shadow-lg ${rarityStyle.glow}` : 'opacity-60'}
          p-6 transition-all duration-300
        `}
      >
        {/* Rare Achievement Indicator (Requirement 19.5) */}
        {isRareAchievement && earnedAt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/20 border border-pink-500/30"
          >
            <Star className="w-3 h-3 text-pink-400 fill-pink-400" />
            <span className="text-xs font-bold text-pink-400">Rare Achievement</span>
          </motion.div>
        )}

        {/* Badge Icon */}
        <div className="flex flex-col items-center gap-4">
          <div
            className={`
              relative w-20 h-20 rounded-full border-2 flex items-center justify-center
              ${rarityStyle.border} ${rarityStyle.bg}
            `}
          >
            {badge.iconUrl ? (
              <img
                src={badge.iconUrl}
                alt={badge.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <Award className={`w-12 h-12 ${rarityStyle.text}`} />
            )}
          </div>

          {/* Badge Info */}
          <div className="text-center space-y-2 w-full">
            <h3 className="text-lg font-bold text-white">{badge.name}</h3>
            
            <p className="text-sm text-white/60 line-clamp-2">
              {badge.description}
            </p>

            {/* Rarity Level (Requirement 19.1) */}
            <div className="flex items-center justify-center gap-2">
              <span
                className={`
                  px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                  ${rarityStyle.bg} ${rarityStyle.text} ${rarityStyle.border} border
                `}
              >
                {RARITY_LABELS[badge.rarityLevel]}
              </span>
            </div>

            {/* Earned At Timestamp (Requirement 5.3) */}
            {earnedDate && (
              <div className="flex items-center justify-center gap-2 text-xs text-white/40 pt-2">
                <Clock className="w-3 h-3" />
                <span>Earned {format(earnedDate, 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Animated glow effect for earned badges */}
        {earnedAt && (
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute inset-0 rounded-2xl ${rarityStyle.glow} pointer-events-none`}
          />
        )}
      </div>
    </motion.div>
  );
};
