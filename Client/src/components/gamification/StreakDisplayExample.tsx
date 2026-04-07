/**
 * StreakDisplay Usage Example
 * 
 * This file demonstrates how to use the StreakDisplay component
 * in a profile page or dashboard.
 */

import { StreakDisplay } from './StreakDisplay';
import { XPDisplay } from './XPDisplay';
import { RankDisplay } from './RankDisplay';

interface ProfileGamificationSectionProps {
  userId: string;
}

/**
 * Example: Profile Gamification Section
 * 
 * Shows all gamification stats including streaks, XP, and rank
 */
export const ProfileGamificationSection = ({ userId }: ProfileGamificationSectionProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Your Progress</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* XP Display */}
        <XPDisplay 
          userId={userId} 
          showNotifications={true}
        />
        
        {/* Streak Display */}
        <StreakDisplay userId={userId} />
        
        {/* Rank Display */}
        <RankDisplay 
          userId={userId} 
          showProgress={true}
        />
      </div>
    </div>
  );
};

/**
 * Example: Compact Streak Widget
 * 
 * Shows just the streak in a smaller format
 */
export const CompactStreakWidget = ({ userId }: ProfileGamificationSectionProps) => {
  return (
    <div className="max-w-sm">
      <StreakDisplay userId={userId} />
    </div>
  );
};

/**
 * Example: Dashboard Overview
 * 
 * Shows streak alongside other key metrics
 */
export const DashboardOverview = ({ userId }: ProfileGamificationSectionProps) => {
  return (
    <div className="bg-gray-900/50 rounded-3xl p-8 backdrop-blur-lg border border-white/10">
      <h2 className="text-3xl font-bold text-white mb-8">Dashboard</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <XPDisplay userId={userId} />
          <StreakDisplay userId={userId} />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <RankDisplay userId={userId} />
        </div>
      </div>
    </div>
  );
};
