const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuth() {
  console.log('Testing User Signup...');
  const email = `test_${Date.now()}@example.com`;
  const password = 'TestPass123!';
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    console.error('❌ Signup Error:', error.message);
  } else {
    console.log('✅ Signup Success! User:', data.user.id);
    
    console.log('Testing Signin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      console.error('❌ Signin Error:', signInError.message);
    } else {
      console.log('✅ Signin Success!');
    }
  }
}

testAuth();
