import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/middleware/auth';
import { createClient } from '../../../../../lib/supabase/server';
import { handleApiError, NotFoundError, ValidationError } from '../../../../../lib/errors';
import { xpService } from '../../../../../services/xp-service';

/**
 * POST /api/registrations/[id]/check-in
 * Check in to an event
 * Requirements: 17.2, 17.5
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication (admin only for check-in)
    const user = await requireAuth();
    
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      throw new ValidationError('Only administrators can check in attendees');
    }
    
    // Get registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        events:event_id (
          id,
          title,
          start_date,
          end_date
        )
      `)
      .eq('id', params.id)
      .single();
    
    if (regError || !registration) {
      throw new NotFoundError('Registration not found');
    }
    
    // Check if registration is confirmed
    if (registration.status !== 'confirmed') {
      throw new ValidationError('Only confirmed registrations can be checked in');
    }
    
    // Check if already checked in
    if (registration.checked_in_at) {
      throw new ValidationError('Already checked in');
    }
    
    // Update registration with check-in timestamp
    const { data: updatedRegistration, error: updateError } = await supabase
      .from('registrations')
      .update({ checked_in_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to check in: ${updateError.message}`);
    }
    
    // Award XP for event check-in (Requirements: 17.2, 17.5)
    try {
      await xpService.awardXP({
        userId: registration.user_id,
        amount: 100, // Higher XP than registration
        source: 'event_participation',
        activityType: 'check_in',
        referenceId: registration.event_id,
        description: `Checked in to event: ${registration.events.title}`,
        metadata: {
          eventId: registration.event_id,
          eventTitle: registration.events.title,
          registrationId: registration.id,
          checkedInAt: updatedRegistration.checked_in_at
        }
      });
    } catch (xpError) {
      // Log XP error but don't fail the check-in
      console.error('Failed to award check-in XP:', xpError);
    }
    
    return NextResponse.json(updatedRegistration);
  } catch (error) {
    return handleApiError(error);
  }
}
