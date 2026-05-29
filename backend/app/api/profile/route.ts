import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { Pool } from 'pg'
import { profileUpdateSchema } from '@/lib/validations/profile'
import { handleApiError, NotFoundError, ConflictError, AuthorizationError, AuthenticationError } from '@/lib/errors'
import { deleteAvatar } from '@/lib/storage/cleanup'
import { ensureEditProfileColumns } from '@/lib/profile-schema'
import { getAvailableClerkUsername, getClerkPrimaryEmail, isGeneratedUsername } from '@/lib/clerk-profile'

// Use pg pool directly — avoids PostgREST schema cache issues entirely
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
})

const normalizeHandle = (value: string) => value.trim().replace(/^@+/, '').replace(/^\/+/, '')

const normalizeUrl = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed.replace(/^\/+/, '')}`
}

const normalizeSocialUrl = (field: string, value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (!trimmed || /^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  const handle = normalizeHandle(trimmed)
  if (field === 'github_url') {
    return `https://github.com/${handle.replace(/^github\.com\//i, '')}`
  }
  if (field === 'linkedin_url') {
    return `https://www.linkedin.com/in/${handle.replace(/^(www\.)?linkedin\.com\/in\//i, '')}`
  }
  if (field === 'twitter_url') {
    return `https://x.com/${handle.replace(/^(www\.)?(twitter|x)\.com\//i, '')}`
  }

  return normalizeUrl(trimmed)
}

const normalizeProfileUpdateBody = (body: Record<string, unknown>) => ({
  ...body,
  github_url: normalizeSocialUrl('github_url', body.github_url),
  linkedin_url: normalizeSocialUrl('linkedin_url', body.linkedin_url),
  twitter_url: normalizeSocialUrl('twitter_url', body.twitter_url),
  portfolio_url: normalizeUrl(body.portfolio_url),
  resume_url: normalizeUrl(body.resume_url),
})

/**
 * GET /api/profile
 * Get current user's own profile (all fields).
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new AuthenticationError('Authentication required')
    }

    const client = await pool.connect()
    try {
      await ensureEditProfileColumns(client)

      const { rows } = await client.query(
        'SELECT * FROM public.profiles WHERE id = $1',
        [userId]
      )

      if (rows.length === 0) {
        // Just-in-time provisioning: Fetch directly from Clerk if Webhook was delayed
        try {
          const clerk = await clerkClient()
          const user = await clerk.users.getUser(userId)
          const primaryEmail = getClerkPrimaryEmail(user) || ''
          const username = await getAvailableClerkUsername(client, user, userId)

          const { rows: newRows } = await client.query(`
            INSERT INTO public.profiles (
              id, username, email, first_name, last_name, full_name, avatar_url, updated_at
            ) VALUES (
              $1, $2, $3, '', '', '', NULL, NOW()
            ) RETURNING *
          `, [userId, username, primaryEmail])
          
          return NextResponse.json(newRows[0])
        } catch (syncError) {
          console.error("Failed to sync user from Clerk just-in-time:", syncError)
          throw new NotFoundError('Profile not found and could not be synced from authentication provider. Please log out and back in.')
        }
      }

      let profile = rows[0]
      if (!profile.username || isGeneratedUsername(profile.username)) {
        try {
          const clerk = await clerkClient()
          const user = await clerk.users.getUser(userId)
          const username = await getAvailableClerkUsername(client, user, userId)
          const primaryEmail = getClerkPrimaryEmail(user) || profile.email

          if (username && username !== profile.username) {
            const { rows: updatedRows } = await client.query(
              'UPDATE public.profiles SET username = $2, email = $3, updated_at = NOW() WHERE id = $1 RETURNING *',
              [userId, username, primaryEmail]
            )
            profile = updatedRows[0] || profile
          }
        } catch (syncError) {
          console.warn('Failed to refresh generated username from Clerk:', syncError)
        }
      }

      return NextResponse.json(profile)
    } finally {
      client.release()
    }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/profile
 * Update authenticated user's own profile.
 * The SQL trigger 'trigger_enforce_username_change_limit' enforces the 2x/month rule.
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new AuthenticationError('Authentication required')
    }

    const body = await request.json()

    // Prevent member_id modification (immutable)
    if ('member_id' in body) {
      throw new AuthorizationError('Member ID is unique and cannot be changed.')
    }
    // Prevent is_admin modification
    if ('is_admin' in body) {
      throw new AuthorizationError('Cannot modify admin status.')
    }

    const validatedData = profileUpdateSchema.parse(normalizeProfileUpdateBody(body))

    const client = await pool.connect()
    try {
      await ensureEditProfileColumns(client)

      // Check username uniqueness (if changing)
      if (validatedData.username) {
        const { rows: existing } = await client.query(
          'SELECT id FROM public.profiles WHERE username = $1 AND id != $2',
          [validatedData.username.toLowerCase(), userId]
        )
        if (existing.length > 0) {
          throw new ConflictError('Username already taken')
        }
      }

      const dataToUpdate: Record<string, unknown> = { ...validatedData }

      if (
        !('full_name' in dataToUpdate) &&
        ('first_name' in dataToUpdate || 'last_name' in dataToUpdate)
      ) {
        const { rows: currentRows } = await client.query(
          'SELECT first_name, last_name, full_name FROM public.profiles WHERE id = $1',
          [userId]
        )
        const currentProfile = currentRows[0] || {}
        const firstName = String(dataToUpdate.first_name ?? currentProfile.first_name ?? '').trim()
        const lastName = String(dataToUpdate.last_name ?? currentProfile.last_name ?? '').trim()
        dataToUpdate.full_name = [firstName, lastName].filter(Boolean).join(' ').trim()
          || currentProfile.full_name
          || ''
      }

      // Build dynamic UPDATE query from validated fields
      const allowedFields = [
        'username', 'full_name', 'email', 'bio', 'avatar_url',
        'first_name', 'last_name', 'gender', 'tshirt_size', 'phone',
        'github_url', 'linkedin_url', 'twitter_url', 'portfolio_url',
        'readme', 'address', 'dietary_preference', 'allergies',
        'has_education', 'education', 'university', 'degree_type',
        'graduation_year', 'graduation_month', 'skills', 'interests',
        'roles', 'resume_url', 'has_experience', 'banner_url',
        'emergency_contact_name', 'emergency_contact_phone',
        'is_email_public', 'is_phone_public', 'is_address_public'
      ]

      const entries = Object.entries(dataToUpdate)
        .filter(([key]) => allowedFields.includes(key))
        .map(([key, value]) => {
          // Lowercase usernames
          if (key === 'username' && typeof value === 'string') {
            return [key, value.toLowerCase()]
          }
          return [key, value]
        })

      if (entries.length === 0) {
        throw new Error('No valid fields to update')
      }

      const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ')
      const values = entries.map(([, value]) => value)

      const { rows } = await client.query(
        `UPDATE public.profiles SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [userId, ...values]
      )

      if (rows.length === 0) {
        throw new NotFoundError('Profile not found. Please log out and log back in to sync your account.')
      }

      return NextResponse.json(rows[0])
    } catch (error: any) {
      // Surface the trigger message for username change limit
      if (error.message?.includes('Username can only be changed twice per month')) {
        throw new ConflictError('You have already changed your username twice this month.')
      }
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/profile
 */
export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new AuthenticationError('Authentication required')
    }

    const client = await pool.connect()
    try {
      await client.query('DELETE FROM public.profiles WHERE id = $1', [userId])
    } finally {
      client.release()
    }

    try {
      await deleteAvatar(userId)
    } catch (cleanupError) {
      console.error('Failed to clean up avatar:', cleanupError)
    }

    return NextResponse.json({ message: 'Profile deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
