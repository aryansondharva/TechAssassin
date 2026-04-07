/**
 * Rank-up Notification Component
 * 
 * Displays modal/toast when user ranks up.
 * Subscribes to Supabase Realtime channel for rank changes.
 * Shows previous and new rank with animation.
 * Includes rank perks and benefits.
 * 
 * Requirements: 6.4
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, X, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RankTier {
  id: string;
  name: string;
  minimumXpThreshold: number;
  rankOrder: number;
  iconUrl: string;
  perks: Record<string, any>;
}

interface RankUpPayload {
  previousRank: RankTier | null;
  newRank: RankTier;
  progress: {
    currentXP: number;
    progressPercentage: number;
  };
}

interface RankUpNotificationProps {
  userId: string;
}

export const RankUpNotification = ({ userId }: RankUpNotificationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rankUpData, setRankUpData] = useState<RankUpPayload | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to rank change events via Supabase Realtime
    const channel = supabase
      .channel(`gamification:ranks:${userId}`)
      .on('broadcast', { event: 'rank_up' }, (payload) => {
        const data = payload.payload as RankUpPayload;
        setRankUpData(data);
        setIsOpen(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!rankUpData) return null;

  const { previousRank, newRank } = rankUpData;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-900/95 to-blue-900/95 border-2 border-purple-500/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Rank Up!</DialogTitle>
        </DialogHeader>

        <div className="relative py-6">
          {/* Celebration Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-yellow-500/50">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Content */}
          <div className="mt-8 space-y-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                Rank Up!
              </h2>
              <p className="text-white/60">
                Congratulations on your achievement!
              </p>
            </motion.div>

            {/* Rank Transition */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4"
            >
              {/* Previous Rank */}
              {previousRank && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center opacity-60">
                    {previousRank.iconUrl ? (
                      <img
                        src={previousRank.iconUrl}
                        alt={previousRank.name}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <Trophy className="w-10 h-10 text-white/60" />
                    )}
                  </div>
                  <p className="text-sm text-white/60">{previousRank.name}</p>
                </div>
              )}

              {/* Arrow */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, repeat: Infinity, duration: 1.5 }}
              >
                <ChevronRight className="w-8 h-8 text-purple-400" />
              </motion.div>

              {/* New Rank */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-purple-300 flex items-center justify-center shadow-lg shadow-purple-500/50">
                    {newRank.iconUrl ? (
                      <img
                        src={newRank.iconUrl}
                        alt={newRank.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <Trophy className="w-12 h-12 text-white" />
                    )}
                  </div>
                  {/* Glow effect */}
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
                    className="absolute inset-0 rounded-full bg-purple-500/30 blur-xl"
                  />
                </div>
                <p className="text-lg font-bold text-white">{newRank.name}</p>
              </motion.div>
            </motion.div>

            {/* New Rank Perks */}
            {newRank.perks && Object.keys(newRank.perks).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <p className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  New Perks & Benefits
                </p>
                <div className="space-y-2">
                  {Object.entries(newRank.perks).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-sm text-white/70"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="capitalize">{key.replace(/_/g, ' ')}: {String(value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold transition-all duration-200 shadow-lg shadow-purple-500/30"
            >
              Awesome!
            </motion.button>
          </div>

          {/* Close Icon */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Confetti particles */}
        <AnimatePresence>
          {isOpen && (
            <>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 1,
                    x: '50%',
                    y: '50%',
                  }}
                  animate={{
                    opacity: 0,
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                    ease: 'easeOut',
                  }}
                  className="absolute w-2 h-2 rounded-full pointer-events-none"
                  style={{
                    backgroundColor: ['#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899'][i % 4],
                    left: '50%',
                    top: '20%',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
