import { NextResponse } from 'next/server'
import { getOnlineCount, getLiveActivity } from '../@/lib/services/presence'
import { handleApiError } from '../@/lib/errors'

export async function GET() {
  try {
    const [onlineCount, activities] = await Promise.all([
      getOnlineCount(),
      getLiveActivity()
    ])
    
    return NextResponse.json({
      onlineCount,
      activities
    })
  } catch (error) {
    return handleApiError(error)
  }
}
