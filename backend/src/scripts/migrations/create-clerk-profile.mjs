/**
 * Create Clerk User Profile
 * Simple script to create a profile for the Clerk user
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function createClerkProfile() {
  try {
    console.log('Creating profile for Clerk user...\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Disable RLS temporarily
    console.log('Disabling RLS temporarily...');
    await client.query('ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY');

    // Create profile for Clerk user
    console.log('Creating profile for Clerk user...');
    
    const createProfileSQL = `
      INSERT INTO public.profiles (
        id, 
        email, 
        username, 
        full_name,
        created_at, 
        updated_at,
        total_xp,
        current_streak,
        longest_streak,
        profile_completion_percentage
      ) VALUES (
        'user_3CWr8XNp646D4hptLdW9qkbfC4Q',
        'clerk-user@example.com',
        'clerk_user',
        'Clerk User',
        NOW(),
        NOW(),
        0,
        0,
        0,
        0
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    `;

    try {
      await client.query(createProfileSQL);
      console.log('Profile created/updated for Clerk user');
    } catch (error) {
      console.log('Create profile result:', error.message);
    }

    // Test the profile
    console.log('\nTesting profile retrieval...');
    
    const testSQL = `
      SELECT id, email, username, full_name FROM public.profiles 
      WHERE id = 'user_3CWr8XNp646D4hptLdW9qkbfC4Q'
    `;

    try {
      const result = await client.query(testSQL);
      console.log('Profile test: SUCCESS');
      console.log('Profile found:', result.rows.length > 0 ? 'YES' : 'NO');
      
      if (result.rows.length > 0) {
        console.log('Profile data:', result.rows[0]);
      }
    } catch (error) {
      console.log('Profile test result:', error.message);
    }

    // Re-enable RLS
    console.log('\nRe-enabling RLS...');
    await client.query('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY');

    await client.end();

    console.log('\n=== CLERK PROFILE CREATION COMPLETED ===');
    console.log('Profile created for user_3CWr8XNp646D4hptLdW9qkbfC4Q');
    console.log('\nNext steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test GET /api/profile');
    console.log('3. Test PATCH /api/profile');

  } catch (error) {
    console.error('Profile creation failed:', error.message);
    process.exit(1);
  }
}

createClerkProfile();
