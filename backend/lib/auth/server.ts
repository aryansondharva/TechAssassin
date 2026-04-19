import { Pool } from 'pg';
import { createClient } from '@/lib/supabase/server';
import { AuthenticationError } from '@/lib/middleware/auth';

// Database connection (Local PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
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

/**
 * Update user profile in PostgreSQL
 */
export async function updateProfile(userId: string, updates: Partial<User>): Promise<User> {
  const client = await pool.connect();
  
  try {
    const allowedFields = [
      'full_name', 'phone', 'aadhaar_number', 'avatar_url', 
      'github_url', 'bio', 'address', 'education', 'university', 'graduation_year'
    ];
    
    // Filter and prepare dynamic query
    const entries = Object.entries(updates).filter(([key]) => allowedFields.includes(key));
    
    if (entries.length === 0) {
      throw new Error('No valid fields to update');
    }

    const updateFields = entries
      .map(([key], index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = entries.map(([, value]) => value);
    
    const result = await client.query(
      `UPDATE public.profiles SET ${updateFields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [userId, ...values]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return formatUser(result.rows[0]);
  } finally {
    client.release();
  }
}

/**
 * Get user by ID from PostgreSQL
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
    
    return formatUser(result.rows[0]);
  } finally {
    client.release();
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

// Export the pool for other services if needed
export { pool };
