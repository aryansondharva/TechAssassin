# Challenges API - Placeholder

## Status: Not Yet Implemented

This directory is reserved for the future challenges system implementation.

## Required Activity Integration

When implementing the challenges system, you MUST integrate activity tracking for challenge completion.

### Activity Tracking Requirements

**Requirement 8.1:** When a user solves a challenge, create and broadcast a "challenge solved" activity

**Implementation Guide:**

After a user successfully completes a challenge, add the following code:

```typescript
// Create activity for challenge completion (Requirements: 8.1)
// Trigger "challenge_solved" activity when user solves challenge
fetch('/api/activity/create', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Cookie': request.headers.get('cookie') || ''
  },
  body: JSON.stringify({
    type: 'challenge_solved',
    metadata: {
      challengeName: challenge.name,
      challengeId: challenge.id,
      score: pointsEarned // optional
    }
  })
}).catch(error => {
  // Log activity creation error but don't fail the challenge completion
  console.error('Failed to create challenge_solved activity:', error)
})
```

### Recommended Endpoint Structure

```
/api/challenges/
  - GET /api/challenges - List all challenges
  - GET /api/challenges/[id] - Get challenge details
  - POST /api/challenges/[id]/submit - Submit challenge solution
    ↑ ADD ACTIVITY TRACKING HERE
  - GET /api/challenges/[id]/submissions - Get user submissions
```

### Integration Checklist

When implementing challenges:

- [ ] Create challenge database schema
- [ ] Implement challenge CRUD endpoints
- [ ] Implement challenge submission endpoint
- [ ] **Add activity tracking to submission endpoint** (Requirement 8.1)
- [ ] Test activity appears in feed after challenge completion
- [ ] Verify real-time broadcasting works
- [ ] Update ACTIVITY_TRACKING_INTEGRATION.md with actual implementation

### Reference Documentation

- See `backend/ACTIVITY_TRACKING_INTEGRATION.md` for detailed integration guide
- See `backend/app/api/registrations/route.ts` for working example
- See `.kiro/specs/real-time-presence-activity/requirements.md` for full requirements
