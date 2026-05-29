import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { collaborationCreateSchema } from '@/lib/validations/collaboration'
import { handleApiError } from '@/lib/errors'
import { requireAuth, requireAdmin } from '@/lib/middleware/auth'
import { ensureCollaborationRequestTable } from '@/lib/collaboration-schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    await requireAdmin(user.id)

    const status = request.nextUrl.searchParams.get('status')
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10), 100)

    const client = await pool.connect()
    try {
      await ensureCollaborationRequestTable(client)

      const values: unknown[] = []
      const whereClauses: string[] = []

      if (status) {
        values.push(status)
        whereClauses.push(`status = $${values.length}`)
      }

      values.push(limit)
      const { rows } = await client.query(
        `
          SELECT *
          FROM public.collaboration_requests
          ${whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''}
          ORDER BY created_at DESC
          LIMIT $${values.length}
        `,
        values
      )

      return NextResponse.json({ data: rows })
    } finally {
      client.release()
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = collaborationCreateSchema.parse(body)
    const { userId } = await auth()

    const client = await pool.connect()
    try {
      await ensureCollaborationRequestTable(client)

      const { rows } = await client.query(
        `
          INSERT INTO public.collaboration_requests (
            user_id,
            organization_name,
            organization_type,
            contact_name,
            role_title,
            work_email,
            phone,
            website_url,
            collaboration_interests,
            budget_range,
            timeline,
            student_audience,
            message,
            source_page,
            metadata
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          )
          RETURNING *
        `,
        [
          userId || null,
          validatedData.organization_name,
          validatedData.organization_type,
          validatedData.contact_name,
          validatedData.role_title || null,
          validatedData.work_email.toLowerCase(),
          validatedData.phone || null,
          validatedData.website_url || null,
          validatedData.collaboration_interests,
          validatedData.budget_range || null,
          validatedData.timeline || null,
          validatedData.student_audience || null,
          validatedData.message,
          validatedData.source_page || 'collaborate',
          {
            userAgent: request.headers.get('user-agent'),
            referrer: request.headers.get('referer'),
          },
        ]
      )

      return NextResponse.json(rows[0], { status: 201 })
    } finally {
      client.release()
    }
  } catch (error) {
    return handleApiError(error)
  }
}
