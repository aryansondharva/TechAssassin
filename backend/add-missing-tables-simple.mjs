/**
 * Add Missing Tables Simple
 * This script adds only the missing tables without RLS policies
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function addMissingTables() {
  try {
    console.log('=== ADDING MISSING TABLES ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Add missing tables
    console.log('Step 1: Adding missing tables...');
    
    const addTables = `
      -- Skill endorsements
      CREATE TABLE IF NOT EXISTS skill_endorsements (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_skill_id TEXT REFERENCES user_skills(id) ON DELETE CASCADE,
        endorser_clerk_user_id TEXT REFERENCES profiles(clerk_user_id),
        
        -- Endorsement details
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        relationship_type TEXT,
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(user_skill_id, endorser_clerk_user_id)
      );
      
      -- Event types
      CREATE TABLE IF NOT EXISTS event_types (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Events table
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        short_description TEXT,
        
        -- Event details
        event_type_id TEXT REFERENCES event_types(id),
        format TEXT CHECK (format IN ('online', 'offline', 'hybrid')),
        category TEXT,
        
        -- Schedule
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        timezone TEXT DEFAULT 'UTC',
        duration_minutes INTEGER,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurring_pattern JSONB,
        
        -- Location
        venue_name TEXT,
        venue_address TEXT,
        venue_city TEXT,
        venue_country TEXT,
        venue_capacity INTEGER,
        online_meeting_url TEXT,
        online_meeting_id TEXT,
        
        -- Registration
        registration_open TIMESTAMPTZ,
        registration_close TIMESTAMPTZ,
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        waitlist_enabled BOOLEAN DEFAULT FALSE,
        waitlist_count INTEGER DEFAULT 0,
        
        -- Pricing
        is_free BOOLEAN DEFAULT TRUE,
        price DECIMAL(10,2),
        currency TEXT DEFAULT 'USD',
        early_bird_price DECIMAL(10,2),
        early_bird_deadline TIMESTAMPTZ,
        
        -- Content and materials
        agenda JSONB DEFAULT '[]',
        speakers JSONB DEFAULT '[]',
        sponsors JSONB DEFAULT '[]',
        materials TEXT[],
        recordings TEXT[],
        
        -- Event management
        status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'completed')) DEFAULT 'draft',
        is_featured BOOLEAN DEFAULT FALSE,
        requires_approval BOOLEAN DEFAULT FALSE,
        
        -- Creator and organizers
        created_by_clerk_user_id TEXT REFERENCES profiles(clerk_user_id),
        organizers JSONB DEFAULT '[]',
        volunteers JSONB DEFAULT '[]',
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        published_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        
        banner_url TEXT,
        thumbnail_url TEXT,
        metadata JSONB DEFAULT '{}'
      );
      
      -- Event registrations
      CREATE TABLE IF NOT EXISTS event_registrations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
        clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        
        -- Registration details
        registration_type TEXT DEFAULT 'attendee',
        status TEXT CHECK (status IN ('pending', 'confirmed', 'waitlisted', 'cancelled', 'attended', 'no_show')) DEFAULT 'pending',
        
        -- Registration data
        registration_data JSONB DEFAULT '{}',
        special_requirements TEXT,
        dietary_restrictions TEXT,
        tshirt_size TEXT,
        
        -- Payment information
        payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')) DEFAULT 'pending',
        payment_amount DECIMAL(10,2),
        payment_method TEXT,
        transaction_id TEXT,
        
        -- Attendance
        checked_in_at TIMESTAMPTZ,
        checked_out_at TIMESTAMPTZ,
        attended BOOLEAN DEFAULT FALSE,
        
        -- Feedback and ratings
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        
        -- Metadata
        registered_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(event_id, clerk_user_id)
      );
      
      -- Posts and discussions
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        author_clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        
        -- Content
        title TEXT,
        content TEXT NOT NULL,
        content_type TEXT CHECK (content_type IN ('text', 'markdown', 'html', 'image', 'video')) DEFAULT 'text',
        
        -- Categorization
        category TEXT,
        tags TEXT[],
        
        -- Engagement metrics
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        shares_count INTEGER DEFAULT 0,
        views_count INTEGER DEFAULT 0,
        
        -- Status and visibility
        status TEXT CHECK (status IN ('draft', 'published', 'archived', 'deleted')) DEFAULT 'published',
        is_pinned BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        allow_comments BOOLEAN DEFAULT TRUE,
        
        -- Media attachments
        attachments JSONB DEFAULT '[]',
        thumbnail_url TEXT,
        
        -- Moderation
        is_flagged BOOLEAN DEFAULT FALSE,
        flag_reason TEXT,
        moderated_by_clerk_user_id TEXT REFERENCES profiles(clerk_user_id),
        moderated_at TIMESTAMPTZ,
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        published_at TIMESTAMPTZ,
        
        metadata JSONB DEFAULT '{}'
      );
      
      -- Comments
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
        parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
        author_clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        
        -- Content
        content TEXT NOT NULL,
        content_type TEXT CHECK (content_type IN ('text', 'markdown', 'html')) DEFAULT 'text',
        
        -- Engagement
        likes_count INTEGER DEFAULT 0,
        replies_count INTEGER DEFAULT 0,
        
        -- Status
        status TEXT CHECK (status IN ('published', 'hidden', 'deleted')) DEFAULT 'published',
        is_edited BOOLEAN DEFAULT FALSE,
        
        -- Moderation
        is_flagged BOOLEAN DEFAULT FALSE,
        flag_reason TEXT,
        moderated_by_clerk_user_id TEXT REFERENCES profiles(clerk_user_id),
        moderated_at TIMESTAMPTZ,
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        metadata JSONB DEFAULT '{}'
      );
      
      -- Likes and reactions
      CREATE TABLE IF NOT EXISTS reactions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        target_type TEXT CHECK (target_type IN ('post', 'comment')) NOT NULL,
        target_id TEXT NOT NULL,
        user_clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        reaction_type TEXT CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')) DEFAULT 'like',
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(target_type, target_id, user_clerk_user_id)
      );
      
      -- Follows and connections
      CREATE TABLE IF NOT EXISTS follows (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        following_clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        
        -- Follow details
        follow_type TEXT CHECK (follow_type IN ('follow', 'mentor', 'mentee', 'connection')) DEFAULT 'follow',
        status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')) DEFAULT 'accepted',
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(follower_clerk_user_id, following_clerk_user_id)
      );
      
      -- Messages (direct messaging)
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id TEXT NOT NULL,
        sender_clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        recipient_clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        
        -- Content
        content TEXT NOT NULL,
        content_type TEXT CHECK (content_type IN ('text', 'image', 'file', 'audio', 'video')) DEFAULT 'text',
        
        -- Status
        is_read BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        
        -- Attachments
        attachments JSONB DEFAULT '[]',
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        metadata JSONB DEFAULT '{}'
      );
      
      -- Conversations
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Participants
        participant_1_clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        participant_2_clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        
        -- Conversation details
        last_message_id TEXT REFERENCES messages(id),
        last_message_at TIMESTAMPTZ,
        
        -- Status
        is_active BOOLEAN DEFAULT TRUE,
        is_archived BOOLEAN DEFAULT FALSE,
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(participant_1_clerk_user_id, participant_2_clerk_user_id)
      );
      
      -- Achievement types
      CREATE TABLE IF NOT EXISTS achievement_types (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        category TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Achievements
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        achievement_type_id TEXT REFERENCES achievement_types(id),
        title TEXT NOT NULL,
        description TEXT,
        
        -- Achievement details
        badge_icon TEXT,
        badge_color TEXT,
        rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) DEFAULT 'common',
        
        -- Requirements
        requirements JSONB DEFAULT '{}',
        conditions JSONB DEFAULT '{}',
        metric_type TEXT,
        metric_target INTEGER,
        
        -- Rewards
        xp_reward INTEGER DEFAULT 0,
        title_reward TEXT,
        badge_reward TEXT,
        
        -- Status
        is_active BOOLEAN DEFAULT TRUE,
        is_hidden BOOLEAN DEFAULT FALSE,
        is_repeatable BOOLEAN DEFAULT FALSE,
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        metadata JSONB DEFAULT '{}'
      );
      
      -- User achievements
      CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
        
        -- Progress
        progress_percentage INTEGER DEFAULT 0,
        current_value INTEGER DEFAULT 0,
        
        -- Status
        is_unlocked BOOLEAN DEFAULT FALSE,
        unlocked_at TIMESTAMPTZ,
        
        -- Rewards claimed
        xp_claimed BOOLEAN DEFAULT FALSE,
        badge_claimed BOOLEAN DEFAULT FALSE,
        title_claimed BOOLEAN DEFAULT FALSE,
        
        -- Metadata
        earned_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(clerk_user_id, achievement_id)
      );
      
      -- Leaderboard
      CREATE TABLE IF NOT EXISTS leaderboard (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        
        -- Leaderboard data
        score INTEGER DEFAULT 0,
        rank INTEGER,
        previous_rank INTEGER,
        
        -- Category and period
        category TEXT DEFAULT 'overall',
        period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')) DEFAULT 'all_time',
        period_start DATE,
        period_end DATE,
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(clerk_user_id, category, period_type, period_start)
      );
      
      -- XP transactions
      CREATE TABLE IF NOT EXISTS xp_transactions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        
        -- Transaction details
        amount INTEGER NOT NULL,
        transaction_type TEXT CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'penalty', 'refund')) DEFAULT 'earned',
        source_type TEXT CHECK (source_type IN ('mission', 'achievement', 'login', 'referral', 'event', 'admin')) NOT NULL,
        source_id TEXT,
        
        -- Description
        description TEXT,
        reason TEXT,
        
        -- Status
        status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'completed',
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        processed_at TIMESTAMPTZ,
        
        metadata JSONB DEFAULT '{}'
      );
    `;
    
    await client.query(addTables);
    console.log('Added missing tables');

    // Step 2: Add indexes
    console.log('\nStep 2: Adding performance indexes...');
    
    const addIndexes = `
      -- Skill endorsements indexes
      CREATE INDEX IF NOT EXISTS idx_skill_endorsements_user_skill_id ON skill_endorsements(user_skill_id);
      CREATE INDEX IF NOT EXISTS idx_skill_endorsements_endorser_clerk_user_id ON skill_endorsements(endorser_clerk_user_id);
      
      -- Events indexes
      CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
      CREATE INDEX IF NOT EXISTS idx_events_event_type_id ON events(event_type_id);
      CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
      CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
      
      -- Event registrations indexes
      CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
      CREATE INDEX IF NOT EXISTS idx_event_registrations_clerk_user_id ON event_registrations(clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);
      
      -- Posts indexes
      CREATE INDEX IF NOT EXISTS idx_posts_author_clerk_user_id ON posts(author_clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured);
      
      -- Comments indexes
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_comments_author_clerk_user_id ON comments(author_clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
      
      -- Reactions indexes
      CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);
      CREATE INDEX IF NOT EXISTS idx_reactions_user_clerk_user_id ON reactions(user_clerk_user_id);
      
      -- Follows indexes
      CREATE INDEX IF NOT EXISTS idx_follows_follower_clerk_user_id ON follows(follower_clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_follows_following_clerk_user_id ON follows(following_clerk_user_id);
      
      -- Messages indexes
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_clerk_user_id ON messages(sender_clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_recipient_clerk_user_id ON messages(recipient_clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
      
      -- Conversations indexes
      CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
      
      -- Achievements indexes
      CREATE INDEX IF NOT EXISTS idx_achievements_achievement_type_id ON achievements(achievement_type_id);
      CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);
      
      -- User achievements indexes
      CREATE INDEX IF NOT EXISTS idx_user_achievements_clerk_user_id ON user_achievements(clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
      CREATE INDEX IF NOT EXISTS idx_user_achievements_is_unlocked ON user_achievements(is_unlocked);
      
      -- Leaderboard indexes
      CREATE INDEX IF NOT EXISTS idx_leaderboard_clerk_user_id ON leaderboard(clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_category ON leaderboard(category);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);
      
      -- XP transactions indexes
      CREATE INDEX IF NOT EXISTS idx_xp_transactions_clerk_user_id ON xp_transactions(clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_xp_transactions_transaction_type ON xp_transactions(transaction_type);
    `;
    
    await client.query(addIndexes);
    console.log('Added performance indexes');

    // Step 3: Insert initial data
    console.log('\nStep 3: Inserting initial data...');
    
    const insertData = `
      -- Insert event types
      INSERT INTO event_types (name, description, icon, color) VALUES
      ('Workshop', 'Hands-on learning workshops', 'wrench', '#3B82F6'),
      ('Webinar', 'Online presentations and talks', 'monitor', '#8B5CF6'),
      ('Meetup', 'Local community meetups', 'users', '#10B981'),
      ('Hackathon', 'Coding competitions and challenges', 'code', '#F59E0B'),
      ('Conference', 'Large-scale conferences', 'microphone', '#EF4444'),
      ('Networking', 'Professional networking events', 'network', '#6366F1')
      ON CONFLICT (name) DO NOTHING;
      
      -- Insert achievement types
      INSERT INTO achievement_types (name, description, icon, color, category) VALUES
      ('Milestone', 'Important milestones and achievements', 'star', '#F59E0B', 'progress'),
      ('Skill', 'Skill-related achievements', 'award', '#3B82F6', 'skills'),
      ('Community', 'Community participation achievements', 'users', '#10B981', 'social'),
      ('Learning', 'Learning and educational achievements', 'book', '#8B5CF6', 'education'),
      ('Leadership', 'Leadership and mentorship achievements', 'crown', '#EF4444', 'leadership')
      ON CONFLICT (name) DO NOTHING;
      
      -- Insert notification types
      INSERT INTO notification_types (name, description, icon, color, template_title, template_message, is_system) VALUES
      ('mission_completed', 'Mission completed notification', 'check', '#10B981', 'Mission Completed!', 'You have successfully completed the mission: {{mission_title}}', true),
      ('achievement_unlocked', 'Achievement unlocked notification', 'award', '#F59E0B', 'Achievement Unlocked!', 'You have unlocked the achievement: {{achievement_title}}', true),
      ('level_up', 'Level up notification', 'arrow-up', '#8B5CF6', 'Level Up!', 'You have reached level {{level}}!', true),
      ('new_follower', 'New follower notification', 'user-plus', '#3B82F6', 'New Follower', '{{follower_name}} started following you', false),
      ('message_received', 'New message notification', 'message', '#6366F1', 'New Message', 'You received a new message from {{sender_name}}', false),
      ('event_reminder', 'Event reminder notification', 'calendar', '#EF4444', 'Event Reminder', 'Event "{{event_title}}" starts in {{time_until}}', true)
      ON CONFLICT (name) DO NOTHING;
    `;
    
    await client.query(insertData);
    console.log('Inserted initial data');

    await client.end();

    console.log('\n=== MISSING TABLES ADDED SUCCESSFULLY ===');
    console.log('\nNew Tables Added:');
    console.log('1. skill_endorsements - For skill endorsements');
    console.log('2. event_types - Event type categories');
    console.log('3. events - Event management');
    console.log('4. event_registrations - Event registrations');
    console.log('5. posts - Community posts and discussions');
    console.log('6. comments - Post comments');
    console.log('7. reactions - Post and comment reactions');
    console.log('8. follows - User follows and connections');
    console.log('9. messages - Direct messaging');
    console.log('10. conversations - Message conversations');
    console.log('11. achievement_types - Achievement categories');
    console.log('12. achievements - Achievements and badges');
    console.log('13. user_achievements - User achievement progress');
    console.log('14. leaderboard - Leaderboard rankings');
    console.log('15. xp_transactions - XP transaction history');

    console.log('\nTotal Schema Now Includes:');
    console.log('- 23 tables with comprehensive features');
    console.log('- Full relationships and foreign keys');
    console.log('- Performance indexes');
    console.log('- Initial data for categories and types');

    console.log('\nSchema Features:');
    console.log('✅ Complete user profiles');
    console.log('✅ Mission and skill tracking');
    console.log('✅ Event management and registration');
    console.log('✅ Community social features');
    console.log('✅ Notifications and messaging');
    console.log('✅ Gamification and achievements');
    console.log('✅ XP system and leaderboard');

    console.log('\nYour TechAssassin platform now has a complete schema!');

  } catch (error) {
    console.error('Failed to add missing tables:', error.message);
    process.exit(1);
  }
}

addMissingTables();
