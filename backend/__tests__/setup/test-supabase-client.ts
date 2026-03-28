/**
 * Test Supabase Client Setup
 * 
 * Creates a Supabase client for testing that doesn't require Next.js request context.
 * Uses service role key for admin operations in tests.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for testing
 * This bypasses the Next.js cookies() requirement
 */
export const createTestClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for testing');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Export as default for easy importing
 */
export const createClient = createTestClient;
