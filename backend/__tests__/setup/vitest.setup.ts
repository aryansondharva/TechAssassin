/**
 * Vitest Global Setup
 * 
 * Mocks the Supabase server client to use a test client instead
 */

import { vi } from 'vitest';
import { createTestClient } from './test-supabase-client';

// Mock the Supabase server client module
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => createTestClient(),
}));
