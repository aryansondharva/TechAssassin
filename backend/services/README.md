# Services

This directory contains core business logic services for the gamification system.

## XP Service

The XP Service (`xp-service.ts`) manages all XP-related operations including:

### Core Features

1. **XP Transaction Management** (Requirements 1.1-1.6, 11.1-11.5)
   - `awardXP()` - Award XP to users with automatic multiplier application
   - `getUserTotalXP()` - Get user's total XP
   - `getXPHistory()` - Retrieve paginated XP transaction history with filtering
   - `getXPSummary()` - Get daily, weekly, and monthly XP summaries

2. **XP Source Configuration** (Requirements 2.1-2.5)
   - `getXPSourceConfig()` - Fetch XP source configuration
   - `updateXPSourceConfig()` - Update XP amounts, multipliers, and cooldowns

3. **Rate Limiting & Fraud Detection** (Requirements 20.1-20.5)
   - `checkRateLimit()` - Enforce max XP per hour limits
   - `recordXPAward()` - Track XP earning rates
   - `flagSuspiciousActivity()` - Flag users for admin review
   - `checkCooldown()` - Prevent duplicate activity XP awards
   - `setCooldown()` - Set cooldown periods for activities

4. **Manual Adjustments** (Requirements 14.1-14.5)
   - `manualAdjustment()` - Admin-only manual XP adjustments with audit trail

### Usage Example

```typescript
import { xpService } from '@/services/xp-service';

// Award XP for event registration
const transaction = await xpService.awardXP({
  userId: 'user-uuid',
  amount: 100,
  source: 'event_participation',
  activityType: 'event_registration',
  referenceId: 'event-uuid',
  description: 'Registered for Tech Assassin Hackathon',
  metadata: { eventName: 'Hackathon 2026' }
});

// Get user's total XP
const totalXP = await xpService.getUserTotalXP('user-uuid');

// Get XP history with filtering
const history = await xpService.getXPHistory('user-uuid', {
  source: 'event_participation',
  page: 1,
  pageSize: 20
});
```

### Database Integration

The service uses Supabase client for all database operations:
- Automatic total_xp updates via database triggers
- Automatic rank updates when XP changes
- Row-level security policies for data access control

### Validation

All inputs are validated using Zod schemas:
- Positive XP amounts only
- Valid UUID formats
- Enum validation for XP sources
- Required fields enforcement

### Testing

Run tests with:
```bash
npm test -- services/__tests__/xp-service.test.ts
```

Tests cover:
- Input validation
- Type checking
- Schema compliance
- Edge cases
