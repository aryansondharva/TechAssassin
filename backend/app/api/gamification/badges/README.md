# Badge API Routes

This directory contains the Badge API routes for the User Gamification System.

## Implemented Routes

### 1. GET /api/gamification/badges
**File**: `route.ts`  
**Authentication**: Public (no auth required)  
**Requirements**: 3.1, 3.2, 3.3

Get all badges with optional filtering.

**Query Parameters**:
- `category` (optional): Filter by badge category (coding, community, events, streaks, mentorship, special)
- `rarity` (optional): Filter by rarity level (common, rare, epic, legendary)
- `isActive` (optional): Filter by active status (true/false)

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Badge Name",
    "description": "Badge description",
    "category": "coding",
    "rarityLevel": "legendary",
    "unlockCriteria": { ... },
    "iconUrl": "https://...",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### 2. GET /api/gamification/badges/:id
**File**: `[id]/route.ts`  
**Authentication**: Public (no auth required)  
**Requirements**: 3.1, 3.4

Get single badge by ID with unlock criteria.

**Response**:
```json
{
  "id": "uuid",
  "name": "Badge Name",
  "description": "Badge description",
  "category": "coding",
  "rarityLevel": "legendary",
  "unlockCriteria": {
    "type": "xp_threshold",
    "conditions": [
      {
        "field": "total_xp",
        "operator": "gte",
        "value": 1000
      }
    ]
  },
  "iconUrl": "https://...",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 3. GET /api/gamification/badges/user/:userId
**File**: `user/[userId]/route.ts`  
**Authentication**: Public (no auth required)  
**Requirements**: 5.1, 5.2, 5.3, 5.4, 5.5

Get all earned badges for a user, sorted by rarity (legendary first) then earned_at.

**Query Parameters**:
- `page` (optional, default: 1): Page number for pagination
- `pageSize` (optional, default: 20): Number of badges per page

**Response**:
```json
{
  "badges": [
    {
      "id": "uuid",
      "userId": "uuid",
      "badgeId": "uuid",
      "badge": { ... },
      "earnedAt": "2024-01-01T00:00:00Z",
      "manualAward": false
    }
  ],
  "totalCount": 15,
  "page": 1,
  "pageSize": 20,
  "hasMore": false,
  "categoryCounts": {
    "coding": 5,
    "community": 3,
    "events": 7
  },
  "rarityDistribution": {
    "common": 8,
    "rare": 4,
    "epic": 2,
    "legendary": 1
  }
}
```

### 4. GET /api/gamification/badges/progress/:userId
**File**: `progress/[userId]/route.ts`  
**Authentication**: Required (user can only view their own progress)  
**Requirements**: 12.1, 12.2, 12.3, 12.4

Get locked badges with progress percentages for the authenticated user.

**Response**:
```json
{
  "lockedBadges": [
    {
      "badge": { ... },
      "progress": {
        "badgeId": "uuid",
        "progress": 75,
        "conditions": [
          {
            "field": "total_xp",
            "current": 750,
            "required": 1000,
            "progress": 75
          }
        ],
        "isUnlocked": false
      }
    }
  ],
  "totalCount": 10
}
```

### 5. POST /api/gamification/badges/evaluate/:userId
**File**: `evaluate/[userId]/route.ts`  
**Authentication**: Required (user can only evaluate their own badges)  
**Requirements**: 4.1, 4.2

Trigger manual badge unlock evaluation for the authenticated user.

**Response**:
```json
{
  "newlyUnlocked": [
    {
      "id": "uuid",
      "userId": "uuid",
      "badgeId": "uuid",
      "badge": { ... },
      "earnedAt": "2024-01-01T00:00:00Z",
      "manualAward": false
    }
  ],
  "count": 1,
  "message": "Congratulations! You unlocked 1 new badge(s)!"
}
```

## Implementation Details

### Authentication
- Routes 1, 2, and 3 are public and do not require authentication
- Routes 4 and 5 require authentication and enforce that users can only access their own data

### Validation
- All routes use Zod for request validation
- UUID format validation for user IDs and badge IDs
- Query parameter validation with sensible defaults

### Error Handling
- Uses centralized `handleApiError` function
- Returns appropriate HTTP status codes (400, 401, 403, 404, 500)
- Provides user-friendly error messages

### Service Integration
- All routes use the `BadgeService` for business logic
- Service handles database operations, badge evaluation, and progress calculation
- Follows separation of concerns pattern

## Testing

Tests are located in `__tests__/badge-routes.test.ts` and cover:
- Public route access without authentication
- Authenticated route access control
- Query parameter filtering
- Pagination support
- Error handling for invalid inputs

## Related Files

- **Service**: `backend/services/badge-service.ts`
- **Middleware**: `backend/lib/middleware/auth.ts`
- **Error Handling**: `backend/lib/errors/handlers.ts`
- **Database Schema**: `backend/supabase/migrations/20260327000002_create_badges_table.sql`
