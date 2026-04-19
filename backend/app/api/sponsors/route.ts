import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin, AuthenticationError, AuthorizationError } from '@/lib/middleware/auth'
import { sponsorCreateSchema } from '@/lib/validations/sponsor'
import { ZodError } from 'zod'
import { getCached, cache, CacheKeys, CacheTTL } from '@/lib/utils/cache'

/**
 * GET /api/sponsors
 * List all sponsors (public access, no auth required)
 * Orders by tier (gold, silver, bronze)
 * Requirements: 9.5, 9.6, 13.4
 */
export async function GET(request: NextRequest) {
  try {
    // Use cache for sponsors list (rarely changes)
    const sponsors = await getCached(
      CacheKeys.sponsors(),
      async () => {
        const supabase = await createClient()
        
        // Define tier order for sorting
        const tierOrder = { gold: 1, silver: 2, bronze: 3 }
        
        // Fetch all sponsors
        const { data: sponsors, error } = await supabase
          .from('sponsors')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          throw new Error(`Failed to fetch sponsors: ${error.message}`)
        }
        
        // Sort by tier (gold, silver, bronze) in memory
        return (sponsors || []).sort((a: any, b: any) => {
          return tierOrder[a.tier as keyof typeof tierOrder] - tierOrder[b.tier as keyof typeof tierOrder]
        })
      },
      CacheTTL.sponsors
    )
    
    return NextResponse.json({ data: sponsors })
  } catch (error) {
    console.error('GET /api/sponsors error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sponsors
 * Create a new sponsor (admin only)
 * Requirements: 9.1, 9.3
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Verify admin privileges
    await requireAdmin(user.id)
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = sponsorCreateSchema.parse(body)
    
    // Create sponsor in database
    const supabase = await createClient()
    const { data: sponsor, error } = await supabase
      .from('sponsors')
      .insert({
        name: validatedData.name,
        logo_url: validatedData.logo_url,
        website_url: validatedData.website_url,
        tier: validatedData.tier,
        description: validatedData.description || null
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create sponsor: ${error.message}`)
    }
    
    // Invalidate sponsors cache
    cache.invalidate(CacheKeys.sponsors())
    
    return NextResponse.json(sponsor, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    
    console.error('POST /api/sponsors error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
