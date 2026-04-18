/**
 * Test Clerk Authentication
 * Check if Clerk is working properly in the backend
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

console.log('=== TESTING CLERK AUTHENTICATION ===\n');

// Check environment variables
const clerkVars = {
  'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY,
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
};

console.log('1. Clerk Environment Variables:');
Object.entries(clerkVars).forEach(([key, value]) => {
  const status = value ? 'OK' : 'MISSING';
  const preview = value ? `${value.substring(0, 20)}...` : 'N/A';
  console.log(`   ${key}: ${status} (${preview})`);
});

// Test Clerk import and basic functionality
console.log('\n2. Testing Clerk Import...');
async function testClerk() {
  try {
    const { auth } = await import('@clerk/nextjs/server');
    console.log('   Clerk import: OK');
    
    // Test auth function (this might fail in this context)
    try {
      const authResult = await auth();
      console.log('   Auth function: OK');
      console.log('   Auth result:', authResult);
    } catch (error) {
      console.log('   Auth function: Expected to fail in this context');
      console.log('   Error:', error.message);
    }
    
  } catch (error) {
    console.log('   Clerk import: FAILED');
    console.log('   Error:', error.message);
  }
}

await testClerk();

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

// Test authentication endpoint with detailed headers
console.log('\n4. Testing Authentication Endpoint...');
async function testAuthEndpoint() {
  try {
    const response = await fetch('http://localhost:3001/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': '', // Try empty cookie first
      }
    });
    
    console.log('   Auth Test Status:', response.status);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('   Response:', text);
    
    if (response.status === 401) {
      console.log('   Issue: Still getting 401');
      console.log('   Possible causes:');
      console.log('   - Backend not restarted after adding CLERK_SECRET_KEY');
      console.log('   - Clerk session not available in request');
      console.log('   - Middleware not processing correctly');
    }
    
  } catch (error) {
    console.log('   Auth Test Failed:', error.message);
  }
}

await testAuthEndpoint();

console.log('\n=== TROUBLESHOOTING STEPS ===');
console.log('1. RESTART BACKEND SERVER:');
console.log('   - Stop current server (Ctrl+C)');
console.log('   - Start again: npm run dev');
console.log('   - Wait for full startup');

console.log('\n2. CHECK CLERK SESSION:');
console.log('   - User should be signed in with Clerk');
console.log('   - Check browser for Clerk cookies');
console.log('   - Try signing out and back in');

console.log('\n3. VERIFY ENVIRONMENT VARIABLES:');
console.log('   - CLERK_SECRET_KEY should be in backend .env.local');
console.log('   - VITE_CLERK_PUBLISHABLE_KEY should be in frontend .env.local');

console.log('\n4. CHECK BROWSER NETWORK:');
console.log('   - Open DevTools > Network');
console.log('   - Look for auth headers in request');
console.log('   - Check if Clerk cookies are sent');

console.log('\n=== QUICK FIX ===');
console.log('Most likely issue: Backend server needs to be restarted');
console.log('After restart: Sign in with Clerk again, then test profile update');
