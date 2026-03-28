/**
 * User Position Component
 * 
 * Shows authenticated user's position in leaderboard.
 * Displays users immediately above and below.
 * Highlights user's row.
 * 
 * Requirements: 10.4
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Loader2, User, ChevronUp, ChevronDown } from 'lucide-react';

interface RankTier {
  name: string;
  icon_url: string;
}

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string | null;
  total_xp: number;
  rank: number;
  current_rank: RankTier | null;
}

interface UserPositionData {
  user: LeaderboardUser;
  user_above: LeaderboardUser | null;
  user_below: LeaderboardUser | null;
  total_users: number;
}

interface UserPositionProps {
  userId: string;
  className?: string;
}

export const UserPosition = ({
  userId,
  className = '',
}: UserPositionProps) => {
  const [positionData, setPositionData] = useState<UserPositionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPosition();
  }, [userId]);

  const fetchUserPosition = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/gamification/leaderboard/position/${userId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found in leaderboard');
        }
        throw new Error('Failed to fetch user position');
      }

      const data = await response.json();
      setPositionData(data);
    } catch (err) {
      console.error('Failed to fetch user position:', err);
      setError(err instanceof Error ? err.message : 'Failed to load position');
    } finally {
      setLoading(false);
    }
  };

  // Render user row
  const renderUserRow = (
    user: LeaderboardUser,
    isCurrentUser: boolean,
    position: 'above' | 'current' | 'below'
  ) => {
    const positionIcon = position === 'above' 
      ? <ChevronUp className="w-4 h-4 text-green-400" />
      : position === 'below'
      ? <ChevronDown className="w-4 h-4 text-red-400" />
      : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: position === 'above' ? -10 : position === 'below' ? 10 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: position === 'above' ? 0 : position === 'below' ? 0.2 : 0.1 }}
        className={`
          p-4 rounded-xl border transition-all
          ${
            isCurrentUser
              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30 shadow-lg'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }
        `}
      >
        <div className="flex items-center gap-4">
          {/* Position indicator */}
          <div className="flex items-center justify-center w-8">
            {positionIcon || (
              <User className="w-5 h-5 text-purple-400" />
            )}
          </div>

          {/* Rank number */}
          <div className="flex items-center justify-center w-12">
            <span
              className={`
                text-lg font-bold
                ${isCurrentUser ? 'text-purple-300' : 'text-white/60'}
              `}
            >
              #{user.rank}
            </span>
          </div>

          {/* User avatar */}
          <div className="relative">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className={`
                  w-12 h-12 rounded-full object-cover border-2
                  ${isCurrentUser ? 'border-purple-500/50' : 'border-white/20'}
                `}
              />
            ) : (
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2
                  ${
                    isCurrentUser
                      ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-purple-500/50'
                      : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-white/20'
                  }
                `}
              >
                <span className="text-lg font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isCurrentUser && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-500 border-2 border-gray-900 flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <p
              className={`
                text-base font-bold truncate
                ${isCurrentUser ? 'text-white' : 'text-white/80'}
              `}
            >
              {user.username}
              {isCurrentUser && (
                <span className="ml-2 text-xs font-normal text-purple-300">
                  (You)
                </span>
              )}
            </p>
            {user.current_rank && (
              <div className="flex items-center gap-2 mt-1">
                {user.current_rank.icon_url && (
                  <img
                    src={user.current_rank.icon_url}
                    alt={user.current_rank.name}
                    className="w-4 h-4 object-contain"
                  />
                )}
                <span className="text-xs text-white/60">
                  {user.current_rank.name}
                </span>
              </div>
            )}
          </div>

          {/* XP display */}
          <div className="text-right">
            <p
              className={`
                text-lg font-bold font-mono
                ${isCurrentUser ? 'text-white' : 'text-white/80'}
              `}
            >
              {user.total_xp.toLocaleString()}
            </p>
            <p className="text-xs text-white/40">XP</p>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-white/60">Loading your position...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !positionData) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8">
          <p className="text-red-400 text-center">{error || 'No position data available'}</p>
        </div>
      </div>
    );
  }

  const { user, user_above, user_below, total_users } = positionData;

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Your Position</h3>
              <p className="text-sm text-white/60">
                Ranked #{user.rank} out of {total_users.toLocaleString()} users
              </p>
            </div>
          </div>
        </div>

        {/* Position context */}
        <div className="p-6 space-y-3">
          {/* User above */}
          {user_above && (
            <div className="relative">
              {renderUserRow(user_above, false, 'above')}
              <div className="absolute left-6 -bottom-2 text-xs text-white/40">
                ↑ Ahead of you
              </div>
            </div>
          )}

          {/* Current user (highlighted) */}
          <div className="relative">
            {renderUserRow(user, true, 'current')}
          </div>

          {/* User below */}
          {user_below && (
            <div className="relative">
              {renderUserRow(user_below, false, 'below')}
              <div className="absolute left-6 -top-2 text-xs text-white/40">
                ↓ Behind you
              </div>
            </div>
          )}

          {/* No users above/below messages */}
          {!user_above && user.rank === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <p className="text-sm text-yellow-400 font-medium">
                🏆 You're at the top of the leaderboard!
              </p>
            </motion.div>
          )}

          {!user_below && user.rank === total_users && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <p className="text-sm text-white/60">
                Keep earning XP to climb the ranks!
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
