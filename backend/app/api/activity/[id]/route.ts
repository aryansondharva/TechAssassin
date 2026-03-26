import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

/**
 * GET /api/activity/:id
 * Get single activity by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid activity ID format' },
        { status: 400 }
      );
    }

    // Query activity with user details
    const result = await query(
      `SELECT 
        af.id,
        af.type,
        af.user_id,
        af.metadata,
        af.created_at,
        p.username,
        p.avatar_url
      FROM activity_feed af
      JOIN profiles p ON af.user_id = p.id
      WHERE af.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    const activity = result.rows[0];

    return NextResponse.json({
      id: activity.id,
      type: activity.type,
      userId: activity.user_id,
      username: activity.username,
      avatarUrl: activity.avatar_url,
      metadata: activity.metadata,
      createdAt: activity.created_at,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
