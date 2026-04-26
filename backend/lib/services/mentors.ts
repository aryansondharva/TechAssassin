import { createClient } from '@/lib/supabase/server'
import { AuthorizationError, NotFoundError, ValidationError } from '../errors'

export interface MentorDirectoryFilters {
  skill?: string
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'expert'
  language?: string
  timezone?: string
  availability?: string
}

type MentorRequestStatus = 'pending' | 'accepted' | 'declined' | 'canceled' | 'completed'
const MENTOR_XP_REWARD = 100
const BEGINNER_XP_REWARD = 40

interface MentorRequestActionInput {
  action: 'accept' | 'decline' | 'cancel' | 'confirm_complete'
  scheduled_for?: string | null
  notes?: string | null
}

export async function getMentorDirectory(filters: MentorDirectoryFilters = {}, viewerId?: string) {
  const client = await pool.connect()
  try {
    let query = `
      SELECT 
        id, username, full_name, avatar_url, bio, skills, 
        mentor_experience_level, mentor_languages, mentor_timezone, 
        mentor_focus_areas, mentor_availability, mentor_visibility, 
        mentor_total_sessions, mentor_rating, mentor_rating_count, 
        is_mentor_verified
      FROM public.profiles
      WHERE is_mentor_available = true 
        AND is_mentor_verified = true 
        AND mentor_visibility != 'private'
    `
    const values: any[] = []
    let valIdx = 1

    if (filters.skill) {
      query += ` AND $${valIdx} = ANY(skills)`
      values.push(filters.skill)
      valIdx++
    }
    if (filters.experienceLevel) {
      query += ` AND mentor_experience_level = $${valIdx}`
      values.push(filters.experienceLevel)
      valIdx++
    }
    if (filters.language) {
      query += ` AND $${valIdx} = ANY(mentor_languages)`
      values.push(filters.language)
      valIdx++
    }
    if (filters.timezone) {
      query += ` AND mentor_timezone = $${valIdx}`
      values.push(filters.timezone)
      valIdx++
    }
    if (filters.availability) {
      query += ` AND mentor_availability ILIKE $${valIdx}`
      values.push(`%${filters.availability}%`)
      valIdx++
    }

    query += ` ORDER BY mentor_rating DESC NULLS LAST, mentor_total_sessions DESC LIMIT 100`

    const { rows: mentors } = await client.query(query, values)

    if (!viewerId || !mentors || mentors.length === 0) {
      return mentors || []
    }

    const mentorIds = mentors.map((m) => m.id)
    const { rows: blocks } = await client.query(
      `SELECT blocker_id, blocked_user_id FROM public.mentor_blocks 
       WHERE (blocker_id = $1 AND blocked_user_id = ANY($2))
       OR (blocked_user_id = $1 AND blocker_id = ANY($2))`,
      [viewerId, mentorIds]
    )

    const blockedIds = new Set<string>()
    blocks.forEach((item: any) => {
      if (item.blocker_id === viewerId) blockedIds.add(item.blocked_user_id)
      if (item.blocked_user_id === viewerId) blockedIds.add(item.blocker_id)
    })

    return mentors.filter((mentor) => !blockedIds.has(mentor.id))
  } finally {
    client.release()
  }
}

import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
})

export async function updateMyMentorProfile(userId: string, input: Record<string, any>) {
  const client = await pool.connect()
  try {
    const allowedFields = [
      'is_mentor_available', 'bio', 'is_mentor_verified',
      'mentor_experience_level', 'mentor_languages', 'mentor_timezone',
      'mentor_focus_areas', 'mentor_availability', 'mentor_visibility'
    ]

    const entries = Object.entries(input)
      .filter(([key]) => allowedFields.includes(key))
    
    if (entries.length === 0) return null

    const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ')
    const values = entries.map(([, value]) => value)

    const { rows } = await client.query(
      `UPDATE public.profiles SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [userId, ...values]
    )

    if (rows.length === 0) {
      throw new NotFoundError('Profile not found for mentor update')
    }
    return rows[0]
  } finally {
    client.release()
  }
}

export async function getMyMentorProfile(userId: string) {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `SELECT 
        id, username, skills, is_mentor_available, mentor_experience_level, 
        mentor_languages, mentor_timezone, mentor_focus_areas, mentor_availability, 
        mentor_visibility, mentor_total_sessions, mentor_rating, 
        mentor_rating_count, is_mentor_verified 
      FROM public.profiles WHERE id = $1`,
      [userId]
    )
    
    if (rows.length === 0) {
      throw new NotFoundError('Mentor profile not found')
    }
    return rows[0]
  } finally {
    client.release()
  }
}

export async function createMentorRequest(beginnerId: string, input: {
  mentor_id: string
  topic: string
  goal: string
  urgency: 'low' | 'medium' | 'high'
  session_type: 'chat' | 'call' | 'pair_programming'
  preferred_time_slots: string[]
  preferred_schedule_at?: string | null
}) {
  const supabase = await createClient()

  const { data: mentorProfile, error: mentorError } = await supabase
    .from('profiles')
    .select('id, is_mentor_available')
    .eq('id', input.mentor_id)
    .single()

  if (mentorError || !mentorProfile) {
    throw new NotFoundError('Mentor not found')
  }
  if (!mentorProfile.is_mentor_available) {
    throw new ValidationError('Selected user is not accepting mentorship requests')
  }
  if (input.mentor_id === beginnerId) {
    throw new ValidationError('You cannot create a mentor request for yourself')
  }

  const participantIds = [beginnerId, input.mentor_id]
  const { data: blockRelation, error: blockError } = await supabase
    .from('mentor_blocks')
    .select('blocker_id, blocked_user_id')
    .in('blocker_id', participantIds)
    .in('blocked_user_id', participantIds)

  if (blockError) throw blockError

  const hasBlockedRelation = (blockRelation || []).some((row) => row.blocker_id !== row.blocked_user_id)
  if (hasBlockedRelation) {
    throw new ValidationError('Mentorship request cannot be sent because one user has blocked the other')
  }

  const { data, error } = await supabase
    .from('mentor_requests')
    .insert({
      beginner_id: beginnerId,
      mentor_id: input.mentor_id,
      topic: input.topic,
      goal: input.goal,
      urgency: input.urgency,
      session_type: input.session_type,
      preferred_time_slots: input.preferred_time_slots,
      preferred_schedule_at: input.preferred_schedule_at ?? null,
      status: 'pending'
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function getMyMentorRequests(userId: string) {
  const supabase = await createClient()

  const [beginnerRequestsResult, mentorRequestsResult] = await Promise.all([
    supabase
      .from('mentor_requests')
      .select('*')
      .eq('beginner_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('mentor_requests')
      .select('*')
      .eq('mentor_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)
  ])

  if (beginnerRequestsResult.error) throw beginnerRequestsResult.error
  if (mentorRequestsResult.error) throw mentorRequestsResult.error

  const mergedRequests = [
    ...(beginnerRequestsResult.data || []),
    ...(mentorRequestsResult.data || [])
  ]

  const requests = mergedRequests
    .filter((item, index, array) => index === array.findIndex((candidate) => candidate.id === item.id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (!requests || requests.length === 0) {
    return []
  }

  const profileIds = new Set<string>()
  requests.forEach((request) => {
    profileIds.add(request.beginner_id)
    profileIds.add(request.mentor_id)
  })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', Array.from(profileIds))

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]))

  const requestIds = requests.map((request) => request.id)
  const { data: sessions } = await supabase
    .from('mentor_sessions')
    .select('id, request_id, scheduled_for, mentor_confirmed, beginner_confirmed, completed_at')
    .in('request_id', requestIds)

  const sessionMap = new Map((sessions || []).map((session) => [session.request_id, session]))

  return requests.map((request) => ({
    ...request,
    beginner: profileMap.get(request.beginner_id) || null,
    mentor: profileMap.get(request.mentor_id) || null,
    session: sessionMap.get(request.id) || null,
    canRespond: request.mentor_id === userId && request.status === 'pending',
    canConfirmComplete: (request.mentor_id === userId || request.beginner_id === userId) && request.status === 'accepted'
  }))
}

export async function updateMentorRequestStatus(userId: string, requestId: string, input: MentorRequestActionInput) {
  const supabase = await createClient()

  const { data: request, error } = await supabase
    .from('mentor_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (error || !request) {
    throw new NotFoundError('Mentor request not found')
  }

  if (input.action === 'accept' || input.action === 'decline') {
    if (request.mentor_id !== userId) {
      throw new AuthorizationError('Only the selected mentor can respond to this request')
    }
  }

  if (input.action === 'cancel') {
    if (request.beginner_id !== userId && request.mentor_id !== userId) {
      throw new AuthorizationError('Only participants can cancel the request')
    }
  }

  if (input.action === 'confirm_complete') {
    if (request.beginner_id !== userId && request.mentor_id !== userId) {
      throw new AuthorizationError('Only participants can mark the session complete')
    }
    if (request.status !== 'accepted') {
      throw new ValidationError('Only accepted sessions can be completed')
    }
  }

  let nextStatus: MentorRequestStatus = request.status as MentorRequestStatus
  if (input.action === 'accept') nextStatus = 'accepted'
  if (input.action === 'decline') nextStatus = 'declined'
  if (input.action === 'cancel') nextStatus = 'canceled'

  if (input.action !== 'confirm_complete') {
    const respondedAt = (input.action === 'accept' || input.action === 'decline')
      ? new Date().toISOString()
      : request.responded_at

    const { data: updatedRequest, error: updateError } = await supabase
      .from('mentor_requests')
      .update({
        status: nextStatus,
        responded_at: respondedAt
      })
      .eq('id', requestId)
      .select('*')
      .single()

    if (updateError) throw updateError

    if (input.action === 'accept') {
      const { data: existingSession } = await supabase
        .from('mentor_sessions')
        .select('id')
        .eq('request_id', requestId)
        .maybeSingle()

      if (!existingSession) {
        const { error: sessionError } = await supabase
          .from('mentor_sessions')
          .insert({
            request_id: requestId,
            mentor_id: request.mentor_id,
            beginner_id: request.beginner_id,
            scheduled_for: input.scheduled_for ?? request.preferred_schedule_at ?? null
          })

        if (sessionError) throw sessionError
      } else if (input.scheduled_for) {
        const { error: sessionUpdateError } = await supabase
          .from('mentor_sessions')
          .update({ scheduled_for: input.scheduled_for })
          .eq('request_id', requestId)
        if (sessionUpdateError) throw sessionUpdateError
      }
    }

    return updatedRequest
  }

  const { data: mentorSession, error: sessionFetchError } = await supabase
    .from('mentor_sessions')
    .select('id, request_id, scheduled_for, mentor_notes, beginner_notes, mentor_confirmed, beginner_confirmed, completed_at')
    .eq('request_id', requestId)
    .maybeSingle()

  if (sessionFetchError) throw sessionFetchError

  let mentorConfirmed = mentorSession?.mentor_confirmed || false
  let beginnerConfirmed = mentorSession?.beginner_confirmed || false

  if (userId === request.mentor_id) mentorConfirmed = true
  if (userId === request.beginner_id) beginnerConfirmed = true

  const mentorNotes = userId === request.mentor_id
    ? (input.notes ?? mentorSession?.mentor_notes ?? null)
    : (mentorSession?.mentor_notes ?? null)
  const beginnerNotes = userId === request.beginner_id
    ? (input.notes ?? mentorSession?.beginner_notes ?? null)
    : (mentorSession?.beginner_notes ?? null)

  const sessionPayload = {
    request_id: requestId,
    mentor_id: request.mentor_id,
    beginner_id: request.beginner_id,
    scheduled_for: input.scheduled_for ?? mentorSession?.scheduled_for ?? request.preferred_schedule_at ?? null,
    mentor_confirmed: mentorConfirmed,
    beginner_confirmed: beginnerConfirmed,
    mentor_notes: mentorNotes,
    beginner_notes: beginnerNotes,
    completed_at: mentorConfirmed && beginnerConfirmed ? new Date().toISOString() : mentorSession?.completed_at ?? null
  }

  const { data: upsertedSession, error: sessionUpsertError } = await supabase
    .from('mentor_sessions')
    .upsert(sessionPayload, { onConflict: 'request_id' })
    .select('*')
    .single()

  if (sessionUpsertError) throw sessionUpsertError

  if (mentorConfirmed && beginnerConfirmed) {
    const { error: requestCompleteError } = await supabase
      .from('mentor_requests')
      .update({ status: 'completed' })
      .eq('id', requestId)
    if (requestCompleteError) throw requestCompleteError

    const { data: mentorProfile } = await supabase
      .from('profiles')
      .select('total_xp, mentor_total_sessions')
      .eq('id', request.mentor_id)
      .single()

    const { data: beginnerProfile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', request.beginner_id)
      .single()

    if (mentorProfile) {
      await supabase
        .from('profiles')
        .update({
          total_xp: (mentorProfile.total_xp || 0) + MENTOR_XP_REWARD,
          mentor_total_sessions: (mentorProfile.mentor_total_sessions || 0) + 1
        })
        .eq('id', request.mentor_id)
    }

    if (beginnerProfile) {
      await supabase
        .from('profiles')
        .update({
          total_xp: (beginnerProfile.total_xp || 0) + BEGINNER_XP_REWARD
        })
        .eq('id', request.beginner_id)
    }
  }

  return {
    ...request,
    status: mentorConfirmed && beginnerConfirmed ? 'completed' : 'accepted',
    session: upsertedSession
  }
}

export async function submitMentorFeedback(userId: string, sessionId: string, input: { rating: number, review?: string }) {
  const supabase = await createClient()

  const { data: session, error: sessionError } = await supabase
    .from('mentor_sessions')
    .select('id, mentor_id, beginner_id, completed_at')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) throw new NotFoundError('Session not found')
  if (!session.completed_at) throw new ValidationError('Feedback can only be submitted after session completion')
  if (session.mentor_id !== userId && session.beginner_id !== userId) {
    throw new AuthorizationError('Only participants can submit feedback')
  }

  const ratedUserId = userId === session.mentor_id ? session.beginner_id : session.mentor_id

  const { data, error } = await supabase
    .from('mentor_feedback')
    .upsert({
      session_id: session.id,
      rater_id: userId,
      rated_user_id: ratedUserId,
      rating: input.rating,
      review: input.review || null
    }, {
      onConflict: 'session_id,rater_id'
    })
    .select('*')
    .single()

  if (error) throw error

  if (ratedUserId === session.mentor_id) {
    await recomputeMentorRating(ratedUserId)
  }

  return data
}

async function recomputeMentorRating(mentorId: string) {
  const supabase = await createClient()
  const { data: feedbackRows, error } = await supabase
    .from('mentor_feedback')
    .select('rating')
    .eq('rated_user_id', mentorId)

  if (error) throw error

  const count = feedbackRows?.length || 0
  const totalRating = (feedbackRows || []).reduce((sum, row) => sum + row.rating, 0)
  const avg = count === 0 ? 0 : totalRating / count

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      mentor_rating: Number(avg.toFixed(2)),
      mentor_rating_count: count
    })
    .eq('id', mentorId)

  if (updateError) throw updateError
}

export async function createMentorReport(userId: string, input: {
  reported_user_id: string
  request_id?: string
  reason: string
  details?: string
}) {
  const supabase = await createClient()

  if (input.reported_user_id === userId) {
    throw new ValidationError('You cannot report yourself')
  }

  const { data, error } = await supabase
    .from('mentor_reports')
    .insert({
      reporter_id: userId,
      reported_user_id: input.reported_user_id,
      request_id: input.request_id || null,
      reason: input.reason,
      details: input.details || null,
      status: 'open'
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function createMentorBlock(userId: string, blockedUserId: string) {
  const supabase = await createClient()
  if (blockedUserId === userId) {
    throw new ValidationError('You cannot block yourself')
  }

  const { data, error } = await supabase
    .from('mentor_blocks')
    .upsert({
      blocker_id: userId,
      blocked_user_id: blockedUserId
    }, {
      onConflict: 'blocker_id,blocked_user_id'
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function getMentorStats() {
  const client = await pool.connect()
  try {
    const [
      { rows: [{ count: activeMentors }] },
      { rows: [{ count: openHelpRequests }] },
      { rows: [{ count: successfulMatches }] },
      { rows: topMentors }
    ] = await Promise.all([
      client.query("SELECT COUNT(*)::int as count FROM public.profiles WHERE is_mentor_available = true"),
      client.query("SELECT COUNT(*)::int as count FROM public.mentor_requests WHERE status = 'pending'"),
      client.query(
        "SELECT COUNT(*)::int as count FROM public.mentor_requests WHERE status = 'completed' AND updated_at >= $1", 
        [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()]
      ),
      client.query(`
        SELECT id, username, full_name, avatar_url, mentor_rating, mentor_total_sessions 
        FROM public.profiles 
        WHERE is_mentor_available = true AND is_mentor_verified = true 
        ORDER BY mentor_rating DESC NULLS LAST, mentor_total_sessions DESC 
        LIMIT 5
      `)
    ])

    return {
      activeMentors: activeMentors || 0,
      openHelpRequests: openHelpRequests || 0,
      successfulMatchesThisWeek: successfulMatches || 0,
      topMentors: topMentors || []
    }
  } finally {
    client.release()
  }
}
