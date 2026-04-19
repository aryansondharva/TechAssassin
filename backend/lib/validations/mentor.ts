import { z } from 'zod'

export const mentorDirectoryFilterSchema = z.object({
  skill: z.string().min(1).max(60).optional(),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'expert']).optional(),
  language: z.string().min(1).max(40).optional(),
  timezone: z.string().min(1).max(80).optional(),
  availability: z.string().min(1).max(120).optional()
})

export const mentorProfileUpdateSchema = z.object({
  is_mentor_available: z.boolean(),
  mentor_experience_level: z.enum(['junior', 'mid', 'senior', 'expert']).nullable().optional(),
  mentor_languages: z.array(z.string().min(1).max(40)).max(10).optional(),
  mentor_timezone: z.string().max(80).nullable().optional(),
  mentor_focus_areas: z.array(z.string().min(1).max(80)).max(15).optional(),
  mentor_availability: z.string().max(250).nullable().optional(),
  mentor_visibility: z.enum(['public', 'community', 'private']).optional()
})

export const mentorHelpRequestCreateSchema = z.object({
  mentor_id: z.string(),
  topic: z.string().min(3).max(120),
  goal: z.string().min(10).max(1000),
  urgency: z.enum(['low', 'medium', 'high']),
  session_type: z.enum(['chat', 'call', 'pair_programming']),
  preferred_time_slots: z.array(z.string().min(1).max(120)).max(10).default([]),
  preferred_schedule_at: z.string().datetime().nullable().optional()
})

export const mentorRequestActionSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel', 'confirm_complete']),
  scheduled_for: z.string().datetime().nullable().optional(),
  notes: z.string().max(1000).nullable().optional()
})

export const mentorFeedbackCreateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional().or(z.literal(''))
})

export const mentorReportCreateSchema = z.object({
  reported_user_id: z.string(),
  request_id: z.string().uuid().optional(),
  reason: z.string().min(5).max(120),
  details: z.string().max(2000).optional().or(z.literal(''))
})

export const mentorBlockCreateSchema = z.object({
  blocked_user_id: z.string()
})
