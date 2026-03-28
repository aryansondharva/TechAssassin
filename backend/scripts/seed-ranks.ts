/**
 * Seed Script: Rank Tiers
 * 
 * Seeds initial rank tiers with ascending XP thresholds, rank names,
 * and rank-specific perks for the Assassin Rank progression system.
 * 
 * Requirements: 6.1, 15.5
 * 
 * Usage:
 *   npx tsx backend/scripts/seed-ranks.ts
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

interface RankTier {
  name: string;
  minimum_xp_threshold: number;
  rank_order: number;
  icon_url: string;
  perks: Record<string, any>;
}

const rankTiers: RankTier[] = [
  {
    name: 'Novice Assassin',
    minimum_xp_threshold: 0,
    rank_order: 1,
    icon_url: '/ranks/novice.svg',
    perks: {
      description: 'Welcome to the Tech Assassin community!',
      benefits: [
        'Access to community forums',
        'Basic event registration'
      ]
    }
  },
  {
    name: 'Apprentice Assassin',
    minimum_xp_threshold: 500,
    rank_order: 2,
    icon_url: '/ranks/apprentice.svg',
    perks: {
      description: 'You\'re learning the ropes!',
      benefits: [
        'Priority event notifications',
        'Access to beginner workshops',
        'Community badge display'
      ]
    }
  },
  {
    name: 'Skilled Assassin',
    minimum_xp_threshold: 1500,
    rank_order: 3,
    icon_url: '/ranks/skilled.svg',
    perks: {
      description: 'Your skills are developing nicely',
      benefits: [
        'Early event registration',
        'Access to intermediate challenges',
        'Mentor matching eligibility',
        'Custom profile themes'
      ]
    }
  },
  {
    name: 'Adept Assassin',
    minimum_xp_threshold: 3000,
    rank_order: 4,
    icon_url: '/ranks/adept.svg',
    perks: {
      description: 'You\'re becoming proficient',
      benefits: [
        'VIP event seating',
        'Access to advanced workshops',
        'Ability to host study groups',
        'Featured profile badge',
        '10% XP bonus on all activities'
      ]
    }
  },
  {
    name: 'Expert Assassin',
    minimum_xp_threshold: 5000,
    rank_order: 5,
    icon_url: '/ranks/expert.svg',
    perks: {
      description: 'Your expertise is recognized',
      benefits: [
        'Exclusive event access',
        'Mentorship program participation',
        'Code review privileges',
        'Custom rank badge',
        '15% XP bonus on all activities',
        'Priority support'
      ]
    }
  },
  {
    name: 'Master Assassin',
    minimum_xp_threshold: 8000,
    rank_order: 6,
    icon_url: '/ranks/master.svg',
    perks: {
      description: 'You\'ve mastered your craft',
      benefits: [
        'All Expert perks',
        'Event speaker opportunities',
        'Advanced mentorship roles',
        'Exclusive master-only events',
        '20% XP bonus on all activities',
        'Featured on leaderboard',
        'Custom profile URL'
      ]
    }
  },
  {
    name: 'Elite Assassin',
    minimum_xp_threshold: 12000,
    rank_order: 7,
    icon_url: '/ranks/elite.svg',
    perks: {
      description: 'You\'re among the elite',
      benefits: [
        'All Master perks',
        'Event planning committee access',
        'Exclusive elite lounge access',
        'Premium mentorship matching',
        '25% XP bonus on all activities',
        'Verified elite badge',
        'Early access to new features'
      ]
    }
  },
  {
    name: 'Legendary Assassin',
    minimum_xp_threshold: 18000,
    rank_order: 8,
    icon_url: '/ranks/legendary.svg',
    perks: {
      description: 'Your legend precedes you',
      benefits: [
        'All Elite perks',
        'Lifetime VIP status',
        'Advisory board eligibility',
        'Exclusive legendary events',
        '30% XP bonus on all activities',
        'Legendary profile frame',
        'Featured in hall of fame',
        'Direct line to leadership'
      ]
    }
  },
  {
    name: 'Grandmaster Assassin',
    minimum_xp_threshold: 25000,
    rank_order: 9,
    icon_url: '/ranks/grandmaster.svg',
    perks: {
      description: 'You\'ve achieved grandmaster status',
      benefits: [
        'All Legendary perks',
        'Permanent hall of fame entry',
        'Exclusive grandmaster title',
        'Event naming rights',
        '40% XP bonus on all activities',
        'Custom grandmaster badge',
        'Lifetime achievement recognition',
        'Community leadership role'
      ]
    }
  },
  {
    name: 'Mythic Assassin',
    minimum_xp_threshold: 35000,
    rank_order: 10,
    icon_url: '/ranks/mythic.svg',
    perks: {
      description: 'You\'ve transcended to mythic status',
      benefits: [
        'All Grandmaster perks',
        'Mythic profile effects',
        'Exclusive mythic-only channel',
        'Platform ambassador status',
        '50% XP bonus on all activities',
        'Unique mythic badge',
        'Permanent featured status',
        'Legacy builder privileges',
        'Unlimited event hosting'
      ]
    }
  },
  {
    name: 'Immortal Assassin',
    minimum_xp_threshold: 50000,
    rank_order: 11,
    icon_url: '/ranks/immortal.svg',
    perks: {
      description: 'You are immortalized in Tech Assassin history',
      benefits: [
        'All Mythic perks',
        'Immortal status badge',
        'Permanent monument in platform',
        'Exclusive immortal lounge',
        '75% XP bonus on all activities',
        'Custom immortal effects',
        'Platform co-creator status',
        'Unlimited all access',
        'Personal achievement showcase',
        'Eternal recognition'
      ]
    }
  }
];

async function seedRanks(): Promise<void> {
  console.log('🌱 Starting rank tiers seed...\n');

  try {
    // Check if any ranks already exist
    const { data: existing, error: checkError } = await supabase
      .from('rank_tiers')
      .select('name');

    if (checkError) {
      throw new Error(`Failed to check existing ranks: ${checkError.message}`);
    }

    if (existing && existing.length > 0) {
      console.log('⚠️  Rank tiers already exist. Updating existing definitions...\n');
      
      // Update existing ranks
      for (const rank of rankTiers) {
        const { error: upsertError } = await supabase
          .from('rank_tiers')
          .upsert({
            ...rank,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'name'
          });

        if (upsertError) {
          console.error(`❌ Failed to update ${rank.name}:`, upsertError.message);
        } else {
          console.log(`✅ Updated: ${rank.name} (${rank.minimum_xp_threshold} XP)`);
        }
      }
    } else {
      // Insert new ranks
      const { error: insertError } = await supabase
        .from('rank_tiers')
        .insert(rankTiers);

      if (insertError) {
        throw new Error(`Failed to insert ranks: ${insertError.message}`);
      }

      console.log('✅ Successfully seeded all rank tiers\n');
    }

    // Verify the seed
    const { data: seeded, error: verifyError } = await supabase
      .from('rank_tiers')
      .select('*')
      .order('rank_order');

    if (verifyError) {
      throw new Error(`Failed to verify seeded data: ${verifyError.message}`);
    }

    console.log('\n📊 Rank Tier Progression:');
    console.log('═'.repeat(70));
    seeded?.forEach((rank, index) => {
      const isLast = index === seeded.length - 1;
      const nextXP = isLast ? '∞' : seeded[index + 1].minimum_xp_threshold;
      const xpRange = isLast 
        ? `${rank.minimum_xp_threshold}+ XP`
        : `${rank.minimum_xp_threshold} - ${nextXP} XP`;
      
      console.log(`\n${rank.rank_order}. ${rank.name}`);
      console.log(`   XP Range: ${xpRange}`);
      console.log(`   Perks: ${rank.perks.benefits?.length || 0} benefits`);
    });
    console.log('\n' + '═'.repeat(70));

    console.log(`\n✅ Verification: ${seeded?.length || 0} rank tiers configured`);
    console.log(`   Lowest: ${seeded?.[0]?.name} (${seeded?.[0]?.minimum_xp_threshold} XP)`);
    console.log(`   Highest: ${seeded?.[seeded.length - 1]?.name} (${seeded?.[seeded.length - 1]?.minimum_xp_threshold} XP)`);

    console.log('\n🎉 Rank tiers seed completed successfully!');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedRanks();
