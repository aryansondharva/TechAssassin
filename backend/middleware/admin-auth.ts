/**
 * Admin Authentication Middleware
 * 
 * Provides middleware functions for admin-only routes with audit logging.
 * 
 * Requirements: All admin operations (13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2, 15.4)
 */

import { requireAuthWithClient, AuthenticationError, AuthorizationError } from '@/lib/middleware/auth';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AdminAuthResult {
  user: User;
  supabase: SupabaseClient;
  adminId: string;
}

/**
 * Verify user is authenticated and has admin role
 * Logs all admin actions with timestamp and admin ID
 * 
 * @returns Admin user and Supabase client
 * @throws {AuthenticationError} When user is not authenticated (401)
 * @throws {AuthorizationError} When user is not an admin (403)
 */
export async function requireAdminAuth(): Promise<AdminAuthResult> {
  // First, verify user is authenticated
  const { user, supabase } = await requireAuthWithClient();
  
  // Check if user has admin role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  
  if (error) {
    throw new AuthorizationError('Unable to verify admin status');
  }
  
  if (!profile || !profile.is_admin) {
    // Log unauthorized admin access attempt
    await logAdminAction(user.id, 'unauthorized_access_attempt', {
      timestamp: new Date().toISOString(),
      reason: 'User attempted to access admin endpoint without admin role'
    });
    
    throw new AuthorizationError('Admin access required');
  }
  
  return {
    user,
    supabase,
    adminId: user.id
  };
}

/**
 * Log admin action to audit trail
 * 
 * @param adminId - Admin user ID
 * @param action - Action type
 * @param metadata - Additional action metadata
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  metadata: Record<string, any>
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Create audit log entry as an XP transaction with special metadata
    // This is a simple implementation; a production system would have a dedicated audit_logs table
    await supabase
      .from('xp_transactions')
      .insert({
        user_id: adminId,
        amount: 1, // Minimal amount to satisfy CHECK constraint
        source: 'community_engagement',
        activity_type: 'admin_action',
        description: `Admin action: ${action}`,
        manual_adjustment: true,
        metadata: {
          admin_action: true,
          action,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      });
  } catch (error) {
    // Log error but don't fail the operation
    console.error('Failed to log admin action:', error);
  }
}
