# Badges API - Placeholder

## Status: Not Yet Implemented

This directory is reserved for the future badge system implementation.

## Required Activity Integration

When implementing the badge system, you MUST integrate activity tracking for badge awards.

### Activity Tracking Requirements

**Requirement 8.3:** When a user earns a badge, create and broadcast a "badge earned" activity

**Implementation Guide:**

After a user is awarded a badge, add the following code:

```typescript
// Create activity for badge award (Requirements: 8.3)
// Trigger "badge_earned" activity when user earns badge
fetch('/api/activity/create', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Cookie': request.headers.get('cookie') || ''
  },
  body: JSON.stringify({
    type: 'badge_earned',
    metadata: {
      badgeName: badge.name,
      badgeId: badge.id,
      description: badge.description // optional
    }
  })
}).catch(error => {
  // Log activity creation error but don't fail the badge award
  console.error('Failed to create badge_earned activity:', error)
})
```

### Recommended Endpoint Structure

```
/api/badges/
  - GET /api/badges - List all available badges
  - GET /api/badges/[id] - Get badge details
  - POST /api/badges/award - Award badge to user (admin only)
    ↑ ADD ACTIVITY TRACKING HERE
  - GET /api/badges/user/[userId] - Get user's earned badges
```

### Badge Award Triggers

Badges can be awarded through various mechanisms:
- Manual admin award
- Automatic award based on achievements (e.g., completing X challenges)
- Event-based awards (e.g., participating in hackathon)

**Important:** Activity tracking should be added wherever badges are awarded, regardless of the trigger mechanism.

### Integration Checklist

When implementing badges:

- [ ] Create badge database schema
- [ ] Implement badge CRUD endpoints
- [ ] Implement badge award logic
- [ ] **Add activity tracking to all badge award paths** (Requirement 8.3)
- [ ] Test activity appears in feed after badge is earned
- [ ] Verify real-time broadcasting works
- [ ] Update ACTIVITY_TRACKING_INTEGRATION.md with actual implementation

### Reference Documentation

- See `backend/ACTIVITY_TRACKING_INTEGRATION.md` for detailed integration guide
- See `backend/app/api/registrations/route.ts` for working example
- See `.kiro/specs/real-time-presence-activity/requirements.md` for full requirements

### Example Badge Award Service

```typescript
// backend/lib/services/badges.ts (example)

export async function awardBadge(userId: string, badgeId: string): Promise<void> {
  // 1. Validate user and badge exist
  // 2. Check if user already has badge
  // 3. Insert into user_badges table
  // 4. CREATE ACTIVITY HERE
  
  const badge = await getBadgeById(badgeId);
  
  // Award the badge
  await db.insert('user_badges', { user_id: userId, badge_id: badgeId });
  
  // Create activity (Requirements: 8.3)
  await fetch('/api/activity/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'badge_earned',
      metadata: {
        badgeName: badge.name,
        badgeId: badge.id
      }
    })
  }).catch(error => {
    console.error('Failed to create badge_earned activity:', error)
  });
}
```
