import { NextResponse } from 'next/server'
import { requireAuthWithClient } from '@/lib/middleware/auth'
import { handleApiError } from '@/lib/errors'
import { mentorRequestActionSchema } from '@/lib/validations/mentor'
import { updateMentorRequestStatus } from '@/lib/services/mentors'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuthWithClient()
    const body = await request.json()
    const validatedData = mentorRequestActionSchema.parse(body)

    const updated = await updateMentorRequestStatus(user.id, params.id, validatedData)
    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
