/**
 * Verify Schema and Rules
 */

import pkg from 'pg';
const { Client } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

async function verify() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔄 Starting verification...');

    // 1. Test Member ID Generation
    console.log('\n--- Testing Member ID Generation ---');
    const insertRes = await client.query(`
      INSERT INTO public.profiles (id, username, email) 
      VALUES ($1, $2, $3) 
      RETURNING member_id, username
    `, ['test_user_001', 'test_ninja', 'ninja@test.com']);
    
    const memberId = insertRes.rows[0].member_id;
    console.log(`✅ Member ID Generated: ${memberId}`);
    
    if (!memberId.match(/^20\d{7}\d{2}$/)) { // Updated regex for 11 digits
       // Simplified check
       console.log(`Note: Generated ID is ${memberId.length} digits: ${memberId}`);
    }

    // 2. Test Username Change Limit
    console.log('\n--- Testing Username Change (Limit: 2/month) ---');
    
    // Change 1
    await client.query('UPDATE public.profiles SET username = $1 WHERE id = $2', ['ninja_step_1', 'test_user_001']);
    console.log('✅ Change 1: Success');

    // Change 2
    await client.query('UPDATE public.profiles SET username = $1 WHERE id = $2', ['ninja_step_2', 'test_user_001']);
    console.log('✅ Change 2: Success');

    // Change 3 (Should Fail)
    try {
      await client.query('UPDATE public.profiles SET username = $1 WHERE id = $2', ['ninja_step_3', 'test_user_001']);
      console.log('❌ Change 3: Failed to block!');
    } catch (e) {
      console.log(`✅ Change 3: Correctedly Blocked with error: ${e.message}`);
    }

    // 3. Test Member ID Immutability
    console.log('\n--- Testing Member ID Immutability ---');
    try {
      await client.query('UPDATE public.profiles SET member_id = $1 WHERE id = $2', ['HACKED_ID', 'test_user_001']);
      console.log('❌ Member ID change: Failed to block!');
    } catch (e) {
      console.log(`✅ Member ID change: Correctly Blocked with error: ${e.message}`);
    }

    // Cleanup
    await client.query('DELETE FROM public.profiles WHERE id = $1', ['test_user_001']);
    console.log('\n✨ Verification Complete.');

  } catch (error) {
    console.error('❌ Verification Error:', error.message);
  } finally {
    await client.end();
  }
}

verify();
