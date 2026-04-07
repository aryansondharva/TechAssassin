import { motion } from 'framer-motion';
import { Trophy, Calendar, Award, Users, Loader2 } from 'lucide-react';
import type { ActivityEvent } from '@/lib/services/activity-service';

interface ActivityItemProps {
  activity: ActivityEvent;
  className?: string;
}

const activityIcons = {
  challenge_solved: Trophy,
  event_joined: Calendar,
  badge_earned: Award,
  team_registered: Users,
};

const activityColors = {
  challenge_solved: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  event_joined: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  badge_earned: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  team_registered: 'text-green-500 bg-green-500/10 border-green-500/20',
};

const getActivityDescription = (activity: ActivityEvent): string => {
  switch (activity.type) {
    case 'challenge_solved':
      return `solved ${activity.metadata.challengeName || 'a challenge'}`;
    case 'event_joined':
      return `joined ${activity.metadata.eventName || 'an event'}`;
    case 'badge_earned':
      return `earned ${activity.metadata.badgeName || 'a badge'}`;
    case 'team_registered':
      return `registered team ${activity.metadata.teamName || 'for an event'}`;
    default:
      return 'performed an action';
  }
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(date).toLocaleDateString();
};

export const ActivityItem = ({ activity, className = '' }: ActivityItemProps) => {
  const Icon = activityIcons[activity.type];
  const colorClass = activityColors[activity.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`relative group ${className}`}
    >
      <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all">
        {/* Icon */}
        <div className={`p-2 rounded-xl ${colorClass} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              {/* Avatar */}
              <img
                src={activity.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.userId}`}
                alt={activity.username}
                className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex-shrink-0"
              />
              
              {/* Username and action */}
              <p className="text-sm text-white/90 truncate">
                <span className="font-bold text-white">{activity.username}</span>
                {' '}
                <span className="text-white/60">{getActivityDescription(activity)}</span>
              </p>
            </div>

            {/* Timestamp */}
            <span className="text-xs text-white/40 font-mono whitespace-nowrap flex-shrink-0">
              {formatTimestamp(activity.createdAt)}
            </span>
          </div>

          {/* Metadata */}
          {Object.keys(activity.metadata).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {activity.metadata.challengeName && (
                <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/60 font-mono">
                  {activity.metadata.challengeName}
                </span>
              )}
              {activity.metadata.eventName && (
                <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/60 font-mono">
                  {activity.metadata.eventName}
                </span>
              )}
              {activity.metadata.badgeName && (
                <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/60 font-mono">
                  {activity.metadata.badgeName}
                </span>
              )}
              {activity.metadata.teamName && (
                <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/60 font-mono">
                  {activity.metadata.teamName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pending indicator */}
        {activity.isPending && (
          <div className="absolute top-2 right-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-4 h-4 text-white/40" />
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
