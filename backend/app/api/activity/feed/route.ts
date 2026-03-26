import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/activity/feed
 * Get activity feed with filtering and pagination
 * Requirements: 3.1, 4.1, 4.2
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * pageSize;

    const supabase = await createClient();

    // Build query with filters
    let query = supabase
      .from('activity_feed')
      .select(`
        id,
        type,
        user_id,
        metadata,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Add filters
    if (type) {
      query = query.eq('type', type);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: activities, error: activitiesError } = await query;

    if (activitiesError) {
      console.error('Supabase error fetching activities:', activitiesError);
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    // Get user details for each activity
    const userIds = activities?.map(row => row.user_id) || [];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Supabase error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 500 }
      );
    }

    // Create a map of user profiles
    const profileMap = new Map();
    profiles?.forEach(profile => {
      profileMap.set(profile.id, profile);
    });

    // Get total count for pagination
    let countQuery = supabase
      .from('activity_feed')
      .select('*', { count: 'exact', head: true });

    if (type) {
      countQuery = countQuery.eq('type', type);
    }

    if (userId) {
      countQuery = countQuery.eq('user_id', userId);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Supabase error counting activities:', countError);
      return NextResponse.json(
        { error: 'Failed to count activities' },
        { status: 500 }
      );
    }

    // Format activities
    const formattedActivities = activities?.map((row) => {
      const profile = profileMap.get(row.user_id);
      return {
        id: row.id,
        type: row.type,
        userId: row.user_id,
        username: profile?.username,
        avatarUrl: profile?.avatar_url,
        metadata: row.metadata,
        createdAt: row.created_at,
      };
    }) || [];

    // Calculate hasMore
    const hasMore = offset + formattedActivities.length < (totalCount || 0);

    return NextResponse.json({
      activities: formattedActivities,
      totalCount: totalCount || 0,
      page,
      pageSize,
      hasMore,
    });
  } catch (error) {
    return handleApiError(error);
  }
}