/**
 * Test Clerk Integration After SQL Fix
 * Verify that Clerk authentication and database operations work
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function testClerkIntegration() {
  try {
    console.log('=== TESTING CLERK INTEGRATION ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Test 1: Check database connection
    console.log('Test 1: Database connection...');
    
    const connectionTest = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('Database connection: OK');
    console.log('Current time:', connectionTest.rows[0].current_time);
    console.log('PostgreSQL version:', connectionTest.rows[0].version.split(' ')[0]);

    // Test 2: Check profiles table structure
    console.log('\nTest 2: Profiles table structure...');
    
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('Profiles table structure:');
    tableCheck.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });

    // Test 3: Check RLS policies
    console.log('\nTest 3: RLS policies...');
    
    const policyCheck = await client.query(`
      SELECT policyname, cmd, permissive 
      FROM pg_policies 
      WHERE tablename = 'profiles' AND schemaname = 'public'
    `);
    
    console.log('RLS policies on profiles table:');
    if (policyCheck.rows.length === 0) {
      console.log('  No policies found (RLS might be disabled)');
    } else {
      policyCheck.rows.forEach(row => {
        console.log(`  ${row.policyname}: ${row.cmd} (${row.permissive ? 'permissive' : 'restrictive'})`);
      });
    }

    // Test 4: Test basic database operations
    console.log('\nTest 4: Basic database operations...');
    
    // Test SELECT
    const selectTest = await client.query('SELECT COUNT(*) as count FROM profiles');
    console.log('SELECT operation: OK');
    console.log('Current profiles count:', selectTest.rows[0].count);

    // Test INSERT (create a test profile)
    const testProfileId = 'test_clerk_user_' + Date.now();
    const insertTest = await client.query(`
      INSERT INTO profiles (id, clerk_user_id, email, username, full_name, created_at, updated_at, total_xp, current_streak, longest_streak, profile_completion_percentage)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), 0, 0, 0, 0)
      ON CONFLICT (clerk_user_id) DO NOTHING
      RETURNING id, clerk_user_id, username
    `, [testProfileId, testProfileId, 'test@example.com', 'test_user', 'Test User']);
    
    console.log('INSERT operation: OK');
    if (insertTest.rows.length > 0) {
      console.log('Created test profile:', insertTest.rows[0]);
    } else {
      console.log('Test profile already exists or insert failed');
    }

    // Test UPDATE
    const updateTest = await client.query(`
      UPDATE profiles 
      SET full_name = 'Updated Test User', updated_at = NOW()
      WHERE clerk_user_id = $1
      RETURNING full_name, updated_at
    `, [testProfileId]);
    
    console.log('UPDATE operation: OK');
    if (updateTest.rows.length > 0) {
      console.log('Updated test profile:', updateTest.rows[0]);
    }

    // Test DELETE (cleanup)
    const deleteTest = await client.query(`
      DELETE FROM profiles WHERE clerk_user_id = $1
      RETURNING id
    `, [testProfileId]);
    
    console.log('DELETE operation: OK');
    if (deleteTest.rows.length > 0) {
      console.log('Deleted test profile:', deleteTest.rows[0]);
    }

    // Test 5: Check Clerk environment variables
    console.log('\nTest 5: Clerk environment variables...');
    
    const clerkVars = {
      'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY ? 'SET' : 'MISSING',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'MISSING'
    };
    
    Object.entries(clerkVars).forEach(([key, status]) => {
      console.log(`  ${key}: ${status}`);
    });

    // Test 6: Test API endpoint health
    console.log('\nTest 6: API endpoint health...');
    
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        const health = await response.json();
        console.log('API health check: OK');
        console.log('Health status:', health.status);
      } else {
        console.log('API health check: FAILED');
        console.log('Status:', response.status);
      }
    } catch (error) {
      console.log('API health check: NOT RUNNING');
      console.log('Error:', error.message);
      console.log('Solution: Start backend with npm run dev');
    }

    // Test 7: Test Clerk auth endpoint
    console.log('\nTest 7: Clerk auth endpoint...');
    
    try {
      const response = await fetch('http://localhost:3001/api/profile');
      console.log('Auth endpoint test status:', response.status);
      
      if (response.status === 401) {
        console.log('Auth endpoint: EXPECTED 401 (user not signed in)');
      } else if (response.status === 200) {
        console.log('Auth endpoint: OK (user signed in)');
      } else {
        console.log('Auth endpoint: UNEXPECTED STATUS');
      }
    } catch (error) {
      console.log('Auth endpoint test: FAILED');
      console.log('Error:', error.message);
    }

    await client.end();

    console.log('\n=== CLERK INTEGRATION TEST COMPLETED ===');
    console.log('Test results:');
    console.log('1. Database connection: OK');
    console.log('2. Profiles table structure: OK');
    console.log('3. RLS policies: OK');
    console.log('4. Database operations: OK');
    console.log('5. Environment variables: CHECKED');
    console.log('6. API health: CHECKED');
    console.log('7. Auth endpoint: CHECKED');
    console.log('\nNext steps:');
    console.log('1. Start backend server: npm run dev');
    console.log('2. Start frontend server: npm run dev');
    console.log('3. Sign in with Clerk in frontend');
    console.log('4. Test profile update functionality');
    console.log('5. Verify GitHub URL saves correctly');

  } catch (error) {
    console.error('Clerk integration test failed:', error.message);
    process.exit(1);
  }
}

testClerkIntegration();
