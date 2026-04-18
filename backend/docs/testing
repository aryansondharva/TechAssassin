# API Endpoint Testing Guide

This document provides manual testing instructions for all TechAssassin backend API endpoints.

## Prerequisites

1. Backend server running: `npm run dev`
2. Supabase project configured with proper environment variables
3. At least one admin user created in the database
4. API testing tool (Postman, Thunder Client, or curl)

## Base URL

```
http://localhost:3000/api
```

## 1. Health Check

### GET /health
**Purpose:** Verify API is running

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T...",
  "message": "TechAssassin Backend API is running"
}
```

## 2. Authentication Endpoints

### POST /auth/signup
**Purpose:** Create new user account

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:** User object with session token

### POST /auth/signin
**Purpose:** Authenticate existing user

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:** User object with session token

### POST /auth/signout
**Purpose:** End user session

```bash
curl -X POST http://localhost:3000/api/auth/signout \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

**Expected Response:** Success message

### POST /auth/reset-password
**Purpose:** Request password reset

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response:** Success message

## 3. Profile Endpoints

### GET /profile
**Purpose:** Get current user's profile
**Auth Required:** Yes

```bash
curl http://localhost:3000/api/profile \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

**Expected Response:** Profile object with all fields

### GET /profile/[id]
**Purpose:** Get specific user's public profile
**Auth Required:** No

```bash
curl http://localhost:3000/api/profile/USER_ID
```

**Expected Response:** Public profile fields

### PATCH /profile
**Purpose:** Update current user's profile
**Auth Required:** Yes

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "username": "newusername",
    "full_name": "John Doe",
    "skills": ["JavaScript", "TypeScript", "React"]
  }'
```

**Expected Response:** Updated profile object

### POST /profile/avatar
**Purpose:** Upload user avatar
**Auth Required:** Yes

```bash
curl -X POST http://localhost:3000/api/profile/avatar \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -F "file=@/path/to/avatar.jpg"
```

**Expected Response:** Profile with updated avatar_url

## 4. Event Endpoints

### GET /events
**Purpose:** List events with optional filters

```bash
# All events
curl http://localhost:3000/api/events

# Filter by status
curl "http://localhost:3000/api/events?status=live"

# With pagination
curl "http://localhost:3000/api/events?page=1&limit=10"
```

**Expected Response:** Array of events with participant counts

### GET /events/[id]
**Purpose:** Get single event details

```bash
curl http://localhost:3000/api/events/EVENT_ID
```

**Expected Response:** Event object with participant count

### POST /events
**Purpose:** Create new event
**Auth Required:** Yes (Admin only)

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -d '{
    "title": "Spring Hackathon 2026",
    "description": "A 48-hour coding challenge",
    "start_date": "2026-03-15T09:00:00Z",
    "end_date": "2026-03-17T17:00:00Z",
    "location": "Tech Hub, San Francisco",
    "max_participants": 100,
    "registration_open": true,
    "themes": ["AI", "Web3", "Healthcare"],
    "prizes": {
      "first": "$5000",
      "second": "$3000",
      "third": "$1000"
    }
  }'
```

**Expected Response:** Created event object

### PATCH /events/[id]
**Purpose:** Update event
**Auth Required:** Yes (Admin only)

```bash
curl -X PATCH http://localhost:3000/api/events/EVENT_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -d '{
    "registration_open": false
  }'
```

**Expected Response:** Updated event object

### DELETE /events/[id]
**Purpose:** Delete event
**Auth Required:** Yes (Admin only)

```bash
curl -X DELETE http://localhost:3000/api/events/EVENT_ID \
  -H "Cookie: sb-access-token=ADMIN_TOKEN"
```

**Expected Response:** Success message

### POST /events/[id]/images
**Purpose:** Upload event images
**Auth Required:** Yes (Admin only)

```bash
curl -X POST http://localhost:3000/api/events/EVENT_ID/images \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg"
```

**Expected Response:** Event with updated image_urls

## 5. Registration Endpoints

### POST /registrations
**Purpose:** Register for an event
**Auth Required:** Yes

```bash
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "event_id": "EVENT_ID",
    "team_name": "Code Warriors",
    "project_idea": "An AI-powered task management app that learns from user behavior"
  }'
```

**Expected Response:** Registration object with status (confirmed/waitlisted)

### GET /registrations
**Purpose:** Get current user's registrations
**Auth Required:** Yes

```bash
curl http://localhost:3000/api/registrations \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

**Expected Response:** Array of user's registrations with event details

### GET /registrations/event/[eventId]
**Purpose:** Get all registrations for an event
**Auth Required:** Yes (Admin only)

```bash
curl http://localhost:3000/api/registrations/event/EVENT_ID \
  -H "Cookie: sb-access-token=ADMIN_TOKEN"
```

**Expected Response:** Array of registrations with user profiles

### PATCH /registrations/[id]
**Purpose:** Update registration status
**Auth Required:** Yes (Admin only)

```bash
curl -X PATCH http://localhost:3000/api/registrations/REGISTRATION_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -d '{
    "status": "confirmed"
  }'
```

**Expected Response:** Updated registration object

## 6. Announcement Endpoints

### GET /announcements
**Purpose:** List announcements
**Auth Required:** Yes

```bash
# All announcements
curl http://localhost:3000/api/announcements \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# With pagination
curl "http://localhost:3000/api/announcements?page=1&limit=20" \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

**Expected Response:** Array of announcements with author info

### POST /announcements
**Purpose:** Create announcement
**Auth Required:** Yes (Admin only)

```bash
curl -X POST http://localhost:3000/api/announcements \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -d '{
    "content": "Registration for Spring Hackathon is now open! Sign up today!"
  }'
```

**Expected Response:** Created announcement object

### PATCH /announcements/[id]
**Purpose:** Update announcement
**Auth Required:** Yes (Author or Admin)

```bash
curl -X PATCH http://localhost:3000/api/announcements/ANNOUNCEMENT_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "content": "Updated: Registration deadline extended to March 10th!"
  }'
```

**Expected Response:** Updated announcement object

### DELETE /announcements/[id]
**Purpose:** Delete announcement
**Auth Required:** Yes (Author or Admin)

```bash
curl -X DELETE http://localhost:3000/api/announcements/ANNOUNCEMENT_ID \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

**Expected Response:** Success message

## 7. Resource Endpoints

### GET /resources
**Purpose:** List resources
**Auth Required:** Yes

```bash
# All resources
curl http://localhost:3000/api/resources \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Filter by category
curl "http://localhost:3000/api/resources?category=tutorials" \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

**Expected Response:** Array of resources

### POST /resources
**Purpose:** Create resource
**Auth Required:** Yes (Admin only)

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -d '{
    "title": "React Best Practices Guide",
    "description": "Comprehensive guide to React development",
    "content_url": "https://example.com/react-guide",
    "category": "tutorials"
  }'
```

**Expected Response:** Created resource object

### PATCH /resources/[id]
**Purpose:** Update resource
**Auth Required:** Yes (Admin only)

```bash
curl -X PATCH http://localhost:3000/api/resources/RESOURCE_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -d '{
    "title": "Updated React Guide"
  }'
```

**Expected Response:** Updated resource object

### DELETE /resources/[id]
**Purpose:** Delete resource
**Auth Required:** Yes (Admin only)

```bash
curl -X DELETE http://localhost:3000/api/resources/RESOURCE_ID \
  -H "Cookie: sb-access-token=ADMIN_TOKEN"
```

**Expected Response:** Success message

## 8. Sponsor Endpoints

### GET /sponsors
**Purpose:** List all sponsors
**Auth Required:** No (Public)

```bash
curl http://localhost:3000/api/sponsors
```

**Expected Response:** Array of sponsors ordered by tier

### POST /sponsors
**Purpose:** Create sponsor
**Auth Required:** Yes (Admin only)

```bash
curl -X POST http://localhost:3000/api/sponsors \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -d '{
    "name": "TechCorp Inc",
    "logo_url": "https://example.com/logo.png",
    "website_url": "https://techcorp.com",
    "tier": "gold",
    "description": "Leading technology solutions provider"
  }'
```

**Expected Response:** Created sponsor object

### PATCH /sponsors/[id]
**Purpose:** Update sponsor
**Auth Required:** Yes (Admin only)

```bash
curl -X PATCH http://localhost:3000/api/sponsors/SPONSOR_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -d '{
    "tier": "platinum"
  }'
```

**Expected Response:** Updated sponsor object

### DELETE /sponsors/[id]
**Purpose:** Delete sponsor
**Auth Required:** Yes (Admin only)

```bash
curl -X DELETE http://localhost:3000/api/sponsors/SPONSOR_ID \
  -H "Cookie: sb-access-token=ADMIN_TOKEN"
```

**Expected Response:** Success message

### POST /sponsors/[id]/logo
**Purpose:** Upload sponsor logo
**Auth Required:** Yes (Admin only)

```bash
curl -X POST http://localhost:3000/api/sponsors/SPONSOR_ID/logo \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -F "file=@/path/to/logo.png"
```

**Expected Response:** Sponsor with updated logo_url

## 9. Leaderboard Endpoints

### GET /leaderboard/[eventId]
**Purpose:** Get leaderboard for event
**Auth Required:** Yes

```bash
curl http://localhost:3000/api/leaderboard/EVENT_ID \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

**Expected Response:** Array of leaderboard entries with participant info

### POST /leaderboard
**Purpose:** Update leaderboard entry
**Auth Required:** Yes (Admin only)

```bash
curl -X POST http://localhost:3000/api/leaderboard \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=ADMIN_TOKEN" \
  -d '{
    "event_id": "EVENT_ID",
    "user_id": "USER_ID",
    "score": 95
  }'
```

**Expected Response:** Updated leaderboard entry with recalculated ranks

## Testing Checklist

### Basic Functionality
- [ ] Health endpoint returns 200 OK
- [ ] Signup creates user and profile
- [ ] Signin returns valid session
- [ ] Signout invalidates session

### Authorization
- [ ] Non-admin cannot create events (403)
- [ ] Non-admin cannot create announcements (403)
- [ ] Non-admin cannot modify resources (403)
- [ ] Unauthenticated requests to protected endpoints fail (401)

### Data Validation
- [ ] Invalid email format rejected
- [ ] Weak password rejected
- [ ] Invalid event dates rejected
- [ ] Empty required fields rejected

### File Uploads
- [ ] Avatar upload accepts valid images
- [ ] Avatar upload rejects invalid file types
- [ ] Avatar upload rejects oversized files
- [ ] Event images upload correctly

### Pagination
- [ ] Events list respects page/limit parameters
- [ ] Announcements list respects page/limit parameters
- [ ] Resources list respects page/limit parameters

### Business Logic
- [ ] Registration creates confirmed status when capacity available
- [ ] Registration creates waitlisted status when at capacity
- [ ] Duplicate registration prevented
- [ ] Event deletion cascades to registrations
- [ ] Leaderboard ranks recalculate on score update

## Notes

- Replace `YOUR_TOKEN` with actual session token from signin response
- Replace `ADMIN_TOKEN` with admin user's session token
- Replace `EVENT_ID`, `USER_ID`, etc. with actual IDs from your database
- Some endpoints require Supabase to be properly configured
- File upload endpoints require multipart/form-data content type
