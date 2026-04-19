import { NextResponse } from 'next/server'
import { requireAuthWithClient } from '@/lib/middleware/auth'
import { handleApiError } from '@/lib/errors'
import { mentorHelpRequestCreateSchema } from '@/lib/validations/mentor'
import { createMentorRequest, getMyMentorRequests } from '@/lib/services/mentors'

export async function GET() {
  try {
    const { user } = await requireAuthWithClient()
    const requests = await getMyMentorRequests(user.id)
    return NextResponse.json(requests)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthWithClient()
    const body = await request.json()
    const validatedData = mentorHelpRequestCreateSchema.parse(body)
    const mentorRequest = await createMentorRequest(user.id, validatedData)
    return NextResponse.json(mentorRequest, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
