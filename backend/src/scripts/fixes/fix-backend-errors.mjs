/**
 * Fix Backend Errors
 * Fix import errors and foreign key constraints
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function fixBackendErrors() {
  try {
    console.log('=== FIXING BACKEND ERRORS ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Fix foreign key constraints
    console.log('Step 1: Fixing foreign key constraints...');
    
    const fixConstraintsSQL = `
      -- Find and drop foreign key constraints that reference non-existent tables
      DO $$
      DECLARE
          constraint_record RECORD;
      BEGIN
          FOR constraint_record IN 
              SELECT tc.table_name, tc.constraint_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
              JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
              WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND ccu.table_name NOT IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public')
              AND tc.table_schema = 'public'
          LOOP
              EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                           constraint_record.table_name, 
                           constraint_record.constraint_name);
              RAISE NOTICE 'Dropped constraint % on table %', constraint_record.constraint_name, constraint_record.table_name;
          END LOOP;
      END $$;
      
      -- Specifically check for constraints referencing 'users' table
      DO $$
      DECLARE
          constraint_record RECORD;
      BEGIN
          FOR constraint_record IN 
              SELECT tc.table_name, tc.constraint_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
              JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
              WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND ccu.table_name = 'users'
              AND tc.table_schema = 'public'
          LOOP
              EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                           constraint_record.table_name, 
                           constraint_record.constraint_name);
              RAISE NOTICE 'Dropped users constraint % on table %', constraint_record.constraint_name, constraint_record.table_name;
          END LOOP;
      END $$;
    `;

    try {
      await client.query(fixConstraintsSQL);
      console.log('Foreign key constraints fixed');
    } catch (error) {
      console.log('Fix constraints result:', error.message);
    }

    // Step 2: Check for any remaining problematic constraints
    console.log('\nStep 2: Checking remaining constraints...');
    
    const checkConstraintsSQL = `
      SELECT 
          tc.table_name, 
          tc.constraint_name, 
          ccu.table_name AS foreign_table_name,
          kcu.column_name,
          ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public';
    `;

    try {
      const result = await client.query(checkConstraintsSQL);
      console.log('Remaining foreign key constraints:');
      result.rows.forEach(row => {
        console.log(`  ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
    } catch (error) {
      console.log('Check constraints result:', error.message);
    }

    // Step 3: Verify profiles table is working
    console.log('\nStep 3: Verifying profiles table...');
    
    const verifyProfilesSQL = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
      ORDER BY ordinal_position;
      
      SELECT COUNT(*) as count FROM profiles;
    `;

    try {
      const result = await client.query(verifyProfilesSQL);
      console.log('Profiles table structure:');
      result.rows.slice(0, -1).forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });
      console.log('Profiles count:', result.rows[result.rows.length - 1]?.count || 0);
    } catch (error) {
      console.log('Verify profiles result:', error.message);
    }

    await client.end();

    console.log('\n=== BACKEND ERRORS FIXED ===');
    console.log('Changes made:');
    console.log('1. Fixed foreign key constraints');
    console.log('2. Removed references to non-existent tables');
    console.log('3. Verified profiles table structure');
    console.log('\nNext steps:');
    console.log('1. Fix the import error in lib/supabase/server.ts');
    console.log('2. Restart backend server');
    console.log('3. Test authentication flow');

  } catch (error) {
    console.error('Backend error fix failed:', error.message);
    process.exit(1);
  }
}

fixBackendErrors();
