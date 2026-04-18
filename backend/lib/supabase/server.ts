import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

/**
 * Server-side Supabase client for use in Server Components and API routes
 * Uses service role key for admin operations (no session management needed with Clerk)
 * Must be called within async server context
 */
export const createClient = async () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}
