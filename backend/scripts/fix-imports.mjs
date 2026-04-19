import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const TARGET_DIRS = [
  path.join(ROOT_DIR, 'app'),
  path.join(ROOT_DIR, 'lib')
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fixImports(fullPath);
    }
  }
}

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Fix broken hybrids: from '../@/lib/...' -> from '@/lib/...'
  const hybridPattern = /from\s+['"]\.\.\/.*\/?@\/(lib|types|services|middleware|storage|supabase|validations)\//g;
  if (hybridPattern.test(content)) {
    content = content.replace(hybridPattern, "from '@/$1/");
    changed = true;
  }

  // 2. Fix deep relative: from '../../../../lib/...' -> from '@/lib/...'
  const relativePattern = /from\s+['"](\.\.\/)+(lib|types|services|middleware|storage|supabase|validations|errors|email)\//g;
  if (relativePattern.test(content)) {
    content = content.replace(relativePattern, "from '@/$2/");
    changed = true;
  }

  // 3. Fix missing lib prefix for core folders: from '@/middleware/...' -> from '@/lib/middleware/...'
  const missingLibPattern = /from\s+['"]@\/(services|middleware|storage|supabase|validations|errors|email)\//g;
  if (missingLibPattern.test(content)) {
    content = content.replace(missingLibPattern, "from '@/lib/$1/");
    changed = true;
  }

  // 4. Fix invalid Clerk SDK calls: 'await Clerk authentication(...)' -> 'await auth()' etc.
  // This is a safety sweep for legacy code.
  if (content.includes('Clerk authentication')) {
    content = content.replace(/await\s+Clerk\s+authentication\({[\s\S]*?}\)/g, "await auth()");
    // Add import if missing
    if (!content.includes("@clerk/nextjs/server")) {
      content = "import { auth } from '@clerk/nextjs/server';\n" + content;
    }
    changed = true;
  }

  if (content.includes('Clerk currentUser')) {
    content = content.replace(/await\s+Clerk\s+currentUser\([^)]*\)/g, "await currentUser()");
    if (!content.includes("@clerk/nextjs/server")) {
      content = "import { currentUser } from '@clerk/nextjs/server';\n" + content;
    }
    changed = true;
  }

  // 5. Fix stale src alias: from '@/src/...' -> from '@/...'
  const srcPattern = /from\s+['"]@\/src\//g;
  if (srcPattern.test(content)) {
    content = content.replace(srcPattern, "from '@/");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed imports in: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

console.log('🚀 Starting Global Import Fix...');
TARGET_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  } else {
    console.warn(`⚠️ Directory not found: ${dir}`);
  }
});
console.log('✨ Cleanup Complete!');
