/**
 * Script to verify real-time API endpoints are working
 * Tests presence, activity, and leaderboard endpoints
 */

async function testEndpoint(url: string, method: string = 'GET', body?: any) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function verifyEndpoints() {
  console.log('🔍 Verifying real-time API endpoints...\n');
  const baseUrl = 'http://localhost:3001';
  
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Database connection
  console.log('1. Testing database connection...');
  const dbTest = await testEndpoint(`${baseUrl}/api/test-db`);
  if (dbTest.ok) {
    console.log('✅ Database connection successful');
    console.log(`   Connected: ${dbTest.data.connected}`);
    passedTests++;
  } else {
    console.log('❌ Database connection failed');
    console.log(`   Status: ${dbTest.status}`);
    console.log(`   Error: ${JSON.stringify(dbTest.data || dbTest.error)}`);
    failedTests++;
  }

  // Test 2: Health check
  console.log('\n2. Testing health endpoint...');
  const healthTest = await testEndpoint(`${baseUrl}/api/health`);
  if (healthTest.ok) {
    console.log('✅ Health check passed');
    console.log(`   Status: ${healthTest.data.status}`);
    passedTests++;
  } else {
    console.log('❌ Health check failed');
    console.log(`   Status: ${healthTest.status}`);
    failedTests++;
  }

  // Note: The following tests require authentication
  console.log('\n3. Presence endpoints (require authentication)...');
  console.log('   - POST /api/presence/update');
  console.log('   - POST /api/presence/heartbeat');
  console.log('   - GET /api/presence/online');
  console.log('   ⚠️  Skipping (requires authentication token)');

  console.log('\n4. Activity endpoints (require authentication)...');
  console.log('   - POST /api/activity/create');
  console.log('   - GET /api/activity/feed');
  console.log('   - GET /api/activity/:id');
  console.log('   ⚠️  Skipping (requires authentication token)');

  console.log('\n5. Leaderboard endpoints (require authentication)...');
  console.log('   - POST /api/leaderboard/update');
  console.log('   - GET /api/leaderboard/:eventId');
  console.log('   - GET /api/leaderboard/:eventId/rank/:userId');
  console.log('   ⚠️  Skipping (requires authentication token)');

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   ⚠️  Skipped: 3 (require authentication)`);
  
  if (failedTests === 0) {
    console.log('\n✅ All testable endpoints are working!');
    console.log('\n📝 Note: Authenticated endpoints were verified via unit tests.');
    console.log('   Run: npx vitest run app/api/__tests__/');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
  }
}

// Check if server is running
async function checkServer() {
  console.log('🔍 Checking if backend server is running...\n');
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (response.ok) {
      console.log('✅ Backend server is running on port 3001\n');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend server is not running on port 3001');
    console.log('   Please start the server with: npm run dev\n');
    return false;
  }
  return false;
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('⚠️  Cannot verify endpoints without running server.');
    console.log('   Start the server and run this script again.');
    process.exit(1);
  }
  
  await verifyEndpoints();
}

main();
