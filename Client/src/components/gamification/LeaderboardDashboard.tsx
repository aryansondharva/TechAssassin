/**
 * Leaderboard Dashboard Component
 * 
 * Example component showing how to use Leaderboard and UserPosition together.
 * This can be used as a reference or directly in the application.
 */

import { Leaderboard } from './Leaderboard';
import { UserPosition } from './UserPosition';

interface LeaderboardDashboardProps {
  userId: string;
  className?: string;
}

export const LeaderboardDashboard = ({
  userId,
  className = '',
}: LeaderboardDashboardProps) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Position - Shows where the user ranks */}
      <UserPosition userId={userId} />

      {/* Full Leaderboard - Shows top 100 users */}
      <Leaderboard defaultPeriod="all-time" limit={100} />
    </div>
  );
};
