import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Client-side Supabase client for use in React components
 * 
 * Performance Optimizations:
 * - Requirement 9.2: Configure eventsPerSecond throttling for realtime
 */
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10, // Throttle to 10 events/second (Requirement 9.2)
      },
    },
  });
};
