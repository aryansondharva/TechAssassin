import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getPresenceService } from '@/lib/services/presence-service';
import type { UserStatus } from '@/lib/services/presence-service';

interface PresenceIndicatorProps {
  userId: string;
  showLastSeen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-500',
};

const statusLabels = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export const PresenceIndicator = ({
  userId,
  showLastSeen = false,
  size = 'md',
  className = '',
}: PresenceIndicatorProps) => {
  const [status, setStatus] = useState<UserStatus>('offline');
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const presenceService = getPresenceService();

  useEffect(() => {
    // Get initial status
    const currentStatus = presenceService.getUserStatus(userId);
    if (currentStatus) {
      setStatus(currentStatus);
    }

    // Get last seen if offline
    if (showLastSeen && currentStatus === 'offline') {
      const formatted = presenceService.formatLastSeen(userId);
      setLastSeen(formatted);
    }

    // Subscribe to status changes
    const subscription = presenceService.onUserStatusChange(userId, (newStatus) => {
      setStatus(newStatus);
      
      if (showLastSeen && newStatus === 'offline') {
        const formatted = presenceService.formatLastSeen(userId);
        setLastSeen(formatted);
      } else {
        setLastSeen(null);
      }
    });

    // Update last seen every minute for offline users
    const interval = setInterval(() => {
      if (status === 'offline' && showLastSeen) {
        const formatted = presenceService.formatLastSeen(userId);
        setLastSeen(formatted);
      }
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [userId, showLastSeen, presenceService, status]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size]} rounded-full ${statusColors[status]}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
        {status === 'online' && (
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full ${statusColors[status]} opacity-75`}
            animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      
      {showLastSeen && (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-white/70">{statusLabels[status]}</span>
          {lastSeen && status === 'offline' && (
            <span className="text-[10px] text-white/40">{lastSeen}</span>
          )}
        </div>
      )}
    </div>
  );
};
