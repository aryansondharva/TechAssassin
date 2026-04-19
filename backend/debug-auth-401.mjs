/**
 * Debug 401 Unauthorized Error
 * Check what's causing the authentication failure
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

console.log('=== DEBUGGING 401 UNAUTHORIZED ERROR ===\n');

// Check environment variables
const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'DATABASE_URL': process.env.DATABASE_URL,
  'JWT_SECRET': process.env.JWT_SECRET
};

console.log('1. Environment Variables Status:');
Object.entries(requiredVars).forEach(([key, value]) => {
  const status = value ? 'OK' : 'MISSING';
  console.log(`   ${key}: ${status}`);
});

// Check Clerk configuration
console.log('\n2. Clerk Configuration Check:');
console.log('   Check if Clerk is properly configured in your app:');
console.log('   - ClerkPublishableKey should be set in frontend');
console.log('   - ClerkSecretKey should be set in backend');
console.log('   - Middleware should be configured');

// Test backend health
console.log('\n3. Testing Backend Health...');
async function testBackend() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    
    if (response.ok) {
      console.log('   Backend Health: OK');
      const health = await response.json();
      console.log('   Health Data:', health);
    } else {
      console.log('   Backend Health: FAILED');
      console.log('   Status:', response.status);
    }
  } catch (error) {
    console.log('   Backend Health: NOT RUNNING');
    console.log('   Error:', error.message);
    console.log('   Solution: Start backend with npm run dev');
  }
}

await testBackend();

// Test authentication endpoint
console.log('\n4. Testing Authentication...');
async function testAuth() {
  try {
    const response = await fetch('http://localhost:3001/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any auth headers if available
      }
    });
    
    console.log('   Auth Test Status:', response.status);
    
    if (response.status === 401) {
      console.log('   Issue: Authentication not working');
      console.log('   Possible causes:');
      console.log('   - Clerk not configured properly');
      console.log('   - User not signed in');
      console.log('   - Session expired');
      console.log('   - Missing auth headers');
    }
    
    const text = await response.text();
    console.log('   Response:', text);
  } catch (error) {
    console.log('   Auth Test Failed:', error.message);
  }
}

await testAuth();

console.log('\n=== SOLUTIONS ===');
console.log('1. Check Clerk Configuration:');
console.log('   Frontend (.env.local):');
console.log('   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...');
console.log('   ');
console.log('   Backend (.env.local):');
console.log('   CLERK_SECRET_KEY=sk_test_...');

console.log('\n2. Check Clerk Middleware:');
console.log('   File: middleware.ts should exist in root');
console.log('   Should contain Clerk configuration');

console.log('\n3. Check User Session:');
console.log('   - User should be signed in with Clerk');
console.log('   - Check browser for Clerk session');
console.log('   - Try signing out and signing back in');

console.log('\n4. Check API Route:');
console.log('   - API route should use requireAuthWithClient()');
console.log('   - Auth middleware should be properly imported');

console.log('\n=== QUICK FIX STEPS ===');
console.log('1. Ensure backend is running: npm run dev');
console.log('2. Check Clerk environment variables');
console.log('3. Sign in with Clerk in frontend');
console.log('4. Try profile update again');

console.log('\n=== DEBUGGING TIPS ===');
console.log('1. Check browser console for Clerk errors');
console.log('2. Check network tab for auth headers');
console.log('3. Verify Clerk session exists');
console.log('4. Test with a simple GET request first');
