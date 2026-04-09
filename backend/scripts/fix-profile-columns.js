/**
 * Fix missing columns in profiles table
 * Uses DATABASE_URL from .env.local
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function fixColumns() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  });

  try {
    console.log('🔧 Connecting to database to fix profiles table...');

    const columnsToAdd = [
      { name: 'banner_url', type: 'TEXT' },
      { name: 'linkedin_url', type: 'TEXT' },
      { name: 'portfolio_url', type: 'TEXT' },
      { name: 'interests', type: 'TEXT[]', default: "'{}'" },
      { name: 'is_email_public', type: 'BOOLEAN', default: 'FALSE', notNull: true },
      { name: 'is_phone_public', type: 'BOOLEAN', default: 'FALSE', notNull: true },
      { name: 'is_address_public', type: 'BOOLEAN', default: 'FALSE', notNull: true }
    ];

    for (const col of columnsToAdd) {
      let query = `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`;
      if (col.default) query += ` DEFAULT ${col.default}`;
      if (col.notNull) query += ` NOT NULL`;
      
      await pool.query(query);
      console.log(`✅ Ensured column ${col.name} exists`);
    }

    // Also ensure updated_at exists as it's common
    await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    
    console.log('\n🚀 Profile table structure updated successfully!');

    // Show current columns
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
    `);
    console.log('\n📋 Current Columns:');
    result.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixColumns();
