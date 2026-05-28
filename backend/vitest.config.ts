import { defineConfig } from 'vitest/config'
import path from 'path'
import { loadEnvFile } from 'node:process'

// Load environment variables from .env.local
try {
  loadEnvFile(path.resolve(__dirname, '.env.local'))
} catch (error) {
  console.warn('Warning: Could not load .env.local file')
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: [
      'lib/utils/setup.test.ts',
      'lib/validations/**/*.test.ts',
      'lib/supabase/**/*.test.ts',
      'lib/email/**/*.test.ts',
      'lib/middleware/**/*.test.ts',
      'app/api/leaderboard/**/*.test.ts',
    ],
    exclude: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      'services/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
