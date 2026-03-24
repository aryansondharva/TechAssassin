import { createClient } from '@/lib/supabase/server'

/**
 * Get global community stats
 */
export async function getCommunityStats() {
  const supabase = await createClient()

  const [
    { count: activeHackers },
    { count: totalEvents },
    { data: registrations },
    { data: events }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('id'),
    supabase.from('events').select('prizes')
  ])

  // Calculate total prize pool (heuristic)
  let totalPrizePool = 0
  events?.forEach(event => {
    if (event.prizes && typeof event.prizes === 'object') {
      // Logic to sum up prizes if structured as numeric
      // For now, let's use a mock value or simple aggregator
    }
  })

  return {
    activeHackers: activeHackers || 0,
    newHackers: 12, // Mocked for now
    totalEvents: totalEvents || 0,
    newEvents: 2,   // Mocked
    totalPrizePool: 5, // Lakhs
    newPrizePool: 50,  // Thousands
    teamsFormed: registrations?.length || 0,
    newTeams: 5
  }
}

/**
 * Get global leaderboard (all-time top scorers)
 */
export async function getGlobalLeaderboard() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leaderboard')
    .select(`
      score,
      user:profiles!leaderboard_user_id_fkey (
        id,
        username,
        avatar_url,
        full_name
      )
    `)
  
  if (error) throw error

  // Aggregate scores by user
  const userScores: Record<string, any> = {}
  data.forEach((entry: any) => {
    const userId = entry.user.id
    if (!userScores[userId]) {
      userScores[userId] = {
        id: userId,
        name: entry.user.full_name || entry.user.username,
        username: entry.user.username,
        avatar: entry.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.username}`,
        score: 0,
        events: 0,
        badges: ['🏅', '🚀'],
        trend: 'up' as const
      }
    }
    userScores[userId].score += entry.score
    userScores[userId].events += 1
  })

  return Object.values(userScores)
    .sort((a, b) => b.score - a.score)
    .map((user, index) => ({ ...user, rank: index + 1 }))
}

/**
 * Get recent community activities
 */
export async function getCommunityActivities() {
  const supabase = await createClient()

  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      id,
      created_at,
      team_name,
      event:events (title),
      user:profiles (full_name, username)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error

  return registrations.map((reg: any) => ({
    id: reg.id,
    type: 'event' as const,
    title: `${reg.user?.full_name || reg.user?.username} joined ${reg.event?.title}`,
    description: `Formed team "${reg.team_name}" for the upcoming hackathon.`,
    timestamp: new Date(reg.created_at).toLocaleDateString(),
    event: reg.event?.title,
    participants: 1
  }))
}
