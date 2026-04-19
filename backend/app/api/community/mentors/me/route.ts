import { NextResponse } from 'next/server'
import { requireAuthWithClient } from '../../@/lib/middleware/auth'
import { handleApiError } from '../../@/lib/errors'
import { mentorProfileUpdateSchema } from '../../@/lib/validations/mentor'
import { getMyMentorProfile, updateMyMentorProfile } from '../../@/lib/services/mentors'

export async function GET() {
  try {
    const { user } = await requireAuthWithClient()
    const profile = await getMyMentorProfile(user.id)
    return NextResponse.json(profile)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireAuthWithClient()
    const body = await request.json()
    const validatedData = mentorProfileUpdateSchema.parse(body)
    const profile = await updateMyMentorProfile(user.id, validatedData)
    return NextResponse.json(profile)
  } catch (error) {
    return handleApiError(error)
  }
}
