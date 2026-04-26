import { NextResponse } from 'next/server'
import { requireAuthWithClient } from '@/lib/middleware/auth'
import { handleApiError } from '@/lib/errors'
import { mentorProfileUpdateSchema } from '@/lib/validations/mentor'
import { getMyMentorProfile, updateMyMentorProfile } from '@/lib/services/mentors'

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
    console.log('PATCH /api/community/mentors/me hit');
    const { user } = await requireAuthWithClient()
    console.log('User authenticated:', user.id);
    const body = await request.json()
    console.log('Request body:', body);
    const validatedData = mentorProfileUpdateSchema.parse(body)
    console.log('Validated data:', validatedData);
    const profile = await updateMyMentorProfile(user.id, validatedData)
    console.log('Profile updated successfully');
    return NextResponse.json(profile)
  } catch (error) {
    return handleApiError(error)
  }
}
