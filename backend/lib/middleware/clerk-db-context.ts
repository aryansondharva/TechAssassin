/**
 * Clerk Database Context Middleware
 * Sets the current Clerk user ID in database context for RLS policies
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Creates a Supabase client with Clerk user context for RLS policies
 */
export async function createSupabaseClientWithClerkContext() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Create Supabase client with user context
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  // Set the current Clerk user ID for RLS policies
  await client.rpc('set_clerk_user_id', { user_id: userId });

  return client;
}

/**
 * Creates a Supabase admin client (bypasses RLS)
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Middleware to set Clerk user context for API routes
 */
export async function withClerkContext(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const { userId } = await auth();
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Add user ID to request headers for database context
    const modifiedReq = new Request(req.url, {
      method: req.method,
      headers: {
        ...Object.fromEntries(req.headers.entries()),
        'x-clerk-user-id': userId,
      },
      body: req.body,
    });

    return handler(modifiedReq, ...args);
  };
}

/**
 * Get current Clerk user ID from request
 */
export function getCurrentClerkUserId(req: Request): string | null {
  return req.headers.get('x-clerk-user-id');
}

/**
 * Database helper functions with Clerk context
 */
export class ClerkDbHelper {
  private client: any;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  /**
   * Initialize database context with user ID
   */
  async initialize() {
    await this.client.rpc('set_clerk_user_id', { user_id: this.userId });
  }

  /**
   * Get user profile
   */
  async getProfile() {
    return await this.client
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', this.userId)
      .single();
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: any) {
    return await this.client
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', this.userId)
      .select()
      .single();
  }

  /**
   * Get user missions
   */
  async getUserMissions() {
    return await this.client
      .from('user_missions')
      .select(`
        *,
        missions (
          id, title, description, difficulty_level, 
          xp_reward, status, created_at
        )
      `)
      .eq('clerk_user_id', this.userId)
      .order('created_at', { ascending: false });
  }

  /**
   * Get user skills
   */
  async getUserSkills() {
    return await this.client
      .from('user_skills')
      .select(`
        *,
        skills (
          id, name, description, category_id, type
        )
      `)
      .eq('clerk_user_id', this.userId)
      .order('created_at', { ascending: false });
  }

  /**
   * Get user notifications
   */
  async getNotifications(limit: number = 20) {
    return await this.client
      .from('notifications')
      .select('*')
      .eq('recipient_clerk_user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(notificationIds: string[]) {
    return await this.client
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in('id', notificationIds)
      .eq('recipient_clerk_user_id', this.userId);
  }

  /**
   * Create a new post
   */
  async createPost(postData: any) {
    return await this.client
      .from('posts')
      .insert({
        ...postData,
        author_clerk_user_id: this.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
  }

  /**
   * Get user's posts
   */
  async getUserPosts() {
    return await this.client
      .from('posts')
      .select('*')
      .eq('author_clerk_user_id', this.userId)
      .order('created_at', { ascending: false });
  }

  /**
   * Get user's XP transactions
   */
  async getXPTransactions(limit: number = 50) {
    return await this.client
      .from('xp_transactions')
      .select('*')
      .eq('clerk_user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements() {
    return await this.client
      .from('user_achievements')
      .select(`
        *,
        achievements (
          id, title, description, badge_icon, badge_color, rarity
        )
      `)
      .eq('clerk_user_id', this.userId)
      .order('created_at', { ascending: false });
  }

  /**
   * Get user's leaderboard position
   */
  async getLeaderboardPosition(category: string = 'overall') {
    return await this.client
      .from('leaderboard')
      .select('*')
      .eq('clerk_user_id', this.userId)
      .eq('category', category)
      .eq('period_type', 'all_time')
      .single();
  }
}

/**
 * Factory function to create ClerkDbHelper instance
 */
export async function createClerkDbHelper(req?: Request): Promise<ClerkDbHelper> {
  let userId: string;

  if (req) {
    userId = getCurrentClerkUserId(req) || '';
  } else {
    const { userId: authUserId } = await auth();
    userId = authUserId || '';
  }

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const helper = new ClerkDbHelper(userId);
  await helper.initialize();
  return helper;
}
