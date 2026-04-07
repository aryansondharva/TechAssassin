import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { getPresenceService } from '@/lib/services/presence-service';
import { PresenceIndicator } from './PresenceIndicator';
import type { PresenceState } from '@/lib/services/presence-service';

interface OnlineUsersListProps {
  location?: { type: 'page' | 'event'; id: string };
  maxDisplay?: number;
  className?: string;
}

export const OnlineUsersList = ({
  location,
  maxDisplay = 10,
  className = '',
}: OnlineUsersListProps) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState>({});
  const [activeCount, setActiveCount] = useState(0);
  const presenceService = getPresenceService();

  useEffect(() => {
    // Get initial state
    const users = presenceService.getOnlineUsers();
    setOnlineUsers(users);
    setActiveCount(presenceService.getActiveCount(location));

    // Subscribe to presence changes
    const subscription = presenceService.onPresenceChange((state) => {
      setOnlineUsers(state);
      setActiveCount(presenceService.getActiveCount(location));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location, presenceService]);

  // Filter users by location if specified
  const filteredUsers = Object.entries(onlineUsers).filter(([_, user]) => {
    if (!location) return user.status !== 'offline';
    return (
      user.status !== 'offline' &&
      user.location?.type === location.type &&
      user.location?.id === location.id
    );
  });

  const displayUsers = filteredUsers.slice(0, maxDisplay);
  const remainingCount = Math.max(0, filteredUsers.length - maxDisplay);

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">
              Online Users
            </h3>
            <p className="text-xs text-white/40 font-mono">
              {activeCount} {activeCount === 1 ? 'user' : 'users'} active
            </p>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-white/30 text-sm"
            >
              No users online
            </motion.div>
          ) : (
            displayUsers.map(([userId, user]) => (
              <motion.div
                key={userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
              >
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                    alt={user.username}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    <PresenceIndicator userId={userId} size="sm" />
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {user.username}
                  </p>
                  {user.location && (
                    <p className="text-xs text-white/40 truncate">
                      {user.location.type === 'event' ? 'In event' : 'On page'}
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Show remaining count */}
        {remainingCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-2 text-xs text-white/40 font-mono"
          >
            +{remainingCount} more {remainingCount === 1 ? 'user' : 'users'}
          </motion.div>
        )}
      </div>
    </div>
  );
};
