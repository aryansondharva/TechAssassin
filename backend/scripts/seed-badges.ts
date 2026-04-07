/**
 * Seed Script: Badge Definitions
 * 
 * Seeds initial badge definitions across all categories (coding, community,
 * events, streaks, mentorship, special) and rarity levels (common, rare,
 * epic, legendary) with unlock criteria.
 * 
 * Requirements: 3.1, 3.2, 3.3
 * 
 * Usage:
 *   npx tsx backend/scripts/seed-badges.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface Badge {
  name: string;
  description: string;
  category: 'coding' | 'community' | 'events' | 'streaks' | 'mentorship' | 'special';
  rarity_level: 'common' | 'rare' | 'epic' | 'legendary';
  unlock_criteria: {
    type: 'xp_threshold' | 'event_count' | 'streak' | 'composite';
    conditions: Array<{
      field: string;
      operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
      value: number | string;
    }>;
  };
  icon_url: string;
}

const badges: Badge[] = [
  // CODING BADGES
  {
    name: 'First Commit',
    description: 'Made your first code contribution to the community',
    category: 'coding',
    rarity_level: 'common',
    unlock_criteria: {
      type: 'xp_threshold',
      conditions: [
        { field: 'code_contribution_count', operator: 'gte', value: 1 }
      ]
    },
    icon_url: '/badges/first-commit.svg'
  },
  {
    name: 'Code Warrior',
    description: 'Contributed 10 code submissions',
    category: 'coding',
    rarity_level: 'rare',
    unlock_criteria: {
      type: 'xp_threshold',
      conditions: [
        { field: 'code_contribution_count', operator: 'gte', value: 10 }
      ]
    },
    icon_url: '/badges/code-warrior.svg'
  },
  {
    name: 'Master Coder',
    description: 'Achieved 5000 XP from code contributions',
    category: 'coding',
    rarity_level: 'epic',
    unlock_criteria: {
      type: 'composite',
      conditions: [
        { field: 'total_xp', operator: 'gte', value: 5000 },
        { field: 'code_contribution_count', operator: 'gte', value: 25 }
      ]
    },
    icon_url: '/badges/master-coder.svg'
  },
  {
    name: 'Legendary Developer',
    description: 'Elite coder with 50+ contributions and 10000 XP',
    category: 'coding',
    rarity_level: 'legendary',
    unlock_criteria: {
      type: 'composite',
      conditions: [
        { field: 'total_xp', operator: 'gte', value: 10000 },
        { field: 'code_contribution_count', operator: 'gte', value: 50 }
      ]
    },
    icon_url: '/badges/legendary-developer.svg'
  },

  // COMMUNITY BADGES
  {
    name: 'Community Member',
    description: 'Joined the Tech Assassin community',
    category: 'community',
    rarity_level: 'common',
    unlock_criteria: {
      type: 'xp_threshold',
      conditions: [
        { field: 'total_xp', operator: 'gte', value: 1 }
      ]
    },
    icon_url: '/badges/community-member.svg'
  },
  {
    name: 'Helpful Hand',
    description: 'Helped 5 community members',
    category: 'community',
    rarity_level: 'rare',
    unlock_criteria: {
      type: 'xp_threshold',
      conditions: [
        { field: 'helping_others_count', operator: 'gte', value: 5 }
      ]
    },
    icon_url: '/badges/helpful-hand.svg'
  },
  {
    name: 'Community Champion',
    description: 'Earned 3000 XP from community engagement',
    category: 'community',
    rarity_level: 'epic',
    unlock_criteria: {
      type: 'composite',
      conditions: [
        { field: 'total_xp', operator: 'gte', value: 3000 },
        { field: 'community_engagement_count', operator: 'gte', value: 50 }
      ]
    },
    icon_url: '/badges/community-champion.svg'
  },
  {
    name: 'Community Legend',
    description: 'Pillar of the community with 100+ engagements',
    category: 'community',
    rarity_level: 'legendary',
    unlock_criteria: {
      type: 'composite',
      conditions: [
        { field: 'community_engagement_count', operator: 'gte', value: 100 },
        { field: 'helping_others_count', operator: 'gte', value: 25 }
      ]
    },
    icon_url: '/badges/community-legend.svg'
  },

  // EVENTS BADGES
  {
    name: 'Event Attendee',
    description: 'Attended your first Tech Assassin event',
    category: 'events',
    rarity_level: 'common',
    unlock_criteria: {
      type: 'event_count',
      conditions: [
        { field: 'event_count', operator: 'gte', value: 1 }
      ]
    },
    icon_url: '/badges/event-attendee.svg'
  },
  {
    name: 'Event Enthusiast',
    description: 'Participated in 5 events',
    category: 'events',
    rarity_level: 'rare',
    unlock_criteria: {
      type: 'event_count',
      conditions: [
        { field: 'event_count', operator: 'gte', value: 5 }
      ]
    },
    icon_url: '/badges/event-enthusiast.svg'
  },
  {
    name: 'Event Master',
    description: 'Completed 15 events',
    category: 'events',
    rarity_level: 'epic',
    unlock_criteria: {
      type: 'event_count',
      conditions: [
        { field: 'event_count', operator: 'gte', value: 15 }
      ]
    },
    icon_url: '/badges/event-master.svg'
  },
  {
    name: 'Event Legend',
    description: 'Participated in 30+ events and won placements',
    category: 'events',
    rarity_level: 'legendary',
    unlock_criteria: {
      type: 'composite',
      conditions: [
        { field: 'event_count', operator: 'gte', value: 30 },
        { field: 'total_xp', operator: 'gte', value: 8000 }
      ]
    },
    icon_url: '/badges/event-legend.svg'
  },

  // STREAKS BADGES
  {
    name: 'Getting Started',
    description: 'Maintained a 3-day activity streak',
    category: 'streaks',
    rarity_level: 'common',
    unlock_criteria: {
      type: 'streak',
      conditions: [
        { field: 'current_streak', operator: 'gte', value: 3 }
      ]
    },
    icon_url: '/badges/getting-started.svg'
  },
  {
    name: 'Week Warrior',
    description: 'Maintained a 7-day activity streak',
    category: 'streaks',
    rarity_level: 'rare',
    unlock_criteria: {
      type: 'streak',
      conditions: [
        { field: 'current_streak', operator: 'gte', value: 7 }
      ]
    },
    icon_url: '/badges/week-warrior.svg'
  },
  {
    name: 'Consistency King',
    description: 'Maintained a 30-day activity streak',
    category: 'streaks',
    rarity_level: 'epic',
    unlock_criteria: {
      type: 'streak',
      conditions: [
        { field: 'current_streak', operator: 'gte', value: 30 }
      ]
    },
    icon_url: '/badges/consistency-king.svg'
  },
  {
    name: 'Unstoppable Force',
    description: 'Maintained a 100-day activity streak',
    category: 'streaks',
    rarity_level: 'legendary',
    unlock_criteria: {
      type: 'streak',
      conditions: [
        { field: 'longest_streak', operator: 'gte', value: 100 }
      ]
    },
    icon_url: '/badges/unstoppable-force.svg'
  },

  // MENTORSHIP BADGES
  {
    name: 'First Mentor',
    description: 'Helped your first community member',
    category: 'mentorship',
    rarity_level: 'common',
    unlock_criteria: {
      type: 'xp_threshold',
      conditions: [
        { field: 'helping_others_count', operator: 'gte', value: 1 }
      ]
    },
    icon_url: '/badges/first-mentor.svg'
  },
  {
    name: 'Guiding Light',
    description: 'Mentored 10 community members',
    category: 'mentorship',
    rarity_level: 'rare',
    unlock_criteria: {
      type: 'xp_threshold',
      conditions: [
        { field: 'helping_others_count', operator: 'gte', value: 10 }
      ]
    },
    icon_url: '/badges/guiding-light.svg'
  },
  {
    name: 'Master Mentor',
    description: 'Provided 25+ mentorship sessions',
    category: 'mentorship',
    rarity_level: 'epic',
    unlock_criteria: {
      type: 'xp_threshold',
      conditions: [
        { field: 'helping_others_count', operator: 'gte', value: 25 }
      ]
    },
    icon_url: '/badges/master-mentor.svg'
  },
  {
    name: 'Legendary Mentor',
    description: 'Mentored 50+ members and earned 5000 XP from helping',
    category: 'mentorship',
    rarity_level: 'legendary',
    unlock_criteria: {
      type: 'composite',
      conditions: [
        { field: 'helping_others_count', operator: 'gte', value: 50 },
        { field: 'total_xp', operator: 'gte', value: 5000 }
      ]
    },
    icon_url: '/badges/legendary-mentor.svg'
  },

  // SPECIAL BADGES
  {
    name: 'Early Adopter',
    description: 'Joined during the beta phase',
    category: 'special',
    rarity_level: 'rare',
    unlock_criteria: {
      type: 'xp_threshold',
      conditions: [
        { field: 'total_xp', operator: 'gte', value: 1 }
      ]
    },
    icon_url: '/badges/early-adopter.svg'
  },
  {
    name: 'Profile Perfectionist',
    description: 'Completed 100% of your profile',
    category: 'special',
    rarity_level: 'rare',
    unlock_criteria: {
      type: 'xp_threshold',
      conditions: [
        { field: 'profile_completion_percentage', operator: 'eq', value: 100 }
      ]
    },
    icon_url: '/badges/profile-perfectionist.svg'
  },
  {
    name: 'XP Millionaire',
    description: 'Earned 10,000 total XP',
    category: 'special',
    rarity_level: 'epic',
    unlock_criteria: {
      type: 'xp_threshold',
      conditions: [
        { field: 'total_xp', operator: 'gte', value: 10000 }
      ]
    },
    icon_url: '/badges/xp-millionaire.svg'
  },
  {
    name: 'Tech Assassin Elite',
    description: 'Achieved legendary status across all categories',
    category: 'special',
    rarity_level: 'legendary',
    unlock_criteria: {
      type: 'composite',
      conditions: [
        { field: 'total_xp', operator: 'gte', value: 25000 },
        { field: 'badge_count', operator: 'gte', value: 15 },
        { field: 'event_count', operator: 'gte', value: 20 }
      ]
    },
    icon_url: '/badges/tech-assassin-elite.svg'
  }
];

async function seedBadges(): Promise<void> {
  console.log('🌱 Starting badge definitions seed...\n');

  try {
    // Check if any badges already exist
    const { data: existing, error: checkError } = await supabase
      .from('badges')
      .select('name');

    if (checkError) {
      throw new Error(`Failed to check existing badges: ${checkError.message}`);
    }

    if (existing && existing.length > 0) {
      console.log('⚠️  Badges already exist. Updating existing definitions...\n');
      
      // Update existing badges
      for (const badge of badges) {
        const { error: upsertError } = await supabase
          .from('badges')
          .upsert({
            ...badge,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'name'
          });

        if (upsertError) {
          console.error(`❌ Failed to update ${badge.name}:`, upsertError.message);
        } else {
          console.log(`✅ Updated: ${badge.name} (${badge.rarity_level})`);
        }
      }
    } else {
      // Insert new badges
      const { error: insertError } = await supabase
        .from('badges')
        .insert(badges);

      if (insertError) {
        throw new Error(`Failed to insert badges: ${insertError.message}`);
      }

      console.log('✅ Successfully seeded all badge definitions\n');
    }

    // Verify the seed and show statistics
    const { data: seeded, error: verifyError } = await supabase
      .from('badges')
      .select('category, rarity_level')
      .order('category');

    if (verifyError) {
      throw new Error(`Failed to verify seeded data: ${verifyError.message}`);
    }

    // Calculate statistics
    const stats = {
      total: seeded?.length || 0,
      byCategory: {} as Record<string, number>,
      byRarity: {} as Record<string, number>
    };

    seeded?.forEach(badge => {
      stats.byCategory[badge.category] = (stats.byCategory[badge.category] || 0) + 1;
      stats.byRarity[badge.rarity_level] = (stats.byRarity[badge.rarity_level] || 0) + 1;
    });

    console.log('\n📊 Badge Statistics:');
    console.log(`   Total badges: ${stats.total}`);
    console.log('\n   By Category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`     • ${category}: ${count}`);
    });
    console.log('\n   By Rarity:');
    Object.entries(stats.byRarity).forEach(([rarity, count]) => {
      console.log(`     • ${rarity}: ${count}`);
    });

    console.log('\n🎉 Badge definitions seed completed successfully!');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedBadges();
