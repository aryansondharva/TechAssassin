import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors';

/**
 * POST /api/presence/update
 * Update user's presence status
 * Requirements: 1.1, 1.2, 2.4
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth();
    
    const body = await request.json();
    const { status, location } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
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
        user_id: user.id,
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
    return handleApiError(error);
  }
}
