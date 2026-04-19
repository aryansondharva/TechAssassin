# Supabase Client Configuration

This directory contains the Supabase client configuration for the Tech Assassin gamification system.

## Overview

The gamification system uses Supabase as the primary database and real-time infrastructure. We provide multiple client configurations for different use cases:

1. **Server-side client** (`backend/lib/supabase.ts`) - For backend services and admin operations
2. **Server component client** (`backend/lib/supabase/server.ts`) - For Next.js Server Components
3. **Browser client** (`backend/lib/supabase/client.ts`) - For React components

## Files

### `backend/lib/supabase.ts`

Main utility file providing:
- `getServerClient()` - Server-side client with service role key (bypasses RLS)
- `getClientSupabase()` - Client-side client with anon key (respects RLS)
- `executeQuery()` - Type-safe query helper with error handling

**Usage:**
```typescript
import { getServerClient, executeQuery } from '@/lib/supabase'

// Direct usage
const client = getServerClient()
const { data, error } = await client.from('xp_transactions').select('*')

// With error handling helper
const result = await executeQuery(async (client) => {
  const { data } = await client.from('xp_transactions').select('*')
  return data
})
```

### `backend/lib/supabase/server.ts`

Server component client for Next.js 14 App Router:
- Uses `@supabase/auth-helpers-nextjs`
- Integrates with Next.js cookies
- Must be called in async server context

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/server'

export async function ServerComponent() {
  const supabase = await createClient()
  const { data } = await supabase.from('badges').select('*')
  return <div>{/* render data */}</div>
}
```

### `backend/lib/supabase/client.ts`

Browser client for React components:
- Uses `@supabase/auth-helpers-nextjs`
- Handles authentication state automatically
- Configured for real-time subscriptions

**Usage:**
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export function ClientComponent() {
  const supabase = createClient()
  // Use in React components
}
```

## Environment Variables

Required environment variables (see `backend/.env.example`):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Authentication

All clients integrate with Supabase Auth:
- Server clients use service role key for admin operations
- Browser clients use anon key with RLS policies
- Session management handled automatically via cookies

## Row Level Security (RLS)

RLS policies are defined in `backend/supabase/migrations/20260327000013_create_rls_policies.sql`:

### Key Policies

**XP Transactions:**
- Users can view their own transactions
- Admins can view all transactions
- Service role can insert transactions

**Badges:**
- Anyone can view active badges
- Admins can manage all badges
- Users can view their own earned badges

**Rank Tiers:**
- Anyone can view rank tiers
- Admins can manage rank tiers

**User Badges:**
- Users can view their own badges
- Anyone can view non-revoked badges
- Admins can award/revoke badges

## Real-time Subscriptions

The browser client is configured for real-time updates:

```typescript
const supabase = createClient()

// Subscribe to XP updates
const channel = supabase
  .channel(`gamification:xp:${userId}`)
  .on('broadcast', { event: 'xp_gained' }, (payload) => {
    console.log('XP gained:', payload)
  })
  .subscribe()

// Cleanup
channel.unsubscribe()
```

## Performance Optimizations

- **Event throttling**: Real-time events limited to 10/second (Requirement 9.2)
- **Connection pooling**: Managed by Supabase
- **Auto-refresh**: Disabled for server clients, enabled for browser clients
- **Session persistence**: Disabled for server clients, enabled for browser clients

## Testing

Tests are located in `backend/lib/supabase/__tests__/client.test.ts`:

```bash
# Run tests
npm test -- lib/supabase/__tests__/client.test.ts
```

Tests verify:
- Client creation with correct configuration
- Environment variable validation
- Error handling
- Query execution

## Security Best Practices

1. **Never expose service role key** - Only use in server-side code
2. **Use RLS policies** - Always define policies for user-facing tables
3. **Validate input** - Use Zod schemas for API request validation
4. **Audit logging** - Log all admin operations
5. **Rate limiting** - Implement rate limits for XP operations

## Integration with Gamification System

The Supabase clients are used throughout the gamification system:

- **XP Service** (`backend/services/xp-service.ts`) - Uses `getServerClient()`
- **Badge Service** (`backend/services/badge-service.ts`) - Uses `getServerClient()`
- **Rank Service** (`backend/services/rank-service.ts`) - Uses `getServerClient()`
- **API Routes** - Use `createClient()` from `server.ts`
- **Frontend Components** - Use `createClient()` from `client.ts`

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` exists with all required variables
- Check variable names match exactly (case-sensitive)
- Restart dev server after adding variables

### RLS policy errors
- Verify policies are applied: Check Supabase Dashboard > Authentication > Policies
- Run migration: `backend/supabase/migrations/20260327000013_create_rls_policies.sql`
- Check user role in profiles table

### Real-time connection issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` is accessible
- Check browser console for WebSocket errors
- Ensure real-time is enabled in Supabase project settings

## References

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)
