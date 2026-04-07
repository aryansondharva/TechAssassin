/**
 * XP Dashboard Component
 * 
 * Example component showing how to use XPDisplay, XPHistory, and XPSummary together.
 * This can be used as a reference or directly in the application.
 */

import { XPDisplay } from './XPDisplay';
import { XPHistory } from './XPHistory';
import { XPSummary } from './XPSummary';

interface XPDashboardProps {
  userId: string;
  initialXP?: number;
  className?: string;
}

export const XPDashboard = ({
  userId,
  initialXP,
  className = '',
}: XPDashboardProps) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* XP Display - Shows total XP with real-time updates */}
      <XPDisplay 
        userId={userId} 
        initialXP={initialXP}
        showNotifications={true}
      />

      {/* Summary and History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* XP Summary - Shows daily, weekly, monthly totals */}
        <XPSummary userId={userId} />

        {/* XP History - Shows transaction list with filters */}
        <XPHistory 
          userId={userId}
          pageSize={10}
          showFilters={true}
        />
      </div>
    </div>
  );
};
