import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithClient } from '../@/lib/middleware/auth'
import { handleApiError } from '../@/lib/errors'
import { mentorDirectoryFilterSchema } from '../@/lib/validations/mentor'
import { getMentorDirectory } from '../@/lib/services/mentors'

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const filters = mentorDirectoryFilterSchema.parse(params)

    let viewerId: string | undefined
    try {
      const { user } = await requireAuthWithClient()
      viewerId = user.id
    } catch {
      viewerId = undefined
    }

    const mentors = await getMentorDirectory(filters, viewerId)
    return NextResponse.json(mentors)
  } catch (error) {
    return handleApiError(error)
  }
}
