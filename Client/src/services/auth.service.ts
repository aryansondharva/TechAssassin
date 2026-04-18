/**
 * Authentication Service (Migrated to Clerk)
 * 
 * Stub implementation that bridges legacy method calls to Clerk.
 * Some methods (like signUp/signIn) should now be handled purely by Clerk Components in React.
 */

import { api } from '@/lib/api-client';
import type { AuthResponse } from '@/types/api';

export const authService = {
  signUp: async (data: any): Promise<AuthResponse> => {
    throw new Error('Please use Clerk <SignUp /> component instead');
  },

  signIn: async (data: any): Promise<AuthResponse> => {
    throw new Error('Please use Clerk <SignIn /> component instead');
  },

  signOut: async (): Promise<void> => {
    if (typeof window !== 'undefined' && (window as any).Clerk) {
      await (window as any).Clerk.signOut();
    }
  },

  logout: async function() {
    await this.signOut();
  },

  getUser: (): any | null => {
    if (typeof window !== 'undefined' && (window as any).Clerk) {
      const user = (window as any).Clerk.user;
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

  updateUser: (userData: any): void => {
    // Left empty. Profile modifications should happen via Clerk Dashboard or Clerk UI Components
    console.warn('Profile modifications should be done via Clerk');
  },

  forgotPassword: async (data: any): Promise<void> => {},
  verifyOTP: async (data: any): Promise<void> => {},

  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined' && (window as any).Clerk) {
      return !!(window as any).Clerk.session;
    }
    return false;
  },

  signInWithProvider: async (provider: 'github' | 'google'): Promise<void> => {},
  sendMagicLink: async (email: string): Promise<void> => {},
  verifyMagicLink: async (email: string, otp: string): Promise<any> => ({}),
  resetPassword: async (data: any): Promise<void> => {},
};
