# Supabase Database Migrations

This directory contains SQL migration files for the TechAssassin backend database schema.

## Migration Files

The migrations are numbered sequentially and should be applied in order:

1. **20260207000001_create_profiles_table.sql**
   - Creates the `profiles` table extending auth.users
   - Adds unique constraint on username
   - Creates index on username

2. **20260207000002_create_events_table.sql**
   - Creates the `events` table for hackathon events
   - Creates index on start_date

3. **20260207000003_create_registrations_table.sql**
   - Creates the `registrations` table for event registrations
   - Adds unique constraint on (user_id, event_id)
   - Creates indexes on event_id and user_id
   - Implements CASCADE DELETE for event_id

4. **20260207000004_create_announcements_table.sql**
   - Creates the `announcements` table for community updates
   - Creates index on created_at DESC

5. **20260207000005_create_resources_table.sql**
   - Creates the `resources` table for educational content
   - Creates index on category

6. **20260207000006_create_sponsors_table.sql**
   - Creates the `sponsors` table for event sponsors
   - Adds check constraint on tier (gold/silver/bronze)

7. **20260207000007_create_leaderboard_table.sql**
   - Creates the `leaderboard` table for event scoring
   - Creates composite index on (event_id, rank)

8. **20260207000008_create_profile_trigger.sql**
   - Creates PostgreSQL function `handle_new_user()`
   - Creates trigger `on_auth_user_created` for automatic profile creation
   - Sets default values: is_admin = false, skills = empty array

9. **20260207000009_create_rls_policies_profiles.sql**
   - Creates RLS policies for profiles table

10. **20260207000010_create_rls_policies_events.sql**
    - Creates RLS policies for events table

11. **20260207000011_create_rls_policies_registrations.sql**
    - Creates RLS policies for registrations table

12. **20260207000012_create_rls_policies_announcements.sql**
    - Creates RLS policies for announcements table

13. **20260207000013_create_rls_policies_resources.sql**
    - Creates RLS policies for resources table

14. **20260207000014_create_rls_policies_sponsors.sql**
    - Creates RLS policies for sponsors table

15. **20260207000015_create_rls_policies_leaderboard.sql**
    - Creates RLS policies for leaderboard table

16. **20260207000016_create_storage_buckets.sql**
    - Creates 'avatars' storage bucket (public, 2MB limit)
    - Creates 'event-images' storage bucket (public, 2MB limit)
    - Creates 'sponsor-logos' storage bucket (public, 2MB limit)
    - Configures allowed MIME types (jpeg, png, webp)

17. **20260207000017_create_storage_policies.sql**
    - Creates storage policies for avatars bucket (users can upload to their own folder)
    - Creates storage policies for event-images bucket (admins only)
    - Creates storage policies for sponsor-logos bucket (admins only)
    - Enables public read access for all buckets

### Additional migrations (forum, live rooms, realtime presence)

- **20260418000001_create_forum_tables.sql**: categories, threads, replies, tags, thread_tags, thread_reactions with indexes
- **20260418000002_create_channels_table.sql**: channels catalog and channel_members junction for live rooms
- **20260418000003_alter_presence_add_channel.sql**: ensure presence_tracking exists and add channel_id for room-scoped presence
- **20260418000004_forum_rls_policies.sql**: RLS policies for forum tables, channels, and presence_tracking
- **20260418000005_thread_view_count_trigger.sql**: thread_views log table and RPC-friendly view_count increment function

## Applying Migrations

### Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste each migration file in order
4. Execute each migration

### Manual Application

You can also apply these migrations manually by connecting to your PostgreSQL database and running each SQL file in order.

## Database Schema Overview

### Tables

- **profiles**: Extended user information (username, skills, admin status)
- **events**: Hackathon event details (dates, location, capacity)
- **registrations**: User event registrations (team name, project idea, status)
- **announcements**: Community announcements and updates
- **resources**: Educational resources and guides
- **sponsors**: Event sponsors and partners
- **leaderboard**: Event scoring and rankings

### Key Relationships

- `profiles.id` → `auth.users.id` (FK)
- `registrations.user_id` → `profiles.id` (FK, CASCADE DELETE)
- `registrations.event_id` → `events.id` (FK, CASCADE DELETE)
- `announcements.author_id` → `profiles.id` (FK, CASCADE DELETE)
- `leaderboard.event_id` → `events.id` (FK, CASCADE DELETE)
- `leaderboard.user_id` → `profiles.id` (FK, CASCADE DELETE)

### Constraints

- `profiles.username` UNIQUE
- `registrations(user_id, event_id)` UNIQUE
- `registrations.status` CHECK IN ('pending', 'confirmed', 'waitlisted')
- `sponsors.tier` CHECK IN ('gold', 'silver', 'bronze')
- `events.max_participants` CHECK > 0
- `leaderboard.score` CHECK >= 0
- `leaderboard.rank` CHECK >= 0

### Indexes

- `idx_profiles_username` on profiles(username)
- `idx_events_start_date` on events(start_date)
- `idx_registrations_event_id` on registrations(event_id)
- `idx_registrations_user_id` on registrations(user_id)
- `idx_announcements_created_at` on announcements(created_at DESC)
- `idx_resources_category` on resources(category)
- `idx_leaderboard_event_rank` on leaderboard(event_id, rank)

## Next Steps

After applying these migrations:

1. ~~Set up Row Level Security (RLS) policies (Task 3)~~ ✓ Complete
2. ~~Create Supabase Storage buckets (Task 4)~~ ✓ Complete
3. Implement TypeScript types and interfaces (Task 5)
4. Configure Supabase client (Task 6)

## Storage Buckets

The following storage buckets are configured:

- **avatars**: User profile avatars (2MB limit, public read)
  - Users can upload to `avatars/{user_id}/` folder
  - Allowed types: JPEG, PNG, WebP

- **event-images**: Event promotional images (2MB limit, public read)
  - Admins only can upload/update/delete
  - Allowed types: JPEG, PNG, WebP

- **sponsor-logos**: Sponsor company logos (2MB limit, public read)
  - Admins only can upload/update/delete
  - Allowed types: JPEG, PNG, WebP

## Notes

- All tables use UUID primary keys
- Timestamps use TIMESTAMPTZ for timezone awareness
- Arrays use PostgreSQL array types (TEXT[])
- JSON data uses JSONB for efficient querying
- Foreign keys implement CASCADE DELETE where appropriate
- The profile trigger automatically creates profiles for new auth users
