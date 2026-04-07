/**
 * XP History Component
 * 
 * Displays paginated list of XP transactions with filtering.
 * Shows amount, source, description, and timestamp for each transaction.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Filter, Loader2, X, Calendar, TrendingUp } from 'lucide-react';

interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  source: string;
  activityType: string;
  referenceId?: string;
  description: string;
  manualAdjustment: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface XPHistoryResponse {
  transactions: XPTransaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface XPHistoryProps {
  userId?: string; // If not provided, uses authenticated user
  pageSize?: number;
  showFilters?: boolean;
  className?: string;
}

type XPSource = 
  | 'event_participation'
  | 'code_contribution'
  | 'community_engagement'
  | 'challenge_completion'
  | 'helping_others'
  | 'profile_completion';

const XP_SOURCE_LABELS: Record<XPSource, string> = {
  event_participation: 'Event Participation',
  code_contribution: 'Code Contribution',
  community_engagement: 'Community Engagement',
  challenge_completion: 'Challenge Completion',
  helping_others: 'Helping Others',
  profile_completion: 'Profile Completion',
};

const XP_SOURCE_COLORS: Record<XPSource, string> = {
  event_participation: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  code_contribution: 'text-green-500 bg-green-500/10 border-green-500/20',
  community_engagement: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  challenge_completion: 'text-red-500 bg-red-500/10 border-red-500/20',
  helping_others: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  profile_completion: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
};

export const XPHistory = ({
  userId,
  pageSize = 20,
  showFilters = true,
  className = '',
}: XPHistoryProps) => {
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [selectedSource, setSelectedSource] = useState<XPSource | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load transactions
  useEffect(() => {
    loadTransactions(1, true);
  }, [selectedSource, startDate, endDate, userId]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadTransactions(currentPage + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, currentPage]);

  const loadTransactions = async (page: number, reset: boolean) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (userId) params.append('userId', userId);
      if (selectedSource) params.append('source', selectedSource);
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());

      const response = await fetch(`/api/gamification/xp/history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch XP history');

      const data: XPHistoryResponse = await response.json();

      if (reset) {
        setTransactions(data.transactions);
      } else {
        setTransactions((prev) => [...prev, ...data.transactions]);
      }

      setHasMore(data.hasMore);
      setCurrentPage(page);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to load XP history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const clearFilters = () => {
    setSelectedSource(null);
    setStartDate('');
    setEndDate('');
    setShowFilterMenu(false);
  };

  const hasActiveFilters = selectedSource || startDate || endDate;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
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

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <History className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                XP History
              </h3>
              <p className="text-xs text-white/40 font-mono">
                {totalCount} total transactions
              </p>
            </div>
          </div>

          {/* Filter Button */}
          {showFilters && (
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`p-2 rounded-xl border transition-all ${
                  hasActiveFilters
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>

              {/* Filter Menu */}
              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-[#0d0d0e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 space-y-4">
                      {/* Source Filter */}
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">
                          Source
                        </label>
                        <select
                          value={selectedSource || ''}
                          onChange={(e) => setSelectedSource(e.target.value as XPSource || null)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                        >
                          <option value="">All Sources</option>
                          {Object.entries(XP_SOURCE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date Range */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="w-full px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 hover:bg-red-500/20 transition-all"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <span className="text-xs text-white/40">Active filters:</span>
            {selectedSource && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <span className="text-xs font-bold text-purple-500">
                  {XP_SOURCE_LABELS[selectedSource]}
                </span>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="text-purple-500 hover:text-purple-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {(startDate || endDate) && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Calendar className="w-3 h-3 text-purple-500" />
                <span className="text-xs font-bold text-purple-500">
                  {startDate && endDate ? `${startDate} to ${endDate}` : startDate || endDate}
                </span>
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-purple-500 hover:text-purple-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Transactions List */}
      <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {transactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-white/30 text-sm"
            >
              No XP transactions found
            </motion.div>
          ) : (
            transactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                        XP_SOURCE_COLORS[transaction.source as XPSource] || 'text-white/60 bg-white/5 border-white/10'
                      }`}>
                        {XP_SOURCE_LABELS[transaction.source as XPSource] || transaction.source}
                      </span>
                      {transaction.manualAdjustment && (
                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-orange-500/10 border border-orange-500/20 text-orange-500">
                          Manual
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white font-medium mb-1">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-white/40 font-mono">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-lg font-bold text-green-500 font-mono">
                      +{transaction.amount}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Load More Trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-4 flex justify-center">
            {loadingMore && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-6 h-6 text-white/40" />
              </motion.div>
            )}
          </div>
        )}

        {!hasMore && transactions.length > 0 && (
          <div className="text-center py-4 text-xs text-white/30">
            No more transactions
          </div>
        )}
      </div>
    </div>
  );
};
