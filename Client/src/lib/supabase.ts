/**
 * Shared Supabase client for the Client app.
 * Uses the JWT token stored in localStorage (set on sign-in via backend)
 * so that it shares the same auth session as the rest of the app.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** Returns the JWT stored by auth.service.ts after sign-in */
function getStoredToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

/** Returns the real Supabase auth user ID stored by auth.service.ts after sign-in */
export function getStoredUserId(): string | null {
  try {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Prefer auth_id (explicit Supabase UID set by backend signin response)
    // Fall back to id (works when profile.id === auth.user.id, which is standard)
    return parsed?.auth_id ?? parsed?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Supabase client that injects the stored Bearer token on every request.
 * This lets us call RPC / table APIs with the logged-in user's identity.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  global: {
    headers: {
      get Authorization() {
        const token = getStoredToken();
        return token ? `Bearer ${token}` : '';
      },
    },
  },
  auth: {
    // We manage auth ourselves via the backend – disable auto-refresh
    persistSession: false,
    autoRefreshToken: false,
    detectSessionFromUrl: false,
  },
});
