/**
 * XP Display Component
 * 
 * Shows user's total XP with animated counter and real-time updates.
 * Displays XP gain notifications via toast.
 * 
 * Requirements: 1.2, 8.1, 8.2, 8.4
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface XPDisplayProps {
  userId: string;
  initialXP?: number;
  showNotifications?: boolean;
  className?: string;
}

interface XPGainPayload {
  amount: number;
  source: string;
  newTotal: number;
  transaction: {
    id: string;
    description: string;
    activityType: string;
  };
}

const XP_SOURCE_LABELS: Record<string, string> = {
  event_participation: 'Event Participation',
  code_contribution: 'Code Contribution',
  community_engagement: 'Community Engagement',
  challenge_completion: 'Challenge Completion',
  helping_others: 'Helping Others',
  profile_completion: 'Profile Completion',
};

export const XPDisplay = ({
  userId,
  initialXP = 0,
  showNotifications = true,
  className = '',
}: XPDisplayProps) => {
  const [totalXP, setTotalXP] = useState(initialXP);
  const [displayXP, setDisplayXP] = useState(initialXP);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Animated counter effect
  useEffect(() => {
    if (displayXP === totalXP) return;

    setIsAnimating(true);
    const difference = totalXP - displayXP;
    const duration = 1000; // 1 second animation
    const steps = 30;
    const increment = difference / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayXP(totalXP);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDisplayXP((prev) => Math.round(prev + increment));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [totalXP, displayXP]);

  // Subscribe to XP updates via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`gamification:xp:${userId}`)
      .on('broadcast', { event: 'xp_gained' }, (payload) => {
        const data = payload.payload as XPGainPayload;
        
        // Update total XP (triggers animation)
        setTotalXP(data.newTotal);

        // Show notification toast
        if (showNotifications) {
          const sourceLabel = XP_SOURCE_LABELS[data.source] || data.source;
          
          toast({
            title: (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>+{data.amount} XP Earned!</span>
              </div>
            ),
            description: (
              <div className="space-y-1">
                <p className="text-sm font-medium">{sourceLabel}</p>
                <p className="text-xs text-white/60">{data.transaction.description}</p>
              </div>
            ),
            duration: 5000,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, showNotifications, supabase, toast]);

  // Fetch current XP on mount if not provided
  useEffect(() => {
    if (initialXP === 0) {
      fetchCurrentXP();
    }
  }, [userId]);

  const fetchCurrentXP = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch current XP:', error);
        return;
      }

      const xp = data?.total_xp || 0;
      setTotalXP(xp);
      setDisplayXP(xp);
    } catch (error) {
      console.error('Failed to fetch current XP:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-md"
        animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Total XP
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={displayXP}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-3xl font-bold text-white font-mono"
                >
                  {displayXP.toLocaleString()}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {isAnimating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 text-green-500"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-bold">+{totalXP - displayXP}</span>
            </motion.div>
          )}
        </div>

        {/* Animated glow effect when XP increases */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 rounded-2xl bg-yellow-500/20 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
