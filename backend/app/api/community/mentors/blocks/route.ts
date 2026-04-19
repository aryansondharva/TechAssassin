import { NextResponse } from 'next/server'
import { requireAuthWithClient } from '../../@/lib/middleware/auth'
import { handleApiError } from '../../@/lib/errors'
import { mentorBlockCreateSchema } from '../../@/lib/validations/mentor'
import { createMentorBlock } from '../../@/lib/services/mentors'

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthWithClient()
    const body = await request.json()
    const validatedData = mentorBlockCreateSchema.parse(body)
    const block = await createMentorBlock(user.id, validatedData.blocked_user_id)
    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
