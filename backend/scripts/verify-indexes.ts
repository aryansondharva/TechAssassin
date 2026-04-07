/**
 * Script to verify database indexes for performance optimization
 * Validates: Requirements 9.3 - Database indexes for efficient queries
 */

import pool from '../lib/db/postgres';

interface IndexInfo {
  tablename: string;
  indexname: string;
  indexdef: string;
}

async function verifyIndexes() {
  console.log('🔍 Verifying database indexes for Real-Time Presence & Activity System...\n');

  try {
    // Query to get all indexes on our tables
    const result = await pool.query<IndexInfo>(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('presence_tracking', 'activity_feed', 'leaderboard_scores')
      ORDER BY tablename, indexname;
    `);

    const indexes = result.rows;

    // Expected indexes for each table
    const expectedIndexes = {
      presence_tracking: [
        'idx_presence_status',
        'idx_presence_location',
        'idx_presence_last_seen',
        'idx_presence_updated_at',
      ],
      activity_feed: [
        'idx_activity_type',
        'idx_activity_user',
        'idx_activity_created',
        'idx_activity_type_created',
      ],
      leaderboard_scores: [
        'idx_leaderboard_event',
        'idx_leaderboard_rank',
        'idx_leaderboard_user',
        'idx_leaderboard_score',
      ],
    };

    // Verify each table
    let allIndexesPresent = true;

    for (const [tableName, expectedIndexList] of Object.entries(expectedIndexes)) {
      console.log(`\n📊 Table: ${tableName}`);
      console.log('─'.repeat(60));

      const tableIndexes = indexes.filter((idx) => idx.tablename === tableName);

      for (const expectedIndex of expectedIndexList) {
        const found = tableIndexes.find((idx) => idx.indexname === expectedIndex);

        if (found) {
          console.log(`✅ ${expectedIndex}`);
          console.log(`   ${found.indexdef}`);
        } else {
          console.log(`❌ MISSING: ${expectedIndex}`);
          allIndexesPresent = false;
        }
      }

      // Show any additional indexes
      const additionalIndexes = tableIndexes.filter(
        (idx) =>
          !expectedIndexList.includes(idx.indexname) &&
          !idx.indexname.endsWith('_pkey') // Exclude primary keys
      );

      if (additionalIndexes.length > 0) {
        console.log('\n📌 Additional indexes:');
        additionalIndexes.forEach((idx) => {
          console.log(`   ${idx.indexname}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));

    if (allIndexesPresent) {
      console.log('✅ All required indexes are present!');
    } else {
      console.log('❌ Some indexes are missing. Run migrations to create them.');
      process.exit(1);
    }

    // Test query performance
    console.log('\n🚀 Testing query performance with EXPLAIN ANALYZE...\n');
    await testQueryPerformance();

    console.log('\n✅ Index verification complete!');
  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function testQueryPerformance() {
  // Test 1: Activity feed query with type filter and pagination
  console.log('Test 1: Activity feed query (type filter + pagination)');
  console.log('─'.repeat(60));

  const activityQuery = `
    EXPLAIN ANALYZE
    SELECT 
      af.id,
      af.type,
      af.user_id,
      af.metadata,
      af.created_at
    FROM activity_feed af
    WHERE af.type = 'challenge_solved'
    ORDER BY af.created_at DESC
    LIMIT 20 OFFSET 0;
  `;

  try {
    const result = await pool.query(activityQuery);
    result.rows.forEach((row) => console.log(row['QUERY PLAN']));

    // Check if index is being used
    const planText = result.rows.map((r) => r['QUERY PLAN']).join(' ');
    if (planText.includes('Index Scan') || planText.includes('Bitmap Index Scan')) {
      console.log('✅ Query uses index');
    } else {
      console.log('⚠️ Query may not be using index optimally');
    }
  } catch (error) {
    console.log('⚠️ Could not test (table may be empty):', error);
  }

  console.log('');

  // Test 2: Presence tracking query by status
  console.log('Test 2: Presence tracking query (status filter)');
  console.log('─'.repeat(60));

  const presenceQuery = `
    EXPLAIN ANALYZE
    SELECT 
      user_id,
      status,
      location_type,
      location_id,
      last_seen
    FROM presence_tracking
    WHERE status IN ('online', 'away', 'busy')
    ORDER BY last_seen DESC;
  `;

  try {
    const result = await pool.query(presenceQuery);
    result.rows.forEach((row) => console.log(row['QUERY PLAN']));

    const planText = result.rows.map((r) => r['QUERY PLAN']).join(' ');
    if (planText.includes('Index Scan') || planText.includes('Bitmap Index Scan')) {
      console.log('✅ Query uses index');
    } else {
      console.log('⚠️ Query may not be using index optimally');
    }
  } catch (error) {
    console.log('⚠️ Could not test (table may be empty):', error);
  }

  console.log('');

  // Test 3: Leaderboard query by event
  console.log('Test 3: Leaderboard query (event filter + rank order)');
  console.log('─'.repeat(60));

  const leaderboardQuery = `
    EXPLAIN ANALYZE
    SELECT 
      user_id,
      score,
      rank,
      previous_rank
    FROM leaderboard_scores
    WHERE event_id = '00000000-0000-0000-0000-000000000000'::uuid
    ORDER BY rank ASC
    LIMIT 50;
  `;

  try {
    const result = await pool.query(leaderboardQuery);
    result.rows.forEach((row) => console.log(row['QUERY PLAN']));

    const planText = result.rows.map((r) => r['QUERY PLAN']).join(' ');
    if (planText.includes('Index Scan') || planText.includes('Bitmap Index Scan')) {
      console.log('✅ Query uses index');
    } else {
      console.log('⚠️ Query may not be using index optimally');
    }
  } catch (error) {
    console.log('⚠️ Could not test (table may be empty):', error);
  }
}

// Run verification
verifyIndexes();
