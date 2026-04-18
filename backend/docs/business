# Free Tier Compliance Verification

This document provides guidelines and checklists for verifying that the TechAssassin backend stays within the free tier limits of all third-party services.

## Service Limits Overview

### Supabase Free Tier Limits
- **Database**: 500 MB storage
- **Bandwidth**: 2 GB per month
- **File Storage**: 1 GB
- **Monthly Active Users**: Unlimited
- **API Requests**: Unlimited
- **Realtime Connections**: 200 concurrent

### Resend Free Tier Limits
- **Emails**: 3,000 emails per month
- **Emails per day**: 100 emails per day
- **Rate limit**: No specific rate limit on free tier

### Vercel Free Tier Limits
- **Bandwidth**: 100 GB per month
- **Serverless Function Execution**: 100 GB-hours per month
- **Serverless Function Duration**: 10 seconds max per invocation
- **Deployments**: Unlimited
- **Build Minutes**: 6,000 minutes per month

## Verification Checklist

### 1. Supabase Usage Monitoring

#### 1.1 Database Size
- [ ] **Check Current Database Size**
  - Navigate to Supabase Dashboard → Settings → Database
  - View "Database size" metric
  - **Current Size**: _______ MB / 500 MB
  - **Status**: ✅ Within limits / ⚠️ Approaching limit / ❌ Over limit

- [ ] **Estimate Growth Rate**
  - Calculate average daily growth
  - Project when 500 MB limit will be reached
  - **Daily Growth**: _______ MB/day
  - **Days Until Limit**: _______ days

- [ ] **Optimization Actions** (if approaching limit)
  - Review and delete test data
  - Archive old events and registrations
  - Optimize JSONB storage (prizes field)
  - Consider data retention policies

#### 1.2 Bandwidth Usage
- [ ] **Check Current Bandwidth**
  - Navigate to Supabase Dashboard → Settings → Usage
  - View "Bandwidth" metric
  - **Current Usage**: _______ GB / 2 GB per month
  - **Status**: ✅ Within limits / ⚠️ Approaching limit / ❌ Over limit

- [ ] **Bandwidth Breakdown**
  - Database queries: _______ GB
  - Storage downloads: _______ GB
  - Realtime subscriptions: _______ GB

- [ ] **Optimization Actions** (if approaching limit)
  - Implement pagination on all list endpoints
  - Add caching for frequently accessed data
  - Optimize query responses (select only needed fields)
  - Compress images before upload
  - Use CDN for static assets

#### 1.3 File Storage
- [ ] **Check Storage Usage**
  - Navigate to Supabase Dashboard → Storage
  - View total storage across all buckets
  - **Avatars Bucket**: _______ MB
  - **Event Images Bucket**: _______ MB
  - **Sponsor Logos Bucket**: _______ MB
  - **Total Storage**: _______ MB / 1 GB
  - **Status**: ✅ Within limits / ⚠️ Approaching limit / ❌ Over limit

- [ ] **Optimization Actions** (if approaching limit)
  - Implement image compression on upload
  - Set maximum file sizes (currently 2MB)
  - Clean up orphaned files
  - Implement storage cleanup on deletion

#### 1.4 Realtime Connections
- [ ] **Monitor Concurrent Connections**
  - Check Supabase Dashboard → Realtime
  - **Peak Concurrent Connections**: _______ / 200
  - **Status**: ✅ Within limits / ⚠️ Approaching limit / ❌ Over limit

- [ ] **Optimization Actions** (if approaching limit)
  - Implement connection pooling on client
  - Use presence channels efficiently
  - Unsubscribe from channels when not needed

### 2. Resend Email Usage Monitoring

#### 2.1 Monthly Email Count
- [ ] **Check Current Email Usage**
  - Navigate to Resend Dashboard → Usage
  - View "Emails sent this month"
  - **Current Count**: _______ / 3,000 per month
  - **Status**: ✅ Within limits / ⚠️ Approaching limit / ❌ Over limit

- [ ] **Email Breakdown**
  - Registration confirmations: _______ emails
  - Welcome emails: _______ emails
  - Password resets: _______ emails
  - Other: _______ emails

- [ ] **Estimate Monthly Usage**
  - Average registrations per day: _______
  - Average signups per day: _______
  - Projected monthly emails: _______

- [ ] **Optimization Actions** (if approaching limit)
  - Batch notifications where possible
  - Implement email preferences (opt-out)
  - Use in-app notifications as alternative
  - Consider upgrading to paid tier

#### 2.2 Daily Email Limit
- [ ] **Monitor Daily Sends**
  - Check Resend Dashboard for daily metrics
  - **Peak Daily Sends**: _______ / 100 per day
  - **Status**: ✅ Within limits / ⚠️ Approaching limit / ❌ Over limit

- [ ] **Optimization Actions** (if approaching limit)
  - Implement email queuing
  - Spread sends throughout the day
  - Prioritize critical emails

### 3. Vercel Usage Monitoring

#### 3.1 Bandwidth Usage
- [ ] **Check Current Bandwidth**
  - Navigate to Vercel Dashboard → Usage
  - View "Bandwidth" metric
  - **Current Usage**: _______ GB / 100 GB per month
  - **Status**: ✅ Within limits / ⚠️ Approaching limit / ❌ Over limit

- [ ] **Optimization Actions** (if approaching limit)
  - Enable compression on API responses
  - Implement caching headers
  - Use Supabase Storage for large files (not Vercel)
  - Optimize API response sizes

#### 3.2 Serverless Function Execution
- [ ] **Check Function Execution Time**
  - Navigate to Vercel Dashboard → Analytics → Functions
  - View "GB-Hours" metric
  - **Current Usage**: _______ GB-hours / 100 GB-hours per month
  - **Status**: ✅ Within limits / ⚠️ Approaching limit / ❌ Over limit

- [ ] **Check Function Duration**
  - Review slowest functions
  - **Slowest Function**: _______ ms / 10,000 ms max
  - **Average Duration**: _______ ms

- [ ] **Optimization Actions** (if approaching limit)
  - Optimize database queries
  - Implement connection pooling
  - Cache frequently accessed data
  - Reduce cold start times
  - Profile and optimize slow functions

#### 3.3 Build Minutes
- [ ] **Check Build Usage**
  - Navigate to Vercel Dashboard → Usage
  - View "Build Execution" metric
  - **Current Usage**: _______ minutes / 6,000 minutes per month
  - **Status**: ✅ Within limits / ⚠️ Approaching limit / ❌ Over limit

## Monitoring Schedule

### Daily Checks
- [ ] Review Vercel function errors
- [ ] Check for unusual traffic spikes
- [ ] Monitor email send rate

### Weekly Checks
- [ ] Review Supabase bandwidth usage
- [ ] Check database size growth
- [ ] Review storage usage
- [ ] Check Resend email count

### Monthly Checks
- [ ] Comprehensive usage review across all services
- [ ] Calculate growth trends
- [ ] Plan optimizations if approaching limits
- [ ] Review and clean up test data

## Usage Calculation Tools

### Database Size Estimation

```sql
-- Check total database size
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Check size by table
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check row counts
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### Storage Size Check

```sql
-- Check storage bucket sizes
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_bytes,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
GROUP BY bucket_id;
```

### Email Usage Projection

```javascript
// Calculate projected monthly email usage
const avgRegistrationsPerDay = 10; // Update with actual data
const avgSignupsPerDay = 5; // Update with actual data
const avgPasswordResetsPerDay = 2; // Update with actual data

const projectedMonthlyEmails = 
  (avgRegistrationsPerDay * 30) + // Registration confirmations
  (avgSignupsPerDay * 30) + // Welcome emails
  (avgPasswordResetsPerDay * 30); // Password resets

console.log(`Projected monthly emails: ${projectedMonthlyEmails} / 3000`);
```

## Alert Thresholds

Set up alerts when usage reaches these thresholds:

### Warning Level (80% of limit)
- Supabase Database: 400 MB
- Supabase Bandwidth: 1.6 GB
- Supabase Storage: 800 MB
- Resend Emails: 2,400 emails/month
- Vercel Bandwidth: 80 GB
- Vercel Function Execution: 80 GB-hours

### Critical Level (95% of limit)
- Supabase Database: 475 MB
- Supabase Bandwidth: 1.9 GB
- Supabase Storage: 950 MB
- Resend Emails: 2,850 emails/month
- Vercel Bandwidth: 95 GB
- Vercel Function Execution: 95 GB-hours

## Optimization Strategies

### Database Optimization
1. **Implement Data Retention Policies**
   - Archive events older than 1 year
   - Delete unverified accounts after 30 days
   - Clean up orphaned registrations

2. **Optimize Data Types**
   - Use appropriate column types (avoid TEXT where VARCHAR(n) suffices)
   - Compress JSONB data where possible
   - Use arrays efficiently

3. **Index Optimization**
   - Ensure all foreign keys are indexed
   - Add indexes for frequently queried columns
   - Remove unused indexes

### Bandwidth Optimization
1. **API Response Optimization**
   - Implement field selection (only return requested fields)
   - Use pagination on all list endpoints
   - Compress responses with gzip

2. **Caching Strategy**
   - Cache frequently accessed data (events list, sponsors)
   - Implement HTTP caching headers
   - Use Supabase edge caching

3. **Query Optimization**
   - Select only needed columns
   - Avoid N+1 queries
   - Use database views for complex queries

### Storage Optimization
1. **Image Optimization**
   - Compress images on upload
   - Generate thumbnails for avatars
   - Set maximum file sizes
   - Use WebP format where possible

2. **Cleanup Automation**
   - Implement storage cleanup on deletion
   - Schedule periodic orphaned file cleanup
   - Monitor and alert on storage growth

### Email Optimization
1. **Email Consolidation**
   - Batch notifications where appropriate
   - Implement digest emails for announcements
   - Use in-app notifications as alternative

2. **Email Preferences**
   - Allow users to opt-out of non-critical emails
   - Implement email frequency limits
   - Prioritize transactional emails

## Upgrade Considerations

If consistently approaching limits, consider upgrading:

### Supabase Pro ($25/month)
- 8 GB database
- 50 GB bandwidth
- 100 GB storage
- 500 concurrent realtime connections

### Resend Pro ($20/month)
- 50,000 emails per month
- Higher rate limits
- Better deliverability

### Vercel Pro ($20/month)
- 1 TB bandwidth
- 1,000 GB-hours function execution
- 24,000 build minutes

## Compliance Status

**Last Verified**: _______________  
**Verified By**: _______________

### Current Status
- [ ] ✅ All services within free tier limits
- [ ] ⚠️ Some services approaching limits (see notes)
- [ ] ❌ Some services over limits (immediate action required)

### Notes
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

### Action Items
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

## Resources

- [Supabase Pricing](https://supabase.com/pricing)
- [Resend Pricing](https://resend.com/pricing)
- [Vercel Pricing](https://vercel.com/pricing)
- [Supabase Usage Dashboard](https://app.supabase.com/project/_/settings/billing)
- [Resend Dashboard](https://resend.com/emails)
- [Vercel Analytics](https://vercel.com/dashboard/usage)
