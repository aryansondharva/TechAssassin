import { Pool } from 'pg';
import { hash_password, verify_password } from '@/lib/database/auth';
import jwt from 'jsonwebtoken';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Create a new user account
 */
export async function signUp(userData: SignUpData): Promise<AuthResponse> {
  const client = await pool.connect();
  
  try {
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM public.profiles WHERE email = $1 OR username = $2',
      [userData.email, userData.username]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User with this email or username already exists');
    }
    
    // Generate user ID
    const userId = crypto.randomUUID();
    
    // Hash password
    const hashedPassword = await hash_password(userData.password);
    
    // Create user profile
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
    
    // Store password hash (you might want a separate auth table)
    await client.query(
      'INSERT INTO public.user_auth (user_id, password_hash, created_at) VALUES ($1, $2, NOW())',
      [userId, hashedPassword]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userId,
        email: userData.email,
        username: userData.username 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
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
      token
    };
    
  } finally {
    client.release();
  }
}

/**
 * Sign in user with email and password
 */
export async function signIn(credentials: SignInData): Promise<AuthResponse> {
  const client = await pool.connect();
  
  try {
    // Get user by email
    const userResult = await client.query(
      'SELECT * FROM public.profiles WHERE email = $1',
      [credentials.email]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Invalid email or password');
    }
    
    const user = userResult.rows[0];
    
    // Get password hash
    const authResult = await client.query(
      'SELECT password_hash FROM public.user_auth WHERE user_id = $1',
      [user.id]
    );
    
    if (authResult.rows.length === 0) {
      throw new Error('Invalid email or password');
    }
    
    const passwordHash = authResult.rows[0].password_hash;
    
    // Verify password
    const isValidPassword = await verify_password(credentials.password, passwordHash);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        username: user.username 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
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
      token
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (!decoded || !decoded.userId) {
      return null;
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM public.profiles WHERE id = $1',
        [decoded.userId]
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
