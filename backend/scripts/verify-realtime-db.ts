/**
 * Script to verify real-time presence and activity database tables
 * Validates that all required tables exist and can be queried
 */

import { query } from '../lib/db/postgres';

async function verifyTables() {
  console.log('🔍 Verifying real-time database tables...\n');

  try {
    // Check presence_tracking table
    console.log('1. Checking presence_tracking table...');
    const presenceResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'presence_tracking'
      ORDER BY ordinal_position
    `);
    
    if (presenceResult.rows.length === 0) {
      console.log('❌ presence_tracking table does not exist');
    } else {
      console.log('✅ presence_tracking table exists with columns:');
      presenceResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    }

    // Check activity_feed table
    console.log('\n2. Checking activity_feed table...');
    const activityResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'activity_feed'
      ORDER BY ordinal_position
    `);
    
    if (activityResult.rows.length === 0) {
      console.log('❌ activity_feed table does not exist');
    } else {
      console.log('✅ activity_feed table exists with columns:');
      activityResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    }

    // Check leaderboard_scores table
    console.log('\n3. Checking leaderboard_scores table...');
    const leaderboardResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leaderboard_scores'
      ORDER BY ordinal_position
    `);
    
    if (leaderboardResult.rows.length === 0) {
      console.log('❌ leaderboard_scores table does not exist');
    } else {
      console.log('✅ leaderboard_scores table exists with columns:');
      leaderboardResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    }

    // Check indexes
    console.log('\n4. Checking indexes...');
    const indexResult = await query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename IN ('presence_tracking', 'activity_feed', 'leaderboard_scores')
      ORDER BY tablename, indexname
    `);
    
    if (indexResult.rows.length > 0) {
      console.log('✅ Found indexes:');
      indexResult.rows.forEach(row => {
        console.log(`   - ${row.tablename}.${row.indexname}`);
      });
    } else {
      console.log('⚠️  No indexes found');
    }

    // Test sample queries
    console.log('\n5. Testing sample queries...');
    
    // Count presence records
    const presenceCount = await query('SELECT COUNT(*) FROM presence_tracking');
    console.log(`✅ presence_tracking: ${presenceCount.rows[0].count} records`);
    
    // Count activity records
    const activityCount = await query('SELECT COUNT(*) FROM activity_feed');
    console.log(`✅ activity_feed: ${activityCount.rows[0].count} records`);
    
    // Count leaderboard records
    const leaderboardCount = await query('SELECT COUNT(*) FROM leaderboard_scores');
    console.log(`✅ leaderboard_scores: ${leaderboardCount.rows[0].count} records`);

    console.log('\n✅ All database verification checks completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database verification failed:', error);
    process.exit(1);
  }
}

verifyTables();
