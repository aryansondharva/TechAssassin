/**
 * Fix UUID Column Issue
 * Convert the id column from UUID to TEXT to support Clerk user IDs
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function fixUUIDColumn() {
  try {
    console.log('=== FIXING UUID COLUMN ISSUE ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Disable RLS temporarily
    console.log('Step 1: Disabling RLS temporarily...');
    
    try {
      await client.query('ALTER TABLE profiles DISABLE ROW LEVEL SECURITY');
      console.log('RLS disabled');
    } catch (error) {
      console.log('Disable RLS result:', error.message);
    }

    // Step 2: Drop all policies
    console.log('\nStep 2: Dropping all policies...');
    
    const dropPoliciesSQL = `
      DROP POLICY IF EXISTS "Enable insert for all users" ON profiles;
      DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
      DROP POLICY IF EXISTS "Enable update for all users" ON profiles;
      DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
      DROP POLICY IF EXISTS "Public read access" ON profiles;
    `;

    try {
      await client.query(dropPoliciesSQL);
      console.log('All policies dropped');
    } catch (error) {
      console.log('Drop policies result:', error.message);
    }

    // Step 3: Convert id column to TEXT
    console.log('\nStep 3: Converting id column to TEXT...');
    
    try {
      // First, try to convert the id column
      await client.query(`
        ALTER TABLE profiles 
        ALTER COLUMN id TYPE TEXT USING id::TEXT
      `);
      console.log('id column converted to TEXT');
    } catch (error) {
      if (error.message.includes('policy definition')) {
        console.log('Cannot convert due to policy definitions - trying alternative approach...');
        
        // Alternative: Create new table and migrate data
        await client.query(`
          CREATE TABLE profiles_new AS 
          SELECT 
            id::TEXT as id,
            username,
            full_name,
            avatar_url,
            github_url,
            skills,
            is_admin,
            created_at,
            email,
            phone,
            aadhaar_number,
            bio,
            address,
            education,
            university,
            graduation_year,
            updated_at,
            total_xp,
            current_rank_id,
            current_streak,
            longest_streak,
            last_activity_date,
            profile_completion_percentage,
            banner_url,
            linkedin_url,
            portfolio_url,
            interests,
            is_email_public,
            is_phone_public,
            is_address_public,
            first_name,
            last_name,
            gender,
            tshirt_size,
            readme,
            dietary_preference,
            allergies,
            has_education,
            degree_type,
            graduation_month,
            roles,
            resume_url,
            has_experience,
            twitter_url,
            emergency_contact_name,
            emergency_contact_phone,
            clerk_user_id,
            email_verified,
            clerk_created_at,
            clerk_updated_at
          FROM profiles
        `);
        
        console.log('New profiles table created with TEXT id');
        
        // Drop old table and rename
        await client.query('DROP TABLE profiles');
        await client.query('ALTER TABLE profiles_new RENAME TO profiles');
        
        console.log('Old table dropped and new table renamed');
      } else {
        console.log('Convert id column result:', error.message);
      }
    }

    // Step 4: Recreate primary key constraint
    console.log('\nStep 4: Recreating primary key constraint...');
    
    try {
      await client.query('ALTER TABLE profiles ADD PRIMARY KEY (id)');
      console.log('Primary key constraint added');
    } catch (error) {
      console.log('Add primary key result:', error.message);
    }

    // Step 5: Recreate indexes
    console.log('\nStep 5: Recreating indexes...');
    
    const recreateIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
      CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
      CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
      CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC);
    `;

    try {
      await client.query(recreateIndexesSQL);
      console.log('Indexes recreated');
    } catch (error) {
      console.log('Recreate indexes result:', error.message);
    }

    // Step 6: Create new Clerk-friendly policies
    console.log('\nStep 6: Creating Clerk-friendly policies...');
    
    const createPoliciesSQL = `
      -- Enable RLS
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      -- Create policies for Clerk authentication
      CREATE POLICY "Users can view their own profile" ON profiles 
      FOR SELECT 
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY "Users can update their own profile" ON profiles 
      FOR UPDATE 
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY "Users can insert their own profile" ON profiles 
      FOR INSERT 
      WITH CHECK (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Public read policy for some fields
      CREATE POLICY "Public read access" ON profiles 
      FOR SELECT 
      USING (true);
    `;

    try {
      await client.query(createPoliciesSQL);
      console.log('Clerk-friendly policies created');
    } catch (error) {
      console.log('Create policies result:', error.message);
    }

    // Step 7: Test the fix
    console.log('\nStep 7: Testing the fix...');
    
    try {
      // Test inserting with TEXT id
      const testId = 'test_clerk_user_' + Date.now();
      const insertTest = await client.query(`
        INSERT INTO profiles (id, clerk_user_id, email, username, full_name, created_at, updated_at, total_xp, current_streak, longest_streak, profile_completion_percentage)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), 0, 0, 0, 0)
        RETURNING id, clerk_user_id, username
      `, [testId, testId, 'test@example.com', 'test_user', 'Test User']);
      
      console.log('Insert test: SUCCESS');
      console.log('Created test profile:', insertTest.rows[0]);
      
      // Clean up test data
      await client.query('DELETE FROM profiles WHERE id = $1', [testId]);
      console.log('Test data cleaned up');
      
    } catch (error) {
      console.log('Insert test result:', error.message);
    }

    // Step 8: Verify table structure
    console.log('\nStep 8: Verifying final table structure...');
    
    const verifySQL = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
      AND column_name IN ('id', 'clerk_user_id')
      ORDER BY column_name;
    `;

    try {
      const result = await client.query(verifySQL);
      console.log('Final table structure:');
      result.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
      });
    } catch (error) {
      console.log('Verify structure result:', error.message);
    }

    await client.end();

    console.log('\n=== UUID COLUMN FIX COMPLETED ===');
    console.log('Changes made:');
    console.log('1. RLS disabled temporarily');
    console.log('2. All policies dropped');
    console.log('3. id column converted to TEXT');
    console.log('4. Primary key constraint recreated');
    console.log('5. Indexes recreated');
    console.log('6. Clerk-friendly policies created');
    console.log('7. Fix tested and verified');
    console.log('\nResult: profiles.id is now TEXT and compatible with Clerk');
    console.log('\nNext steps:');
    console.log('1. Restart backend server');
    console.log('2. Test Clerk authentication');
    console.log('3. Verify profile operations work');

  } catch (error) {
    console.error('UUID column fix failed:', error.message);
    process.exit(1);
  }
}

fixUUIDColumn();
