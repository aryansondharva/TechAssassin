import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/presence/online
 * Get all online users with their presence information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationType = searchParams.get('locationType');
    const locationId = searchParams.get('locationId');

    const supabase = await createClient();

    // Build query - join with profiles using user_id
    let query = supabase
      .from('presence_tracking')
      .select(`
        user_id,
        status,
        location_type,
        location_id,
        last_seen
      `)
      .neq('status', 'offline');

    // Filter by location if provided
    if (locationType && locationId) {
      query = query
        .eq('location_type', locationType)
        .eq('location_id', locationId);
    }

    const { data: presenceData, error } = await query.order('last_seen', { ascending: false });

    if (error) {
      console.error('Supabase error fetching online users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch online users' },
        { status: 500 }
      );
    }

    // Get user details for each presence record
    const userIds = presenceData?.map(row => row.user_id) || [];
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

    // Transform to presence state format
    const presenceState: Record<string, any> = {};
    presenceData?.forEach((row) => {
      const profile = profileMap.get(row.user_id);
      presenceState[row.user_id] = {
        status: row.status,
        location: row.location_type && row.location_id
          ? { type: row.location_type, id: row.location_id }
          : undefined,
        lastSeen: row.last_seen,
        username: profile?.username,
        avatarUrl: profile?.avatar_url,
      };
    });

    return NextResponse.json({
      success: true,
      presenceState,
      count: presenceData?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    );
  }
}
