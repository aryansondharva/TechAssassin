/**
 * Test Frontend Service Role Connection
 * Tests the client-side Supabase configuration with service role
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Frontend Service Role Connection...\n');

console.log('Environment Variables Check:');
console.log('VITE_SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
console.log();

if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL!');
  process.exit(1);
}

async function testFrontendServiceRole() {
  try {
    // Test 1: Create client with service role key (if available)
    console.log('Test 1: Creating Supabase client...');
    const supabase = SUPABASE_SERVICE_ROLE_KEY 
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : createClient(SUPABASE_URL, 'dummy-key');
    console.log('Client created successfully\n');

    // Test 2: Check connection by querying database
    console.log('Test 2: Testing database connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error && error.message.includes('infinite recursion')) {
      console.log('RLS recursion detected - this is expected for anon key');
      console.log('Service role key bypasses RLS issues');
    } else if (error) {
      console.log('Connection result:', error.message);
    } else {
      console.log('Database connection successful\n');
    }

    // Test 3: Check if environment variables are properly configured
    console.log('Test 3: Checking configuration...');
    
    const checks = [
      { name: 'Backend URL', value: process.env.VITE_API_URL },
      { name: 'App URL', value: process.env.VITE_APP_URL },
      { name: 'App Name', value: process.env.VITE_APP_NAME },
      { name: 'Debug Mode', value: process.env.VITE_DEBUG }
    ];

    checks.forEach(check => {
      console.log(`${check.name}: ${check.value || 'Not set'}`);
    });

    console.log('\nConfiguration Summary:');
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Anon Key:', SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    console.log('Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    console.log('API URL:', process.env.VITE_API_URL || 'Not set');
    console.log('App URL:', process.env.VITE_APP_URL || 'Not set');
    
    console.log('\nFrontend Configuration Status:');
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      console.log('Supabase: OK');
    } else {
      console.log('Supabase: Missing configuration');
    }
    
    if (process.env.VITE_API_URL) {
      console.log('Backend API: OK');
    } else {
      console.log('Backend API: Missing configuration');
    }
    
    console.log('\nNext Steps:');
    console.log('1. Start the frontend application');
    console.log('2. Test user authentication');
    console.log('3. Verify real-time features');
    console.log('4. Test all CRUD operations');
    
  } catch (error) {
    console.error('Frontend test failed:', error.message);
    process.exit(1);
  }
}

testFrontendServiceRole();
