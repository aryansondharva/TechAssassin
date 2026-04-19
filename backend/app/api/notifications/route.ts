import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
})

// GET /api/notifications — fetch paginated list for current user
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const offset = (page - 1) * limit

    const client = await pool.connect()
    try {
      const { rows } = await client.query(`
        SELECT * FROM public.notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset])

      const { rows: countRows } = await client.query(`
        SELECT COUNT(*) FROM public.notifications WHERE user_id = $1
      `, [userId])

      return NextResponse.json({ 
        data: rows, 
        count: parseInt(countRows[0].count, 10), 
        page, 
        limit 
      })
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/notifications/read — mark all as read
export async function PATCH() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = await pool.connect()
    try {
      await client.query(`
        UPDATE public.notifications 
        SET is_read = true 
        WHERE user_id = $1 AND is_read = false
      `, [userId])

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
