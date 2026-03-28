/**
 * XP Summary Component
 * 
 * Displays daily, weekly, and monthly XP totals with visual charts.
 * Shows XP earning trends over time.
 * 
 * Requirements: 11.5
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Loader2 } from 'lucide-react';

interface XPSummary {
  daily: number;
  weekly: number;
  monthly: number;
}

interface XPSummaryProps {
  userId?: string; // If not provided, uses authenticated user
  className?: string;
}

export const XPSummary = ({
  userId,
  className = '',
}: XPSummaryProps) => {
  const [summary, setSummary] = useState<XPSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, [userId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`/api/gamification/xp/summary${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch XP summary');
      }

      const data: XPSummary = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load XP summary:', err);
      setError('Failed to load XP summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md ${className}`}>
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-8 h-8 text-white/40" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md ${className}`}>
        <div className="text-center py-12 text-red-500 text-sm">
          {error || 'Failed to load XP summary'}
        </div>
      </div>
    );
  }

  // Calculate max value for chart scaling
  const maxValue = Math.max(summary.daily, summary.weekly, summary.monthly, 1);

  const periods = [
    {
      label: 'Today',
      value: summary.daily,
      icon: Calendar,
      color: 'from-blue-500/20 to-blue-600/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'This Week',
      value: summary.weekly,
      icon: TrendingUp,
      color: 'from-purple-500/20 to-purple-600/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'This Month',
      value: summary.monthly,
      icon: BarChart3,
      color: 'from-green-500/20 to-green-600/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">
              XP Summary
            </h3>
            <p className="text-xs text-white/40 font-mono">
              Your earning trends
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 space-y-4">
        {periods.map((period, index) => {
          const percentage = maxValue > 0 ? (period.value / maxValue) * 100 : 0;
          const Icon = period.icon;

          return (
            <motion.div
              key={period.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Period Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${period.bgColor} border ${period.borderColor}`}>
                    <Icon className={`w-4 h-4 ${period.textColor}`} />
                  </div>
                  <span className="text-sm font-bold text-white/80">
                    {period.label}
                  </span>
                </div>
                <span className={`text-xl font-bold ${period.textColor} font-mono`}>
                  {period.value.toLocaleString()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2, ease: 'easeOut' }}
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${period.color} border-r ${period.borderColor}`}
                />
              </div>
            </motion.div>
          );
        })}

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 pt-6 border-t border-white/10"
        >
          <div className="space-y-3">
            {/* Daily Average */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Daily Average (This Week)</span>
              <span className="font-bold text-white font-mono">
                {Math.round(summary.weekly / 7).toLocaleString()} XP
              </span>
            </div>

            {/* Weekly Average */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Weekly Average (This Month)</span>
              <span className="font-bold text-white font-mono">
                {Math.round(summary.monthly / 4).toLocaleString()} XP
              </span>
            </div>

            {/* Trend Indicator */}
            {summary.weekly > 0 && summary.daily > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Today vs Daily Avg</span>
                <div className="flex items-center gap-2">
                  {summary.daily > summary.weekly / 7 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-bold text-green-500">
                        +{Math.round(((summary.daily - summary.weekly / 7) / (summary.weekly / 7)) * 100)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                      <span className="font-bold text-red-500">
                        {Math.round(((summary.daily - summary.weekly / 7) / (summary.weekly / 7)) * 100)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Motivational Message */}
        {summary.daily === 0 && summary.weekly === 0 && summary.monthly === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
          >
            <p className="text-sm text-yellow-500 text-center">
              Start earning XP by participating in events, contributing code, and engaging with the community!
            </p>
          </motion.div>
        )}

        {summary.daily > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
          >
            <p className="text-sm text-green-500 text-center">
              Great work! You've earned {summary.daily} XP today. Keep it up! 🚀
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
