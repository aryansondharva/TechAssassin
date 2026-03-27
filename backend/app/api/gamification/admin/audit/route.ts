/**
 * GET /api/gamification/admin/audit
 * 
 * Admin endpoint for fetching audit log of all manual operations.
 * Supports filtering by admin, action type, and date range.
 * 
 * Requirements: 13.5, 14.5
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth } from '@/middleware/admin-auth';
import { handleApiError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

// Validation schema for query parameters
const auditQuerySchema = z.object({
  adminId: z.string().uuid().optional(),
  actionType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  pageSize: z.string().optional().transform(val => val ? parseInt(val, 10) : 50)
});

/**
 * GET handler for fetching audit log
 */
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      adminId: searchParams.get('adminId') || undefined,
      actionType: searchParams.get('actionType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined
    };
    
    const validated = auditQuerySchema.parse(queryParams);
    
    const supabase = await createClient();
    
    // Build query for audit log entries
    // Admin actions are stored as XP transactions with admin_action metadata
    let query = supabase
      .from('xp_transactions')
      .select('*', { count: 'exact' })
      .eq('manual_adjustment', true)
      .eq('activity_type', 'admin_action');
    
    // Apply filters
    if (validated.adminId) {
      query = query.eq('user_id', validated.adminId);
    }
    
    if (validated.actionType) {
      query = query.contains('metadata', { action: validated.actionType });
    }
    
    if (validated.startDate) {
      query = query.gte('created_at', validated.startDate);
    }
    
    if (validated.endDate) {
      query = query.lte('created_at', validated.endDate);
    }
    
    // Apply pagination
    const offset = (validated.page - 1) * validated.pageSize;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + validated.pageSize - 1);
    
    const { data: auditEntries, error, count } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }
    
    // Also fetch manual XP adjustments and badge operations
    const manualXPQuery = supabase
      .from('xp_transactions')
      .select('*', { count: 'exact' })
      .eq('manual_adjustment', true)
      .neq('activity_type', 'admin_action');
    
    if (validated.startDate) {
      manualXPQuery.gte('created_at', validated.startDate);
    }
    
    if (validated.endDate) {
      manualXPQuery.lte('created_at', validated.endDate);
    }
    
    const { data: manualXPEntries } = await manualXPQuery
      .order('created_at', { ascending: false })
      .limit(100);
    
    // Fetch badge operations (manual awards and revocations)
    const badgeOpsQuery = supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(name, category, rarity_level)
      `)
      .or('manual_award.eq.true,revoked_at.not.is.null');
    
    if (validated.startDate) {
      badgeOpsQuery.gte('earned_at', validated.startDate);
    }
    
    if (validated.endDate) {
      badgeOpsQuery.lte('earned_at', validated.endDate);
    }
    
    const { data: badgeOps } = await badgeOpsQuery
      .order('earned_at', { ascending: false })
      .limit(100);
    
    // Format audit log entries
    const formattedAuditLog = [
      ...(auditEntries || []).map(entry => ({
        id: entry.id,
        type: 'admin_action',
        adminId: entry.user_id,
        action: entry.metadata?.action || 'unknown',
        timestamp: entry.created_at,
        metadata: entry.metadata,
        description: entry.description
      })),
      ...(manualXPEntries || []).map(entry => ({
        id: entry.id,
        type: 'xp_adjustment',
        adminId: entry.metadata?.admin_id,
        action: 'manual_xp_adjustment',
        timestamp: entry.created_at,
        metadata: {
          target_user_id: entry.user_id,
          amount: entry.amount,
          reason: entry.metadata?.reason,
          source: entry.source
        },
        description: entry.description
      })),
      ...(badgeOps || []).map(entry => ({
        id: entry.id,
        type: entry.revoked_at ? 'badge_revocation' : 'badge_award',
        action: entry.revoked_at ? 'badge_revoked' : 'badge_awarded',
        timestamp: entry.revoked_at || entry.earned_at,
        metadata: {
          user_id: entry.user_id,
          badge_id: entry.badge_id,
          badge_name: entry.badge?.name,
          manual_award: entry.manual_award,
          revocation_reason: entry.revocation_reason
        },
        description: entry.revoked_at 
          ? `Badge revoked: ${entry.badge?.name}` 
          : `Badge awarded: ${entry.badge?.name}`
      }))
    ];
    
    // Sort by timestamp descending
    formattedAuditLog.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const totalCount = count || 0;
    
    return NextResponse.json({
      success: true,
      auditLog: formattedAuditLog,
      pagination: {
        page: validated.page,
        pageSize: validated.pageSize,
        totalCount,
        hasMore: offset + validated.pageSize < totalCount
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
