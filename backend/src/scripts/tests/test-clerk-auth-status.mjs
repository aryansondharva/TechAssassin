/**
 * Test Clerk Authentication Status
 * Check if Clerk is working and user is signed in
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

console.log('=== TESTING CLERK AUTHENTICATION STATUS ===\n');

// Check environment variables
const clerkVars = {
  'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY ? 'SET' : 'MISSING',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'MISSING'
};

console.log('1. Clerk Environment Variables:');
Object.entries(clerkVars).forEach(([key, status]) => {
  console.log(`   ${key}: ${status}`);
});

// Test backend health
console.log('\n2. Testing Backend Health...');
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
console.log('\n3. Testing Authentication Endpoint...');
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
    console.log('   Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('   Response:', text);
    
    // Check for Clerk-specific headers
    const clerkHeaders = {
      'x-clerk-auth-status': response.headers.get('x-clerk-auth-status'),
      'x-clerk-auth-reason': response.headers.get('x-clerk-auth-reason'),
      'x-clerk-auth-message': response.headers.get('x-clerk-auth-message'),
      'x-clerk-auth-session-id': response.headers.get('x-clerk-auth-session-id'),
    };
    
    console.log('   Clerk Headers:', clerkHeaders);
    
    if (response.status === 401) {
      console.log('   Issue: User not authenticated');
      
      if (clerkHeaders['x-clerk-auth-status'] === 'signed-out') {
        console.log('   Status: User is signed out');
        console.log('   Solution: User needs to sign in with Clerk');
      } else if (clerkHeaders['x-clerk-auth-reason'] === 'dev-browser-missing') {
        console.log('   Status: Clerk session missing in browser');
        console.log('   Solution: Check browser cookies and Clerk configuration');
      } else {
        console.log('   Status: General authentication issue');
        console.log('   Solution: Check Clerk configuration and user session');
      }
    }
    
  } catch (error) {
    console.log('   Auth Test Failed:', error.message);
  }
}

await testAuthEndpoint();

// Test middleware directly
console.log('\n4. Testing Clerk Middleware...');
async function testMiddleware() {
  try {
    const response = await fetch('http://localhost:3001/api/profile', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3002',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      }
    });
    
    console.log('   Middleware Test Status:', response.status);
    console.log('   CORS Headers:', {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
    });
    
  } catch (error) {
    console.log('   Middleware Test Failed:', error.message);
  }
}

await testMiddleware();

console.log('\n=== SOLUTIONS FOR 401 ERROR ===');
console.log('Based on the test results, here are the solutions:');

console.log('\n1. CHECK IF USER IS SIGNED IN:');
console.log('   - Open your frontend app (http://localhost:3002)');
console.log('   - Look for Clerk sign-in button');
console.log('   - Click "Sign In" and complete the process');
console.log('   - Verify you see your name/avatar in the UI');

console.log('\n2. CHECK BROWSER FOR CLERK SESSION:');
console.log('   - Open browser DevTools (F12)');
console.log('   - Go to Application/Storage tab');
console.log('   - Look for Clerk cookies (__session, etc.)');
console.log('   - If no cookies, sign in again');

console.log('\n3. CHECK FRONTEND CLERK CONFIGURATION:');
console.log('   - Frontend should have VITE_CLERK_PUBLISHABLE_KEY');
console.log('   - ClerkProvider should wrap your app');
console.log('   - Sign-in buttons should be visible');

console.log('\n4. CHECK BACKEND CLERK CONFIGURATION:');
console.log('   - Backend should have CLERK_SECRET_KEY');
console.log('   - Middleware should be configured');
console.log('   - Auth middleware should be working');

console.log('\n5. TROUBLESHOOTING STEPS:');
console.log('   - Clear browser cookies and localStorage');
console.log('   - Restart both frontend and backend');
console.log('   - Sign out and sign back in with Clerk');
console.log('   - Check browser console for Clerk errors');

console.log('\n=== QUICK FIX ===');
console.log('Most likely issue: User is not signed in with Clerk');
console.log('Solution: Sign in with Clerk in your frontend application');

console.log('\n=== TESTING INSTRUCTIONS ===');
console.log('1. Start frontend: npm run dev (in Client directory)');
console.log('2. Start backend: npm run dev (in backend directory)');
console.log('3. Open: http://localhost:3002');
console.log('4. Click "Sign In" button');
console.log('5. Complete sign-in process');
console.log('6. Try updating profile again');
