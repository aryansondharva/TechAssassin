import { NextResponse } from 'next/server';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { profileCompletionService } from '@/services/profile-completion-service';

/**
 * GET /api/gamification/profile/completion/:userId
 * Get profile completion percentage and remaining fields for a user
 * 
 * Public route (no auth required)
 * 
 * Requirements: 16.5
 * 
 * @param params - Route parameters containing userId
 * @returns Profile completion data
 */
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      throw new NotFoundError('User ID is required');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new NotFoundError('Invalid user ID format');
    }
    
    // Get profile completion data
    const completionData = await profileCompletionService.calculateProfileCompletion(userId);
    
    return NextResponse.json({
      userId,
      profile_completion_percentage: completionData.profileCompletionPercentage,
      completed_fields: completionData.completedFields,
      remaining_fields: completionData.remainingFields.map(field => ({
        name: field.name,
        display_name: field.displayName,
        xp_amount: field.xpAmount,
      })),
      total_fields: completionData.totalFields,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
