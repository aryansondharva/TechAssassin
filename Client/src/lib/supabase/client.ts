import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  // Don't throw error, just log it - allow app to load
}

/**
 * Client-side Supabase client for use in React components
 * 
 * Performance Optimizations:
 * - Requirement 9.2: Configure eventsPerSecond throttling for realtime
 */
export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase client created without proper credentials');
    // Return a dummy client that won't crash the app
    return createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  }
  
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10, // Throttle to 10 events/second (Requirement 9.2)
      },
    },
  });
};
