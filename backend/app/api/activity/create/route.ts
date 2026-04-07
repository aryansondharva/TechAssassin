import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors';

/**
 * POST /api/activity/create
 * Create a new activity and persist to database
 * Requirements: 3.1, 4.1, 4.2
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth();
    
    const body = await request.json();
    const { type, metadata } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
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
    const { data: profile, error: userError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    if (userError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Insert activity into database
    const { data: activity, error: activityError } = await supabase
      .from('activity_feed')
      .insert({
        type,
        user_id: user.id,
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
      username: profile.username,
      avatarUrl: profile.avatar_url,
      metadata: activity.metadata,
      createdAt: activity.created_at,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
