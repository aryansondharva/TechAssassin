import { createClient } from '../supabase/server'
import { handleApiError } from '../errors'

export interface Mission {
  id: string
  title: string
  description: string
  xp_reward: number
  frequency: 'daily' | 'weekly' | 'one-time'
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'in_progress' | 'pending_verification' | 'completed'
  progress: any
  time_remaining_ms: number
}

/**
 * Fetch available missions for the current user
 */
export async function getAvailableMissions(userId: string) {
  const supabase = await createClient()

  // Using the RPC function we created in SQL
  const { data, error } = await supabase.rpc('get_available_missions', {
    p_user_id: userId
  })

  if (error) throw error
  return data as Mission[]
}

/**
 * Update mission progress or complete a mission
 */
export async function updateMissionProgress(userId: string, missionId: string, status: string, progress: any = {}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_missions')
    .upsert({
      user_id: userId,
      mission_id: missionId,
      status,
      progress,
      updated_at: new Date().toISOString(),
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Verify mission completion (Real-time verification)
 */
export async function verifyMission(userId: string, missionId: string, requirementType: string, payload: any = {}) {
  const supabase = await createClient()

  // 1. Fetch mission and user profile
  const [{ data: mission }, { data: profile }] = await Promise.all([
    supabase.from('missions').select('*').eq('id', missionId).single(),
    supabase.from('profiles').select('*').eq('id', userId).single()
  ])

  if (!mission) throw new Error('Mission not found')
  if (!profile) throw new Error('Profile not found')

  let isVerified = false
  const progress: any = { verified: true, timestamp: new Date().toISOString() }

  switch (requirementType) {
    case 'github_push':
      // CHECK GITHUB API
      if (profile.github_url) {
        const username = profile.github_url.split('/').pop()
        try {
          const response = await fetch(`https://api.github.com/users/${username}/events`, {
            headers: { 'User-Agent': 'TechAssassin-Verification' }
          })
          const events = await response.json()
          
          if (Array.isArray(events)) {
            // Look for PushEvents in the last 24 hours
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
            const recentPush = events.find((e: any) => 
              e.type === 'PushEvent' && new Date(e.created_at) > oneDayAgo
            )
            
            if (recentPush) {
              isVerified = true
              progress.github_event = recentPush.id
            }
          }
        } catch (e) {
          console.error('Github verification failed:', e)
        }
      }
      break

    case 'leetcode_solve':
      // Check if payload contains a valid leetcode link
      if (payload?.link && payload.link.includes('leetcode.com/submissions')) {
        isVerified = true
        progress.submission_link = payload.link
      }
      break

    case 'blog_post':
      // Check if payload contains a valid dev.to, hashnode, or medium link
      const validBlogs = ['dev.to', 'hashnode.com', 'medium.com']
      if (payload?.link && validBlogs.some(d => payload.link.includes(d))) {
        isVerified = true
        progress.blog_link = payload.link
      }
      break

    case 'first_mission':
    case 'join_hackathon':
      // These are usually handled by system triggers, but can be manual for now
      isVerified = true
      break

    default:
      // Generic verification for other types
      isVerified = true
  }

  if (isVerified) {
    const data = await updateMissionProgress(userId, missionId, 'completed', progress)
    return { status: 'completed', data }
  }

  return { status: 'failed', message: 'Verification requirements not met.' }
}
