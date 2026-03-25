import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Server-side Supabase client for use in Server Components and API routes
 * Uses cookies for session management
 * Must be called within async server context
 */
export const createClient = async () => {
  const cookieStore = cookies()
  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })
}
