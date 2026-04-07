const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetDatabase() {
  console.log('⚠️  WARNING: Resetting all data in the public schema...\n');
  console.log('Connection URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

  try {
    await client.connect();
    console.log('Connected to Supabase...');

    // Drop and recreate public schema (Wipes everything in public)
    console.log('🗑️  Dropping public schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    
    console.log('🏗️  Recreating public schema...');
    await client.query('CREATE SCHEMA public;');
    
    console.log('🔓 Restoring permissions...');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    await client.query('GRANT ALL ON SCHEMA public TO anon;');
    await client.query('GRANT ALL ON SCHEMA public TO authenticated;');
    await client.query('GRANT ALL ON SCHEMA public TO service_role;');

    console.log('\n✅ Database reset successfully! Public schema is now empty and ready for fresh migrations.');

  } catch (err) {
    console.error('❌ Error during database reset:', err.message);
    if (err.message.includes('authentication')) {
      console.log('Tip: Check your password in .env.local');
    }
  } finally {
    await client.end();
  }
}

resetDatabase();
