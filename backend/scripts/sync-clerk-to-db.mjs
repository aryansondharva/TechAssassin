/**
 * Clerk to Supabase User Synchronization Script
 * Preserves historical join dates for Member ID generation.
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

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!CLERK_SECRET_KEY || !DATABASE_URL) {
  console.error('❌ Error: Missing credentials in .env.local');
  process.exit(1);
}

async function syncClerkToDb() {
  const dbClient = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Fetching users from Clerk...');
    
    // Fetch all users from Clerk (standard limit is 500)
    const response = await fetch('https://api.clerk.com/v1/users?limit=500', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Clerk API Error: ${JSON.stringify(errorData)}`);
    }

    const clerkUsers = await response.json();
    console.log(`✅ Found ${clerkUsers.length} users in Clerk.`);

    await dbClient.connect();
    console.log('✅ Connected to Supabase.');

    let successCount = 0;

    for (const user of clerkUsers) {
      try {
        const clerkUserId = user.id;
        const primaryEmail = user.email_addresses.find(e => e.id === user.primary_email_address_id)?.email_address 
                          || user.email_addresses[0]?.email_address 
                          || null;
        
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ') || '';
        const username = user.username || primaryEmail?.split('@')[0] || `user_${clerkUserId.slice(-8)}`;
        const imageUrl = user.image_url || null;
        
        // Convert Clerk's milliseconds timestamp to ISO string for the database
        const createdAt = new Date(user.created_at).toISOString();

        // Upsert user into profiles
        // Our SQL trigger will take this 'created_at' and generate the correct historical member_id
        await dbClient.query(`
          INSERT INTO public.profiles (
            id, username, email, full_name, avatar_url, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $6
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW()
        `, [
          clerkUserId,
          username,
          primaryEmail,
          fullName,
          imageUrl,
          createdAt
        ]);

        successCount++;
      } catch (userError) {
        console.error(`❌ Failed to sync user ${user.id}:`, userError.message);
      }
    }

    console.log(`\n✨ SYNC COMPLETE: ${successCount}/${clerkUsers.length} users successfully captured.`);
    console.log('Tip: Check your Supabase profiles table to see their brand-new, historically accurate Member IDs!');

  } catch (error) {
    console.error('❌ Sync Error:', error.message);
  } finally {
    await dbClient.end();
  }
}

syncClerkToDb();
