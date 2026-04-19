/**
 * Simple Project Structure Organizer
 * Create professional folder structure
 */

import { config } from 'dotenv';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
config({ path: '.env.local' });

console.log('=== ORGANIZING PROJECT STRUCTURE ===\n');

// Define the professional folder structure
const folderStructure = {
  'backend': {
    'src': {
      'app': {
        'api': {
          'auth': {
            'signin': {},
            'signup': {},
            'signout': {},
            'refresh': {}
          },
          'profile': {},
          'missions': {},
          'skills': {},
          'leaderboard': {},
          'notifications': {},
          'health': {}
        },
        'lib': {
          'auth': {
            'middleware': {},
            'validators': {},
            'guards': {}
          },
          'supabase': {
            'client': {},
            'server': {},
            'admin': {},
            'types': {}
          },
          'database': {
            'migrations': {},
            'seeds': {},
            'queries': {},
            'types': {}
          },
          'utils': {
            'helpers': {},
            'formatters': {},
            'validators': {},
            'constants': {}
          },
          'errors': {
            'handlers': {},
            'types': {},
            'middleware': {}
          },
          'storage': {
            'cleanup': {},
            'upload': {},
            'types': {}
          }
        },
        'components': {
          'ui': {
            'forms': {},
            'buttons': {},
            'modals': {},
            'cards': {},
            'layouts': {},
            'navigation': {},
            'loading': {}
          },
          'auth': {
            'signin': {},
            'signup': {},
            'profile': {},
            'guards': {}
          },
          'profile': {
            'edit': {},
            'view': {},
            'settings': {},
            'avatar': {}
          }
        },
        'hooks': {
          'auth': {},
          'api': {},
          'database': {},
          'storage': {},
          'notifications': {}
        },
        'types': {
          'api': {},
          'database': {},
          'auth': {},
          'profile': {},
          'mission': {}
        },
        'tests': {
          'unit': {
            'auth': {},
            'api': {},
            'database': {},
            'utils': {}
          },
          'integration': {
            'api': {},
            'auth': {},
            'database': {}
          },
          'e2e': {
            'auth': {},
            'profile': {},
            'missions': {}
          },
          'fixtures': {},
          'mocks': {},
          'helpers': {}
        },
        'scripts': {
          'migrations': {},
          'seeds': {},
          'cleanup': {},
          'backup': {},
          'deploy': {}
        }
      },
      'docs': {
        'api': {},
        'database': {},
        'deployment': {},
        'development': {},
        'architecture': {},
        'guides': {}
      }
    },
    'client': {
      'src': {
        'components': {
          'common': {
            'ui': {
              'buttons': {},
              'forms': {},
              'modals': {},
              'cards': {},
              'layouts': {},
              'navigation': {},
              'loading': {}
            },
            'layout': {
              'header': {},
              'sidebar': {},
              'footer': {},
              'main': {}
            },
            'auth': {
              'signin': {},
              'signup': {},
              'profile': {},
              'guards': {}
            }
          },
          'pages': {
            'auth': {
              'signin': {},
              'signup': {},
              'forgot': {},
              'reset': {}
            },
            'profile': {
              'edit': {},
              'view': {},
              'settings': {}
            },
            'missions': {
              'list': {},
              'detail': {},
              'create': {}
            },
            'leaderboard': {},
            'dashboard': {},
            'home': {}
          },
          'hooks': {
            'auth': {},
            'api': {},
            'storage': {},
            'notifications': {}
          },
          'services': {
            'api': {},
            'auth': {},
            'storage': {},
            'notifications': {}
          },
          'utils': {
            'helpers': {},
            'formatters': {},
            'validators': {},
            'constants': {}
          },
          'types': {
            'api': {},
            'auth': {},
            'profile': {},
            'mission': {}
          },
          'styles': {
            'components': {},
            'pages': {},
            'globals': {},
            'themes': {}
          },
          'assets': {
            'images': {},
            'icons': {},
            'fonts': {}
          }
        },
        'tests': {
          'unit': {
            'components': {},
            'hooks': {},
            'services': {},
            'utils': {}
          },
          'integration': {
            'pages': {},
            'services': {}
          },
          'e2e': {
            'auth': {},
            'profile': {},
            'missions': {}
          },
          'fixtures': {},
          'mocks': {}
        }
      }
    },
    'database': {
      'migrations': {},
      'seeds': {},
      'schemas': {},
      'scripts': {},
      'backups': {},
      'docs': {}
    },
    'docs': {
      'api': {},
      'database': {},
      'deployment': {},
      'development': {},
      'architecture': {},
      'guides': {},
      'business': {}
    },
    'tools': {
      'scripts': {},
      'generators': {},
      'analyzers': {},
      'deploy': {}
    }
  };

// Function to create directory structure
function createDirectoryStructure(basePath, structure) {
  Object.entries(structure).forEach(([name, content]) => {
    const fullPath = join(basePath, name);
    
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
    }
    
    if (typeof content === 'object' && !Array.isArray(content)) {
      createDirectoryStructure(fullPath, content);
    }
  });
}

// Function to move files to appropriate locations
function moveFilesToStructure() {
  console.log('\n=== MOVING FILES TO STRUCTURE ===\n');
  
  // Define file mappings
  const fileMappings = [
    // Backend API routes
    { from: 'app/api/auth/signin/route.ts', to: 'backend/src/app/api/auth/signin/route.ts' },
    { from: 'app/api/profile/route.ts', to: 'backend/src/app/api/profile/route.ts' },
    { from: 'app/api/profile/user/[username]/route.ts', to: 'backend/src/app/api/profile/user/[username]/route.ts' },
    { from: 'app/api/profile/[id]/route.ts', to: 'backend/src/app/api/profile/[id]/route.ts' },
    { from: 'app/api/missions/route.ts', to: 'backend/src/app/api/missions/route.ts' },
    
    // Backend lib files
    { from: 'lib/middleware/auth-clerk-new.ts', to: 'backend/src/lib/auth/middleware/auth-clerk.ts' },
    { from: 'lib/middleware/auth.ts', to: 'backend/src/lib/auth/middleware/auth.ts' },
    { from: 'lib/supabase/server.ts', to: 'backend/src/lib/supabase/server.ts' },
    { from: 'lib/supabase/client.ts', to: 'backend/src/lib/supabase/client.ts' },
    { from: 'lib/errors/index.ts', to: 'backend/src/lib/errors/index.ts' },
    { from: 'lib/validations/auth.ts', to: 'backend/src/lib/auth/validators/auth.ts' },
    { from: 'lib/validations/profile.ts', to: 'backend/src/lib/profile/validators/profile.ts' },
    
    // Backend middleware
    { from: 'middleware.ts', to: 'backend/src/middleware.ts' },
    
    // Backend types
    { from: 'types/database.ts', to: 'backend/src/types/database.ts' },
    
    // Test files
    { from: 'lib/supabase/__tests__/rls-policies.test.ts', to: 'backend/src/tests/unit/database/rls-policies.test.ts' },
    
    // Migration and fix scripts
    { from: 'migrate-to-clerk-auth.mjs', to: 'backend/src/scripts/migrations/migrate-to-clerk-auth.mjs' },
    { from: 'fix-clerk-uuid-database.mjs', to: 'backend/src/scripts/migrations/fix-clerk-uuid-database.mjs' },
    { from: 'remove-supabase-auth.mjs', to: 'backend/src/scripts/migrations/remove-supabase-auth.mjs' },
    { from: 'fix-backend-errors.mjs', to: 'backend/src/scripts/fixes/fix-backend-errors.mjs' },
    { from: 'test-clerk-auth-status.mjs', to: 'backend/src/tests/integration/auth/test-clerk-auth-status.mjs' },
    { from: 'simple-auth-check.mjs', to: 'backend/src/tests/integration/auth/simple-auth-check.mjs' },
    
    // Documentation
    { from: 'CLERK_MIGRATION_COMPLETE.md', to: 'docs/migration/CLERK_MIGRATION_COMPLETE.md' },
    { from: 'UUID_FIX_COMPLETE.md', to: 'docs/database/UUID_FIX_COMPLETE.md' },
    { from: 'BACKEND_ERRORS_FIXED.md', to: 'docs/troubleshooting/BACKEND_ERRORS_FIXED.md' },
    { from: 'CLERK_LOGIN_GUIDE.md', to: 'docs/guides/CLERK_LOGIN_GUIDE.md' },
    
    // SQL files
    { from: '../SQL/20260418000001_master_database_schema_v2.sql', to: 'database/schemas/20260418000001_master_database_schema_v2.sql' },
    { from: '../SQL/20260418000002_safe_schema_migration.sql', to: 'database/migrations/20260418000002_safe_schema_migration.sql' },
    { from: '../SQL/DATABASE_DOCUMENTATION.md', to: 'database/docs/DATABASE_DOCUMENTATION.md' },
  ];
  
  fileMappings.forEach(mapping => {
    const fromPath = join(__dirname, mapping.from);
    const toPath = join(__dirname, '..', mapping.to);
    
    try {
      if (existsSync(fromPath)) {
        const content = readFileSync(fromPath, 'utf8');
        
        // Create destination directory if it doesn't exist
        const destDir = dirname(toPath);
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        
        writeFileSync(toPath, content);
        console.log(`Moved: ${mapping.from} -> ${mapping.to}`);
      } else {
        console.log(`File not found: ${mapping.from}`);
      }
    } catch (error) {
      console.log(`Error moving ${mapping.from}:`, error.message);
    }
  });
}

// Function to create README files
function createReadmeFiles() {
  console.log('\n=== CREATING README FILES ===\n');
  
  const readmeFiles = [
    {
      path: 'backend/README.md',
      content: `# TechAssassin Backend

## Overview
Professional backend API for the TechAssassin platform.

## Architecture
- Framework: Next.js 14 with App Router
- Authentication: Clerk
- Database: Supabase (PostgreSQL)
- Language: TypeScript

## Structure
- src/app/ - API routes and pages
- src/lib/ - Library functions and utilities
- src/components/ - Reusable components
- src/tests/ - Test files
- src/middleware/ - Request middleware

## Getting Started
npm install
npm run dev

## Environment Variables
See .env.local.example for required variables.

## API Documentation
See docs/api/ for detailed API documentation.
`
    },
    {
      path: 'client/README.md',
      content: `# TechAssassin Frontend

## Overview
Professional frontend application for the TechAssassin platform.

## Architecture
- Framework: React with Vite
- Authentication: Clerk
- Styling: Tailwind CSS
- Language: TypeScript

## Structure
- src/pages/ - Page components
- src/components/ - Reusable components
- src/services/ - API services
- src/hooks/ - Custom hooks
- src/utils/ - Utility functions

## Getting Started
npm install
npm run dev

## Environment Variables
See .env.local.example for required variables.
`
    },
    {
      path: 'database/README.md',
      content: `# TechAssassin Database

## Overview
Professional database schema and migrations for the TechAssassin platform.

## Structure
- schemas/ - Database schema files
- migrations/ - Migration scripts
- seeds/ - Seed data scripts
- scripts/ - Utility scripts
- docs/ - Database documentation

## Database System
- Provider: Supabase
- Engine: PostgreSQL
- Authentication: Clerk integration

## Schema
See schemas/ for detailed schema documentation.
`
    },
    {
      path: 'docs/README.md',
      content: `# TechAssassin Documentation

## Overview
Comprehensive documentation for the TechAssassin platform.

## Structure
- api/ - API documentation
- database/ - Database documentation
- deployment/ - Deployment guides
- development/ - Development guides
- architecture/ - Architecture documentation
- guides/ - User guides
- business/ - Business documentation

## Getting Started
Start with development/README.md for development setup.
`
    }
  ];
  
  readmeFiles.forEach(file => {
    const filePath = join(__dirname, '..', file.path);
    const dirPath = dirname(filePath);
    
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    
    writeFileSync(filePath, file.content);
    console.log(`Created README file: ${file.path}`);
  });
}

// Main execution
async function organizeProject() {
  try {
    console.log('Starting project organization...\n');
    
    // Create directory structure
    console.log('Creating directory structure...');
    createDirectoryStructure(join(__dirname, '..'), folderStructure);
    
    // Move files to structure
    moveFilesToStructure();
    
    // Create README files
    createReadmeFiles();
    
    console.log('\n=== PROJECT ORGANIZATION COMPLETE ===');
    console.log('\nSummary of changes:');
    console.log('1. Created professional folder structure');
    console.log('2. Moved files to appropriate locations');
    console.log('3. Added README files for documentation');
    console.log('4. Organized test files in dedicated folders');
    console.log('5. Separated concerns properly');
    
    console.log('\nNext steps:');
    console.log('1. Update import paths in files');
    console.log('2. Update package.json scripts');
    console.log('3. Test the new structure');
    console.log('4. Update documentation');
    
    console.log('\nBenefits:');
    console.log('1. Professional folder structure');
    console.log('2. Better code organization');
    console.log('3. Easier maintenance');
    console.log('4. Better scalability');
    console.log('5. Improved developer experience');
    
  } catch (error) {
    console.error('Project organization failed:', error.message);
    process.exit(1);
  }
}

organizeProject();
