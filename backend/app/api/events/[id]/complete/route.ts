import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/middleware/auth';
import { createClient } from '../../../../../lib/supabase/server';
import { handleApiError, NotFoundError, ValidationError } from '../../../../../lib/errors';
import { xpService } from '../../../../../services/xp-service';

/**
 * POST /api/events/[id]/complete
 * Mark an event as completed and award XP to all checked-in attendees
 * Requirements: 17.3, 17.5
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication (admin only)
    const user = await requireAuth();
    
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      throw new ValidationError('Only administrators can complete events');
    }
    
    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (eventError || !event) {
      throw new NotFoundError('Event not found');
    }
    
    // Check if event has already ended
    const now = new Date();
    const endDate = new Date(event.end_date);
    
    if (endDate > now) {
      throw new ValidationError('Event has not ended yet');
    }
    
    // Get all checked-in registrations for this event
    const { data: checkedInRegistrations, error: regError } = await supabase
      .from('registrations')
      .select('id, user_id, event_id')
      .eq('event_id', params.id)
      .eq('status', 'confirmed')
      .not('checked_in_at', 'is', null);
    
    if (regError) {
      throw new Error(`Failed to get registrations: ${regError.message}`);
    }
    
    if (!checkedInRegistrations || checkedInRegistrations.length === 0) {
      return NextResponse.json({
        message: 'No checked-in attendees found',
        awardedCount: 0
      });
    }
    
    // Award XP to all checked-in attendees (Requirements: 17.3, 17.5)
    const results = await Promise.allSettled(
      checkedInRegistrations.map(async (registration) => {
        try {
          await xpService.awardXP({
            userId: registration.user_id,
            amount: 200, // Higher XP for completion
            source: 'event_participation',
            activityType: 'completion',
            referenceId: event.id,
            description: `Completed event: ${event.title}`,
            metadata: {
              eventId: event.id,
              eventTitle: event.title,
              registrationId: registration.id
            }
          });
          return { success: true, userId: registration.user_id };
        } catch (error) {
          console.error(`Failed to award completion XP to user ${registration.user_id}:`, error);
          return { success: false, userId: registration.user_id, error };
        }
      })
    );
    
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    
    return NextResponse.json({
      message: `Event completed. Awarded XP to ${successCount} attendees.`,
      totalAttendees: checkedInRegistrations.length,
      awardedCount: successCount,
      failedCount: checkedInRegistrations.length - successCount
    });
  } catch (error) {
    return handleApiError(error);
  }
}
