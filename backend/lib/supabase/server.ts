import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/**
 * Creates a server-side Supabase client.
 * By default, this returns an ADMIN client (service role) to allow background
 * tasks like storage cleanup to run without RLS restrictions.
 */
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  )
}

/**
 * Creates a server-side Supabase client scoped to the current Clerk user.
 * This is used for API routes where RLS should be enforced.
 */
export async function createAuthenticatedClient() {
  const { userId, getToken } = await auth()
  const token = await getToken({ template: 'supabase' })
  
  if (!token) {
    throw new Error('No Clerk JWT found')
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false
      }
    }
  )
}
