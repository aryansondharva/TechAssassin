// Debug script to test signup validation
const { z } = require('zod');

// Test the validation schema
const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  aadhaar_number: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  address: z.string().optional(),
  education: z.string().optional(),
  university: z.string().optional(),
  graduation_year: z.number().int().min(1950).max(2030).optional()
});

// Test data
const testData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

console.log('Testing validation schema...');
try {
  const result = signupSchema.parse(testData);
  console.log('✅ Validation passed:', result);
} catch (error) {
  console.error('❌ Validation failed:', error.errors);
  console.error('Error details:', error.issues);
}

// Test with missing required fields
console.log('\nTesting with missing username...');
try {
  const result = signupSchema.parse({ email: 'test@example.com', password: 'password123' });
  console.log('✅ Validation passed:', result);
} catch (error) {
  console.error('❌ Validation failed:', error.errors);
  console.error('Error details:', error.issues);
}

// Test with invalid email
console.log('\nTesting with invalid email...');
try {
  const result = signupSchema.parse({ username: 'testuser', email: 'invalid-email', password: 'password123' });
  console.log('✅ Validation passed:', result);
} catch (error) {
  console.error('❌ Validation failed:', error.errors);
  console.error('Error details:', error.issues);
}

// Test with short password
console.log('\nTesting with short password...');
try {
  const result = signupSchema.parse({ username: 'testuser', email: 'test@example.com', password: '123' });
  console.log('✅ Validation passed:', result);
} catch (error) {
  console.error('❌ Validation failed:', error.errors);
  console.error('Error details:', error.issues);
}
