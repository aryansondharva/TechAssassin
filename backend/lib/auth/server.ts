import { Pool } from 'pg';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

// Database connection (Local PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
  const supabase = await createClient();
  const client = await pool.connect();
  
  try {
    // 1. REGISTER IN SUPABASE AUTH
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
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('Auth registration failed');

    const userId = authData.user.id;
    
    // 2. SYNC TO LOCAL POSTGRESQL PROFILES
    const result = await client.query(
      `INSERT INTO public.profiles (
        id, username, email, full_name, phone, aadhaar_number,
        avatar_url, github_url, bio, address, education,
        university, graduation_year, is_admin, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, NOW(), NOW())
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

    const user = result.rows[0];
    
    return {
      user: {
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
      },
      token: authData.session?.access_token || '' // Supabase session token
    };
    
  } catch (error: any) {
    // If local DB failed but auth succeeded, you might want to rollback but usually just log it
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Sign in user via Supabase Auth
 */
export async function signIn(credentials: SignInData): Promise<AuthResponse> {
  const supabase = await createClient();
  const client = await pool.connect();
  
  try {
    // 1. AUTHENTICATE IN SUPABASE
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('Invalid credentials');

    // 2. FETCH PROFILE FROM LOCAL DB
    const profileResult = await client.query(
      'SELECT * FROM public.profiles WHERE id = $1',
      [authData.user.id]
    );
    
    if (profileResult.rows.length === 0) {
      throw new Error('User profile not found in database');
    }
    
    const user = profileResult.rows[0];
    
    return {
      user: {
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
      },
      token: authData.session?.access_token || ''
    };
    
  } finally {
    client.release();
  }
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
