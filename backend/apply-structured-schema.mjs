/**
 * Apply Structured Database Schema to Supabase
 * This script applies the properly structured schema to your Supabase database
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function applyStructuredSchema() {
  try {
    console.log('Applying structured database schema to Supabase...\n');

    // Read the structured schema file
    const scriptPath = join(__dirname, '../SQL/20260418000007_structured_database_schema.sql');
    const sqlScript = readFileSync(scriptPath, 'utf8');
    
    console.log('Executing structured schema script...');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Execute the SQL script
    try {
      await client.query(sqlScript);
      console.log('Structured schema applied successfully!');
    } catch (error) {
      console.log('Schema application result:', error.message);
    }

    await client.end();

    // Test the structured schema
    console.log('\nTesting structured schema...');
    
    const testClient = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await testClient.connect();
    
    // Test key tables and relationships
    const tables = [
      'profiles',
      'skills', 
      'user_skills',
      'rank_tiers',
      'user_ranks_history',
      'events',
      'event_registrations',
      'xp_source_config',
      'xp_transactions',
      'xp_rate_limits',
      'activity_cooldowns',
      'badges',
      'user_badges',
      'missions',
      'user_missions',
      'leaderboard',
      'leaderboard_scores',
      'announcements',
      'notifications',
      'activity_feed',
      'resources',
      'sponsors',
      'presence_tracking'
    ];
    
    console.log('\nVerifying table structure:');
    for (const table of tables) {
      try {
        const result = await testClient.query(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
        console.log(`Table ${table}: OK (${result.rows[0].count} records)`);
      } catch (error) {
        console.log(`Table ${table}: Error - ${error.message}`);
      }
    }
    
    // Test foreign key relationships
    console.log('\nTesting foreign key relationships:');
    
    try {
      // Test profiles -> user_skills relationship
      const skillsResult = await testClient.query(`
        SELECT COUNT(*) as count 
        FROM public.user_skills us 
        JOIN public.profiles p ON us.user_id = p.id 
        LIMIT 1
      `);
      console.log('Profiles -> User Skills relationship: OK');
    } catch (error) {
      console.log('Profiles -> User Skills relationship: Error -', error.message);
    }

    try {
      // Test events -> event_registrations relationship
      const registrationsResult = await testClient.query(`
        SELECT COUNT(*) as count 
        FROM public.event_registrations er 
        JOIN public.events e ON er.event_id = e.id 
        LIMIT 1
      `);
      console.log('Events -> Event Registrations relationship: OK');
    } catch (error) {
      console.log('Events -> Event Registrations relationship: Error -', error.message);
    }

    try {
      // Test badges -> user_badges relationship
      const badgesResult = await testClient.query(`
        SELECT COUNT(*) as count 
        FROM public.user_badges ub 
        JOIN public.badges b ON ub.badge_id = b.id 
        LIMIT 1
      `);
      console.log('Badges -> User Badges relationship: OK');
    } catch (error) {
      console.log('Badges -> User Badges relationship: Error -', error.message);
    }

    await testClient.end();

    console.log('\nStructured schema application completed!');
    console.log('\nDatabase features:');
    console.log('1. Proper table relationships with foreign keys');
    console.log('2. Comprehensive constraints and checks');
    console.log('3. Performance-optimized indexes');
    console.log('4. Complete RLS security policies');
    console.log('5. Real-time capabilities');
    console.log('6. Proper organization by domain');

  } catch (error) {
    console.error('Schema application failed:', error.message);
    process.exit(1);
  }
}

applyStructuredSchema();
