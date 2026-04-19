import { NextResponse } from 'next/server'
import { getCommunityStats } from '@/lib/services/community'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const stats = await getCommunityStats()
    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
