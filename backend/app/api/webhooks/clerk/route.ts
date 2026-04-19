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

  // Verify payload with headers
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
  console.log(`Webhook received: ${eventType}`)

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

    return new Response('', { status: 200 })

  } catch (err: any) {
    console.error(`Webhook handler error:`, err)
    return new Response('Internal Server Error', { status: 500 })
  } finally {
    if (client) client.release()
  }
}

async function handleUserCreated(userData: any, client: any) {
  try {
    console.log('Creating user in Supabase:', userData.id)

    // Extract user data from Clerk
    const clerkUserId = userData.id
    const primaryEmail = userData.email_addresses?.find(
      (email: any) => email.id === userData.primary_email_address_id
    )?.email_address || userData.email_addresses?.[0]?.email_address || null
    const firstName = userData.first_name || null
    const lastName = userData.last_name || null
    const username = userData.username || null
    const imageUrl = userData.image_url || null
    const phone = userData.phone_numbers?.[0]?.phone_number || null

    // Create full name
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || ''
    const defaultUsername = username || primaryEmail?.split('@')[0] || `user_${clerkUserId.slice(-8)}`

    // Create comprehensive profile in Supabase
    await client.query(`
      INSERT INTO public.profiles (
        id, clerk_user_id, username, email, first_name, last_name, full_name,
        avatar_url, phone, email_verified, phone_verified, is_admin, is_mentor,
        is_mentee, is_active, is_verified, is_profile_public, total_xp,
        current_level, xp_to_next_level, current_level_xp, rank_tier,
        profile_completion_percentage, timezone, language, theme,
        notifications_enabled, email_notifications, push_notifications,
        created_at, updated_at, clerk_created_at, clerk_updated_at, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, false, false,
        true, false, true, 0, 1, 100, 0, 'Bronze', 0, 'UTC', 'en', 'dark',
        true, true, false, NOW(), NOW(), $12, $13, $14
      )
      ON CONFLICT (clerk_user_id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        phone = EXCLUDED.phone,
        email_verified = EXCLUDED.email_verified,
        phone_verified = EXCLUDED.phone_verified,
        updated_at = NOW(),
        clerk_updated_at = EXCLUDED.clerk_updated_at,
        metadata = EXCLUDED.metadata
    `, [
      clerkUserId, // id
      clerkUserId, // clerk_user_id
      defaultUsername, // username
      primaryEmail, // email
      firstName, // first_name
      lastName, // last_name
      fullName, // full_name
      imageUrl, // avatar_url
      phone, // phone
      userData.email_addresses?.[0]?.verification?.status === 'verified' || false, // email_verified
      userData.phone_numbers?.[0]?.verification?.status === 'verified' || false, // phone_verified
      userData.created_at, // clerk_created_at
      userData.updated_at, // clerk_updated_at
      JSON.stringify({
        clerk_data: userData,
        signup_source: 'clerk_webhook'
      }) // metadata
    ])

    console.log(`Successfully created user profile for ${clerkUserId}`)

    // Create initial XP transaction
    await createInitialXPTransaction(clerkUserId, client)

    // Send welcome notification
    await sendWelcomeNotification(clerkUserId, fullName || defaultUsername, client)

  } catch (error) {
    console.error(`Failed to create user ${userData.id}:`, error)
    throw error
  }
}

async function handleUserUpdated(userData: any, client: any) {
  try {
    console.log('Updating user in Supabase:', userData.id)

    const clerkUserId = userData.id
    const primaryEmail = userData.email_addresses?.find(
      (email: any) => email.id === userData.primary_email_address_id
    )?.email_address || userData.email_addresses?.[0]?.email_address || null
    const firstName = userData.first_name || null
    const lastName = userData.last_name || null
    const username = userData.username || null
    const imageUrl = userData.image_url || null
    const phone = userData.phone_numbers?.[0]?.phone_number || null

    // Create full name
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || ''

    // Update profile in Supabase
    await client.query(`
      UPDATE public.profiles SET
        email = $1,
        username = $2,
        first_name = $3,
        last_name = $4,
        full_name = $5,
        avatar_url = $6,
        phone = $7,
        email_verified = $8,
        phone_verified = $9,
        updated_at = NOW(),
        clerk_updated_at = $10,
        metadata = $11
      WHERE clerk_user_id = $12
    `, [
      primaryEmail,
      username,
      firstName,
      lastName,
      fullName,
      imageUrl,
      phone,
      userData.email_addresses?.[0]?.verification?.status === 'verified' || false,
      userData.phone_numbers?.[0]?.verification?.status === 'verified' || false,
      userData.updated_at,
      JSON.stringify({
        clerk_data: userData,
        last_updated_by: 'clerk_webhook'
      }),
      clerkUserId
    ])

    console.log(`Successfully updated user profile for ${clerkUserId}`)

  } catch (error) {
    console.error(`Failed to update user ${userData.id}:`, error)
    throw error
  }
}

async function handleUserDeleted(userData: any, client: any) {
  try {
    console.log('Deleting user from Supabase:', userData.id)

    const clerkUserId = userData.id

    // Soft delete by setting deleted_at timestamp
    await client.query(`
      UPDATE public.profiles SET
        is_active = false,
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE clerk_user_id = $1
    `, [clerkUserId])

    console.log(`Successfully soft-deleted user profile for ${clerkUserId}`)

  } catch (error) {
    console.error(`Failed to delete user ${userData.id}:`, error)
    throw error
  }
}

async function handleSessionCreated(sessionData: any, client: any) {
  try {
    console.log('Session created for user:', sessionData.user_id)

    const clerkUserId = sessionData.user_id

    // Update last login and increment login count
    await client.query(`
      UPDATE public.profiles SET
        last_login_at = NOW(),
        last_activity_at = NOW(),
        login_count = COALESCE(login_count, 0) + 1,
        updated_at = NOW()
      WHERE clerk_user_id = $1
    `, [clerkUserId])

    console.log(`Successfully updated session for ${clerkUserId}`)

  } catch (error) {
    console.error(`Failed to update session for ${sessionData.user_id}:`, error)
    throw error
  }
}

async function createInitialXPTransaction(clerkUserId: string, client: any) {
  try {
    await client.query(`
      INSERT INTO public.xp_transactions (
        clerk_user_id, amount, transaction_type, source_type, description,
        reason, status, created_at, processed_at, metadata
      ) VALUES (
        $1, 100, 'earned', 'admin', 'Welcome bonus for joining TechAssassin',
        'New user signup bonus', 'completed', NOW(), NOW(), $2
      )
    `, [
      clerkUserId,
      JSON.stringify({
        source: 'clerk_webhook',
        type: 'welcome_bonus'
      })
    ])

    console.log('Initial XP transaction created successfully')

  } catch (error) {
    console.error('Error creating initial XP transaction:', error)
  }
}

async function sendWelcomeNotification(clerkUserId: string, userName: string, client: any) {
  try {
    await client.query(`
      INSERT INTO public.notifications (
        recipient_clerk_user_id, title, message, in_app, email,
        priority, created_at, metadata
      ) VALUES (
        $1, 'Welcome to TechAssassin! 🎉', 
        $2, true, true, 'high', NOW(), $3
      )
    `, [
      clerkUserId,
      `Hi ${userName}! Welcome to TechAssassin. You've earned 100 XP as a welcome bonus. Start exploring missions, skills, and connect with the community!`,
      JSON.stringify({
        type: 'welcome',
        xp_bonus: 100
      })
    ])

    console.log('Welcome notification sent successfully')

  } catch (error) {
    console.error('Error sending welcome notification:', error)
  }
}
