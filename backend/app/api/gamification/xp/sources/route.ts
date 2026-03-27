/**
 * GET /api/gamification/xp/sources
 * 
 * Get all XP source configurations
 * Public route - no authentication required
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { getServerClient } from '@/lib/supabase';

/**
 * Get all XP source configurations
 * Returns base amounts, multipliers, and cooldowns for all XP sources
 * Public endpoint - no authentication required
 */
export async function GET(request: Request) {
  try {
    const supabase = getServerClient();
    
    // Fetch all XP source configurations
    const { data: sources, error } = await supabase
      .from('xp_source_config')
      .select('*')
      .order('source', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to fetch XP source configurations: ${error.message}`);
    }
    
    // Transform database records to API response format
    const formattedSources = sources.map(source => ({
      id: source.id,
      source: source.source,
      baseAmount: source.base_amount,
      multipliers: source.multipliers || {},
      cooldownSeconds: source.cooldown_seconds,
      maxPerHour: source.max_per_hour,
      createdAt: source.created_at,
      updatedAt: source.updated_at
    }));
    
    return NextResponse.json(formattedSources);
  } catch (error) {
    return handleApiError(error);
  }
}
