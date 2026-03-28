# Admin Dashboard Components

This directory contains React components for the gamification system admin dashboard.

## Components

### 1. XPManagementPanel
**File:** `XPManagementPanel.tsx`  
**Requirements:** 2.1, 2.2, 2.4, 2.5, 14.1, 14.2, 14.3, 14.4, 20.3, 20.5

Admin interface for managing XP sources, manual adjustments, and monitoring suspicious activity.

**Features:**
- Display XP source configurations with edit capability
- Form to update base amounts, multipliers, cooldowns, max per hour
- Manual XP adjustment form with reason field
- View flagged users and suspicious activity
- Real-time validation and error handling

**Tabs:**
- **XP Sources:** Configure base amounts, cooldowns, and rate limits
- **Manual Adjustment:** Award or deduct XP with audit trail
- **Flagged Users:** View users with suspicious activity patterns

**API Endpoints Used:**
- `GET /api/gamification/admin/xp/sources` (via Supabase)
- `POST /api/gamification/admin/xp/adjust`

---

### 2. BadgeManagementPanel
**File:** `BadgeManagementPanel.tsx`  
**Requirements:** 3.5, 13.1, 13.2, 13.3, 13.4

Admin interface for creating, editing, and managing badges.

**Features:**
- List all badges with create/edit/deactivate actions
- Visual badge criteria builder for unlock_criteria JSON
- Manual badge award form (select user and badge)
- Manual badge revocation form with reason field
- Badge statistics (earn rates, rarity distribution)

**Tabs:**
- **All Badges:** List view with edit and deactivate actions
- **Create/Edit:** Form for badge properties and unlock criteria
- **Manual Actions:** Award or revoke badges manually
- **Statistics:** Earn rates and rarity distribution

**API Endpoints Used:**
- `POST /api/gamification/admin/badges`
- `PUT /api/gamification/admin/badges/:id`
- `DELETE /api/gamification/admin/badges/:id`
- `POST /api/gamification/admin/badges/award`
- `POST /api/gamification/admin/badges/revoke`

---

### 3. RankManagementPanel
**File:** `RankManagementPanel.tsx`  
**Requirements:** 15.1, 15.2, 15.4

Admin interface for managing rank tiers and XP thresholds.

**Features:**
- List all rank tiers with create/edit actions
- Drag-and-drop rank reordering interface (up/down buttons)
- XP threshold visualization chart
- Rank distribution chart showing user counts per rank
- Form to set rank-specific perks (JSON)

**Visualizations:**
- Bar chart showing XP thresholds for each rank
- Pie chart showing user distribution across ranks
- List view with user counts and percentages

**API Endpoints Used:**
- `POST /api/gamification/admin/ranks`
- `PUT /api/gamification/admin/ranks/:id`
- `POST /api/gamification/admin/ranks/reorder`

---

### 4. AnalyticsDashboard
**File:** `AnalyticsDashboard.tsx`  
**Requirements:** All (analytics)

Admin interface for viewing XP trends, badge unlock rates, and engagement metrics.

**Features:**
- XP earning trends over time (line chart)
- Badge unlock rates (bar chart)
- User engagement metrics (cards)
- Leaderboard movement tracking
- Time range selector (7d, 30d, 90d)

**Metrics Displayed:**
- Active Users
- Total XP Awarded
- Badges Unlocked
- Rank Ups

**Visualizations:**
- Line chart: Daily XP awarded and transaction volume
- Bar chart: Top 10 most unlocked badges
- Category distribution: Badge unlocks by category

**Data Sources:**
- Supabase queries on `xp_transactions`, `user_badges`, `user_ranks_history`

---

### 5. AuditLogViewer
**File:** `AuditLogViewer.tsx`  
**Requirements:** 13.5, 14.5

Admin interface for viewing all manual adjustments, configuration changes, and flagged activity.

**Features:**
- Display all manual adjustments with filters
- Show configuration changes with timestamps
- Display flagged activity reports
- Export audit log to CSV
- Pagination support

**Filters:**
- Action Type (XP adjustments, badge awards/revocations, config changes)
- Date Range (start and end date)
- Admin ID (optional)

**API Endpoints Used:**
- `GET /api/gamification/admin/audit`

**Export:**
- CSV export with all audit log entries and metadata

---

## Usage

### Importing Components

```typescript
import {
  XPManagementPanel,
  BadgeManagementPanel,
  RankManagementPanel,
  AnalyticsDashboard,
  AuditLogViewer
} from '@/components/gamification/admin';
```

### Example: Admin Dashboard Page

```typescript
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  XPManagementPanel,
  BadgeManagementPanel,
  RankManagementPanel,
  AnalyticsDashboard,
  AuditLogViewer
} from '@/components/gamification/admin';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gamification Admin Dashboard</h1>
      
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="xp">XP Management</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="ranks">Ranks</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="xp">
          <XPManagementPanel />
        </TabsContent>

        <TabsContent value="badges">
          <BadgeManagementPanel />
        </TabsContent>

        <TabsContent value="ranks">
          <RankManagementPanel />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

---

## Dependencies

### UI Components (shadcn/ui)
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Button`
- `Input`
- `Label`
- `Alert`, `AlertDescription`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Textarea`
- `Badge`

### Charts (recharts)
- `LineChart`, `Line`
- `BarChart`, `Bar`
- `PieChart`, `Pie`, `Cell`
- `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`

### Icons (lucide-react)
- `AlertCircle`, `Save`, `RefreshCw`, `Plus`, `Edit`, `Trash2`, `Award`
- `TrendingUp`, `Users`, `Activity`, `BarChart3`, `Download`, `Filter`, `Calendar`

### Data & API
- `@/lib/supabase/client` - Supabase client for database queries
- Fetch API for admin endpoints

---

## Authentication & Authorization

All admin components assume the user has admin privileges. The backend API routes handle authentication and authorization checks using the `requireAdminAuth` middleware.

**Security Notes:**
- All admin actions are logged to the audit trail
- Manual adjustments require a reason field
- Rate limiting is enforced on admin endpoints
- All operations are validated server-side

---

## Error Handling

All components include:
- Loading states with spinner
- Error alerts with descriptive messages
- Success notifications with auto-dismiss
- Form validation
- API error handling

---

## Styling

Components use Tailwind CSS classes and follow the shadcn/ui design system:
- Consistent spacing and typography
- Responsive grid layouts
- Color-coded badges for different action types
- Accessible form controls
- Dark mode support (via shadcn/ui theme)

---

## Testing

To test admin components:

1. **Authentication:** Ensure user has admin role in `profiles` table
2. **API Endpoints:** Verify all admin API routes are deployed
3. **Database:** Ensure all gamification tables exist with proper RLS policies
4. **Permissions:** Test with non-admin user to verify access denial

---

## Future Enhancements

Potential improvements:
- Real-time updates using Supabase Realtime subscriptions
- Advanced filtering and search capabilities
- Bulk operations (e.g., award badge to multiple users)
- More detailed analytics and reporting
- Scheduled tasks and automation
- Role-based access control (different admin levels)
- Activity notifications for admins
- Data export in multiple formats (JSON, Excel)

---

## Support

For issues or questions:
- Check the main gamification README at `Client/src/components/gamification/README.md`
- Review the design document at `.kiro/specs/user-gamification-system/design.md`
- Check API documentation in backend routes
