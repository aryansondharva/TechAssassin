import { Pool } from 'pg';
import { createClient } from '../supabase/server';
import jwt from 'jsonwebtoken';
import { ConflictError } from '../errors';

// Database connection (Local PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 60000, // Increase to 1 minute
  connectionTimeoutMillis: 10000, // Increase to 10 seconds for cloud DBs
});

// Interface definitions
export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  aadhaar_number?: string;
  avatar_url?: string;
  github_url?: string;
  bio?: string;
  address?: string;
  education?: string;
  university?: string;
  graduation_year?: number;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  aadhaar_number?: string;
  avatar_url?: string;
  github_url?: string;
  bio?: string;
  address?: string;
  education?: string;
  university?: string;
  graduation_year?: number;
}

/**
 * Create a new user account via Supabase Auth + Local Database Sync
 */
export async function signUp(userData: SignUpData): Promise<AuthResponse> {
  let client;
  
  try {
    // 1. REGISTER IN SUPABASE AUTH
    console.log(`[AUTH] Starting registration for: ${userData.email}`);
    const supabase = await createClient();
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.full_name,
        }
      }
    });
    
    if (authError) {
      console.error('[AUTH] Supabase error:', authError.message);
      throw authError;
    }
    
    if (!authData.user) {
      console.error('[AUTH] No user data returned from Supabase');
      throw new Error('Auth registration failed');
    }

    const userId = authData.user.id;
    console.log(`[AUTH] Supabase registration successful. ID: ${userId}`);
    
    // 2. CONNECT TO DATABASE
    try {
      client = await pool.connect();
    } catch (dbConnError: any) {
      console.error('[AUTH] Database connection failed:', dbConnError.message);
      throw new Error(`Database connection failed: ${dbConnError.message}`);
    }

    // 3. SYNC TO LOCAL POSTGRESQL PROFILES
    // We use ON CONFLICT because Supabase might have a trigger that already created the profile
    console.log(`[AUTH] Syncing to local profile table...`);

    try {
      const result = await client.query(
        `INSERT INTO public.profiles (
          id, username, email, full_name, phone, aadhaar_number,
          avatar_url, github_url, bio, address, education,
          university, graduation_year, is_admin, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          updated_at = NOW()
        RETURNING *`,
        [
          userId,
          userData.username,
          userData.email,
          userData.full_name,
          userData.phone,
          userData.aadhaar_number,
          userData.avatar_url,
          userData.github_url,
          userData.bio,
          userData.address,
          userData.education,
          userData.university,
          userData.graduation_year
        ]
      );

      if (result.rows.length === 0) {
        console.error('[AUTH] Profile sync failed - no row returned');
        throw new Error('Database profile creation failed');
      }

      const user = result.rows[0];
      console.log('[AUTH] Signup process complete');
      
      return {
        user: formatUser(user),
        token: authData.session?.access_token || '' 
      };
    } catch (syncError: any) {
      // Check if this is a unique constraint violation on username
      if (syncError.code === '23505' && syncError.constraint === 'profiles_username_key') {
        console.error(`[AUTH] Username ${userData.username} is already taken.`);
        throw new ConflictError(`Username '${userData.username}' is already taken. Please choose another one.`);
      }
      throw syncError;
    }
    
  } catch (error: any) {
    console.error('[AUTH] Critical error during signup:', error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
}

/**
 * Sign in user via Supabase Auth
 */
export async function signIn(credentials: SignInData): Promise<AuthResponse> {
  let client;
  
  try {
    // 1. AUTHENTICATE IN SUPABASE
    console.log(`[AUTH] Starting signin for: ${credentials.email}`);
    const supabase = await createClient();
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    
    if (authError) {
      console.error('[AUTH] Supabase signin error:', authError.message);
      throw authError;
    }
    
    if (!authData.user) {
      console.error('[AUTH] No user data returned from Supabase');
      throw new Error('Invalid credentials');
    }

    // 2. CONNECT TO DATABASE
    try {
      client = await pool.connect();
    } catch (dbConnError: any) {
      console.error('[AUTH] Database connection failed:', dbConnError.message);
      throw new Error(`Database connection failed: ${dbConnError.message}`);
    }

    // 3. FETCH PROFILE FROM LOCAL DB
    const profileResult = await client.query(
      'SELECT * FROM public.profiles WHERE id = $1',
      [authData.user.id]
    );
    
    if (profileResult.rows.length === 0) {
      console.warn(`[AUTH] Profile not found for user ${authData.user.id}, creating one...`);
      // If profile is missing (e.g. sync failed during signup), create one now
      const syncResult = await client.query(
        `INSERT INTO public.profiles (id, username, email, full_name, is_admin, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, NOW(), NOW())
         RETURNING *`,
        [
          authData.user.id,
          authData.user.email?.split('@')[0] || 'user',
          authData.user.email,
          authData.user.user_metadata?.full_name || ''
        ]
      );
      
      const user = syncResult.rows[0];
      return {
        user: formatUser(user),
        token: authData.session?.access_token || ''
      };
    }
    
    const user = profileResult.rows[0];
    console.log(`[AUTH] Signin successful for: ${user.email}`);
    
    return {
      user: formatUser(user),
      token: authData.session?.access_token || ''
    };
    
  } catch (error: any) {
    console.error('[AUTH] Critical error during signin:', error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
}

/**
 * Ensure user profile exists in local DB, creating it if necessary
 */
export async function ensureUserProfile(supabaseUser: any, suggestedUsername?: string): Promise<User> {
  let client;
  
  try {
    client = await pool.connect();
    
    // Check if profile exists
    const profileResult = await client.query(
      'SELECT * FROM public.profiles WHERE id = $1',
      [supabaseUser.id]
    );
    
    if (profileResult.rows.length > 0) {
      return formatUser(profileResult.rows[0]);
    }
    
    // Profile missing, create one
    console.log(`[AUTH] Profile not found for user ${supabaseUser.id}, creating one...`);
    
    const username = suggestedUsername || supabaseUser.email?.split('@')[0] || `user_${Date.now()}`;
    const fullName = supabaseUser.user_metadata?.full_name || '';
    
    const syncResult = await client.query(
      `INSERT INTO public.profiles (id, username, email, full_name, is_admin, created_at, updated_at)
       VALUES ($1, $2, $3, $4, false, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
       RETURNING *`,
      [
        supabaseUser.id,
        username,
        supabaseUser.email,
        fullName
      ]
    );
    
    return formatUser(syncResult.rows[0]);
    
  } catch (error: any) {
    console.error('[AUTH] Error ensuring user profile:', error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
}

// Helper to format user object consistently
function formatUser(user: any): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone,
    aadhaar_number: user.aadhaar_number,
    avatar_url: user.avatar_url,
    github_url: user.github_url,
    bio: user.bio,
    address: user.address,
    education: user.education,
    university: user.university,
    graduation_year: user.graduation_year,
    is_admin: user.is_admin,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

/**
 * Verify JWT token and get user
 */
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const supabase = await createClient();
    
    // 1. Verify token with Supabase
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    
    if (error || !authUser) {
      return null;
    }
    
    // 2. Fetch profile from local database
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM public.profiles WHERE id = $1',
        [authUser.id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        aadhaar_number: user.aadhaar_number,
        avatar_url: user.avatar_url,
        github_url: user.github_url,
        bio: user.bio,
        address: user.address,
        education: user.education,
        university: user.university,
        graduation_year: user.graduation_year,
        is_admin: user.is_admin,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: Partial<User>): Promise<User> {
  const client = await pool.connect();
  
  try {
    const allowedFields = [
      'full_name', 'phone', 'aadhaar_number', 'avatar_url', 
      'github_url', 'bio', 'address', 'education', 'university', 'graduation_year'
    ];
    
    const updateFields = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => (updates as any)[key]);
    
    const result = await client.query(
      `UPDATE public.profiles SET ${updateFields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [userId, ...values]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = result.rows[0];
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      aadhaar_number: user.aadhaar_number,
      avatar_url: user.avatar_url,
      github_url: user.github_url,
      bio: user.bio,
      address: user.address,
      education: user.education,
      university: user.university,
      graduation_year: user.graduation_year,
      is_admin: user.is_admin,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
  } finally {
    client.release();
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM public.profiles WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      aadhaar_number: user.aadhaar_number,
      avatar_url: user.avatar_url,
      github_url: user.github_url,
      bio: user.bio,
      address: user.address,
      education: user.education,
      university: user.university,
      graduation_year: user.graduation_year,
      is_admin: user.is_admin,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
  } finally {
    client.release();
  }
}
/**
 * Request password reset (Forgot Password)
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });
  
  if (error) {
    console.error('[AUTH] Reset password request failed:', error.message);
    throw error;
  }
}

/**
 * Reset password with new password
 */
export async function resetPassword(password: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });
  
  if (error) {
    console.error('[AUTH] Password reset failed:', error.message);
    throw error;
  }
}
