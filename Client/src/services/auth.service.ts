/**
 * Authentication Service (Migrated to Clerk)
 * 
 * Stub implementation that bridges legacy method calls to Clerk.
 * Some methods (like signUp/signIn) should now be handled purely by Clerk Components in React.
 */

import { api } from '@/lib/api-client';
import type { AuthResponse } from '@/types/api';

type ClerkUser = {
  id: string
  primaryEmailAddress?: { emailAddress: string } | null
  fullName?: string | null
  imageUrl?: string
  username?: string | null
}

type AppUser = {
  id: string
  email?: string
  full_name: string
  avatar_url?: string
  username?: string | null
}

const getClerk = () => (typeof window !== 'undefined' ? (window as Window & { Clerk?: { user?: ClerkUser; session?: { signOut?: () => Promise<void> }; signOut?: () => Promise<void> } }).Clerk : undefined)

export const authService = {
  signUp: async (_data: unknown): Promise<AuthResponse> => {
    throw new Error('Please use Clerk <SignUp /> component instead');
  },

  signIn: async (_data: unknown): Promise<AuthResponse> => {
    throw new Error('Please use Clerk <SignIn /> component instead');
  },

  signOut: async (): Promise<void> => {
    const clerk = getClerk()
    if (clerk?.signOut) {
      await clerk.signOut();
    }
  },

  logout: async function() {
    await this.signOut();
  },

  getUser: (): AppUser | null => {
    const clerk = getClerk()
    if (clerk?.user) {
      const user = clerk.user;
      if (!user) return null;
      return {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        full_name: user.fullName || '',
        avatar_url: user.imageUrl,
        username: user.username,
      };
    }
    return null;
  },

  updateUser: (_userData: unknown): void => {
    // Left empty. Profile modifications should happen via Clerk Dashboard or Clerk UI Components
    console.warn('Profile modifications should be done via Clerk');
  },

  forgotPassword: async (_data: unknown): Promise<void> => {},
  verifyOTP: async (_data: unknown): Promise<void> => {},

  isAuthenticated: (): boolean => {
    return Boolean(getClerk()?.session);
  },

  signInWithProvider: async (provider: 'github' | 'google'): Promise<void> => {},
  sendMagicLink: async (email: string): Promise<void> => {},
  verifyMagicLink: async (_email: string, _otp: string): Promise<Record<string, never>> => ({}),
  resetPassword: async (_data: unknown): Promise<void> => {},
};
