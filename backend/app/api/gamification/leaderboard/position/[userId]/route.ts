/**
 * GET /api/gamification/leaderboard/position/[userId]
 * 
 * Find user's position in leaderboard with context (users above/below)
 * 
 * Requirements: 10.4
 */

import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

/**
 * GET handler - Find user's leaderboard position
 * Public route (no auth required)
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { userId } = await params;
    
    // Validate userId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Use optimized SQL query with ROW_NUMBER() window function
    // This calculates ranks efficiently and gets users above/below in one query
    const { data, error } = await supabase.rpc('get_user_leaderboard_position', {
      target_user_id: userId
    });
    
    if (error) {
      // If the function doesn't exist, fall back to manual calculation
      console.warn('get_user_leaderboard_position function not available, using fallback');
      
      // Fallback: Get all users and calculate position
      const { data: allUsers, error: allError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          total_xp,
          current_rank_id,
          rank_tiers:current_rank_id (
            name,
            icon_url
          )
        `)
        .order('total_xp', { ascending: false });
      
      if (allError) {
        throw allError;
      }
      
      if (!allUsers || allUsers.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Find user's position
      const userIndex = allUsers.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return NextResponse.json(
          { error: 'User not found in leaderboard' },
          { status: 404 }
        );
      }
      
      const currentUser = allUsers[userIndex];
      const userAbove = userIndex > 0 ? allUsers[userIndex - 1] : null;
      const userBelow = userIndex < allUsers.length - 1 ? allUsers[userIndex + 1] : null;
      
      // Format response
      const formatUser = (user: any, rank: number) => ({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        total_xp: user.total_xp,
        rank,
        current_rank: user.rank_tiers ? {
          name: user.rank_tiers.name,
          icon_url: user.rank_tiers.icon_url
        } : null
      });
      
      return NextResponse.json({
        user: formatUser(currentUser, userIndex + 1),
        user_above: userAbove ? formatUser(userAbove, userIndex) : null,
        user_below: userBelow ? formatUser(userBelow, userIndex + 2) : null,
        total_users: allUsers.length
      });
    }
    
    // If RPC function exists and returned data
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'User not found in leaderboard' },
        { status: 404 }
      );
    }
    
    // Parse RPC result
    const result = data[0];
    
    return NextResponse.json({
      user: {
        id: result.user_id,
        username: result.username,
        avatar_url: result.avatar_url,
        total_xp: result.total_xp,
        rank: result.user_rank,
        current_rank: result.rank_name ? {
          name: result.rank_name,
          icon_url: result.rank_icon
        } : null
      },
      user_above: result.above_username ? {
        id: result.above_id,
        username: result.above_username,
        avatar_url: result.above_avatar,
        total_xp: result.above_xp,
        rank: result.user_rank - 1,
        current_rank: result.above_rank_name ? {
          name: result.above_rank_name,
          icon_url: result.above_rank_icon
        } : null
      } : null,
      user_below: result.below_username ? {
        id: result.below_id,
        username: result.below_username,
        avatar_url: result.below_avatar,
        total_xp: result.below_xp,
        rank: result.user_rank + 1,
        current_rank: result.below_rank_name ? {
          name: result.below_rank_name,
          icon_url: result.below_rank_icon
        } : null
      } : null,
      total_users: result.total_users
    });
  } catch (error) {
    return handleApiError(error);
  }
}
