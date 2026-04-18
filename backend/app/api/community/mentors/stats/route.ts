import { NextResponse } from 'next/server'
import { handleApiError } from '../../../../../lib/errors'
import { getMentorStats } from '../../../../../lib/services/mentors'

export async function GET() {
  try {
    const stats = await getMentorStats()
    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
