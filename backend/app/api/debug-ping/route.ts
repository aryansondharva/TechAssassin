import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const { userId, getToken } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 1. Get the Clerk JWT for supabase template
    const token = await getToken({ template: 'supabase' })

    // 2. Try service-role client (bypasses RLS) to confirm row exists
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    const { data: profileAdmin, error: adminError } = await adminClient
      .from('profiles')
      .select('id, username, member_id')
      .eq('id', userId)
      .single()

    // 3. Try authenticated client (respects RLS)
    let profileRLS = null
    let rlsError = null
    if (token) {
      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false }
        }
      )
      const { data, error } = await authClient
        .from('profiles')
        .select('id, username, member_id')
        .eq('id', userId)
        .single()
      profileRLS = data
      rlsError = error?.message || null
    }

    return NextResponse.json({
      clerkUserId: userId,
      hasSupabaseToken: !!token,
      // Did admin client find the row?
      adminFound: !!profileAdmin,
      adminError: adminError?.message || null,
      adminProfile: profileAdmin,
      // Did RLS-scoped client find the row?
      rlsFound: !!profileRLS,
      rlsError,
      rlsProfile: profileRLS,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
