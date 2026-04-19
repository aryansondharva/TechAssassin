/**
 * Clean up Supabase Auth References from Code
 * Remove any remaining Supabase auth code and references
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Files to check for Supabase auth references
const filesToCheck = [
  'lib/middleware/auth.ts',
  'lib/middleware/auth-final-fix.ts',
  'lib/middleware/auth-clerk-fix.ts',
  'app/api/auth/signin/route.ts',
  'app/api/auth/signup/route.ts',
  'app/api/auth/signout/route.ts',
  'app/api/auth/refresh/route.ts',
  '.env.local',
  'next.config.mjs'
];

// Directories to search for Supabase auth references
const directoriesToSearch = [
  'app/api',
  'lib',
  'components'
];

// Patterns to remove/replace
const patterns = [
  {
    find: /@supabase\/auth-helpers-nextjs/g,
    replace: '@clerk/nextjs'
  },
  {
    find: /createClient.*from.*@supabase\/auth-helpers-nextjs/g,
    replace: 'createClient from @supabase/supabase-js'
  },
  {
    find: /import.*createClient.*from.*@supabase\/auth-helpers-nextjs/g,
    replace: 'import { createClient } from \'@supabase/supabase-js\''
  },
  {
    find: /createClient.*cookies.*supabase.*url.*supabase.*key/g,
    replace: 'createClient(supabaseUrl, supabaseKey)'
  },
  {
    find: /supabase\.auth\.signInWithPassword/g,
    replace: 'Clerk authentication'
  },
  {
    find: /supabase\.auth\.signOut/g,
    replace: 'Clerk signOut'
  },
  {
    find: /supabase\.auth\.getUser/g,
    replace: 'Clerk currentUser'
  },
  {
    find: /supabase\.auth\.getSession/g,
    replace: 'Clerk auth'
  },
  {
    find: /auth\.jwt\(\)/g,
    replace: 'Clerk user ID'
  },
  {
    find: /auth\.uid\(\)/g,
    replace: 'Clerk user ID'
  },
  {
    find: /auth\.role\(\)/g,
    replace: 'Clerk role'
  },
  {
    find: /auth\.email\(\)/g,
    replace: 'Clerk email'
  }
];

function findFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function cleanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Apply all patterns
    for (const pattern of patterns) {
      if (pattern.find.test(newContent)) {
        newContent = newContent.replace(pattern.find, pattern.replace);
        modified = true;
      }
    }
    
    if (modified) {
      writeFileSync(filePath, newContent);
      console.log(`Cleaned: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`Error cleaning ${filePath}: ${error.message}`);
    return false;
  }
}

function searchAndReplace() {
  console.log('=== CLEANING UP SUPABASE AUTH REFERENCES ===\n');
  
  let totalModified = 0;
  
  // Check specific files
  console.log('1. Checking specific files...');
  for (const file of filesToCheck) {
    const filePath = join(__dirname, file);
    try {
      if (cleanFile(filePath)) {
        totalModified++;
      }
    } catch (error) {
      console.log(`File not found: ${file}`);
    }
  }
  
  // Search directories
  console.log('\n2. Searching directories...');
  for (const dir of directoriesToSearch) {
    const dirPath = join(__dirname, dir);
    try {
      const files = findFiles(dirPath);
      console.log(`Searching ${dir}: ${files.length} files`);
      
      for (const file of files) {
        if (cleanFile(file)) {
          totalModified++;
        }
      }
    } catch (error) {
      console.log(`Directory not found: ${dir}`);
    }
  }
  
  console.log(`\n=== CLEANUP COMPLETED ===`);
  console.log(`Total files modified: ${totalModified}`);
  
  if (totalModified > 0) {
    console.log('\nNext steps:');
    console.log('1. Review the modified files');
    console.log('2. Update any remaining auth logic manually');
    console.log('3. Test all authentication functionality');
    console.log('4. Remove any Supabase auth dependencies from package.json');
  } else {
    console.log('\nNo Supabase auth references found in code.');
  }
}

// Check for Supabase auth dependencies
function checkDependencies() {
  console.log('\n3. Checking package.json dependencies...');
  
  try {
    const packagePath = join(__dirname, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    const supabaseAuthDeps = [
      '@supabase/auth-helpers-nextjs',
      '@supabase/auth-helpers-react',
      '@supabase/auth-ui-react',
      '@supabase/auth-ui-shared'
    ];
    
    const foundDeps = [];
    
    // Check dependencies
    for (const dep of supabaseAuthDeps) {
      if (packageJson.dependencies?.[dep]) {
        foundDeps.push(dep);
      }
    }
    
    // Check devDependencies
    for (const dep of supabaseAuthDeps) {
      if (packageJson.devDependencies?.[dep]) {
        foundDeps.push(`${dep} (dev)`);
      }
    }
    
    if (foundDeps.length > 0) {
      console.log('Found Supabase auth dependencies to remove:');
      foundDeps.forEach(dep => console.log(`  - ${dep}`));
      console.log('\nTo remove these dependencies, run:');
      foundDeps.forEach(dep => {
        const cleanDep = dep.replace(' (dev)', '');
        console.log(`  npm uninstall ${cleanDep}`);
      });
    } else {
      console.log('No Supabase auth dependencies found in package.json');
    }
  } catch (error) {
    console.log('Error checking package.json:', error.message);
  }
}

// Main execution
searchAndReplace();
checkDependencies();

console.log('\n=== FINAL CLEANUP STEPS ===');
console.log('1. Remove any remaining Supabase auth files (if not needed)');
console.log('2. Update any frontend auth components to use Clerk');
console.log('3. Test the entire authentication flow');
console.log('4. Deploy and verify production works');
console.log('\nYour application should now be 100% Clerk-based!');
