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
    console.error('Missing CLERK_WEBHOOK_SECRET')
    return new Response('Error: Missing webhook secret', { status: 500 })
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

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured during verification', {
      status: 400,
    })
  }

  // Determine event type
  const eventType = evt.type
  console.log(`Clerk Webhook processed: ${eventType} for user ${evt.data.id}`)

  let client
  try {
    client = await pool.connect()

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data, client)
        break
      case 'user.updated':
        await handleUserUpdated(evt.data, client)
        break
      case 'user.deleted':
        await handleUserDeleted(evt.data, client)
        break
      case 'session.created':
        await handleSessionCreated(evt.data, client)
        break
      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return new Response('Webhook processed', { status: 200 })

  } catch (err: any) {
    console.error(`Webhook handler error [${eventType}]:`, err)
    return new Response('Internal Server Error', { status: 500 })
  } finally {
    if (client) client.release()
  }
}

async function handleUserCreated(userData: any, client: any) {
  try {
    const clerkUserId = userData.id
    const primaryEmail = userData.email_addresses?.find(
      (email: any) => email.id === userData.primary_email_address_id
    )?.email_address || userData.email_addresses?.[0]?.email_address || null
    
    const firstName = userData.first_name || null
    const lastName = userData.last_name || null
    const username = userData.username || null
    const imageUrl = userData.image_url || null
    const phone = userData.phone_numbers?.[0]?.phone_number || null

    const fullName = [firstName, lastName].filter(Boolean).join(' ') || ''
    const defaultUsername = username || primaryEmail?.split('@')[0] || `user_${clerkUserId.slice(-8)}`

    // Create profile using Clerk ID as the primary key (TEXT)
    await client.query(`
      INSERT INTO public.profiles (
        id, clerk_user_id, username, email, first_name, last_name, full_name,
        avatar_url, phone, email_verified, phone_verified, is_admin,
        is_active, total_xp, created_at, updated_at, metadata
      ) VALUES (
        $1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, 
        true, 0, NOW(), NOW(), $11
      )
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW(),
        metadata = profiles.metadata || EXCLUDED.metadata
    `, [
      clerkUserId,
      defaultUsername,
      primaryEmail,
      firstName,
      lastName,
      fullName,
      imageUrl,
      phone,
      userData.email_addresses?.[0]?.verification?.status === 'verified' || false,
      userData.phone_numbers?.[0]?.verification?.status === 'verified' || false,
      JSON.stringify({ signup_source: 'clerk_webhook' })
    ])

    console.log(`Profile synced for ${clerkUserId}`)

    // Create initial rewards
    await createInitialXPTransaction(clerkUserId, client)
    await sendWelcomeNotification(clerkUserId, fullName || defaultUsername, client)

  } catch (error) {
    console.error(`Failed to handle user.created for ${userData.id}:`, error)
    throw error
  }
}

async function handleUserUpdated(userData: any, client: any) {
  try {
    const clerkUserId = userData.id
    const primaryEmail = userData.email_addresses?.find(
      (email: any) => email.id === userData.primary_email_address_id
    )?.email_address || userData.email_addresses?.[0]?.email_address || null
    
    const firstName = userData.first_name || null
    const lastName = userData.last_name || null
    const username = userData.username || null
    const imageUrl = userData.image_url || null

    const fullName = [firstName, lastName].filter(Boolean).join(' ') || ''

    await client.query(`
      UPDATE public.profiles SET
        email = $1,
        username = $2,
        first_name = $3,
        last_name = $4,
        full_name = $5,
        avatar_url = $6,
        updated_at = NOW(),
        metadata = profiles.metadata || $7
      WHERE id = $8
    `, [
      primaryEmail,
      username,
      firstName,
      lastName,
      fullName,
      imageUrl,
      JSON.stringify({ last_sync: new Date().toISOString() }),
      clerkUserId
    ])

    console.log(`Profile updated for ${clerkUserId}`)
  } catch (error) {
    console.error(`Failed to handle user.updated for ${userData.id}:`, error)
    throw error
  }
}

async function handleUserDeleted(userData: any, client: any) {
  try {
    const clerkUserId = userData.id
    await client.query(`
      UPDATE public.profiles SET
        is_active = false,
        updated_at = NOW()
      WHERE id = $1
    `, [clerkUserId])
    console.log(`Profile deactivated for ${clerkUserId}`)
  } catch (error) {
    console.error(`Failed to handle user.deleted for ${userData.id}:`, error)
    throw error
  }
}

async function handleSessionCreated(sessionData: any, client: any) {
  try {
    const clerkUserId = sessionData.user_id
    await client.query(`
      UPDATE public.profiles SET
        last_login_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `, [clerkUserId])
  } catch (error) {
    console.error(`Failed to handle session.created for ${sessionData.user_id}:`, error)
    throw error
  }
}

async function createInitialXPTransaction(clerkUserId: string, client: any) {
  try {
    await client.query(`
      INSERT INTO public.xp_transactions (
        user_id, amount, source, activity_type, description, status, created_at
      ) VALUES (
        $1, 100, 'profile_completion', 'signup_bonus', 'Welcome bonus!', 'completed', NOW()
      )
    `, [clerkUserId])
  } catch (error) {
    console.error('Error in createInitialXPTransaction:', error)
  }
}

async function sendWelcomeNotification(clerkUserId: string, userName: string, client: any) {
  try {
    await client.query(`
      INSERT INTO public.notifications (
        user_id, title, message, type, created_at
      ) VALUES (
        $1, 'Welcome! 🎉', $2, 'xp_gain', NOW()
      )
    `, [
      clerkUserId,
      `Hi ${userName}! Welcome to the community.`
    ])
  } catch (error) {
    console.error('Error in sendWelcomeNotification:', error)
  }
}
