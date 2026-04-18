/**
 * Simple Authentication Check
 * Check the most important things for Clerk auth
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

console.log('=== SIMPLE AUTHENTICATION CHECK ===\n');

// Step 1: Check if frontend is running
console.log('Step 1: Checking Frontend Status...');

async function checkFrontend() {
  try {
    const response = await fetch('http://localhost:3002');
    if (response.ok) {
      console.log('  Frontend: RUNNING at http://localhost:3002');
    } else {
      console.log('  Frontend: NOT RESPONDING (Status: ' + response.status + ')');
    }
  } catch (error) {
    console.log('  Frontend: NOT RUNNING');
    console.log('  Solution: Start frontend with "npm run dev" in Client directory');
  }
}

await checkFrontend();

// Step 2: Check backend status
console.log('\nStep 2: Checking Backend Status...');

async function checkBackend() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (response.ok) {
      console.log('  Backend: RUNNING at http://localhost:3001');
    } else {
      console.log('  Backend: NOT RESPONDING (Status: ' + response.status + ')');
    }
  } catch (error) {
    console.log('  Backend: NOT RUNNING');
    console.log('  Solution: Start backend with "npm run dev" in backend directory');
  }
}

await checkBackend();

// Step 3: Check Clerk configuration
console.log('\nStep 3: Checking Clerk Configuration...');

const clerkConfig = {
  backend: {
    secretKey: process.env.CLERK_SECRET_KEY ? 'SET' : 'MISSING',
  },
  frontend: {
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
  }
};

console.log('  Backend CLERK_SECRET_KEY:', clerkConfig.backend.secretKey);
console.log('  Frontend VITE_CLERK_PUBLISHABLE_KEY:', clerkConfig.frontend.publishableKey);

// Step 4: Test authentication endpoint
console.log('\nStep 4: Testing Authentication...');

async function testAuth() {
  try {
    const response = await fetch('http://localhost:3001/api/profile');
    console.log('  Auth Test Status:', response.status);
    
    const clerkStatus = response.headers.get('x-clerk-auth-status');
    const clerkReason = response.headers.get('x-clerk-auth-reason');
    
    console.log('  Clerk Auth Status:', clerkStatus || 'UNKNOWN');
    console.log('  Clerk Auth Reason:', clerkReason || 'UNKNOWN');
    
    if (response.status === 401) {
      console.log('  ISSUE: User not authenticated');
      if (clerkStatus === 'signed-out') {
        console.log('  SOLUTION: User needs to sign in with Clerk');
      } else if (clerkReason === 'dev-browser-missing') {
        console.log('  SOLUTION: Clerk session missing - sign in again');
      }
    }
  } catch (error) {
    console.log('  Auth Test Failed:', error.message);
  }
}

await testAuth();

console.log('\n=== DIAGNOSIS ===');

// Step 5: Provide specific solution
console.log('\nMOST LIKELY ISSUES:');
console.log('1. Frontend not running');
console.log('2. User not signed in with Clerk');
console.log('3. Clerk cookies not set in browser');

console.log('\nSOLUTION STEPS:');
console.log('1. Make sure frontend is running: npm run dev (in Client directory)');
console.log('2. Open browser to: http://localhost:3002');
console.log('3. Look for "Sign In" button');
console.log('4. Click "Sign In" and complete the process');
console.log('5. Verify you see your name/avatar');
console.log('6. Try updating profile again');

console.log('\nFRONTEND CHECKLIST:');
console.log('[] Frontend running at http://localhost:3002');
console.log('[] Clerk sign-in button visible');
console.log('[] User signed in with Clerk');
console.log('[] User name/avatar visible');
console.log('[] Clerk cookies present in browser');

console.log('\nBACKEND CHECKLIST:');
console.log('[] Backend running at http://localhost:3001');
console.log('[] CLERK_SECRET_KEY set in backend');
console.log('[] Middleware configured for Clerk');
console.log('[] API routes using Clerk auth');

console.log('\nTESTING CHECKLIST:');
console.log('[] Both frontend and backend running');
console.log('[] User signed in with Clerk');
console.log('[] Browser has Clerk cookies');
console.log('[] API calls include auth headers');
console.log('[] Profile update works');

console.log('\n=== QUICK FIX ===');
console.log('The most likely issue is that you need to:');
console.log('1. Start the frontend server');
console.log('2. Sign in with Clerk');
console.log('3. Then try the profile update');

console.log('\nIf still not working:');
console.log('1. Clear browser cookies');
console.log('2. Restart both servers');
console.log('3. Sign in again');
