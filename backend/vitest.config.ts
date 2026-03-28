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
    setupFiles: ['./__tests__/setup/vitest.setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000, // 30 seconds for setup/teardown hooks
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
