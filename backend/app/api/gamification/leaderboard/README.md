# Leaderboard API

## Overview

The Leaderboard API provides endpoints for retrieving user rankings based on XP (Experience Points). It includes caching, period filtering, and position lookup functionality.

## Endpoints

### GET /api/gamification/leaderboard

Get leaderboard rankings with optional filtering.

**Query Parameters:**
- `period` (optional): Time period filter - `all-time`, `monthly`, `weekly` (default: `all-time`)
- `limit` (optional): Number of users to return (default: 100, max: 1000)

**Response:**
```json
{
  "period": "all-time",
  "limit": 100,
  "count": 100,
  "leaderboard": [
    {
      "id": "uuid",
      "username": "user1",
      "avatar_url": "https://...",
      "total_xp": 5000,
      "rank": 1,
      "current_rank": {
        "name": "Master",
        "icon_url": "https://..."
      }
    }
  ]
}
```

### GET /api/gamification/leaderboard/position/[userId]

Find a user's position in the leaderboard with context (users above/below).

**Response:**
```json
{
  "user": { "id": "...", "rank": 42, ... },
  "user_above": { "id": "...", "rank": 41, ... },
  "user_below": { "id": "...", "rank": 43, ... },
  "total_users": 1000
}
```


### POST /api/gamification/leaderboard/cache

Manually refresh leaderboard cache (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "Leaderboard cache cleared successfully"
}
```

### GET /api/gamification/leaderboard/cache

Get cache statistics (Admin only).

**Response:**
```json
{
  "success": true,
  "stats": {
    "size": 3,
    "keys": ["leaderboard:all-time:100", ...],
    "oldestEntry": "2024-01-01T00:00:00Z",
    "newestEntry": "2024-01-01T00:01:00Z"
  }
}
```

## Caching

- **TTL**: 60 seconds
- **Invalidation**: Automatic on XP changes >100 XP
- **Manual Refresh**: Available via admin endpoint

## Requirements

Implements requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
