import { createClient } from '../supabase/server'

/**
 * Get count of online users
 */
export async function getOnlineCount() {
  const supabase = await createClient()
  
  const { count, error } = await supabase
    .from('presence_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'online')
    .gt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Active in last 5 mins

  if (error) return 0
  return (count || 0) + 5 // Add a baseline for flavor
}

/**
 * Get recent activity feed
 */
export async function getLiveActivity() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activity_feed')
    .select(`
      id,
      type,
      metadata,
      created_at,
      user:profiles!activity_feed_user_id_fkey (
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return []

  return data.map((activity: any) => ({
    id: activity.id,
    user: activity.user.username,
    avatar: activity.user.avatar_url,
    type: activity.type,
    message: formatActivityMessage(activity),
    timestamp: activity.created_at
  }))
}

function formatActivityMessage(activity: any) {
  const meta = activity.metadata
  switch (activity.type) {
    case 'event_joined':
      return `joined the mission: ${meta.activity || 'New Event'}`
    case 'challenge_solved':
      return `completed mission and earned ${meta.xp_amount} XP`
    case 'badge_earned':
      return `earned a new badge!`
    default:
      return `is active in the terminal`
  }
}
