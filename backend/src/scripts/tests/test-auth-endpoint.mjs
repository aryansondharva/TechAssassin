/**
 * Test Authentication Endpoint
 * Direct test of the signin endpoint to identify issues
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

console.log('=== TESTING AUTH ENDPOINTS ===\n');

async function testAuthEndpoints() {
  try {
    // Test 1: Signin endpoint with test credentials
    console.log('1. Testing Signin Endpoint...');
    
    const signinData = {
      email: 'test@example.com',
      password: 'testpassword123'
    };

    try {
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signinData)
      });

      const result = await response.json();
      
      console.log('Status:', response.status);
      console.log('Response:', result);
      
      if (response.ok) {
        console.log('Signin endpoint: WORKING');
      } else {
        console.log('Signin endpoint: ERROR');
        console.log('Error:', result.error || result.message);
      }
    } catch (error) {
      console.log('Signin endpoint: FAILED TO CONNECT');
      console.log('Error:', error.message);
    }

    // Test 2: Check if backend is running
    console.log('\n2. Testing Backend Connection...');
    
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/health`);
      
      if (healthResponse.ok) {
        console.log('Backend: RUNNING');
      } else {
        console.log('Backend: RESPONDING WITH ERROR');
      }
    } catch (error) {
      console.log('Backend: NOT RUNNING');
      console.log('Start backend with: npm run dev');
    }

    // Test 3: Check Supabase Auth directly
    console.log('\n3. Testing Supabase Auth Directly...');
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Test with existing user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com', // Change this to a real user email
        password: 'testpassword123' // Change this to real password
      });

      if (error) {
        console.log('Supabase Auth Error:', error.message);
        
        if (error.message.includes('Invalid login credentials')) {
          console.log('SOLUTION: User does not exist or wrong password');
          console.log('Create a test user in Supabase Dashboard > Authentication');
        } else if (error.message.includes('Email not confirmed')) {
          console.log('SOLUTION: User email not confirmed');
          console.log('Confirm email in Supabase Dashboard or disable email confirmation');
        }
      } else {
        console.log('Supabase Auth: WORKING');
        console.log('User ID:', data.user?.id);
        console.log('Session:', data.session ? 'Active' : 'None');
      }
    } catch (error) {
      console.log('Supabase Auth Test Failed:', error.message);
    }

    // Test 4: Check if user exists in profiles table
    console.log('\n4. Testing Profiles Table...');
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

      if (error) {
        console.log('Profiles Table Error:', error.message);
      } else {
        console.log('Profiles Table: OK');
        console.log('Users found:', profiles.length);
        
        profiles.forEach(profile => {
          console.log(`- ${profile.email || 'No email'} (${profile.username || 'No username'})`);
        });
      }
    } catch (error) {
      console.log('Profiles Test Failed:', error.message);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Production-specific checks
console.log('=== PRODUCTION CHECKLIST ===\n');
console.log('1. Supabase Dashboard > Authentication > Settings:');
console.log('   - Site URL: Should be your production URL');
console.log('   - Redirect URLs: Should include your production URL');
console.log('   - Email confirmation: Check if enabled\n');

console.log('2. Supabase Dashboard > Authentication > Users:');
console.log('   - Check if users exist');
console.log('   - Verify email confirmation status\n');

console.log('3. CORS Configuration:');
console.log('   - Supabase Dashboard > Settings > API');
console.log('   - Add your production URL to CORS origins\n');

console.log('4. Environment Variables:');
console.log('   - Ensure production .env has correct values');
console.log('   - Check for any typos in keys\n');

console.log('5. Browser Console:');
console.log('   - Check for CORS errors');
console.log('   - Look for network request failures');
console.log('   - Verify auth token in localStorage\n');

testAuthEndpoints();
