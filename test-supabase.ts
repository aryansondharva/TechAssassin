
import { createClient } from './backend/lib/supabase/server';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env.local' });

async function test() {
  try {
    console.log('Testing createClient...');
    const client = await createClient();
    console.log('Client created successfully');
    console.log('Client type:', typeof client);
    console.log('Has auth:', !!client.auth);
  } catch (error) {
    console.error('Error in createClient:', error);
  }
}

test();
