import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/activity/create
 * Create a new activity and persist to database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, metadata } = body;

    // Validate required fields
    if (!type || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, userId' },
        { status: 400 }
      );
    }

    // Validate activity type
    const validTypes = ['challenge_solved', 'event_joined', 'badge_earned', 'team_registered'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid activity type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Insert activity into database
    const { data: activity, error: activityError } = await supabase
      .from('activity_feed')
      .insert({
        type,
        user_id: userId,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (activityError) {
      console.error('Supabase error creating activity:', activityError);
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      );
    }

    // Return activity with user details
    return NextResponse.json({
      id: activity.id,
      type: activity.type,
      userId: activity.user_id,
      username: user.username,
      avatarUrl: user.avatar_url,
      metadata: activity.metadata,
      createdAt: activity.created_at,
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
