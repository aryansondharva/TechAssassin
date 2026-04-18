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

/**  
 * Returns the real Supabase auth user ID currently active in Clerk session.
 * We pull this dynamically from Clerk instead of local storage.
 */
export function getStoredUserId(): string | null {
  try {
    return window.Clerk?.user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Supabase client initialization with asynchronous Clerk JWT injection.
 */
let supabaseInstance: any;

if (isSupabaseConfigured) {
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: {
      fetch: async (url, options = {}) => {
        // Asynchronously fetch the custom Supabase-signed JWT mint from Clerk
        const clerkToken = window.Clerk?.session 
          ? await window.Clerk.session.getToken({ template: 'supabase' })
          : null;

        const headers = new Headers(options?.headers);
        if (clerkToken) {
          headers.set('Authorization', `Bearer ${clerkToken}`);
        }

        // Return standard fetch implementation but armed with the new dynamic headers!
        return fetch(url, {
          ...options,
          headers,
        });
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
