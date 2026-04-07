/**
 * Seed Script: XP Source Configuration
 * 
 * Seeds initial XP source configurations with base amounts, multipliers,
 * cooldowns, and rate limits for all 6 XP sources.
 * 
 * Requirements: 2.1, 2.2, 2.3
 * 
 * Usage:
 *   npx tsx backend/scripts/seed-xp-sources.ts
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

interface XPSourceConfig {
  source: string;
  base_amount: number;
  multipliers: Record<string, number>;
  cooldown_seconds: number;
  max_per_hour: number;
}

const xpSourceConfigs: XPSourceConfig[] = [
  {
    source: 'event_participation',
    base_amount: 50,
    multipliers: {
      registration: 1.0,
      check_in: 1.5,
      completion: 2.0,
      first_place: 3.0,
      second_place: 2.5,
      third_place: 2.0
    },
    cooldown_seconds: 0, // No cooldown for different events
    max_per_hour: 500
  },
  {
    source: 'code_contribution',
    base_amount: 100,
    multipliers: {
      pull_request: 1.0,
      merged_pr: 2.0,
      code_review: 0.5,
      bug_fix: 1.5,
      feature: 2.0
    },
    cooldown_seconds: 300, // 5 minutes between contributions
    max_per_hour: 600
  },
  {
    source: 'community_engagement',
    base_amount: 25,
    multipliers: {
      post: 1.0,
      comment: 0.5,
      helpful_answer: 2.0,
      upvote_received: 0.2,
      share: 0.8
    },
    cooldown_seconds: 60, // 1 minute between actions
    max_per_hour: 300
  },
  {
    source: 'challenge_completion',
    base_amount: 150,
    multipliers: {
      easy: 0.5,
      medium: 1.0,
      hard: 2.0,
      expert: 3.0,
      first_completion: 1.5
    },
    cooldown_seconds: 0, // No cooldown for different challenges
    max_per_hour: 800
  },
  {
    source: 'helping_others',
    base_amount: 75,
    multipliers: {
      mentorship_session: 1.0,
      code_review_help: 1.2,
      answered_question: 1.5,
      pair_programming: 2.0
    },
    cooldown_seconds: 600, // 10 minutes between helping actions
    max_per_hour: 400
  },
  {
    source: 'profile_completion',
    base_amount: 20,
    multipliers: {
      basic_info: 1.0,
      skills: 1.5,
      bio: 1.2,
      social_links: 1.0,
      avatar: 1.3,
      full_completion_bonus: 5.0
    },
    cooldown_seconds: 0, // No cooldown for profile updates
    max_per_hour: 200
  }
];

async function seedXPSources(): Promise<void> {
  console.log('🌱 Starting XP source configuration seed...\n');

  try {
    // Check if any XP sources already exist
    const { data: existing, error: checkError } = await supabase
      .from('xp_source_config')
      .select('source');

    if (checkError) {
      throw new Error(`Failed to check existing XP sources: ${checkError.message}`);
    }

    if (existing && existing.length > 0) {
      console.log('⚠️  XP sources already exist. Updating existing configurations...\n');
      
      // Update existing configurations
      for (const config of xpSourceConfigs) {
        const { error: updateError } = await supabase
          .from('xp_source_config')
          .upsert({
            ...config,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'source'
          });

        if (updateError) {
          console.error(`❌ Failed to update ${config.source}:`, updateError.message);
        } else {
          console.log(`✅ Updated: ${config.source} (${config.base_amount} base XP)`);
        }
      }
    } else {
      // Insert new configurations
      const { error: insertError } = await supabase
        .from('xp_source_config')
        .insert(xpSourceConfigs);

      if (insertError) {
        throw new Error(`Failed to insert XP sources: ${insertError.message}`);
      }

      console.log('✅ Successfully seeded all XP source configurations:\n');
      xpSourceConfigs.forEach(config => {
        console.log(`   • ${config.source}: ${config.base_amount} base XP`);
        console.log(`     - Cooldown: ${config.cooldown_seconds}s`);
        console.log(`     - Max per hour: ${config.max_per_hour} XP`);
        console.log(`     - Multipliers: ${Object.keys(config.multipliers).length} types\n`);
      });
    }

    // Verify the seed
    const { data: seeded, error: verifyError } = await supabase
      .from('xp_source_config')
      .select('*')
      .order('source');

    if (verifyError) {
      throw new Error(`Failed to verify seeded data: ${verifyError.message}`);
    }

    console.log(`\n✅ Verification: ${seeded?.length || 0} XP sources configured`);
    console.log('\n🎉 XP source configuration seed completed successfully!');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedXPSources();
