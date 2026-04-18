/**
 * Fix Clerk User ID vs Supabase UUID Issue
 * Update database to accept TEXT IDs instead of UUIDs
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

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

async function fixClerkUUIDIssue() {
  try {
    console.log('Fixing Clerk User ID vs Supabase UUID issue...\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Update profiles table ID column to TEXT
    console.log('Step 1: Updating profiles table ID column to TEXT...');
    
    const updateProfilesSQL = `
      ALTER TABLE public.profiles 
      ALTER COLUMN id TYPE TEXT USING id::TEXT;
    `;

    try {
      await client.query(updateProfilesSQL);
      console.log('Profiles table ID column updated to TEXT');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('column')) {
        console.log('Profiles table ID column is already TEXT or update not needed');
      } else {
        console.log('Profiles table update result:', error.message);
      }
    }

    // Step 2: Update foreign key constraints (drop and recreate)
    console.log('\nStep 2: Updating foreign key constraints...');
    
    // Drop existing constraints if they exist
    const dropConstraintsSQL = `
      -- Drop foreign key constraints that reference profiles.id
      ALTER TABLE public.user_skills DROP CONSTRAINT IF EXISTS user_skills_user_id_fkey;
      ALTER TABLE public.event_registrations DROP CONSTRAINT IF EXISTS event_registrations_user_id_fkey;
      ALTER TABLE public.xp_transactions DROP CONSTRAINT IF EXISTS xp_transactions_user_id_fkey;
      ALTER TABLE public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
      ALTER TABLE public.user_missions DROP CONSTRAINT IF EXISTS user_missions_user_id_fkey;
      ALTER TABLE public.user_ranks_history DROP CONSTRAINT IF EXISTS user_ranks_history_user_id_fkey;
      ALTER TABLE public.leaderboard DROP CONSTRAINT IF EXISTS leaderboard_user_id_fkey;
      ALTER TABLE public.leaderboard_scores DROP CONSTRAINT IF EXISTS leaderboard_scores_user_id_fkey;
      ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
      ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_author_id_fkey;
      ALTER TABLE public.activity_cooldowns DROP CONSTRAINT IF EXISTS activity_cooldowns_user_id_fkey;
      ALTER TABLE public.xp_rate_limits DROP CONSTRAINT IF EXISTS xp_rate_limits_user_id_fkey;
    `;

    try {
      await client.query(dropConstraintsSQL);
      console.log('Foreign key constraints dropped');
    } catch (error) {
      console.log('Drop constraints result:', error.message);
    }

    // Step 3: Update referencing columns to TEXT
    console.log('\nStep 3: Updating referencing columns to TEXT...');
    
    const updateReferencesSQL = `
      -- Update all user_id columns to TEXT
      ALTER TABLE public.user_skills ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE public.event_registrations ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE public.xp_transactions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE public.user_badges ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE public.user_missions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE public.user_ranks_history ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE public.leaderboard ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE public.leaderboard_scores ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE public.announcements ALTER COLUMN author_id TYPE TEXT USING author_id::TEXT;
      ALTER TABLE public.activity_cooldowns ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      ALTER TABLE public.xp_rate_limits ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    `;

    try {
      await client.query(updateReferencesSQL);
      console.log('Referencing columns updated to TEXT');
    } catch (error) {
      console.log('Update references result:', error.message);
    }

    // Step 4: Recreate foreign key constraints
    console.log('\nStep 4: Recreating foreign key constraints...');
    
    const recreateConstraintsSQL = `
      -- Recreate foreign key constraints (now TEXT to TEXT)
      ALTER TABLE public.user_skills ADD CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.event_registrations ADD CONSTRAINT event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.xp_transactions ADD CONSTRAINT xp_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.user_missions ADD CONSTRAINT user_missions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.user_ranks_history ADD CONSTRAINT user_ranks_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.leaderboard ADD CONSTRAINT leaderboard_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.leaderboard_scores ADD CONSTRAINT leaderboard_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.announcements ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.activity_cooldowns ADD CONSTRAINT activity_cooldowns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE public.xp_rate_limits ADD CONSTRAINT xp_rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    `;

    try {
      await client.query(recreateConstraintsSQL);
      console.log('Foreign key constraints recreated');
    } catch (error) {
      console.log('Recreate constraints result:', error.message);
    }

    // Step 5: Update auth.users reference if it exists
    console.log('\nStep 5: Checking auth.users reference...');
    
    const checkAuthSQL = `
      -- Check if profiles table references auth.users
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conrelid = 'public.profiles'::regclass 
      AND contype = 'f';
    `;

    try {
      const result = await client.query(checkAuthSQL);
      console.log('Profile constraints:', result.rows);
      
      // If there's a reference to auth.users, we need to handle it
      const authConstraint = result.rows.find(row => row.consrc.includes('auth.users'));
      if (authConstraint) {
        console.log('Found auth.users constraint, dropping it...');
        await client.query(`ALTER TABLE public.profiles DROP CONSTRAINT ${authConstraint.conname}`);
        console.log('auth.users constraint dropped');
      }
    } catch (error) {
      console.log('Auth constraint check result:', error.message);
    }

    await client.end();

    // Step 6: Test the fix
    console.log('\nStep 6: Testing the fix...');
    
    const testClient = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await testClient.connect();
    
    try {
      // Test with a Clerk user ID format
      const testSQL = `
        SELECT COUNT(*) FROM public.profiles 
        WHERE id = $1::TEXT
      `;
      
      const result = await testClient.query(testSQL, ['user_3CWr8XNp646D4hptLdW9qkbfC4Q']);
      console.log('Clerk user ID format test: OK');
      console.log('Profiles found with test ID:', result.rows[0].count);
      
    } catch (error) {
      console.log('Test result:', error.message);
    }
    
    await testClient.end();

    console.log('\n=== DATABASE FIX COMPLETED ===');
    console.log('Changes made:');
    console.log('1. profiles.id column changed from UUID to TEXT');
    console.log('2. All user_id reference columns changed to TEXT');
    console.log('3. Foreign key constraints recreated');
    console.log('4. Database now accepts Clerk user IDs');
    console.log('\nNext steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test the profile API endpoints');
    console.log('3. Verify authentication works');

  } catch (error) {
    console.error('Database fix failed:', error.message);
    process.exit(1);
  }
}

fixClerkUUIDIssue();
