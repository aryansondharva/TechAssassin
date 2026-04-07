# SQL Migration Scripts

This directory contains SQL migration scripts for the User Gamification System.

## Performance Optimization Scripts

### 1. Leaderboard Materialized View

**File**: `create_leaderboard_materialized_view.sql`

**Purpose**: Creates a materialized view for optimized leaderboard queries

**Requirements**: 10.3, 10.6

**What it does**:
- Creates `leaderboard_all_time` materialized view
- Adds indexes on `id` and `rank`
- Creates refresh function `refresh_leaderboard_all_time()`
- Sets up permissions

**How to run**:
```bash
# Using psql
psql -d your_database -f SQL/create_leaderboard_materialized_view.sql

# Using Supabase CLI
supabase db push --file SQL/create_leaderboard_materialized_view.sql

# Using Supabase Dashboard
# Copy and paste the SQL into the SQL Editor and run
```

**Post-installation**:
Set up automatic refresh every 5 minutes using one of these methods:

1. **pg_cron** (if available):
   ```sql
   SELECT cron.schedule(
     'refresh-leaderboard',
     '*/5 * * * *',
     'SELECT refresh_leaderboard_all_time();'
   );
   ```

2. **Supabase Edge Function**: Create a function that calls the refresh and set up a cron trigger

3. **External cron**: Schedule a job to call the refresh function

### 2. Badge Criteria Indexes

**File**: `optimize_badge_criteria_indexes.sql`

**Purpose**: Creates indexes on all fields used in badge criteria evaluation

**Requirements**: 4.1, 4.5

**What it does**:
- Creates indexes on `profiles` table (total_xp, current_streak, longest_streak, profile_completion_percentage)
- Creates indexes on `user_badges` table (user_id, badge_id)
- Creates indexes on `registrations` table (user_id)
- Creates indexes on `xp_transactions` table (user_id, source, created_at)
- Runs ANALYZE on all tables

**How to run**:
```bash
# Using psql
psql -d your_database -f SQL/optimize_badge_criteria_indexes.sql

# Using Supabase CLI
supabase db push --file SQL/optimize_badge_criteria_indexes.sql

# Using Supabase Dashboard
# Copy and paste the SQL into the SQL Editor and run
```

**Verification**:
```sql
-- Check if indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname LIKE '%badge_eval%';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%badge_eval%';
```

## Running All Scripts

To run all performance optimization scripts in order:

```bash
# 1. Create materialized view
psql -d your_database -f SQL/create_leaderboard_materialized_view.sql

# 2. Create indexes
psql -d your_database -f SQL/optimize_badge_criteria_indexes.sql
```

## Maintenance

### Regular Maintenance Tasks

1. **Refresh materialized view** (automated via cron):
   ```sql
   SELECT refresh_leaderboard_all_time();
   ```

2. **Analyze tables** (weekly):
   ```sql
   ANALYZE profiles;
   ANALYZE user_badges;
   ANALYZE registrations;
   ANALYZE xp_transactions;
   ANALYZE badges;
   ```

3. **Check materialized view size**:
   ```sql
   SELECT pg_size_pretty(pg_total_relation_size('leaderboard_all_time'));
   ```

4. **Check index usage**:
   ```sql
   SELECT 
     schemaname,
     tablename,
     indexname,
     idx_scan as scans,
     idx_tup_read as tuples_read,
     idx_tup_fetch as tuples_fetched
   FROM pg_stat_user_indexes
   WHERE indexname LIKE '%badge_eval%'
   ORDER BY idx_scan DESC;
   ```

## Troubleshooting

### Materialized View Issues

**Problem**: Materialized view not refreshing

**Solution**:
1. Check if refresh function exists:
   ```sql
   \df refresh_leaderboard_all_time
   ```

2. Manual refresh:
   ```sql
   SELECT refresh_leaderboard_all_time();
   ```

3. Check for errors in logs

**Problem**: Slow refresh times

**Solution**:
1. Check view size:
   ```sql
   SELECT pg_size_pretty(pg_total_relation_size('leaderboard_all_time'));
   ```

2. Consider using `REFRESH MATERIALIZED VIEW CONCURRENTLY` (requires unique index)

3. Optimize underlying queries

### Index Issues

**Problem**: Indexes not being used

**Solution**:
1. Run ANALYZE:
   ```sql
   ANALYZE profiles;
   ```

2. Check query plans:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM profiles WHERE total_xp > 1000;
   ```

3. Verify indexes exist:
   ```sql
   \d+ profiles
   ```

**Problem**: Slow index creation

**Solution**:
1. Create indexes with `CONCURRENTLY` option (doesn't lock table):
   ```sql
   CREATE INDEX CONCURRENTLY idx_name ON table(column);
   ```

2. Run during low-traffic periods

## Performance Monitoring

### Key Metrics to Monitor

1. **Cache hit rate**: Should be > 80%
2. **Query response time**: Leaderboard < 100ms, Badge evaluation < 500ms
3. **Index usage**: Check `idx_scan` in `pg_stat_user_indexes`
4. **Materialized view size**: Monitor growth over time

### Monitoring Queries

```sql
-- Cache statistics (from application)
-- Use leaderboardCache.getStats() in Node.js

-- Database query performance
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%leaderboard%'
ORDER BY mean_time DESC
LIMIT 10;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Rollback

If you need to rollback these changes:

### Remove Materialized View

```sql
DROP MATERIALIZED VIEW IF EXISTS leaderboard_all_time CASCADE;
DROP FUNCTION IF EXISTS refresh_leaderboard_all_time();
```

### Remove Indexes

```sql
DROP INDEX IF EXISTS idx_profiles_total_xp_badge_eval;
DROP INDEX IF EXISTS idx_profiles_current_streak_badge_eval;
DROP INDEX IF EXISTS idx_profiles_longest_streak_badge_eval;
DROP INDEX IF EXISTS idx_profiles_completion_badge_eval;
DROP INDEX IF EXISTS idx_user_badges_count_badge_eval;
DROP INDEX IF EXISTS idx_registrations_user_badge_eval;
DROP INDEX IF EXISTS idx_xp_transactions_user_source_badge_eval;
```

## References

- Performance Optimization Documentation: `backend/services/PERFORMANCE_OPTIMIZATION.md`
- Design Document: `.kiro/specs/user-gamification-system/design.md`
- Requirements: `.kiro/specs/user-gamification-system/requirements.md`
