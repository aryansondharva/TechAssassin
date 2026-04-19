/**
 * View Current Profiles in Database
 */

import pkg from 'pg';
const { Client } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
config({ path: join(__dirname, '../.env.local') });

async function viewProfiles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('\n--- 👥 CURRENT USERS IN DATABASE ---');
    const { rows } = await client.query('SELECT id, member_id, username, created_at FROM public.profiles ORDER BY created_at ASC');
    
    if (rows.length === 0) {
      console.log('No users found in database.');
    } else {
      console.table(rows.map(row => ({
        'Clerk ID': row.id,
        'Member ID': row.member_id,
        'Username': row.username,
        'Join Date': new Date(row.created_at).toLocaleDateString()
      })));
    }
    console.log('-------------------------------------\n');

  } catch (err) {
    console.error('Error viewing profiles:', err.message);
  } finally {
    await client.end();
  }
}

viewProfiles();
