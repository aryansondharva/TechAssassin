/**
 * GET /api/gamification/badges/:id
 * 
 * Get single badge by ID with unlock criteria
 * Public route (no auth required)
 * 
 * Requirements: 3.1, 3.4
 */

import { NextResponse } from 'next/server';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

/**
 * Get badge details by ID
 * Returns badge with unlock_criteria
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundError('Invalid badge ID format');
    }
    
    const supabase = await createClient();
    
    // Fetch badge by ID
    const { data: badge, error } = await supabase
      .from('badges')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !badge) {
      throw new NotFoundError('Badge not found');
    }
    
    // Map database fields to camelCase
    const mappedBadge = {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      category: badge.category,
      rarityLevel: badge.rarity_level,
      unlockCriteria: badge.unlock_criteria,
      iconUrl: badge.icon_url,
      isActive: badge.is_active,
      createdAt: badge.created_at,
      updatedAt: badge.updated_at
    };
    
    return NextResponse.json(mappedBadge);
  } catch (error) {
    return handleApiError(error);
  }
}
