/**
 * Simple UUID Column Fix
 * Direct approach to convert UUID to TEXT
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function simpleUUIDFix() {
  try {
    console.log('=== SIMPLE UUID COLUMN FIX ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Check current table state
    console.log('Step 1: Checking current table state...');
    
    const checkTable = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'id'
    `);
    
    console.log('Current id column type:', checkTable.rows[0]?.data_type || 'Unknown');

    // Step 2: Disable RLS and drop policies
    console.log('\nStep 2: Disabling RLS and dropping policies...');
    
    try {
      await client.query('ALTER TABLE profiles DISABLE ROW LEVEL SECURITY');
      await client.query('DROP POLICY IF EXISTS "Users can view their own profile" ON profiles');
      await client.query('DROP POLICY IF EXISTS "Users can update their own profile" ON profiles');
      await client.query('DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles');
      await client.query('DROP POLICY IF EXISTS "Public read access" ON profiles');
      await client.query('DROP POLICY IF EXISTS "Enable insert for all users" ON profiles');
      await client.query('DROP POLICY IF EXISTS "Enable read access for all users" ON profiles');
      await client.query('DROP POLICY IF EXISTS "Enable update for all users" ON profiles');
      console.log('RLS disabled and policies dropped');
    } catch (error) {
      console.log('Disable RLS result:', error.message);
    }

    // Step 3: Try to convert the column directly
    console.log('\nStep 3: Converting id column to TEXT...');
    
    try {
      // First, drop primary key constraint
      await client.query('ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey');
      console.log('Primary key constraint dropped');
      
      // Convert the column
      await client.query('ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT');
      console.log('id column converted to TEXT');
      
      // Add primary key back
      await client.query('ALTER TABLE profiles ADD PRIMARY KEY (id)');
      console.log('Primary key constraint added');
      
    } catch (error) {
      console.log('Direct conversion failed:', error.message);
      
      // Alternative: Use CAST without constraint
      try {
        await client.query('ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING CAST(id AS TEXT)');
        console.log('id column converted using CAST');
      } catch (error2) {
        console.log('CAST conversion failed:', error2.message);
        
        // Last resort: Create a new table
        console.log('Trying last resort: new table approach...');
        
        await client.query(`
          CREATE TABLE profiles_temp AS 
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
        
        console.log('Temporary table created');
        
        // Drop and rename
        await client.query('DROP TABLE profiles CASCADE');
        await client.query('ALTER TABLE profiles_temp RENAME TO profiles');
        
        console.log('Table replaced with TEXT id');
      }
    }

    // Step 4: Recreate indexes
    console.log('\nStep 4: Recreating indexes...');
    
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id)');
      console.log('Indexes recreated');
    } catch (error) {
      console.log('Recreate indexes result:', error.message);
    }

    // Step 5: Create simple policies
    console.log('\nStep 5: Creating simple policies...');
    
    try {
      await client.query('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY');
      
      await client.query(`CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true)`);
      await client.query(`CREATE POLICY "Enable insert for all users" ON profiles FOR INSERT WITH CHECK (true)`);
      await client.query(`CREATE POLICY "Enable update for all users" ON profiles FOR UPDATE USING (true)`);
      
      console.log('Simple policies created');
    } catch (error) {
      console.log('Create policies result:', error.message);
    }

    // Step 6: Test the fix
    console.log('\nStep 6: Testing the fix...');
    
    try {
      const testId = 'test_clerk_user_' + Date.now();
      const insertTest = await client.query(`
        INSERT INTO profiles (id, clerk_user_id, email, username, full_name, created_at, updated_at, total_xp, current_streak, longest_streak, profile_completion_percentage)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), 0, 0, 0, 0)
        RETURNING id, clerk_user_id, username
      `, [testId, testId, 'test@example.com', 'test_user', 'Test User']);
      
      console.log('Insert test: SUCCESS');
      console.log('Created test profile:', insertTest.rows[0]);
      
      // Clean up
      await client.query('DELETE FROM profiles WHERE id = $1', [testId]);
      console.log('Test data cleaned up');
      
    } catch (error) {
      console.log('Insert test result:', error.message);
    }

    // Step 7: Verify final state
    console.log('\nStep 7: Verifying final state...');
    
    try {
      const finalCheck = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'id'
      `);
      
      console.log('Final id column type:', finalCheck.rows[0]?.data_type || 'Unknown');
      
      const countCheck = await client.query('SELECT COUNT(*) as count FROM profiles');
      console.log('Total profiles:', countCheck.rows[0].count);
      
    } catch (error) {
      console.log('Final verification result:', error.message);
    }

    await client.end();

    console.log('\n=== SIMPLE UUID FIX COMPLETED ===');
    console.log('Result: profiles.id should now be TEXT');
    console.log('Next steps:');
    console.log('1. Restart backend server');
    console.log('2. Test Clerk authentication');
    console.log('3. Verify profile operations work');

  } catch (error) {
    console.error('Simple UUID fix failed:', error.message);
    process.exit(1);
  }
}

simpleUUIDFix();
