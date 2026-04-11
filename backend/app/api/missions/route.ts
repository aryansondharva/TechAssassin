import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { getAvailableMissions, verifyMission } from '../../../lib/services/missions'
import { handleApiError } from '../../../lib/errors'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const missions = await getAvailableMissions(user.id)
    console.log(`[ROUTE DEBUG] Returning ${missions?.length || 0} missions for user ${user.id}`);
    if (missions?.length === 0) {
      console.log(`[ROUTE DEBUG] Data payload empty! Why?`, missions);
    }
    return NextResponse.json(missions || [])
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { missionId, requirementType, payload } = await request.json()
    
    if (!missionId || !requirementType) {
      return NextResponse.json({ error: 'Missing missionId or requirementType' }, { status: 400 })
    }

    const result = await verifyMission(user.id, missionId, requirementType, payload)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
