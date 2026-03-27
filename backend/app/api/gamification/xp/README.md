# XP API Routes

This directory contains the API routes for XP (Experience Points) operations in the gamification system.

## Routes

### POST /api/gamification/xp/award

Award XP to a user. **Restricted to admin use only.**

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "userId": "uuid",
  "amount": 100,
  "source": "event_participation",
  "activityType": "registration",
  "referenceId": "uuid (optional)",
  "description": "Registered for Tech Talk 2024",
  "metadata": {
    "eventId": "uuid",
    "eventName": "Tech Talk 2024"
  }
}
```

**Valid Sources:**
- `event_participation`
- `code_contribution`
- `community_engagement`
- `challenge_completion`
- `helping_others`
- `profile_completion`

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "amount": 100,
  "source": "event_participation",
  "activityType": "registration",
  "referenceId": "uuid",
  "description": "Registered for Tech Talk 2024",
  "manualAdjustment": false,
  "metadata": {},
  "createdAt": "2024-03-27T10:00:00Z"
}
```

**Requirements:** 1.1, 1.4

---

### GET /api/gamification/xp/history

Get the authenticated user's XP transaction history with filtering and pagination.

**Authentication:** Required

**Query Parameters:**
- `source` (optional): Filter by XP source (e.g., `event_participation`)
- `startDate` (optional): ISO 8601 datetime string
- `endDate` (optional): ISO 8601 datetime string
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)

**Example Request:**
```
GET /api/gamification/xp/history?source=event_participation&page=1&pageSize=20
```

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "userId": "uuid",
      "amount": 100,
      "source": "event_participation",
      "activityType": "registration",
      "referenceId": "uuid",
      "description": "Registered for Tech Talk 2024",
      "manualAdjustment": false,
      "metadata": {},
      "createdAt": "2024-03-27T10:00:00Z"
    }
  ],
  "totalCount": 50,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

**Requirements:** 11.1, 11.2, 11.3, 11.4

---

### GET /api/gamification/xp/summary

Get XP summary statistics for the authenticated user (daily, weekly, monthly totals).

**Authentication:** Required

**Response (200):**
```json
{
  "daily": 50,
  "weekly": 200,
  "monthly": 800
}
```

**Requirements:** 11.5

---

### GET /api/gamification/xp/sources

Get all XP source configurations. **Public endpoint - no authentication required.**

**Authentication:** None

**Response (200):**
```json
[
  {
    "id": "uuid",
    "source": "event_participation",
    "baseAmount": 50,
    "multipliers": {
      "registration": 1.0,
      "check_in": 1.5,
      "completion": 2.0
    },
    "cooldownSeconds": 0,
    "maxPerHour": 500,
    "createdAt": "2024-03-27T10:00:00Z",
    "updatedAt": "2024-03-27T10:00:00Z"
  }
]
```

**Requirements:** 2.1, 2.2, 2.3

---

## Error Responses

All routes return standard error responses:

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "Admin access required"
}
```

**400 Bad Request:**
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "amount",
      "message": "Amount must be a positive integer"
    }
  ]
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## Implementation Details

- All routes use Zod for request validation
- Authentication is handled via Supabase Auth middleware
- Admin routes check for admin role in the profiles table
- XP operations are performed through the XPService class
- Rate limiting and fraud detection are applied automatically by XPService
- All XP awards trigger database triggers for total XP updates and rank recalculation

## Testing

Run tests with:
```bash
npm test -- xp-routes.test.ts
```

## Related Services

- `XPService` - Core XP business logic
- `BadgeService` - Badge unlock evaluation triggered by XP changes
- `RankService` - Rank updates triggered by XP changes
- `NotificationService` - Real-time XP notifications
