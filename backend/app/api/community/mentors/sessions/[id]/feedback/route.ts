import { NextResponse } from 'next/server'
import { requireAuthWithClient } from '@/lib/middleware/auth'
import { handleApiError } from '@/lib/errors'
import { mentorFeedbackCreateSchema } from '@/lib/validations/mentor'
import { submitMentorFeedback } from '@/lib/services/mentors'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuthWithClient()
    const body = await request.json()
    const validatedData = mentorFeedbackCreateSchema.parse(body)
    const feedback = await submitMentorFeedback(user.id, params.id, validatedData)
    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
