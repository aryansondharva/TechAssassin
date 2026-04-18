/**
 * Diagnose Production Authentication Issues
 * Check what's wrong with the production auth setup
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

console.log('=== PRODUCTION AUTH DIAGNOSIS ===\n');

// Check required environment variables
const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'DATABASE_URL': process.env.DATABASE_URL,
  'JWT_SECRET': process.env.JWT_SECRET,
  'JWT_EXPIRES_IN': process.env.JWT_EXPIRES_IN
};

console.log('1. Environment Variables Status:');
Object.entries(requiredVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value ? 'OK' : 'MISSING'}`);
});

// Check for common production issues
console.log('\n2. Common Production Issues:');

// Issue 1: Missing SUPABASE_SERVICE_ROLE_KEY in server.ts
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('   ISSUE: SUPABASE_SERVICE_ROLE_KEY is missing');
  console.log('   FIX: Add SUPABASE_SERVICE_ROLE_KEY to .env.local');
} else {
  console.log('   SUPABASE_SERVICE_ROLE_KEY: OK');
}

// Issue 2: Wrong variable name in server.ts
console.log('\n3. Server Configuration Issue:');
console.log('   ISSUE: server.ts uses process.env.SUPABASE_SERVICE_ROLE_KEY');
console.log('   BUT .env.local has SUPABASE_SERVICE_ROLE_KEY (without NEXT_PUBLIC_)');
console.log('   This is CORRECT - server should use the non-prefixed version');

// Issue 3: Check if JWT is configured
if (!process.env.JWT_SECRET) {
  console.log('\n   ISSUE: JWT_SECRET is missing');
  console.log('   FIX: Add JWT_SECRET to .env.local');
} else {
  console.log('   JWT_SECRET: OK');
}

// Issue 4: Check database connection
if (!process.env.DATABASE_URL) {
  console.log('\n   ISSUE: DATABASE_URL is missing');
  console.log('   FIX: Add DATABASE_URL to .env.local');
} else {
  console.log('   DATABASE_URL: OK');
}

// Provide solution
console.log('\n=== SOLUTION ===');
console.log('Your server.ts is looking for: process.env.SUPABASE_SERVICE_ROLE_KEY');
console.log('Your .env.local has: SUPABASE_SERVICE_ROLE_KEY');
console.log('This should work correctly.\n');

console.log('If auth is still failing, check:');
console.log('1. Supabase Auth settings in dashboard');
console.log('2. CORS configuration');
console.log('3. Site URL and Redirect URLs');
console.log('4. Email confirmation settings');

// Test Supabase connection
console.log('\n=== TESTING SUPABASE CONNECTION ===');
try {
  const { createClient } = await import('@supabase/supabase-js');
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test auth service
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('Auth Service Error:', error.message);
    } else {
      console.log('Auth Service: OK');
    }
    
    // Test database connection
    const { data: profiles, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (dbError) {
      console.log('Database Error:', dbError.message);
    } else {
      console.log('Database Connection: OK');
      console.log('Profiles Count:', profiles[0]?.count || 0);
    }
  } else {
    console.log('Cannot test - missing credentials');
  }
} catch (error) {
  console.log('Connection Test Failed:', error.message);
}

console.log('\n=== NEXT STEPS ===');
console.log('1. Ensure all environment variables are set');
console.log('2. Check Supabase Auth configuration');
console.log('3. Verify CORS settings');
console.log('4. Test signin endpoint directly');
console.log('5. Check browser console for errors');
