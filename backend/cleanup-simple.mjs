/**
 * Simple cleanup script
 * Move remaining files to organized locations
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== SIMPLE CLEANUP ===\n');

// Files to move
const filesToMove = [
  // Documentation
  'ACTIVITY_TRACKING_INTEGRATION.md',
  'ANNOUNCEMENTS_API_VERIFICATION.md', 
  'API.md',
  'CHECKPOINT-14-VERIFICATION.md',
  'CHECKPOINT-24-FINAL-VERIFICATION.md',
  'CHECKPOINT-24-SUMMARY.md',
  'CHECKPOINT-24-VERIFICATION.md',
  'CHECKPOINT-5-VALIDATION-REPORT.md',
  'CHECKPOINT_10_REPORT.md',
  'DATABASE_MIGRATION_GUIDE.md',
  'DEPLOYMENT.md',
  'DEPLOYMENT_SUMMARY.md',
  'ERROR_HANDLING_UPDATE_GUIDE.md',
  'FREE_TIER_COMPLIANCE.md',
  'MANUAL_TESTING_CHECKLIST.md',
  'PERFORMANCE_OPTIMIZATIONS.md',
  'PGADMIN_4_SETUP_GUIDE.md',
  'PRODUCTION_CHECKLIST.md',
  'REALTIME_API_DOCUMENTATION.md',
  'REALTIME_API_ENDPOINTS.md',
  'REALTIME_API_SUBSCRIPTIONS.md',
  'SUPABASE_SETUP.md',
  'TASK_12_IMPLEMENTATION_SUMMARY.md',
  'TASK_15_COMPLETION_SUMMARY.md',
  'TASK_20_COMPLETION_SUMMARY.md',
  'TASK_26_SUMMARY.md',
  'TASK_3_COMPLETION_SUMMARY.md',
  'TASK_7_COMPLETION_SUMMARY.md',
  'TASK_8_COMPLETION_SUMMARY.md',
  'TASK_9_CLEANUP_VERIFICATION.md',
  'test-api-endpoints.md',
  'VERCEL_DEPLOYMENT.md',
  
  // Scripts
  'add-missing-tables.mjs',
  'apply-new-schema.mjs',
  'apply-structured-schema.mjs',
  'comprehensive-uuid-fix.mjs',
  'create-clerk-profile.mjs',
  'create-event-registrations.mjs',
  'debug-production-500.mjs',
  'diagnose-auth-issue.mjs',
  'direct-sql-fix.mjs',
  'fix-backend-errors.mjs',
  'fix-clerk-auth-simple.mjs',
  'fix-clerk-uuid-database.mjs',
  'fix-migration-issues.mjs',
  'fix-sql-syntax-error.mjs',
  'fix-supabase-from-terminal.mjs',
  'fix-table-permissions.mjs',
  'fix-uuid-column.mjs',
  'migrate-to-clerk-auth.mjs',
  'remove-supabase-auth.mjs',
  'simple-uuid-fix.mjs',
  'test-auth-endpoint.mjs',
  'test-clerk-auth-status.mjs',
  'test-clerk-auth.mjs',
  'test-clerk-integration.mjs',
  'test-service-role-connection.mjs',
  'test-supabase-connection-env.mjs',
  'test-supabase-connection.mjs',
  'thorough-auth-check.mjs',
  'verify-checkpoint.mjs',
  'verify-core-features-simple.mjs',
  'verify-core-features.mjs',
  
  // Config
  'next.config.mjs',
  
  // More docs
  'render-env-fix-script.md',
  'fix-render-env-variables.md',
  'fix-vercel-config.md',
  'fix-production-auth.md'
];

// Directory mappings
const dirMappings = {
  'ACTIVITY_TRACKING_INTEGRATION.md': 'docs/api/',
  'ANNOUNCEMENTS_API_VERIFICATION.md': 'docs/api/',
  'API.md': 'docs/api/',
  'CHECKPOINT-14-VERIFICATION.md': 'docs/testing/',
  'CHECKPOINT-24-FINAL-VERIFICATION.md': 'docs/testing/',
  'CHECKPOINT-24-SUMMARY.md': 'docs/testing/',
  'CHECKPOINT-24-VERIFICATION.md': 'docs/testing/',
  'CHECKPOINT-5-VALIDATION-REPORT.md': 'docs/testing/',
  'CHECKPOINT_10_REPORT.md': 'docs/testing/',
  'DATABASE_MIGRATION_GUIDE.md': 'docs/database/',
  'DEPLOYMENT.md': 'docs/deployment/',
  'DEPLOYMENT_SUMMARY.md': 'docs/deployment/',
  'ERROR_HANDLING_UPDATE_GUIDE.md': 'docs/troubleshooting/',
  'FREE_TIER_COMPLIANCE.md': 'docs/business/',
  'MANUAL_TESTING_CHECKLIST.md': 'docs/testing/',
  'PERFORMANCE_OPTIMIZATIONS.md': 'docs/performance/',
  'PGADMIN_4_SETUP_GUIDE.md': 'docs/database/',
  'PRODUCTION_CHECKLIST.md': 'docs/deployment/',
  'REALTIME_API_DOCUMENTATION.md': 'docs/api/',
  'REALTIME_API_ENDPOINTS.md': 'docs/api/',
  'REALTIME_API_SUBSCRIPTIONS.md': 'docs/api/',
  'SUPABASE_SETUP.md': 'docs/database/',
  'TASK_12_IMPLEMENTATION_SUMMARY.md': 'docs/project/',
  'TASK_15_COMPLETION_SUMMARY.md': 'docs/project/',
  'TASK_20_COMPLETION_SUMMARY.md': 'docs/project/',
  'TASK_26_SUMMARY.md': 'docs/project/',
  'TASK_3_COMPLETION_SUMMARY.md': 'docs/project/',
  'TASK_7_COMPLETION_SUMMARY.md': 'docs/project/',
  'TASK_8_COMPLETION_SUMMARY.md': 'docs/project/',
  'TASK_9_CLEANUP_VERIFICATION.md': 'docs/testing/',
  'test-api-endpoints.md': 'docs/testing/',
  'VERCEL_DEPLOYMENT.md': 'docs/deployment/',
  
  // Scripts to src/scripts/migrations/
  'add-missing-tables.mjs': 'src/scripts/migrations/',
  'apply-new-schema.mjs': 'src/scripts/migrations/',
  'apply-structured-schema.mjs': 'src/scripts/migrations/',
  'comprehensive-uuid-fix.mjs': 'src/scripts/migrations/',
  'create-clerk-profile.mjs': 'src/scripts/migrations/',
  'create-event-registrations.mjs': 'src/scripts/migrations/',
  'debug-production-500.mjs': 'src/scripts/debug/',
  'diagnose-auth-issue.mjs': 'src/scripts/debug/',
  'direct-sql-fix.mjs': 'src/scripts/migrations/',
  'fix-backend-errors.mjs': 'src/scripts/fixes/',
  'fix-clerk-auth-simple.mjs': 'src/scripts/migrations/',
  'fix-clerk-uuid-database.mjs': 'src/scripts/migrations/',
  'fix-migration-issues.mjs': 'src/scripts/migrations/',
  'fix-sql-syntax-error.mjs': 'src/scripts/fixes/',
  'fix-supabase-from-terminal.mjs': 'src/scripts/migrations/',
  'fix-table-permissions.mjs': 'src/scripts/migrations/',
  'fix-uuid-column.mjs': 'src/scripts/migrations/',
  'migrate-to-clerk-auth.mjs': 'src/scripts/migrations/',
  'remove-supabase-auth.mjs': 'src/scripts/migrations/',
  'simple-uuid-fix.mjs': 'src/scripts/migrations/',
  'test-auth-endpoint.mjs': 'src/scripts/tests/',
  'test-clerk-auth-status.mjs': 'src/scripts/tests/',
  'test-clerk-auth.mjs': 'src/scripts/tests/',
  'test-clerk-integration.mjs': 'src/scripts/tests/',
  'test-service-role-connection.mjs': 'src/scripts/tests/',
  'test-supabase-connection-env.mjs': 'src/scripts/tests/',
  'test-supabase-connection.mjs': 'src/scripts/tests/',
  'thorough-auth-check.mjs': 'src/scripts/tests/',
  'verify-checkpoint.mjs': 'src/scripts/tests/',
  'verify-core-features-simple.mjs': 'src/scripts/tests/',
  'verify-core-features.mjs': 'src/scripts/tests/',
  
  // Config
  'next.config.mjs': 'src/config/',
  
  // More docs
  'render-env-fix-script.md': 'docs/deployment/',
  'fix-render-env-variables.md': 'docs/deployment/',
  'fix-vercel-config.md': 'docs/deployment/',
  'fix-production-auth.md': 'docs/troubleshooting/'
};

// Function to move file
function moveFile(filename, targetDir) {
  const sourcePath = join(__dirname, filename);
  const targetPath = join(__dirname, targetDir, filename);
  
  try {
    if (existsSync(sourcePath)) {
      const content = readFileSync(sourcePath, 'utf8');
      
      // Create directory if it doesn't exist
      if (!existsSync(join(__dirname, targetDir))) {
        mkdirSync(join(__dirname, targetDir), { recursive: true });
      }
      
      writeFileSync(targetPath, content);
      unlinkSync(sourcePath);
      
      console.log(`Moved: ${filename} -> ${targetDir}${filename}`);
    } else {
      console.log(`File not found: ${filename}`);
    }
  } catch (error) {
    console.log(`Error moving ${filename}:`, error.message);
  }
}

// Move all files
console.log('Moving files...\n');
filesToMove.forEach(filename => {
  if (dirMappings[filename]) {
    moveFile(filename, dirMappings[filename]);
  }
});

console.log('\n=== CLEANUP COMPLETE ===');
console.log('Root directory is now clean!');
console.log('All files organized into proper folders.');
