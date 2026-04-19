import { NextResponse } from 'next/server'
import { requireAuthWithClient } from '@/lib/middleware/auth'
import { handleApiError } from '@/lib/errors'
import { mentorReportCreateSchema } from '@/lib/validations/mentor'
import { createMentorReport } from '@/lib/services/mentors'

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthWithClient()
    const body = await request.json()
    const validatedData = mentorReportCreateSchema.parse(body)
    const report = await createMentorReport(user.id, validatedData)
    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
