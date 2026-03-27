import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Filter, Loader2, X } from 'lucide-react';
import { getActivityService } from '@/lib/services/activity-service';
import { ActivityItem } from './ActivityItem';
import type { ActivityEvent, ActivityFilter, ActivityType } from '@/lib/services/activity-service';

interface ActivityFeedProps {
  showFilters?: boolean;
  pageSize?: number;
  className?: string;
}

const activityTypeLabels: Record<ActivityType, string> = {
  challenge_solved: 'Challenges',
  event_joined: 'Events',
  badge_earned: 'Badges',
  team_registered: 'Teams',
};

export const ActivityFeed = ({
  showFilters = true,
  pageSize = 20,
  className = '',
}: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<ActivityFilter | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const activityService = getActivityService();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load initial activities
  useEffect(() => {
    loadActivities(1, true);
  }, [filter]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = activityService.onActivityCreated((activity) => {
      // Check if activity matches current filter
      if (filter?.type && activity.type !== filter.type) return;
      if (filter?.userId && activity.userId !== filter.userId) return;

      // Add to top of list
      setActivities((prev) => [activity, ...prev]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activityService, filter]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadActivities(currentPage + 1, false);
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

  const loadActivities = async (page: number, reset: boolean) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await activityService.getActivities({
        page,
        pageSize,
        filter: filter || undefined,
      });

      if (reset) {
        setActivities(result.activities);
      } else {
        setActivities((prev) => [...prev, ...result.activities]);
      }

      setHasMore(result.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFilterChange = useCallback((newFilter: ActivityFilter | null) => {
    setFilter(newFilter);
    setCurrentPage(1);
    setShowFilterMenu(false);
    
    if (newFilter) {
      activityService.setFilter(newFilter);
    } else {
      activityService.clearFilter();
    }
  }, [activityService]);

  const clearFilter = useCallback(() => {
    handleFilterChange(null);
  }, [handleFilterChange]);

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
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                Activity Feed
              </h3>
              <p className="text-xs text-white/40 font-mono">
                Live updates from the community
              </p>
            </div>
          </div>

          {/* Filter Button */}
          {showFilters && (
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`p-2 rounded-xl border transition-all ${
                  filter
                    ? 'bg-red-500/10 border-red-500/20 text-red-500'
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
                    className="absolute right-0 top-full mt-2 w-48 bg-[#0d0d0e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-2">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider px-2 py-1">
                        Filter by type
                      </p>
                      {(Object.entries(activityTypeLabels) as [ActivityType, string][]).map(([type, label]) => (
                        <button
                          key={type}
                          onClick={() => handleFilterChange({ type })}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                            filter?.type === type
                              ? 'bg-red-500/20 text-red-500 font-bold'
                              : 'text-white/70 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Active Filter Display */}
        {filter && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2"
          >
            <span className="text-xs text-white/40">Active filter:</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-xs font-bold text-red-500">
                {filter.type && activityTypeLabels[filter.type]}
              </span>
              <button
                onClick={clearFilter}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Activities List */}
      <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-white/30 text-sm"
            >
              No activities yet
            </motion.div>
          ) : (
            activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
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

        {!hasMore && activities.length > 0 && (
          <div className="text-center py-4 text-xs text-white/30">
            No more activities
          </div>
        )}
      </div>
    </div>
  );
};
