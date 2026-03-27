/**
 * Integration Example: Real-Time Components
 * 
 * This file demonstrates how to integrate the real-time presence and activity
 * components into existing pages like Dashboard and EventDetails.
 * 
 * DO NOT USE THIS FILE DIRECTLY - it's for reference only.
 */

import { useEffect } from 'react';
import { 
  ConnectionStatusIndicator,
  OnlineUsersList,
  ActivityFeed,
  LiveLeaderboard,
  PresenceIndicator 
} from '@/components/realtime';
import { getPresenceService } from '@/lib/services/presence-service';
import { getRealtimeManager } from '@/lib/services/realtime-manager';

/**
 * Example 1: Dashboard Page Integration
 * 
 * Add real-time features to the main dashboard:
 * - Connection status indicator
 * - Online users list
 * - Activity feed
 */
export function DashboardWithRealtime({ userId }: { userId: string }) {
  const presenceService = getPresenceService();
  const realtimeManager = getRealtimeManager();

  useEffect(() => {
    // Initialize services
    const init = async () => {
      // Connect to realtime
      await realtimeManager.connect();
      
      // Initialize presence tracking
      await presenceService.initialize(userId);
      
      // Track presence on dashboard
      presenceService.trackPresence({ type: 'page', id: 'dashboard' });
    };

    init();

    // Cleanup on unmount
    return () => {
      presenceService.stopTracking();
    };
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Connection status in top-right corner */}
      <ConnectionStatusIndicator position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-black mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Online users */}
          <div className="lg:col-span-1 space-y-6">
            <OnlineUsersList 
              location={{ type: 'page', id: 'dashboard' }}
              maxDisplay={15}
            />
          </div>
          
          {/* Main content - Activity feed */}
          <div className="lg:col-span-2">
            <ActivityFeed 
              showFilters={true}
              pageSize={20}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 2: Event Details Page Integration
 * 
 * Add real-time features to event pages:
 * - Live leaderboard
 * - Event-specific online users
 * - Activity feed filtered to event
 */
export function EventDetailsWithRealtime({ 
  eventId, 
  userId 
}: { 
  eventId: string; 
  userId: string;
}) {
  const presenceService = getPresenceService();
  const realtimeManager = getRealtimeManager();

  useEffect(() => {
    // Initialize services
    const init = async () => {
      await realtimeManager.connect();
      await presenceService.initialize(userId);
      
      // Track presence on this event page
      presenceService.trackPresence({ type: 'event', id: eventId });
    };

    init();

    return () => {
      presenceService.stopTracking();
    };
  }, [eventId, userId]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <ConnectionStatusIndicator position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-black mb-8">Event Details</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Online users for this event */}
            <OnlineUsersList 
              location={{ type: 'event', id: eventId }}
              maxDisplay={10}
            />
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live leaderboard */}
            <LiveLeaderboard 
              eventId={eventId}
              currentUserId={userId}
              liveMode={true}
              maxDisplay={10}
            />
            
            {/* Activity feed */}
            <ActivityFeed 
              showFilters={true}
              pageSize={15}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: User Profile with Presence
 * 
 * Show user presence indicator on profile pages
 */
export function UserProfileWithPresence({ 
  userId, 
  username 
}: { 
  userId: string; 
  username: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <img 
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
        alt={username}
        className="w-16 h-16 rounded-full"
      />
      <div>
        <h3 className="text-xl font-bold">{username}</h3>
        <PresenceIndicator 
          userId={userId}
          showLastSeen={true}
          size="md"
        />
      </div>
    </div>
  );
}

/**
 * Example 4: Minimal Integration (Just Connection Status)
 * 
 * Add only connection status indicator to any page
 */
export function MinimalRealtimeIntegration() {
  const realtimeManager = getRealtimeManager();

  useEffect(() => {
    realtimeManager.connect();
    
    return () => {
      realtimeManager.disconnect();
    };
  }, []);

  return <ConnectionStatusIndicator position="top-right" />;
}

/**
 * Example 5: Custom Activity Feed with Filters
 * 
 * Show activity feed with pre-applied filters
 */
export function CustomActivityFeed({ userId }: { userId: string }) {
  const activityService = getActivityService();

  useEffect(() => {
    // Pre-filter to show only challenge completions
    activityService.setFilter({ type: 'challenge_solved' });
    
    return () => {
      activityService.clearFilter();
    };
  }, []);

  return (
    <ActivityFeed 
      showFilters={false}
      pageSize={10}
      className="max-w-2xl mx-auto"
    />
  );
}

/**
 * Integration Steps:
 * 
 * 1. Import components:
 *    import { ConnectionStatusIndicator, ActivityFeed } from '@/components/realtime';
 * 
 * 2. Import services:
 *    import { getRealtimeManager, getPresenceService } from '@/lib/services';
 * 
 * 3. Initialize in useEffect:
 *    useEffect(() => {
 *      const init = async () => {
 *        await realtimeManager.connect();
 *        await presenceService.initialize(userId);
 *      };
 *      init();
 *    }, []);
 * 
 * 4. Add components to JSX:
 *    <ConnectionStatusIndicator position="top-right" />
 *    <ActivityFeed showFilters={true} />
 * 
 * 5. Cleanup on unmount:
 *    return () => {
 *      presenceService.stopTracking();
 *    };
 */

// Import statement for reference
import { getActivityService } from '@/lib/services/activity-service';
