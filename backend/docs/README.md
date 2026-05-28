# TechAssassin Backend

Next.js 14 backend for the TechAssassin platform. It provides API routes for profiles, events, registrations, announcements, resources, sponsors, community features, mentorship, notifications, missions, and leaderboards.

## Stack

- Next.js 14 App Router
- TypeScript
- Supabase PostgreSQL
- Clerk authentication
- Zod validation
- Resend email integration
- Vitest smoke/unit tests

## Structure

```text
backend/
  app/api/                  API route handlers
  lib/auth/                 Server auth helpers
  lib/email/                Email provider integration
  lib/errors/               Error classes and handlers
  lib/middleware/           Auth middleware helpers
  lib/services/             Backend business logic
  lib/supabase/             Supabase clients
  lib/utils/                Shared backend utilities
  lib/validations/          Zod request schemas
  scripts/                  Maintenance and startup scripts
  supabase/migrations/      Database migrations
  types/                    Database and shared types
```

## Local Development

```bash
npm install
copy .env.example .env.local
npm run dev
```

The API runs at `http://localhost:3001/api`.

## Required Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server-only operations |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `RESEND_API_KEY` | Resend API key |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |

## Commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm start
```

`npm start` uses `scripts/start-next.js` so hosted platforms can provide `PORT`.

## Database

Apply migrations from `backend/supabase/migrations` in filename order. The migration folder includes core tables, RLS policies, storage setup, realtime presence, mentorship, notifications, and gamification tables.
