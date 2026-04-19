import { NextResponse } from 'next/server'
import { getCommunityActivities } from '../@/lib/services/community'
import { handleApiError } from '../@/lib/errors'

export async function GET() {
  try {
    const activities = await getCommunityActivities()
    return NextResponse.json(activities)
  } catch (error) {
    return handleApiError(error)
  }
}
