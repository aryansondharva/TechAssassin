# Real-Time Presence & Activity Components

This directory contains React components for the Real-Time Presence & Activity System.

## Components

### PresenceIndicator
Displays a user's online status with a color-coded badge and optional last seen timestamp.

```tsx
import { PresenceIndicator } from '@/components/PresenceIndicator';

<PresenceIndicator 
  userId="user-123" 
  showLastSeen={true}
  size="md"
/>
```

**Props:**
- `userId` (string, required): The user ID to display presence for
- `showLastSeen` (boolean, optional): Whether to show last seen timestamp for offline users
- `size` ('sm' | 'md' | 'lg', optional): Size of the indicator badge
- `className` (string, optional): Additional CSS classes

**Status Colors:**
- 🟢 Green: Online
- 🟡 Yellow: Away
- 🔴 Red: Busy
- ⚫ Gray: Offline

---

### OnlineUsersList
Displays a list of currently online users with real-time updates.

```tsx
import { OnlineUsersList } from '@/components/OnlineUsersList';

<OnlineUsersList 
  location={{ type: 'event', id: 'event-123' }}
  maxDisplay={10}
/>
```

**Props:**
- `location` (object, optional): Filter users by location (page or event)
- `maxDisplay` (number, optional): Maximum number of users to display (default: 10)
- `className` (string, optional): Additional CSS classes

---

### ActivityItem
Renders a single activity event with metadata and animations.

```tsx
import { ActivityItem } from '@/components/ActivityItem';

<ActivityItem activity={activityEvent} />
```

**Props:**
- `activity` (ActivityEvent, required): The activity event to display
- `className` (string, optional): Additional CSS classes

**Activity Types:**
- `challenge_solved`: User solved a challenge
- `event_joined`: User joined an event
- `badge_earned`: User earned a badge
- `team_registered`: Team registered for an event

---

### ActivityFeed
Displays a real-time activity feed with filtering and infinite scroll.

```tsx
import { ActivityFeed } from '@/components/ActivityFeed';

<ActivityFeed 
  showFilters={true}
  pageSize={20}
/>
```

**Props:**
- `showFilters` (boolean, optional): Whether to show filter controls (default: true)
- `pageSize` (number, optional): Number of activities per page (default: 20)
- `className` (string, optional): Additional CSS classes

**Features:**
- Real-time updates via WebSocket
- Filter by activity type
- Infinite scroll pagination
- Fade-in animations for new activities
- Pending indicators for optimistic updates

---

### LiveLeaderboard
Displays a real-time leaderboard with rank changes and animations.

```tsx
import { LiveLeaderboard } from '@/components/LiveLeaderboard';

<LiveLeaderboard 
  eventId="event-123"
  currentUserId="user-456"
  liveMode={true}
  maxDisplay={10}
/>
```

**Props:**
- `eventId` (string, required): The event ID for the leaderboard
- `currentUserId` (string, optional): Current user ID to highlight
- `liveMode` (boolean, optional): Enable live competition mode (default: false)
- `maxDisplay` (number, optional): Maximum entries to display (default: 10)
- `className` (string, optional): Additional CSS classes

**Features:**
- Real-time score updates
- Animated rank changes
- Current user highlighting
- Rank change indicators (up/down arrows)
- Special styling for top 3 ranks

---

### ConnectionStatusIndicator
Displays the WebSocket connection status with reconnection controls.

```tsx
import { ConnectionStatusIndicator } from '@/components/ConnectionStatusIndicator';

<ConnectionStatusIndicator position="top-right" />
```

**Props:**
- `position` ('top-left' | 'top-right' | 'bottom-left' | 'bottom-right', optional): Position on screen (default: 'top-right')
- `className` (string, optional): Additional CSS classes

**Connection States:**
- 🟢 Connected: Hidden by default (everything working)
- 🔴 Disconnected: Shows with manual reconnect button
- 🟡 Reconnecting: Shows with attempt counter and progress bar

**Features:**
- Automatic reconnection with exponential backoff
- Manual reconnect button
- Dismissible notification
- Reconnection attempt counter
- Animated progress indicator

---

## Usage Example

Here's a complete example integrating multiple components:

```tsx
import { 
  ConnectionStatusIndicator,
  OnlineUsersList,
  ActivityFeed,
  LiveLeaderboard 
} from '@/components/realtime';

function EventPage({ eventId, currentUserId }) {
  return (
    <div className="container mx-auto p-6">
      {/* Connection status in top-right corner */}
      <ConnectionStatusIndicator position="top-right" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Online users */}
        <div className="lg:col-span-1">
          <OnlineUsersList 
            location={{ type: 'event', id: eventId }}
            maxDisplay={15}
          />
        </div>
        
        {/* Main content - Leaderboard and Activity */}
        <div className="lg:col-span-2 space-y-6">
          <LiveLeaderboard 
            eventId={eventId}
            currentUserId={currentUserId}
            liveMode={true}
            maxDisplay={10}
          />
          
          <ActivityFeed 
            showFilters={true}
            pageSize={20}
          />
        </div>
      </div>
    </div>
  );
}
```

## Services

The components use the following services from `@/lib/services`:

- `getRealtimeManager()`: WebSocket connection management
- `getPresenceService()`: User presence tracking
- `getActivityService()`: Activity feed management
- `getLeaderboardService()`: Leaderboard updates

These services are automatically initialized and handle:
- WebSocket connections
- Real-time subscriptions
- Optimistic updates
- Error handling
- State synchronization

## Styling

All components use:
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- Dark theme with glass morphism effects

The components follow the TechAssassin design system with:
- Red accent colors (#dc2626)
- Dark backgrounds (#0a0a0b)
- Glass morphism effects (backdrop-blur)
- Smooth animations and transitions

## Requirements Validated

These components implement the following requirements:

- **Requirement 1.4**: Color-coded presence indicators
- **Requirement 1.5**: Active user count display
- **Requirement 2.2**: Last seen timestamps
- **Requirement 3.3**: Activity display with avatars and metadata
- **Requirement 3.5**: Chronological activity ordering
- **Requirement 4.1-4.2**: Activity filtering
- **Requirement 5.2**: Animated rank changes
- **Requirement 5.3**: Current user highlighting
- **Requirement 5.5**: Rank change indicators
- **Requirement 6.4**: Connection state indicators
- **Requirement 7.5**: Pending update indicators
- **Requirement 10.1**: Fade-in animations
- **Requirement 10.2**: Rank change animations
- **Requirement 10.3**: Status color coding
