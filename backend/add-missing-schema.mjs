/**
 * Add Missing Schema Components to Supabase
 * This script adds only the missing tables and features to complete the TechAssassin schema
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables!');
  process.exit(1);
}

async function addMissingSchema() {
  try {
    console.log('=== ADDING MISSING SCHEMA COMPONENTS ===\n');

    // Import pg dynamically
    const { Client } = await import('pg');
    
    // Create client with DATABASE_URL
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Step 1: Add missing mission categories
    console.log('Step 1: Adding mission categories...');
    
    const addMissionCategories = `
      CREATE TABLE IF NOT EXISTS mission_categories (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    await client.query(addMissionCategories);
    console.log('Added mission categories table');

    // Step 2: Add skill categories
    console.log('\nStep 2: Adding skill categories...');
    
    const addSkillCategories = `
      CREATE TABLE IF NOT EXISTS skill_categories (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        parent_category_id TEXT REFERENCES skill_categories(id),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    await client.query(addSkillCategories);
    console.log('Added skill categories table');

    // Step 3: Add events system
    console.log('\nStep 3: Adding events system...');
    
    const addEventsSystem = `
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
    `;
    
    await client.query(addEventsSystem);
    console.log('Added events system');

    // Step 4: Add community features
    console.log('\nStep 4: Adding community features...');
    
    const addCommunityFeatures = `
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
    `;
    
    await client.query(addCommunityFeatures);
    console.log('Added community features');

    // Step 5: Add notifications and messaging
    console.log('\nStep 5: Adding notifications and messaging...');
    
    const addNotificationsAndMessaging = `
      -- Notification types
      CREATE TABLE IF NOT EXISTS notification_types (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        template_title TEXT,
        template_message TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Notifications
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
        sender_clerk_user_id TEXT REFERENCES profiles(clerk_user_id),
        
        -- Content
        title TEXT NOT NULL,
        message TEXT,
        notification_type_id TEXT REFERENCES notification_types(id),
        
        -- Channels
        in_app BOOLEAN DEFAULT TRUE,
        email BOOLEAN DEFAULT FALSE,
        push BOOLEAN DEFAULT FALSE,
        sms BOOLEAN DEFAULT FALSE,
        
        -- Status
        is_read BOOLEAN DEFAULT FALSE,
        is_sent BOOLEAN DEFAULT FALSE,
        is_delivered BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        
        -- Priority and scheduling
        priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
        scheduled_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        
        -- Action buttons
        action_url TEXT,
        action_text TEXT,
        action_data JSONB DEFAULT '{}',
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        metadata JSONB DEFAULT '{}'
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
    `;
    
    await client.query(addNotificationsAndMessaging);
    console.log('Added notifications and messaging');

    // Step 6: Add gamification system
    console.log('\nStep 6: Adding gamification system...');
    
    const addGamificationSystem = `
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
    
    await client.query(addGamificationSystem);
    console.log('Added gamification system');

    // Step 7: Add indexes for performance
    console.log('\nStep 7: Adding performance indexes...');
    
    const addIndexes = `
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
      
      -- Notifications indexes
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient_clerk_user_id ON notifications(recipient_clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      
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

    // Step 8: Enable RLS and create policies
    console.log('\nStep 8: Enabling RLS and creating policies...');
    
    const enableRLSAndPolicies = `
      -- Enable RLS on new tables
      ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
      
      -- Event registrations policies
      CREATE POLICY IF NOT EXISTS "Users can manage their own registrations" ON event_registrations
      FOR ALL
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Posts policies
      CREATE POLICY IF NOT EXISTS "Users can manage their own posts" ON posts
      FOR ALL
      USING (author_clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY IF NOT EXISTS "Public read access to published posts" ON posts
      FOR SELECT
      USING (status = 'published');
      
      -- Comments policies
      CREATE POLICY IF NOT EXISTS "Users can manage their own comments" ON comments
      FOR ALL
      USING (author_clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY IF NOT EXISTS "Public read access to published comments" ON comments
      FOR SELECT
      USING (status = 'published');
      
      -- Reactions policies
      CREATE POLICY IF NOT EXISTS "Users can manage their own reactions" ON reactions
      FOR ALL
      USING (user_clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY IF NOT EXISTS "Public read access to reactions" ON reactions
      FOR SELECT
      USING (true);
      
      -- Follows policies
      CREATE POLICY IF NOT EXISTS "Users can manage their own follows" ON follows
      FOR ALL
      USING (follower_clerk_user_id = current_setting('app.current_clerk_user_id', true) OR 
             following_clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Notifications policies
      CREATE POLICY IF NOT EXISTS "Users can manage their own notifications" ON notifications
      FOR ALL
      USING (recipient_clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Messages policies
      CREATE POLICY IF NOT EXISTS "Users can manage their own messages" ON messages
      FOR ALL
      USING (sender_clerk_user_id = current_setting('app.current_clerk_user_id', true) OR 
             recipient_clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- Conversations policies
      CREATE POLICY IF NOT EXISTS "Users can manage their own conversations" ON conversations
      FOR ALL
      USING (participant_1_clerk_user_id = current_setting('app.current_clerk_user_id', true) OR 
             participant_2_clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- User achievements policies
      CREATE POLICY IF NOT EXISTS "Users can manage their own achievements" ON user_achievements
      FOR ALL
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      -- XP transactions policies
      CREATE POLICY IF NOT EXISTS "Users can view their own transactions" ON xp_transactions
      FOR SELECT
      USING (clerk_user_id = current_setting('app.current_clerk_user_id', true));
      
      CREATE POLICY IF NOT EXISTS "Users can insert their own transactions" ON xp_transactions
      FOR INSERT
      WITH CHECK (clerk_user_id = current_setting('app.current_clerk_user_id', true));
    `;
    
    await client.query(enableRLSAndPolicies);
    console.log('Enabled RLS and created policies');

    // Step 9: Insert initial data
    console.log('\nStep 9: Inserting initial data...');
    
    const insertInitialData = `
      -- Insert mission categories
      INSERT INTO mission_categories (name, description, icon, color, sort_order) VALUES
      ('Development', 'Software development missions', 'code', '#3B82F6', 1),
      ('Design', 'UI/UX and graphic design missions', 'palette', '#8B5CF6', 2),
      ('Marketing', 'Marketing and content missions', 'megaphone', '#10B981', 3),
      ('Community', 'Community building missions', 'users', '#F59E0B', 4),
      ('Learning', 'Educational and training missions', 'book', '#EF4444', 5),
      ('Innovation', 'Innovation and research missions', 'lightbulb', '#6366F1', 6)
      ON CONFLICT (name) DO NOTHING;
      
      -- Insert skill categories
      INSERT INTO skill_categories (name, description, icon, color, sort_order) VALUES
      ('Programming Languages', 'Programming and coding languages', 'code', '#3B82F6', 1),
      ('Frameworks', 'Software frameworks and libraries', 'layers', '#8B5CF6', 2),
      ('Tools', 'Development and productivity tools', 'tool', '#10B981', 3),
      ('Soft Skills', 'Communication and interpersonal skills', 'heart', '#F59E0B', 4),
      ('Design', 'Design and creative skills', 'palette', '#EF4444', 5),
      ('Business', 'Business and management skills', 'briefcase', '#6366F1', 6)
      ON CONFLICT (name) DO NOTHING;
      
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
    
    await client.query(insertInitialData);
    console.log('Inserted initial data');

    await client.end();

    console.log('\n=== MISSING SCHEMA COMPONENTS ADDED ===');
    console.log('\nAdded Components:');
    console.log('1. Mission categories - For organizing missions');
    console.log('2. Skill categories - For organizing skills');
    console.log('3. Events system - Complete event management');
    console.log('4. Community features - Posts, comments, reactions, follows');
    console.log('5. Notifications and messaging - Multi-channel notifications');
    console.log('6. Gamification system - Achievements, leaderboard, XP tracking');
    console.log('7. Performance indexes - For optimal query performance');
    console.log('8. RLS policies - Security with Clerk integration');
    console.log('9. Initial data - Categories, types, and templates');

    console.log('\nNew Tables Added:');
    console.log('- mission_categories');
    console.log('- skill_categories');
    console.log('- event_types, events, event_registrations');
    console.log('- posts, comments, reactions, follows');
    console.log('- notification_types, notifications, messages, conversations');
    console.log('- achievement_types, achievements, user_achievements');
    console.log('- leaderboard, xp_transactions');

    console.log('\nTotal Schema Now Includes:');
    console.log('- 8 core tables (profiles, missions, skills, events, posts, notifications, achievements, leaderboard)');
    console.log('- 12 junction tables (user_missions, user_skills, event_registrations, etc.)');
    console.log('- 6 lookup tables (categories, types, etc.)');
    console.log('- Complete: 26 tables with full relationships');

    console.log('\nFeatures Enabled:');
    console.log('Clerk authentication with RLS');
    console.log('Comprehensive user profiles');
    console.log('Mission and skill tracking');
    console.log('Event management and registration');
    console.log('Community social features');
    console.log('Notifications and messaging');
    console.log('Gamification and achievements');
    console.log('Performance optimization');

    console.log('\nNext Steps:');
    console.log('1. Update backend API to use new tables');
    console.log('2. Update frontend to use new features');
    console.log('3. Test all new functionality');
    console.log('4. Verify RLS policies work correctly');

    console.log('\nYour TechAssassin platform now has a complete, connected schema!');

  } catch (error) {
    console.error('Failed to add missing schema components:', error.message);
    process.exit(1);
  }
}

addMissingSchema();
