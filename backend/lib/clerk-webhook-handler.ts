/**
 * Clerk Webhook Handler
 * Handles Clerk webhooks to automatically sync user data to Supabase
 */

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new NextResponse('Error occurred -- no svix headers', {
        status: 400
      });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(webhookSecret);

    let evt: any;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new NextResponse('Error occurred', {
        status: 400
      });
    }

    // Handle the webhook
    const eventType = evt.type;
    console.log(`Webhook received: ${eventType}`);

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      case 'session.created':
        await handleSessionCreated(evt.data);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function handleUserCreated(userData: any) {
  try {
    console.log('Creating user in Supabase:', userData.id);

    // Extract user data from Clerk
    const clerkUserId = userData.id;
    const email = userData.email_addresses?.[0]?.email_address || null;
    const firstName = userData.first_name || null;
    const lastName = userData.last_name || null;
    const username = userData.username || null;
    const imageUrl = userData.image_url || null;
    const phone = userData.phone_numbers?.[0]?.phone_number || null;

    // Create full name
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : 
                    firstName || lastName || username || 'User';

    // Create or update profile in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        clerk_user_id: clerkUserId,
        email: email,
        username: username || `user_${clerkUserId.slice(-8)}`,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        avatar_url: imageUrl,
        phone: phone,
        email_verified: userData.email_addresses?.[0]?.verification?.status === 'verified' || false,
        phone_verified: userData.phone_numbers?.[0]?.verification?.status === 'verified' || false,
        is_active: true,
        is_verified: false,
        total_xp: 0,
        current_level: 1,
        rank_tier: 'Bronze',
        profile_completion_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clerk_created_at: userData.created_at,
        clerk_updated_at: userData.updated_at,
        metadata: {
          clerk_data: userData,
          signup_source: 'clerk_webhook'
        }
      }, {
        onConflict: 'clerk_user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }

    console.log('User profile created successfully:', data);

    // Create initial XP transaction
    await createInitialXPTransaction(clerkUserId);

    // Send welcome notification
    await sendWelcomeNotification(clerkUserId, fullName);

    return data;

  } catch (error) {
    console.error('Error handling user created:', error);
    throw error;
  }
}

async function handleUserUpdated(userData: any) {
  try {
    console.log('Updating user in Supabase:', userData.id);

    const clerkUserId = userData.id;
    const email = userData.email_addresses?.[0]?.email_address || null;
    const firstName = userData.first_name || null;
    const lastName = userData.last_name || null;
    const username = userData.username || null;
    const imageUrl = userData.image_url || null;
    const phone = userData.phone_numbers?.[0]?.phone_number || null;

    // Create full name
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : 
                    firstName || lastName || username || 'User';

    // Update profile in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .update({
        email: email,
        username: username,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        avatar_url: imageUrl,
        phone: phone,
        email_verified: userData.email_addresses?.[0]?.verification?.status === 'verified' || false,
        phone_verified: userData.phone_numbers?.[0]?.verification?.status === 'verified' || false,
        updated_at: new Date().toISOString(),
        clerk_updated_at: userData.updated_at,
        metadata: {
          clerk_data: userData,
          last_updated_by: 'clerk_webhook'
        }
      })
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    console.log('User profile updated successfully:', data);
    return data;

  } catch (error) {
    console.error('Error handling user updated:', error);
    throw error;
  }
}

async function handleUserDeleted(userData: any) {
  try {
    console.log('Deleting user from Supabase:', userData.id);

    const clerkUserId = userData.id;

    // Soft delete by setting deleted_at timestamp
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }

    console.log('User profile deleted successfully:', data);
    return data;

  } catch (error) {
    console.error('Error handling user deleted:', error);
    throw error;
  }
}

async function handleSessionCreated(sessionData: any) {
  try {
    console.log('Session created for user:', sessionData.user_id);

    const clerkUserId = sessionData.user_id;

    // Update last login
    const { data, error } = await supabase
      .from('profiles')
      .update({
        last_login_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        login_count: supabase.rpc('increment_login_count', { user_id: clerkUserId }),
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      throw error;
    }

    console.log('Session updated successfully:', data);
    return data;

  } catch (error) {
    console.error('Error handling session created:', error);
    throw error;
  }
}

async function createInitialXPTransaction(clerkUserId: string) {
  try {
    const { error } = await supabase
      .from('xp_transactions')
      .insert({
        clerk_user_id: clerkUserId,
        amount: 100, // Welcome bonus XP
        transaction_type: 'earned',
        source_type: 'admin',
        description: 'Welcome bonus for joining TechAssassin',
        reason: 'New user signup bonus',
        status: 'completed',
        created_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        metadata: {
          source: 'clerk_webhook',
          type: 'welcome_bonus'
        }
      });

    if (error) {
      console.error('Error creating initial XP transaction:', error);
    } else {
      console.log('Initial XP transaction created successfully');
    }

  } catch (error) {
    console.error('Error creating initial XP transaction:', error);
  }
}

async function sendWelcomeNotification(clerkUserId: string, userName: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_clerk_user_id: clerkUserId,
        title: 'Welcome to TechAssassin! 🎉',
        message: `Hi ${userName}! Welcome to TechAssassin. You've earned 100 XP as a welcome bonus. Start exploring missions, skills, and connect with the community!`,
        notification_type_id: null, // You can create a welcome notification type
        in_app: true,
        email: true,
        priority: 'high',
        created_at: new Date().toISOString(),
        metadata: {
          type: 'welcome',
          xp_bonus: 100
        }
      });

    if (error) {
      console.error('Error sending welcome notification:', error);
    } else {
      console.log('Welcome notification sent successfully');
    }

  } catch (error) {
    console.error('Error sending welcome notification:', error);
  }
}
