import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Pool } from 'pg'
import { profileUpdateSchema } from '@/lib/validations/profile'
import { handleApiError, NotFoundError, ConflictError, AuthorizationError, AuthenticationError } from '@/lib/errors'
import { deleteAvatar } from '@/lib/storage/cleanup'

// Use pg pool directly — avoids PostgREST schema cache issues entirely
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
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
      const { rows } = await client.query(
        'SELECT * FROM public.profiles WHERE id = $1',
        [userId]
      )

      if (rows.length === 0) {
        throw new NotFoundError('Profile not found. Please log out and log back in to sync your account.')
      }

      return NextResponse.json(rows[0])
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

    const validatedData = profileUpdateSchema.parse(body)

    const client = await pool.connect()
    try {
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

      // Build dynamic UPDATE query from validated fields
      const allowedFields = [
        'username', 'full_name', 'email', 'bio', 'avatar_url',
        'github_url', 'linkedin_url', 'portfolio_url'
      ]

      const entries = Object.entries(validatedData)
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
