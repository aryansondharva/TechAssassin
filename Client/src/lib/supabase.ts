/**
 * Shared Supabase client for the Client app.
 * Uses the JWT token stored in localStorage (set on sign-in via backend)
 * so that it shares the same auth session as the rest of the app.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail gracefully instead of showing a white screen if env vars are missing in production
const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON);

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
    return parsed?.auth_id ?? parsed?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Supabase client initialization with safety guards.
 */
let supabaseInstance: any;

if (isSupabaseConfigured) {
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: {
      headers: {
        get Authorization() {
          const token = getStoredToken();
          return token ? `Bearer ${token}` : '';
        },
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionFromUrl: false,
    },
  });
} else {
  console.warn("Supabase Environment Variables missing. Real-time and RPC features will be disabled.");
  // Provide a proxy object that doesn't crash but logs errors when called
  supabaseInstance = new Proxy({}, {
    get: (_, prop) => {
      return () => {
        console.error(`Supabase not initialized: Cannot call '${String(prop)}' without VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.`);
        return { data: null, error: new Error("Supabase not configured") };
      };
    }
  });
}

export const supabase = supabaseInstance;
export { SUPABASE_URL };
