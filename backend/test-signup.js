
require('dotenv').config({ path: '.env.local' });
const { signUp } = require('./lib/auth/server');

async function testSignUp() {
  const userData = {
    username: 'testuser_' + Date.now(),
    email: 'aryansondharva25@gmail.com',
    password: 'password123',
    full_name: 'Test Aryan'
  };

  console.log('Testing sign up for:', userData.email);
  try {
    const result = await signUp(userData);
    console.log('Sign up successful:', result);
  } catch (error) {
    console.error('Sign up failed:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

testSignUp();
