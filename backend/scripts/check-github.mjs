import pkg from 'pg';
const { Client } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

async function checkGithubUrl() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT username, github_url, updated_at 
      FROM public.profiles
    `);
    
    console.log('\n🔍 Current Profile Data in Supabase:');
    console.table(result.rows);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkGithubUrl();
