import { createClient } from '../supabase/server'
import { AuthorizationError, NotFoundError, ValidationError } from '../errors'

export interface MentorDirectoryFilters {
  skill?: string
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'expert'
  language?: string
  timezone?: string
  availability?: string
}

type MentorRequestStatus = 'pending' | 'accepted' | 'declined' | 'canceled' | 'completed'

interface MentorRequestActionInput {
  action: 'accept' | 'decline' | 'cancel' | 'confirm_complete'
  scheduled_for?: string | null
  notes?: string | null
}

export async function getMentorDirectory(filters: MentorDirectoryFilters = {}, viewerId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      bio,
      skills,
      mentor_experience_level,
      mentor_languages,
      mentor_timezone,
      mentor_focus_areas,
      mentor_availability,
      mentor_visibility,
      mentor_total_sessions,
      mentor_rating,
      mentor_rating_count
    `)
    .eq('is_mentor_available', true)
    .neq('mentor_visibility', 'private')
    .order('mentor_rating', { ascending: false, nullsFirst: false })
    .order('mentor_total_sessions', { ascending: false })
    .limit(100)

  if (filters.skill) {
    query = query.contains('skills', [filters.skill])
  }
  if (filters.experienceLevel) {
    query = query.eq('mentor_experience_level', filters.experienceLevel)
  }
  if (filters.language) {
    query = query.contains('mentor_languages', [filters.language])
  }
  if (filters.timezone) {
    query = query.eq('mentor_timezone', filters.timezone)
  }
  if (filters.availability) {
    query = query.ilike('mentor_availability', `%${filters.availability}%`)
  }

  const { data: mentors, error } = await query
  if (error) throw error

  if (!viewerId || !mentors || mentors.length === 0) {
    return mentors || []
  }

  const mentorIds = mentors.map((mentor) => mentor.id)
  const [blocksByViewer, blocksAgainstViewer] = await Promise.all([
    supabase
      .from('mentor_blocks')
      .select('blocker_id, blocked_user_id')
      .eq('blocker_id', viewerId)
      .in('blocked_user_id', mentorIds),
    supabase
      .from('mentor_blocks')
      .select('blocker_id, blocked_user_id')
      .eq('blocked_user_id', viewerId)
      .in('blocker_id', mentorIds)
  ])

  if (blocksByViewer.error) throw blocksByViewer.error
  if (blocksAgainstViewer.error) throw blocksAgainstViewer.error

  const blockedLinks = [
    ...(blocksByViewer.data || []),
    ...(blocksAgainstViewer.data || [])
  ]

  const blockedIds = new Set<string>()
  ;(blockedLinks || []).forEach((item) => {
    if (item.blocker_id === viewerId) blockedIds.add(item.blocked_user_id)
    if (item.blocked_user_id === viewerId) blockedIds.add(item.blocker_id)
  })

  return mentors.filter((mentor) => !blockedIds.has(mentor.id))
}

export async function updateMyMentorProfile(userId: string, input: Record<string, unknown>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', userId)
    .select(`
      id,
      username,
      is_mentor_available,
      mentor_experience_level,
      mentor_languages,
      mentor_timezone,
      mentor_focus_areas,
      mentor_availability,
      mentor_visibility
    `)
    .single()

  if (error) throw error
  return data
}

export async function getMyMentorProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      skills,
      is_mentor_available,
      mentor_experience_level,
      mentor_languages,
      mentor_timezone,
      mentor_focus_areas,
      mentor_availability,
      mentor_visibility,
      mentor_total_sessions,
      mentor_rating,
      mentor_rating_count
    `)
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
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
    .select('*')
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
    const { data: updatedRequest, error: updateError } = await supabase
      .from('mentor_requests')
      .update({
        status: nextStatus,
        responded_at: input.action === 'accept' || input.action === 'decline' ? new Date().toISOString() : request.responded_at
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

  const { data: session, error: sessionFetchError } = await supabase
    .from('mentor_sessions')
    .select('*')
    .eq('request_id', requestId)
    .maybeSingle()

  if (sessionFetchError) throw sessionFetchError

  let mentorConfirmed = session?.mentor_confirmed || false
  let beginnerConfirmed = session?.beginner_confirmed || false

  if (userId === request.mentor_id) mentorConfirmed = true
  if (userId === request.beginner_id) beginnerConfirmed = true

  const mentorNotes = userId === request.mentor_id
    ? (input.notes ?? session?.mentor_notes ?? null)
    : (session?.mentor_notes ?? null)
  const beginnerNotes = userId === request.beginner_id
    ? (input.notes ?? session?.beginner_notes ?? null)
    : (session?.beginner_notes ?? null)

  const sessionPayload = {
    request_id: requestId,
    mentor_id: request.mentor_id,
    beginner_id: request.beginner_id,
    scheduled_for: input.scheduled_for ?? session?.scheduled_for ?? request.preferred_schedule_at ?? null,
    mentor_confirmed: mentorConfirmed,
    beginner_confirmed: beginnerConfirmed,
    mentor_notes: mentorNotes,
    beginner_notes: beginnerNotes,
    completed_at: mentorConfirmed && beginnerConfirmed ? new Date().toISOString() : session?.completed_at ?? null
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
      .select('total_xp, current_streak')
      .eq('id', request.beginner_id)
      .single()

    if (mentorProfile) {
      await supabase
        .from('profiles')
        .update({
          total_xp: (mentorProfile.total_xp || 0) + 100,
          mentor_total_sessions: (mentorProfile.mentor_total_sessions || 0) + 1
        })
        .eq('id', request.mentor_id)
    }

    if (beginnerProfile) {
      await supabase
        .from('profiles')
        .update({
          total_xp: (beginnerProfile.total_xp || 0) + 40,
          current_streak: (beginnerProfile.current_streak || 0) + 1
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
  const avg = count === 0
    ? 0
    : feedbackRows!.reduce((sum, row) => sum + row.rating, 0) / count

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
  const supabase = await createClient()

  const [activeMentorsResult, openRequestsResult, successfulMatchesResult, topMentorsResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_mentor_available', true),
    supabase.from('mentor_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('mentor_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, mentor_rating, mentor_total_sessions')
      .eq('is_mentor_available', true)
      .order('mentor_rating', { ascending: false, nullsFirst: false })
      .order('mentor_total_sessions', { ascending: false })
      .limit(5)
  ])

  return {
    activeMentors: activeMentorsResult.count || 0,
    openHelpRequests: openRequestsResult.count || 0,
    successfulMatchesThisWeek: successfulMatchesResult.count || 0,
    topMentors: topMentorsResult.data || []
  }
}
