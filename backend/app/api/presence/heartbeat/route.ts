import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/presence/heartbeat
 * Update user's last_seen timestamp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, location } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Try to update existing record first
    const { data: updateData, error: updateError } = await supabase
      .from('presence_tracking')
      .update({
        last_seen: new Date().toISOString(),
        location_type: location?.type || null,
        location_id: location?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError && updateError.code === 'PGRST116') {
      // No record exists, create one with default 'online' status
      const { data: insertData, error: insertError } = await supabase
        .from('presence_tracking')
        .insert({
          user_id: userId,
          status: 'online',
          location_type: location?.type || null,
          location_id: location?.id || null,
          last_seen: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase error inserting presence:', insertError);
        return NextResponse.json(
          { error: 'Failed to update heartbeat' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        presence: insertData,
      });
    }

    if (updateError) {
      console.error('Supabase error updating heartbeat:', updateError);
      return NextResponse.json(
        { error: 'Failed to update heartbeat' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      presence: updateData,
    });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return NextResponse.json(
      { error: 'Failed to update heartbeat' },
      { status: 500 }
    );
  }
}
