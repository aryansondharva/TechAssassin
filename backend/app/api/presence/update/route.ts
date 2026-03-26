import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/presence/update
 * Update user's presence status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, status, location } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'userId and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['online', 'away', 'busy', 'offline'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: online, away, busy, offline' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update or insert presence record using Supabase upsert
    const { data, error } = await supabase
      .from('presence_tracking')
      .upsert({
        user_id: userId,
        status: status,
        location_type: location?.type || null,
        location_id: location?.id || null,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating presence:', error);
      return NextResponse.json(
        { error: 'Failed to update presence' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      presence: data,
    });
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}
