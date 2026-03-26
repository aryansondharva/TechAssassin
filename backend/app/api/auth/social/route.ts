import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

/**
 * GET /api/auth/social
 * Initiate OAuth sign in with GitHub or Google
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as 'github' | 'google'
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    
    if (error) {
      throw error
    }
    
    if (data.url) {
      return NextResponse.redirect(data.url)
    }
    
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
  } catch (error) {
    console.error('[AUTH] OAuth initiation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
