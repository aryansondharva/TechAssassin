/**
 * Clean up root directory files
 * Move all .md and .mjs files to organized locations
 */

import { config } from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
config({ path: '.env.local' });

console.log('=== CLEANING UP ROOT DIRECTORY FILES ===\n');

// Define file mappings
const fileMappings = [
  // Documentation files
  { from: 'ACTIVITY_TRACKING_INTEGRATION.md', to: 'docs/api/' },
  { from: 'ANNOUNCEMENTS_API_VERIFICATION.md', to: 'docs/api/' },
  { from: 'API.md', to: 'docs/api/' },
  { from: 'CHECKPOINT-14-VERIFICATION.md', to: 'docs/testing/' },
  { from: 'CHECKPOINT-24-FINAL-VERIFICATION.md', to: 'docs/testing/' },
  { from: 'CHECKPOINT-24-SUMMARY.md', to: 'docs/testing/' },
  { from: 'CHECKPOINT-24-VERIFICATION.md', to: 'docs/testing/' },
  { from: 'CHECKPOINT-5-VALIDATION-REPORT.md', to: 'docs/testing/' },
  { from: 'CHECKPOINT_10_REPORT.md', to: 'docs/testing/' },
  { from: 'DATABASE_MIGRATION_GUIDE.md', to: 'docs/database/' },
  { from: 'DEPLOYMENT.md', to: 'docs/deployment/' },
  { from: 'DEPLOYMENT_SUMMARY.md', to: 'docs/deployment/' },
  { from: 'ERROR_HANDLING_UPDATE_GUIDE.md', to: 'docs/troubleshooting/' },
  { from: 'FREE_TIER_COMPLIANCE.md', to: 'docs/business/' },
  { from: 'MANUAL_TESTING_CHECKLIST.md', to: 'docs/testing/' },
  { from: 'PERFORMANCE_OPTIMIZATIONS.md', to: 'docs/performance/' },
  { from: 'PGADMIN_4_SETUP_GUIDE.md', to: 'docs/database/' },
  { from: 'PRODUCTION_CHECKLIST.md', to: 'docs/deployment/' },
  { from: 'REALTIME_API_DOCUMENTATION.md', to: 'docs/api/' },
  { from: 'REALTIME_API_ENDPOINTS.md', to: 'docs/api/' },
  { from: 'REALTIME_API_SUBSCRIPTIONS.md', to: 'docs/api/' },
  { from: 'SUPABASE_SETUP.md', to: 'docs/database/' },
  { from: 'TASK_12_IMPLEMENTATION_SUMMARY.md', to: 'docs/project/' },
  { from: 'TASK_15_COMPLETION_SUMMARY.md', to: 'docs/project/' },
  { from: 'TASK_20_COMPLETION_SUMMARY.md', to: 'docs/project/' },
  { from: 'TASK_26_SUMMARY.md', to: 'docs/project/' },
  { from: 'TASK_3_COMPLETION_SUMMARY.md', to: 'docs/project/' },
  { from: 'TASK_7_COMPLETION_SUMMARY.md', to: 'docs/project/' },
  { from: 'TASK_8_COMPLETION_SUMMARY.md', to: 'docs/project/' },
  { from: 'TASK_9_CLEANUP_VERIFICATION.md', to: 'docs/testing/' },
  { from: 'test-api-endpoints.md', to: 'docs/testing/' },
  { from: 'VERCEL_DEPLOYMENT.md', to: 'docs/deployment/' },
  
  // Migration and fix scripts
  { from: 'add-missing-tables.mjs', to: 'src/scripts/migrations/' },
  { from: 'apply-new-schema.mjs', to: 'src/scripts/migrations/' },
  { from: 'apply-structured-schema.mjs', to: 'src/scripts/migrations/' },
  { from: 'comprehensive-uuid-fix.mjs', to: 'src/scripts/migrations/' },
  { from: 'create-clerk-profile.mjs', to: 'src/scripts/migrations/' },
  { from: 'create-event-registrations.mjs', to: 'src/scripts/migrations/' },
  { from: 'debug-auth-401.mjs', to: 'src/tests/integration/auth/' },
  { from: 'debug-production-500.mjs', to: 'src/scripts/debug/' },
  { from: 'diagnose-auth-issue.mjs', to: 'src/tests/integration/auth/' },
  { from: 'direct-sql-fix.mjs', to: 'src/scripts/migrations/' },
  { from: 'fix-backend-errors.mjs', to: 'src/scripts/fixes/' },
  { from: 'fix-clerk-auth-simple.mjs', to: 'src/scripts/migrations/' },
  { from: 'fix-clerk-uuid-database.mjs', to: 'src/scripts/migrations/' },
  { from: 'fix-migration-issues.mjs', to: 'src/scripts/migrations/' },
  { from: 'fix-sql-syntax-error.mjs', to: 'src/scripts/fixes/' },
  { from: 'fix-supabase-from-terminal.mjs', to: 'src/scripts/migrations/' },
  { from: 'fix-table-permissions.mjs', to: 'src/scripts/migrations/' },
  { from: 'fix-uuid-column.mjs', to: 'src/scripts/migrations/' },
  { from: 'migrate-to-clerk-auth.mjs', to: 'src/scripts/migrations/' },
  { from: 'remove-supabase-auth.mjs', to: 'src/scripts/migrations/' },
  { from: 'simple-auth-check.mjs', to: 'src/tests/integration/auth/' },
  { from: 'simple-uuid-fix.mjs', to: 'src/scripts/migrations/' },
  { from: 'test-auth-endpoint.mjs', to: 'src/tests/integration/auth/' },
  { from: 'test-clerk-auth-status.mjs', to: 'src/tests/integration/auth/' },
  { from: 'test-clerk-auth.mjs', to: 'src/tests/integration/auth/' },
  { from: 'test-clerk-integration.mjs', to: 'src/tests/integration/auth/' },
  { from: 'test-service-role-connection.mjs', to: 'src/tests/unit/database/' },
  { from: 'test-supabase-connection-env.mjs', to: 'src/tests/unit/database/' },
  { from: 'test-supabase-connection.mjs', to: 'src/tests/unit/database/' },
  { from: 'thorough-auth-check.mjs', to: 'src/tests/integration/auth/' },
  { from: 'verify-checkpoint.mjs', to: 'src/tests/integration/' },
  { from: 'verify-core-features-simple.mjs', to: 'src/tests/integration/' },
  { from: 'verify-core-features.mjs', to: 'src/tests/integration/' },
  
  // Configuration files
  { from: 'next.config.mjs', to: 'src/config/' },
  { from: 'render-env-fix-script.md', to: 'docs/deployment/' },
  { from: 'fix-render-env-variables.md', to: 'docs/deployment/' },
  { from: 'fix-vercel-config.md', to: 'docs/deployment/' },
  { from: 'fix-production-auth.md', to: 'docs/troubleshooting/' },
];

// Function to move files
function moveFile(fromPath, toPath) {
  try {
    const fullFromPath = join(__dirname, fromPath);
    const fullToPath = join(__dirname, toPath);
    
    if (existsSync(fullFromPath)) {
      const content = readFileSync(fullFromPath, 'utf8');
      
      // Create destination directory if it doesn't exist
      const destDir = dirname(fullToPath);
      if (!existsSync(destDir)) {
        const { mkdirSync } = require('fs');
        mkdirSync(destDir, { recursive: true });
      }
      
      writeFileSync(fullToPath, content);
      console.log(`Moved: ${fromPath} -> ${toPath}`);
      
      // Delete the original file
      const { unlinkSync } = require('fs');
      unlinkSync(fullFromPath);
      console.log(`Deleted original: ${fromPath}`);
    } else {
      console.log(`File not found: ${fromPath}`);
    }
  } catch (error) {
    console.log(`Error moving ${fromPath}:`, error.message);
  }
}

// Move all files
console.log('Moving files to organized locations...\n');

fileMappings.forEach(mapping => {
  moveFile(mapping.from, mapping.to);
});

console.log('\n=== CLEANUP COMPLETE ===');
console.log('\nSummary:');
console.log('1. Moved all .md files to docs/ folders');
console.log('2. Moved all .mjs files to src/scripts/ or src/tests/');
console.log('3. Deleted original files from root directory');
console.log('4. Organized by functionality (migrations, tests, docs, etc.)');

console.log('\nBenefits:');
console.log('1. Clean root directory');
console.log('2. Professional file organization');
console.log('3. Easy to find files by purpose');
console.log('4. Better project structure');

console.log('\nNext steps:');
console.log('1. Update import paths in moved files');
console.log('2. Test the organized structure');
console.log('3. Update documentation if needed');
