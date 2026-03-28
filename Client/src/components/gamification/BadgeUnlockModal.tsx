/**
 * Badge Unlock Modal Component
 * 
 * Display modal when badge is unlocked.
 * Subscribe to Supabase Realtime channel for badge unlocks.
 * Show badge details with animation.
 * Include rarity indicator and description.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RarityLevel } from './BadgeCard';

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

interface BadgeUnlockPayload {
  badge: Badge;
  userBadge: UserBadge;
}

interface BadgeUnlockModalProps {
  userId: string;
  onClose?: () => void;
}

// Rarity color scheme
const RARITY_COLORS: Record<RarityLevel, { border: string; bg: string; text: string; glow: string }> = {
  common: {
    border: 'border-gray-500/50',
    bg: 'bg-gray-500/20',
    text: 'text-gray-400',
    glow: 'shadow-gray-500/50',
  },
  rare: {
    border: 'border-blue-500/50',
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/50',
  },
  epic: {
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/50',
  },
  legendary: {
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/50',
  },
};

const RARITY_LABELS: Record<RarityLevel, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const BadgeUnlockModal = ({ userId, onClose }: BadgeUnlockModalProps) => {
  const [unlockedBadge, setUnlockedBadge] = useState<BadgeUnlockPayload | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const supabase = createClient();

  // Subscribe to badge unlock events (Requirement 9.1, 9.2)
  useEffect(() => {
    const channel = supabase
      .channel(`gamification:badges:${userId}`)
      .on('broadcast', { event: 'badge_unlocked' }, (payload) => {
        const data = payload.payload as BadgeUnlockPayload;
        setUnlockedBadge(data);
        setIsVisible(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setUnlockedBadge(null);
      onClose?.();
    }, 300);
  };

  if (!unlockedBadge) return null;

  const rarityStyle = RARITY_COLORS[unlockedBadge.badge.rarityLevel];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal (Requirement 9.3, 9.4) */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateY: 180 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
              }}
              onClick={(e) => e.stopPropagation()}
              className={`
                relative max-w-md w-full rounded-3xl border backdrop-blur-xl
                ${rarityStyle.border} ${rarityStyle.bg}
                shadow-2xl ${rarityStyle.glow}
                p-8
              `}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Sparkles Animation */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: `${Math.random() * 100}%`,
                      y: `${Math.random() * 100}%`,
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                    className="absolute"
                  >
                    <Sparkles className={`w-4 h-4 ${rarityStyle.text}`} />
                  </motion.div>
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Badge Unlocked!
                  </h2>
                  <p className="text-sm text-white/60">
                    You've earned a new achievement
                  </p>
                </motion.div>

                {/* Badge Icon with Animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.3,
                  }}
                  className={`
                    relative w-32 h-32 rounded-full border-4 flex items-center justify-center
                    ${rarityStyle.border} ${rarityStyle.bg}
                    shadow-2xl ${rarityStyle.glow}
                  `}
                >
                  {unlockedBadge.badge.iconUrl ? (
                    <img
                      src={unlockedBadge.badge.iconUrl}
                      alt={unlockedBadge.badge.name}
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <Award className={`w-20 h-20 ${rarityStyle.text}`} />
                  )}

                  {/* Pulsing glow */}
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
                    className={`absolute inset-0 rounded-full ${rarityStyle.bg} blur-xl`}
                  />
                </motion.div>

                {/* Badge Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <h3 className="text-2xl font-bold text-white">
                    {unlockedBadge.badge.name}
                  </h3>

                  <p className="text-white/70 max-w-sm">
                    {unlockedBadge.badge.description}
                  </p>

                  {/* Rarity Indicator (Requirement 9.4) */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <span
                      className={`
                        px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider
                        ${rarityStyle.bg} ${rarityStyle.text} ${rarityStyle.border} border-2
                      `}
                    >
                      {RARITY_LABELS[unlockedBadge.badge.rarityLevel]}
                    </span>
                  </div>
                </motion.div>

                {/* Action Button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={handleClose}
                  className={`
                    w-full px-6 py-3 rounded-xl font-bold text-white
                    ${rarityStyle.bg} ${rarityStyle.border} border-2
                    hover:scale-105 active:scale-95
                    transition-transform duration-200
                  `}
                >
                  Awesome!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
