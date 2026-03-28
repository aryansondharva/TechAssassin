# XP Display Components

This directory contains React components for displaying and managing user XP (Experience Points) in the gamification system.

## Components

### XPDisplay

Shows the user's total XP with an animated counter and real-time updates via Supabase Realtime.

**Features:**
- Animated XP counter with smooth transitions
- Real-time XP updates via Supabase Realtime channels
- Toast notifications for XP gains
- Shows XP source and description
- Glow effect animation on XP increase

**Props:**
- `userId` (string, required): The user ID to display XP for
- `initialXP` (number, optional): Initial XP value (default: 0)
- `showNotifications` (boolean, optional): Whether to show toast notifications (default: true)
- `className` (string, optional): Additional CSS classes

**Usage:**
```tsx
import { XPDisplay } from '@/components/gamification';

function ProfilePage() {
  return (
    <XPDisplay 
      userId="user-id-here"
      initialXP={1500}
      showNotifications={true}
    />
  );
}
```

**Requirements:** 1.2, 8.1, 8.2, 8.4

---

### XPHistory

Displays a paginated list of XP transactions with filtering capabilities.

**Features:**
- Paginated transaction list with infinite scroll
- Filter by XP source (event_participation, code_contribution, etc.)
- Filter by date range (start date and end date)
- Color-coded source badges
- Manual adjustment indicators
- Relative timestamps (e.g., "2h ago", "3d ago")

**Props:**
- `userId` (string, optional): User ID to fetch history for (uses authenticated user if not provided)
- `pageSize` (number, optional): Number of transactions per page (default: 20)
- `showFilters` (boolean, optional): Whether to show filter controls (default: true)
- `className` (string, optional): Additional CSS classes

**Usage:**
```tsx
import { XPHistory } from '@/components/gamification';

function XPHistoryPage() {
  return (
    <XPHistory 
      pageSize={20}
      showFilters={true}
    />
  );
}
```

**Requirements:** 11.1, 11.2, 11.3, 11.4

---

### XPSummary

Displays daily, weekly, and monthly XP totals with visual progress bars and insights.

**Features:**
- Daily, weekly, and monthly XP totals
- Visual progress bars with animations
- Daily and weekly averages
- Trend indicators (comparing today vs average)
- Motivational messages based on activity
- Color-coded periods (blue for daily, purple for weekly, green for monthly)

**Props:**
- `userId` (string, optional): User ID to fetch summary for (uses authenticated user if not provided)
- `className` (string, optional): Additional CSS classes

**Usage:**
```tsx
import { XPSummary } from '@/components/gamification';

function DashboardPage() {
  return (
    <XPSummary />
  );
}
```

**Requirements:** 11.5

---

## API Endpoints

These components interact with the following backend API routes:

- `GET /api/gamification/xp/history` - Fetch XP transaction history
- `GET /api/gamification/xp/summary` - Fetch XP summary statistics
- `GET /api/gamification/xp/total` - Fetch user's total XP (used by XPDisplay)

## Supabase Realtime

The `XPDisplay` component subscribes to Supabase Realtime channels for live XP updates:

**Channel:** `gamification:xp:{userId}`
**Event:** `xp_gained`
**Payload:**
```typescript
{
  amount: number;
  source: string;
  newTotal: number;
  transaction: {
    id: string;
    description: string;
    activityType: string;
  };
}
```

## Styling

All components use:
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- Consistent dark theme with glass morphism effects

## Dependencies

- `@supabase/supabase-js` - Supabase client for Realtime
- `framer-motion` - Animation library
- `lucide-react` - Icon library
- `@/hooks/use-toast` - Toast notification hook

## Example: Complete XP Dashboard

```tsx
import { XPDisplay, XPHistory, XPSummary } from '@/components/gamification';

function XPDashboard({ userId }: { userId: string }) {
  return (
    <div className="space-y-6 p-6">
      {/* XP Display at the top */}
      <XPDisplay userId={userId} showNotifications={true} />
      
      {/* Summary and History side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <XPSummary userId={userId} />
        <XPHistory userId={userId} pageSize={10} />
      </div>
    </div>
  );
}
```

## Testing

To test these components:

1. Ensure the backend API routes are running
2. Ensure Supabase is configured with proper environment variables
3. Award XP to a user via the backend API
4. Observe real-time updates in the XPDisplay component
5. Check XPHistory for transaction records
6. Verify XPSummary shows correct totals

## Notes

- All components handle loading and error states
- XPHistory implements infinite scroll for better performance
- XPDisplay uses optimistic UI updates with Realtime sync
- Components are fully typed with TypeScript
- All components are responsive and mobile-friendly
