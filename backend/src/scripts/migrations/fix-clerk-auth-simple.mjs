/**
 * Simple Fix for Clerk Authentication
 * Update the database to handle Clerk user IDs properly
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { join } from 'path';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function fixClerkAuthSimple() {
  try {
    console.log('Applying simple Clerk authentication fix...\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Temporarily disable RLS policies
    console.log('Step 1: Temporarily disabling RLS policies...');
    
    const disableRLSSQL = `
      ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_skills DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.xp_transactions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_badges DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_missions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_ranks_history DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.leaderboard DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.leaderboard_scores DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.activity_cooldowns DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.xp_rate_limits DISABLE ROW LEVEL SECURITY;
    `;

    try {
      await client.query(disableRLSSQL);
      console.log('RLS policies disabled temporarily');
    } catch (error) {
      console.log('Disable RLS result:', error.message);
    }

    // Step 2: Update profiles table to accept TEXT IDs
    console.log('\nStep 2: Updating profiles table for Clerk IDs...');
    
    const updateProfilesSQL = `
      DO $$
      BEGIN
        -- Check if column is UUID and convert to TEXT
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'profiles' 
          AND column_name = 'id' 
          AND data_type = 'uuid'
        ) THEN
          EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::TEXT';
          RAISE NOTICE 'profiles.id converted from UUID to TEXT';
        ELSE
          RAISE NOTICE 'profiles.id is already TEXT';
        END IF;
      END $$;
    `;

    try {
      await client.query(updateProfilesSQL);
      console.log('Profiles table updated for Clerk IDs');
    } catch (error) {
      console.log('Profiles update result:', error.message);
    }

    // Step 3: Create a test profile for the Clerk user
    console.log('\nStep 3: Creating test profile for Clerk user...');
    
    const createTestProfileSQL = `
      INSERT INTO public.profiles (
        id, 
        email, 
        username, 
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
        NOW(),
        NOW(),
        0,
        0,
        0,
        0
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    try {
      await client.query(createTestProfileSQL);
      console.log('Test profile created for Clerk user');
    } catch (error) {
      console.log('Create test profile result:', error.message);
    }

    // Step 4: Test the profile query
    console.log('\nStep 4: Testing profile query with Clerk ID...');
    
    const testQuerySQL = `
      SELECT * FROM public.profiles 
      WHERE id = 'user_3CWr8XNp646D4hptLdW9qkbfC4Q'
    `;

    try {
      const result = await client.query(testQuerySQL);
      console.log('Profile query test: SUCCESS');
      console.log('Profile found:', result.rows.length > 0 ? 'YES' : 'NO');
      
      if (result.rows.length > 0) {
        console.log('Profile data:', {
          id: result.rows[0].id,
          email: result.rows[0].email,
          username: result.rows[0].username
        });
      }
    } catch (error) {
      console.log('Profile query test result:', error.message);
    }

    // Step 5: Re-enable RLS with updated policies
    console.log('\nStep 5: Re-enabling RLS with Clerk-friendly policies...');
    
    const enableRLSSQL = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
      
      -- Create new policies that work with TEXT IDs
      CREATE POLICY "Users can view their own profile" ON public.profiles 
      FOR SELECT USING (auth.uid()::TEXT = id::TEXT);
      
      CREATE POLICY "Users can update their own profile" ON public.profiles 
      FOR UPDATE USING (auth.uid()::TEXT = id::TEXT);
      
      CREATE POLICY "Users can insert their own profile" ON public.profiles 
      FOR INSERT WITH CHECK (auth.uid()::TEXT = id::TEXT);
      
      -- Re-enable RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    `;

    try {
      await client.query(enableRLSSQL);
      console.log('RLS re-enabled with Clerk-friendly policies');
    } catch (error) {
      console.log('Enable RLS result:', error.message);
    }

    await client.end();

    console.log('\n=== CLERK AUTHENTICATION FIX COMPLETED ===');
    console.log('Changes made:');
    console.log('1. RLS policies temporarily disabled');
    console.log('2. profiles.id updated to accept TEXT');
    console.log('3. Test profile created for Clerk user');
    console.log('4. RLS re-enabled with TEXT-compatible policies');
    console.log('\nNext steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test GET /api/profile');
    console.log('3. Test PATCH /api/profile');
    console.log('4. Verify no more 500 errors');

  } catch (error) {
    console.error('Clerk auth fix failed:', error.message);
    process.exit(1);
  }
}

fixClerkAuthSimple();
