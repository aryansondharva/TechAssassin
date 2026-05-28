import { createClient as createSupabaseClient } from '@supabase/supabase-js'

type QueryResult<T> = {
  data: T | null
  error: Error | null
}

const getRequiredEnv = (name: string) => {
  const value = process.env[name]
  if (!value) {
    throw new Error('Missing Supabase environment variables')
  }
  return value
}

export function getServerClient() {
  const url = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function getClientSupabase() {
  const url = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

export async function executeQuery<T>(
  queryFn: (client: ReturnType<typeof getServerClient>) => Promise<T>
): Promise<QueryResult<T>> {
  try {
    const data = await queryFn(getServerClient())
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown database error'),
    }
  }
}

