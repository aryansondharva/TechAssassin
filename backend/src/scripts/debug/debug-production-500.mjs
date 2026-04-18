/**
 * Debug Production 500 Error
 * Debug the 500 error from techassassin.onrender.com
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const PRODUCTION_URL = 'https://techassassin.onrender.com';

console.log('=== DEBUGGING PRODUCTION 500 ERROR ===\n');

async function debugProductionError() {
  try {
    console.log('1. Testing Production Signin Endpoint...');
    
    // Test with existing user
    const testData = {
      email: 'naitiksondharva138@gmail.com',
      password: 'password123' // You'll need to provide the actual password
    };

    try {
      const response = await fetch(`${PRODUCTION_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      console.log('Status Code:', response.status);
      console.log('Status Text:', response.statusText);
      
      // Try to get error details
      const text = await response.text();
      console.log('Response Body:', text);
      
      if (response.status === 500) {
        console.log('\n500 ERROR ANALYSIS:');
        console.log('This is a server-side error in your deployed application.');
        
        console.log('\nCOMMON CAUSES:');
        console.log('1. Environment variables not set in production');
        console.log('2. Database connection failure');
        console.log('3. Supabase client initialization error');
        console.log('4. Missing dependencies in production');
        console.log('5. Code error in signin route');
        
        console.log('\nIMMEDIATE CHECKS:');
        console.log('A. Check Render logs for detailed error');
        console.log('B. Verify environment variables in Render dashboard');
        console.log('C. Test database connection');
        console.log('D. Check if all dependencies are installed');
      }
      
    } catch (error) {
      console.log('Request Failed:', error.message);
      
      if (error.message.includes('fetch failed')) {
        console.log('\nNETWORK ERROR:');
        console.log('The production server may be down or not responding.');
        console.log('Check if your Render app is running.');
      }
    }

    console.log('\n2. Testing Production Health Endpoint...');
    
    try {
      const healthResponse = await fetch(`${PRODUCTION_URL}/api/health`);
      
      if (healthResponse.ok) {
        console.log('Health Endpoint: OK');
        const health = await healthResponse.json();
        console.log('Health Data:', health);
      } else {
        console.log('Health Endpoint Status:', healthResponse.status);
        console.log('Health Endpoint Response:', await healthResponse.text());
      }
    } catch (error) {
      console.log('Health Endpoint Failed:', error.message);
    }

    console.log('\n3. Environment Variables Check for Production...');
    
    const productionVars = {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'DATABASE_URL': process.env.DATABASE_URL,
      'JWT_SECRET': process.env.JWT_SECRET
    };

    console.log('Local Environment Variables:');
    Object.entries(productionVars).forEach(([key, value]) => {
      const status = value ? 'SET' : 'MISSING';
      const preview = value ? `${value.substring(0, 20)}...` : 'N/A';
      console.log(`   ${key}: ${status} (${preview})`);
    });

    console.log('\n4. Production Environment Checklist:');
    console.log('RENDER DASHBOARD CHECKS:');
    console.log('1. Go to Render dashboard > your app > Environment');
    console.log('2. Ensure ALL these variables are set:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    console.log('   - DATABASE_URL');
    console.log('   - JWT_SECRET');
    console.log('3. Check Render logs for detailed error messages');
    console.log('4. Verify build and deployment logs');

    console.log('\n5. Common Production 500 Errors:');
    
    // Test specific error scenarios
    console.log('\nTesting potential issues...');
    
    // Test 1: Missing environment variable
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('ISSUE: SUPABASE_SERVICE_ROLE_KEY might be missing in production');
    }
    
    // Test 2: Database connection
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          console.log('DATABASE CONNECTION ERROR:', error.message);
        } else {
          console.log('DATABASE CONNECTION: OK');
        }
      }
    } catch (error) {
      console.log('DATABASE TEST FAILED:', error.message);
    }

  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

// Render-specific debugging
console.log('=== RENDER DEPLOYMENT CHECKLIST ===\n');
console.log('1. Render Dashboard > Your App > Environment Variables:');
console.log('   - Add ALL environment variables from your local .env.local');
console.log('   - Make sure there are no typos');
console.log('   - Check that sensitive variables are not prefixed with NEXT_PUBLIC_\n');

console.log('2. Render Dashboard > Your App > Logs:');
console.log('   - Check "Logs" tab for detailed error messages');
console.log('   - Look for specific error lines');
console.log('   - Check build logs for deployment issues\n');

console.log('3. Render Dashboard > Your App > Events:');
console.log('   - Check recent deployment events');
console.log('   - Look for failed deployments\n');

console.log('4. Common Render Issues:');
console.log('   - Environment variables not properly set');
console.log('   - Database connection string incorrect');
console.log('   - Missing dependencies in package.json');
console.log('   - Build process failing\n');

console.log('=== IMMEDIATE ACTION ITEMS ===\n');
console.log('1. Go to Render dashboard and check environment variables');
console.log('2. Check Render logs for the exact 500 error');
console.log('3. Ensure all required environment variables are set');
console.log('4. Test the health endpoint: https://techassassin.onrender.com/api/health');
console.log('5. If health endpoint works, issue is in signin route specifically');

debugProductionError();
