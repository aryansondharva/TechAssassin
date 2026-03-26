import pool, { query } from '../lib/db/postgres';

async function verifyRealtimeSchema() {
  console.log('🔍 Verifying Real-Time Presence & Activity System schema...\n');

  try {
    // Check presence_tracking table
    console.log('1. Checking presence_tracking table...');
    const presenceTable = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'presence_tracking'
      ORDER BY ordinal_position;
    `);
    
    if (presenceTable.rows.length === 0) {
      console.log('   ❌ presence_tracking table not found');
    } else {
      console.log('   ✅ presence_tracking table exists');
      console.log('   Columns:', presenceTable.rows.map(r => r.column_name).join(', '));
    }

    // Check activity_feed table
    console.log('\n2. Checking activity_feed table...');
    const activityTable = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'activity_feed'
      ORDER BY ordinal_position;
    `);
    
    if (activityTable.rows.length === 0) {
      console.log('   ❌ activity_feed table not found');
    } else {
      console.log('   ✅ activity_feed table exists');
      console.log('   Columns:', activityTable.rows.map(r => r.column_name).join(', '));
    }

    // Check leaderboard_scores table
    console.log('\n3. Checking leaderboard_scores table...');
    const leaderboardTable = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'leaderboard_scores'
      ORDER BY ordinal_position;
    `);
    
    if (leaderboardTable.rows.length === 0) {
      console.log('   ❌ leaderboard_scores table not found');
    } else {
      console.log('   ✅ leaderboard_scores table exists');
      console.log('   Columns:', leaderboardTable.rows.map(r => r.column_name).join(', '));
    }

    // Check indexes
    console.log('\n4. Checking indexes...');
    const indexes = await query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE tablename IN ('presence_tracking', 'activity_feed', 'leaderboard_scores')
      ORDER BY tablename, indexname;
    `);
    
    console.log('   Found', indexes.rows.length, 'indexes:');
    indexes.rows.forEach(row => {
      console.log(`   - ${row.tablename}.${row.indexname}`);
    });

    // Check RLS policies
    console.log('\n5. Checking Row Level Security policies...');
    const policies = await query(`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE tablename IN ('presence_tracking', 'activity_feed', 'leaderboard_scores')
      ORDER BY tablename, policyname;
    `);
    
    console.log('   Found', policies.rows.length, 'RLS policies:');
    policies.rows.forEach(row => {
      console.log(`   - ${row.tablename}: ${row.policyname}`);
    });

    console.log('\n✅ Schema verification complete!');
  } catch (error) {
    console.error('\n❌ Schema verification failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

verifyRealtimeSchema();
