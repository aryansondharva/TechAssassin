import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Pool } from 'pg'

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
})

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Determine event type
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, username, image_url } = evt.data
    const primaryEmail = email_addresses.find(
      (email) => email.id === evt.data.primary_email_address_id
    )?.email_address || email_addresses[0]?.email_address

    const fullName = [first_name, last_name].filter(Boolean).join(' ') || ''
    const defaultUsername = username || primaryEmail?.split('@')[0] || `user_${Date.now()}`

    let client
    try {
      client = await pool.connect()
      await client.query(
        `INSERT INTO public.profiles (
          id, username, email, full_name, avatar_url, is_admin, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          avatar_url = EXCLUDED.avatar_url,
          updated_at = NOW()`,
        [id, defaultUsername, primaryEmail, fullName, image_url]
      )
      console.log(`Successfully synced User ${id} to Supabase profiles`)
    } catch (err: any) {
      console.error(`Failed to sync clerk user ${id} to supabase:`, err)
      return new Response('Database Error', { status: 500 })
    } finally {
      if (client) client.release()
    }
  }

  return new Response('', { status: 200 })
}
