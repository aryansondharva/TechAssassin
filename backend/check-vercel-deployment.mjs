/**
 * Check Vercel Deployment Configuration
 * Verify environment variables and deployment status for tech-assassin.vercel.app
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const VERCEL_URL = 'https://tech-assassin.vercel.app';

console.log('=== CHECKING VERCEL DEPLOYMENT ===\n');

async function checkVercelDeployment() {
  try {
    console.log('1. Testing Vercel App Health...');
    
    try {
      const healthResponse = await fetch(`${VERCEL_URL}/api/health`);
      
      if (healthResponse.ok) {
        console.log('Health Endpoint: OK');
        const health = await healthResponse.json();
        console.log('Health Data:', health);
      } else {
        console.log('Health Endpoint Status:', healthResponse.status);
        console.log('Health Response:', await healthResponse.text());
      }
    } catch (error) {
      console.log('Health Endpoint Failed:', error.message);
    }

    console.log('\n2. Testing Vercel Signin Endpoint...');
    
    try {
      const signinResponse = await fetch(`${VERCEL_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'naitiksondharva138@gmail.com',
          password: 'testpassword'
        })
      });

      console.log('Signin Status:', signinResponse.status);
      console.log('Signin Response:', await signinResponse.text());
      
      if (signinResponse.ok) {
        console.log('Signin Endpoint: WORKING! ');
      } else if (signinResponse.status === 500) {
        console.log('Signin Endpoint: 500 ERROR - Environment variables missing');
      } else {
        console.log('Signin Endpoint: Other error');
      }
      
    } catch (error) {
      console.log('Signin Endpoint Failed:', error.message);
    }

    console.log('\n3. Environment Variables for Vercel:');
    
    const requiredVars = {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'DATABASE_URL': process.env.DATABASE_URL,
      'JWT_SECRET': process.env.JWT_SECRET,
      'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
      'NEXT_PUBLIC_SITE_URL': process.env.NEXT_PUBLIC_SITE_URL
    };

    console.log('Required Environment Variables:');
    Object.entries(requiredVars).forEach(([key, value]) => {
      const status = value ? 'SET' : 'MISSING';
      const preview = value ? `${value.substring(0, 50)}...` : 'N/A';
      console.log(`   ${key}: ${status} (${preview})`);
    });

    console.log('\n4. Vercel Configuration Check:');
    
    // Check if URLs are correctly set
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    if (appUrl === 'https://tech-assassin.vercel.app') {
      console.log('NEXT_PUBLIC_APP_URL: CORRECT');
    } else {
      console.log('NEXT_PUBLIC_APP_URL: INCORRECT or MISSING');
      console.log('Should be: https://tech-assassin.vercel.app');
    }
    
    if (siteUrl === 'https://tech-assassin.vercel.app') {
      console.log('NEXT_PUBLIC_SITE_URL: CORRECT');
    } else {
      console.log('NEXT_PUBLIC_SITE_URL: INCORRECT or MISSING');
      console.log('Should be: https://tech-assassin.vercel.app');
    }

    console.log('\n5. Vercel Environment Setup:');
    console.log('VERCEL DASHBOARD CHECKS:');
    console.log('1. Go to Vercel dashboard > your project > Settings');
    console.log('2. Go to "Environment Variables"');
    console.log('3. Add these variables:');
    
    const vercelVars = {
      'NEXT_PUBLIC_SUPABASE_URL': 'https://qlurztwklaysbhdjcpam.supabase.co',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdXJ6dHdrbGF5c2JoZGpjcGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI4NDIsImV4cCI6MjA5MTE0ODg0Mn0.qxQv9K7x6QSAW4Zt0OoshfgeRbzDbIU3C9RNZYbUuwo',
      'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdXJ6dHdrbGF5c2JoZGpjcGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3Mjg0MiwiZXhwIjoyMDkxMTQ4ODQyfQ.mTzP5hsNFhDfevbiCHCf1iinRftsoi9NPQoeOXjkvzc',
      'DATABASE_URL': 'postgresql://postgres.qlurztwklaysbhdjcpam:1046402103As@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
      'JWT_SECRET': 'your-super-secret-jwt-key-change-this-in-production-min-32-chars',
      'JWT_EXPIRES_IN': '7d',
      'NEXT_PUBLIC_APP_URL': 'https://tech-assassin.vercel.app',
      'NEXT_PUBLIC_SITE_URL': 'https://tech-assassin.vercel.app'
    };
    
    Object.entries(vercelVars).forEach(([key, value]) => {
      console.log(`   ${key}=${value}`);
    });

    console.log('\n6. Vercel vs Render Differences:');
    console.log('Vercel Advantages:');
    console.log(' - Better frontend deployment');
    console.log(' - Automatic environment variable management');
    console.log(' - Built-in CDN and edge functions');
    console.log(' - Better performance for static assets');
    
    console.log('\n7. Supabase Configuration for Vercel:');
    console.log('Update Supabase Dashboard > Authentication > Settings:');
    console.log(' - Site URL: https://tech-assassin.vercel.app');
    console.log(' - Redirect URLs: https://tech-assassin.vercel.app');
    console.log(' - CORS origins: https://tech-assassin.vercel.app');

  } catch (error) {
    console.error('Check failed:', error.message);
  }
}

console.log('=== VERCEL DEPLOYMENT STATUS ===\n');
console.log('Your URLs:');
console.log('App: https://tech-assassin.vercel.app');
console.log('Health: https://tech-assassin.vercel.app/api/health');
console.log('Signin: https://tech-assassin.vercel.app/api/auth/signin');
console.log('');

checkVercelDeployment();
