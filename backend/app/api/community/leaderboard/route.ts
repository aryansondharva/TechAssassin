import { NextResponse } from 'next/server'
import { getGlobalLeaderboard } from '../@/lib/services/community'
import { handleApiError } from '../@/lib/errors'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const leaderboard = await getGlobalLeaderboard()
    return NextResponse.json(leaderboard)
  } catch (error) {
    return handleApiError(error)
  }
}
