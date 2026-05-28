# TechAssassin Web Client

React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Clerk, and Supabase client integration.

## Key Folders

```text
Client/
  public/          Static public assets
  src/assets/      Imported images and brand assets
  src/components/  Shared UI and feature components
  src/hooks/       React hooks
  src/lib/         API, Supabase, and utility helpers
  src/pages/       Route-level pages
  src/services/    Frontend service wrappers
  src/types/       Shared TypeScript types
```

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

The client runs on `http://localhost:3000` and expects the backend API at `http://localhost:3001/api` unless `VITE_API_URL` is changed.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend API base URL, including `/api` |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_APP_URL` | Public frontend URL |
| `VITE_DEBUG` | Enables API debug logging when set to `true` |

## Commands

```bash
npm run dev
npm run typecheck
npm run test
npm run build
npm run preview
```
