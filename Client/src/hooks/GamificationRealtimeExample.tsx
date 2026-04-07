/**
 * Gamification Realtime Example Component
 * 
 * Demonstrates how to use all gamification realtime hooks together
 * in a real-world scenario.
 * 
 * This example shows:
 * - Subscribing to multiple realtime channels
 * - Handling XP gains with toast notifications
 * - Showing badge unlock modals
 * - Displaying rank-up notifications
 * - Updating leaderboard in real-time
 */

import React, { useState } from 'react';
import { useXPRealtime } from './useXPRealtime';
import { useBadgeRealtime } from './useBadgeRealtime';
import { useRankRealtime } from './useRankRealtime';
import { useLeaderboardRealtime } from './useLeaderboardRealtime';

// Mock components (replace with actual components)
const Toast = ({ message, type }: { message: string; type: string }) => (
  <div className={`toast toast-${type}`}>{message}</div>
);

const BadgeModal = ({ badge, isOpen, onClose }: any) => {
  if (!isOpen) return null;
  return (
    <div className="modal">
      <h2>Badge Unlocked!</h2>
      <p>{badge?.name}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

const RankUpModal = ({ data, isOpen, onClose }: any) => {
  if (!isOpen) return null;
  return (
    <div className="modal">
      <h2>Rank Up!</h2>
      <p>You reached {data?.newRank?.name}!</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

interface GamificationRealtimeExampleProps {
  userId: string;
}

export function GamificationRealtimeExample({ userId }: GamificationRealtimeExampleProps) {
  // Toast notifications
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: string }>>([]);
  
  // Badge unlock modal
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<any>(null);
  
  // Rank up modal
  const [rankUpModalOpen, setRankUpModalOpen] = useState(false);
  const [rankUpData, setRankUpData] = useState<any>(null);

  // Subscribe to XP updates
  const xp = useXPRealtime(userId, {
    onXPGained: (payload) => {
      // Show toast notification
      const toastId = Date.now();
      setToasts(prev => [...prev, {
        id: toastId,
        message: `+${payload.amount} XP from ${payload.source}!`,
        type: 'success'
      }]);
      
      // Auto-remove toast after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 3000);
      
      console.log('XP gained:', payload);
    },
    onError: (error) => {
      console.error('XP subscription error:', error);
      setToasts(prev => [...prev, {
        id: Date.now(),
        message: 'Connection error. Reconnecting...',
        type: 'error'
      }]);
    }
  });

  // Subscribe to badge unlocks
  const badges = useBadgeRealtime(userId, {
    onBadgeUnlocked: (payload) => {
      // Show badge unlock modal
      setCurrentBadge(payload.badge);
      setBadgeModalOpen(true);
      
      // Play celebration sound (if available)
      // playSound('badge-unlock.mp3');
      
      console.log('Badge unlocked:', payload);
    }
  });

  // Subscribe to rank changes
  const ranks = useRankRealtime(userId, {
    onRankUp: (payload) => {
      // Show rank-up modal
      setRankUpData(payload);
      setRankUpModalOpen(true);
      
      // Play rank-up sound (if available)
      // playSound('rank-up.mp3');
      
      console.log('Rank up:', payload);
    }
  });

  // Subscribe to leaderboard updates
  const leaderboard = useLeaderboardRealtime({
    onLeaderboardUpdate: (payload) => {
      // Show notification if it's the current user
      if (payload.userId === userId) {
        const toastId = Date.now();
        setToasts(prev => [...prev, {
          id: toastId,
          message: `You moved to rank #${payload.newRank}!`,
          type: 'info'
        }]);
        
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 3000);
      }
      
      console.log('Leaderboard update:', payload);
    }
  });

  return (
    <div className="gamification-realtime-example">
      {/* Connection Status */}
      <div className="connection-status">
        <div className="status-item">
          <span>XP:</span>
          <span className={xp.isConnected ? 'connected' : 'disconnected'}>
            {xp.isConnected ? '● Live' : '○ Offline'}
          </span>
        </div>
        <div className="status-item">
          <span>Badges:</span>
          <span className={badges.isConnected ? 'connected' : 'disconnected'}>
            {badges.isConnected ? '● Live' : '○ Offline'}
          </span>
        </div>
        <div className="status-item">
          <span>Ranks:</span>
          <span className={ranks.isConnected ? 'connected' : 'disconnected'}>
            {ranks.isConnected ? '● Live' : '○ Offline'}
          </span>
        </div>
        <div className="status-item">
          <span>Leaderboard:</span>
          <span className={leaderboard.isConnected ? 'connected' : 'disconnected'}>
            {leaderboard.isConnected ? '● Live' : '○ Offline'}
          </span>
        </div>
      </div>

      {/* Current Stats */}
      <div className="current-stats">
        <div className="stat">
          <h3>Total XP</h3>
          <p>{xp.totalXP ?? 'Loading...'}</p>
        </div>
        <div className="stat">
          <h3>Current Rank</h3>
          <p>{ranks.currentRank?.name ?? 'Loading...'}</p>
        </div>
        <div className="stat">
          <h3>Badges Unlocked</h3>
          <p>{badges.unlockedBadges.length}</p>
        </div>
      </div>

      {/* Last Updates */}
      <div className="last-updates">
        {xp.lastUpdate && (
          <div className="update">
            <strong>Last XP Gain:</strong> +{xp.lastUpdate.amount} from {xp.lastUpdate.source}
          </div>
        )}
        {badges.lastBadgeUnlocked && (
          <div className="update">
            <strong>Last Badge:</strong> {badges.lastBadgeUnlocked.badge.name}
          </div>
        )}
        {ranks.lastRankUp && (
          <div className="update">
            <strong>Last Rank Up:</strong> {ranks.lastRankUp.newRank.name}
          </div>
        )}
        {leaderboard.lastUpdate && (
          <div className="update">
            <strong>Last Leaderboard Update:</strong> User moved to rank #{leaderboard.lastUpdate.newRank}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>

      {/* Modals */}
      <BadgeModal
        badge={currentBadge}
        isOpen={badgeModalOpen}
        onClose={() => setBadgeModalOpen(false)}
      />
      <RankUpModal
        data={rankUpData}
        isOpen={rankUpModalOpen}
        onClose={() => setRankUpModalOpen(false)}
      />
    </div>
  );
}

// Example usage in a page component
export function ExampleUsage() {
  // Get current user from auth context
  const userId = 'example-user-id'; // Replace with actual user ID from auth

  return (
    <div>
      <h1>Gamification Dashboard</h1>
      <GamificationRealtimeExample userId={userId} />
    </div>
  );
}
