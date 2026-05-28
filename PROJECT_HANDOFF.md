# TechAssassin Project Handoff

Prepared for manager review on 2026-05-28.

## Current Scope

The active project is a web client and backend API:

- `Client/`: React/Vite web application
- `backend/`: Next.js API backend
- `backend/supabase/migrations/`: database migrations
- `render.yaml`: Render backend deployment
- `vercel.json`: Vercel web deployment

## Local Runbook

1. Install dependencies:

```bash
npm install --prefix backend
npm install --prefix Client
```

2. Create local environment files:

```bash
copy backend\.env.example backend\.env.local
copy Client\.env.example Client\.env.local
```

3. Start services:

```bash
npm run dev:backend
npm run dev:client
```

4. Open:

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

## Verification Commands

```bash
npm run typecheck
npm run test:client
npm run test:backend
npm run build:client
npm run build:backend
```

## Environment Checklist

Backend:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CORS_ORIGINS`

Client:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_APP_URL`
- `VITE_DEBUG`

## Deployment Notes

- Deploy the client with Vercel using `vercel.json`.
- Deploy the backend with Render using `render.yaml`.
- `backend/package.json` uses `node scripts/start-next.js` for production start so Render can inject the `PORT`.
- Apply Supabase migrations before testing production flows.
- Configure Clerk webhook delivery to the backend webhook route before production signup testing.

## Cleanup Completed

- Removed tracked Vite cache output.
- Added root scripts for client/backend development, builds, tests, and type-checks.
- Documented the current project structure and setup flow.
- Moved one-off image adjustment scripts into `tools/scripts`.
- Separated backend production type-checking from stale legacy tests.
