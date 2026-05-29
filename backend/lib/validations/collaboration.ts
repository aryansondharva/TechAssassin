import { z } from 'zod'

const blankToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export const collaborationOrganizationTypes = [
  'company',
  'startup',
  'sponsor',
  'mentor',
  'tech_organization',
  'university',
  'community',
  'other',
] as const

export const collaborationInterests = [
  'workshops',
  'hackathons',
  'sponsorships',
  'hiring_talent',
  'product_feedback',
  'mentorship',
  'brand_presence',
  'campus_events',
  'internship_connect',
  'startup_collaboration',
  'community_growth',
  'student_innovation',
] as const

export const collaborationCreateSchema = z.object({
  organization_name: z.string().trim().min(2, 'Organization name is required').max(120),
  organization_type: z.enum(collaborationOrganizationTypes),
  contact_name: z.string().trim().min(2, 'Contact name is required').max(100),
  role_title: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  work_email: z.string().trim().email('Work email must be valid').max(160),
  phone: z.preprocess(blankToUndefined, z.string().trim().max(30).optional()),
  website_url: z.preprocess(
    blankToUndefined,
    z.string().trim().regex(/^https?:\/\/.+/i, 'Website URL must start with http:// or https://').max(240).optional()
  ),
  collaboration_interests: z
    .array(z.enum(collaborationInterests))
    .min(1, 'Select at least one collaboration interest')
    .max(8, 'Select up to 8 collaboration interests'),
  budget_range: z.preprocess(blankToUndefined, z.string().trim().max(80).optional()),
  timeline: z.preprocess(blankToUndefined, z.string().trim().max(80).optional()),
  student_audience: z.preprocess(blankToUndefined, z.string().trim().max(120).optional()),
  message: z.string().trim().min(20, 'Message must be at least 20 characters').max(2000),
  source_page: z.preprocess(blankToUndefined, z.string().trim().max(120).optional()),
})

export type CollaborationCreateInput = z.infer<typeof collaborationCreateSchema>
