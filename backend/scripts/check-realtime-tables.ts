// Script to check if real-time tables exist
import { createClient } from '../lib/supabase/server';
import pool from '../lib/db/postgres';

async function checkTables() {
  console.log('🔍 Checking real-time presence & activity tables...\n');

  try {
    // Check presence_tracking table
    const presenceCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'presence_tracking'
      );
    `);
    console.log(`${presenceCheck.rows[0].exists ? '✅' : '❌'} presence_tracking table: ${presenceCheck.rows[0].exists ? 'EXISTS' : 'MISSING'}`);

    // Check activity_feed table
    const activityCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_feed'
      );
    `);
    console.log(`${activityCheck.rows[0].exists ? '✅' : '❌'} activity_feed table: ${activityCheck.rows[0].exists ? 'EXISTS' : 'MISSING'}`);

    // Check leaderboard_scores table
    const leaderboardCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leaderboard_scores'
      );
    `);
    console.log(`${leaderboardCheck.rows[0].exists ? '✅' : '❌'} leaderboard_scores table: ${leaderboardCheck.rows[0].exists ? 'EXISTS' : 'MISSING'}`);

    console.log('\n✅ Table check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  }
}

checkTables();
