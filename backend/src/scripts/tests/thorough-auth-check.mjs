/**
 * Thorough Authentication Check
 * Go through everything step by step to find the issue
 */

import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

console.log('=== THOROUGH AUTHENTICATION CHECK ===\n');

// Step 1: Check all environment variables
console.log('Step 1: Checking Environment Variables...');

const envChecks = {
  backend: {
    file: 'backend/.env.local',
    vars: {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'DATABASE_URL': process.env.DATABASE_URL,
      'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY,
      'JWT_SECRET': process.env.JWT_SECRET,
      'PORT': process.env.PORT
    }
  },
  frontend: {
    file: 'Client/.env.local',
    vars: {
      'VITE_API_URL': process.env.VITE_API_URL,
      'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
      'VITE_CLERK_PUBLISHABLE_KEY': process.env.VITE_CLERK_PUBLISHABLE_KEY,
      'VITE_APP_NAME': process.env.VITE_APP_NAME,
      'VITE_APP_URL': process.env.VITE_APP_URL
    }
  }
};

Object.entries(envChecks).forEach(([env, config]) => {
  console.log(`\n${env.toUpperCase()} Environment (${config.file}):`);
  Object.entries(config.vars).forEach(([key, value]) => {
    const status = value ? 'OK' : 'MISSING';
    const preview = value ? `${value.substring(0, 30)}...` : 'N/A';
    console.log(`  ${key}: ${status} (${preview})`);
  });
});

// Step 2: Check if files exist
console.log('\nStep 2: Checking File Existence...');

const filesToCheck = [
  'backend/.env.local',
  'Client/.env.local',
  'backend/middleware.ts',
  'backend/lib/middleware/auth-clerk-new.ts',
  'backend/app/api/profile/route.ts',
  'backend/lib/supabase/server.ts',
  'backend/lib/supabase/client.ts'
];

filesToCheck.forEach(file => {
  const exists = existsSync(join(__dirname, '..', file));
  console.log(`  ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Step 3: Check middleware configuration
console.log('\nStep 3: Checking Middleware Configuration...');

try {
  const middlewarePath = join(__dirname, '..', 'middleware.ts');
  if (existsSync(middlewarePath)) {
    const middlewareContent = readFileSync(middlewarePath, 'utf8');
    
    const hasClerkMiddleware = middlewareContent.includes('clerkMiddleware');
    const hasClerkImport = middlewareContent.includes('@clerk/nextjs/server');
    const hasAuth = middlewareContent.includes('auth');
    
    console.log(`  Has clerkMiddleware: ${hasClerkMiddleware ? 'YES' : 'NO'}`);
    console.log(`  Has Clerk import: ${hasClerkImport ? 'YES' : 'NO'}`);
    console.log(`  Has auth function: ${hasAuth ? 'YES' : 'NO'}`);
    
    if (!hasClerkMiddleware || !hasClerkImport) {
      console.log('  ISSUE: Middleware not properly configured for Clerk');
    }
  } else {
    console.log('  ISSUE: middleware.ts file not found');
  }
} catch (error) {
  console.log('  Error checking middleware:', error.message);
}

// Step 4: Check auth middleware
console.log('\nStep 4: Checking Auth Middleware...');

try {
  const authPath = join(__dirname, '..', 'lib', 'middleware', 'auth-clerk-new.ts');
  if (existsSync(authPath)) {
    const authContent = readFileSync(authPath, 'utf8');
    
    const hasClerkAuth = authContent.includes('@clerk/nextjs/server');
    const hasRequireAuth = authContent.includes('requireAuthWithClient');
    const hasCreateProfile = authContent.includes('getOrCreateUserProfile');
    
    console.log(`  Has Clerk auth: ${hasClerkAuth ? 'YES' : 'NO'}`);
    console.log(`  Has requireAuthWithClient: ${hasRequireAuth ? 'YES' : 'NO'}`);
    console.log(`  Has profile creation: ${hasCreateProfile ? 'YES' : 'NO'}`);
    
    if (!hasClerkAuth || !hasRequireAuth) {
      console.log('  ISSUE: Auth middleware not properly configured');
    }
  } else {
    console.log('  ISSUE: auth-clerk-new.ts file not found');
  }
} catch (error) {
  console.log('  Error checking auth middleware:', error.message);
}

// Step 5: Check API route
console.log('\nStep 5: Checking API Route...');

try {
  const apiPath = join(__dirname, '..', 'app', 'api', 'profile', 'route.ts');
  if (existsSync(apiPath)) {
    const apiContent = readFileSync(apiPath, 'utf8');
    
    const hasCorrectImport = apiContent.includes('auth-clerk-new');
    const hasRequireAuth = apiContent.includes('requireAuthWithClient');
    const hasAuthCheck = apiContent.includes('await requireAuthWithClient()');
    
    console.log(`  Has correct import: ${hasCorrectImport ? 'YES' : 'NO'}`);
    console.log(`  Has requireAuth: ${hasRequireAuth ? 'YES' : 'NO'}`);
    console.log(`  Has auth check: ${hasAuthCheck ? 'YES' : 'NO'}`);
    
    if (!hasCorrectImport || !hasAuthCheck) {
      console.log('  ISSUE: API route not using correct auth middleware');
    }
  } else {
    console.log('  ISSUE: profile API route not found');
  }
} catch (error) {
  console.log('  Error checking API route:', error.message);
}

// Step 6: Test backend connectivity
console.log('\nStep 6: Testing Backend Connectivity...');

async function testBackend() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    
    if (response.ok) {
      const health = await response.json();
      console.log('  Backend Health: OK');
      console.log('  Status:', health.status);
    } else {
      console.log('  Backend Health: FAILED');
      console.log('  Status:', response.status);
    }
  } catch (error) {
    console.log('  Backend Health: NOT REACHABLE');
    console.log('  Error:', error.message);
  }
}

await testBackend();

// Step 7: Test Clerk middleware directly
console.log('\nStep 7: Testing Clerk Middleware...');

async function testClerkMiddleware() {
  try {
    const response = await fetch('http://localhost:3001/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('  Clerk Middleware Test Status:', response.status);
    
    const clerkHeaders = {
      'x-clerk-auth-status': response.headers.get('x-clerk-auth-status'),
      'x-clerk-auth-reason': response.headers.get('x-clerk-auth-reason'),
      'x-clerk-auth-message': response.headers.get('x-clerk-auth-message'),
    };
    
    console.log('  Clerk Headers:', clerkHeaders);
    
    if (clerkHeaders['x-clerk-auth-status'] === 'signed-out') {
      console.log('  ISSUE: User is signed out');
      console.log('  SOLUTION: User needs to sign in with Clerk');
    } else if (clerkHeaders['x-clerk-auth-reason'] === 'dev-browser-missing') {
      console.log('  ISSUE: Clerk session missing in browser');
      console.log('  SOLUTION: Check Clerk cookies and sign in again');
    }
    
  } catch (error) {
    console.log('  Clerk Middleware Test Failed:', error.message);
  }
}

await testClerkMiddleware();

// Step 8: Check frontend configuration
console.log('\nStep 8: Checking Frontend Configuration...');

try {
  const frontendEnvPath = join(__dirname, '..', '..', 'Client', '.env.local');
  if (existsSync(frontendEnvPath)) {
    const frontendEnv = readFileSync(frontendEnvPath, 'utf8');
    
    const hasClerkKey = frontendEnv.includes('VITE_CLERK_PUBLISHABLE_KEY');
    const hasApiUrl = frontendEnv.includes('VITE_API_URL');
    
    console.log(`  Has Clerk key: ${hasClerkKey ? 'YES' : 'NO'}`);
    console.log(`  Has API URL: ${hasApiUrl ? 'YES' : 'NO'}`);
    
    if (!hasClerkKey) {
      console.log('  ISSUE: Frontend missing Clerk publishable key');
    }
    
    if (!hasApiUrl) {
      console.log('  ISSUE: Frontend missing API URL');
    }
  } else {
    console.log('  ISSUE: Frontend .env.local not found');
  }
} catch (error) {
  console.log('  Error checking frontend config:', error.message);
}

console.log('\n=== THOROUGH CHECK COMPLETE ===');
console.log('\nSUMMARY OF ISSUES:');
console.log('1. Check if all environment variables are set');
console.log('2. Verify middleware.ts is configured for Clerk');
console.log('3. Ensure auth-clerk-new.ts exists and is correct');
console.log('4. Check API route uses correct auth middleware');
console.log('5. Verify frontend has Clerk configuration');
console.log('6. Make sure user is signed in with Clerk');

console.log('\nNEXT STEPS:');
console.log('1. Fix any issues identified above');
console.log('2. Restart backend server');
console.log('3. Start frontend server');
console.log('4. Sign in with Clerk');
console.log('5. Test profile update');
