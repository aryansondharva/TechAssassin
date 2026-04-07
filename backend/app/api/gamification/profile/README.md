# Profile Completion API

## Overview

The Profile Completion API tracks user profile completion and awards XP for completing profile fields.

## Endpoints

### GET /api/gamification/profile/completion/:userId

Get profile completion percentage and remaining fields for a user.

**Public route** - No authentication required

**Parameters:**
- `userId` (path) - User UUID

**Response:**
```json
{
  "userId": "uuid",
  "profile_completion_percentage": 60,
  "completed_fields": ["full_name", "bio", "avatar_url"],
  "remaining_fields": [
    {
      "name": "github_url",
      "display_name": "GitHub URL",
      "xp_amount": 20
    }
  ],
  "total_fields": 10
}
```

## Profile Fields

The following fields are tracked for completion:

| Field | Display Name | Weight | XP Amount |
|-------|-------------|--------|-----------|
| full_name | Full Name | 3 | 30 |
| bio | Bio | 2 | 20 |
| avatar_url | Profile Picture | 2 | 20 |
| phone | Phone Number | 1 | 10 |
| address | Address | 1 | 10 |
| education | Education | 2 | 20 |
| university | University | 2 | 20 |
| graduation_year | Graduation Year | 1 | 10 |
| github_url | GitHub URL | 2 | 20 |
| aadhaar_number | Aadhaar Number | 1 | 10 |

**Completion Bonus:** 50 XP awarded when profile reaches 100%

## XP Award Rules

1. XP is awarded only once per field (no duplicates)
2. XP is awarded when field is first completed
3. Bonus XP is awarded when profile reaches 100% completion
4. XP amounts are based on field importance (weight)

## Integration

Profile completion XP is automatically awarded when:
- User updates profile via PATCH /api/profile
- User uploads avatar via POST /api/profile/avatar

No manual integration required for XP awards.
