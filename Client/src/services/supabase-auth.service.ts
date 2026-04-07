/**
 * Supabase Authentication Service
 * 
 * Direct integration with Supabase Auth for sign up, sign in, OAuth, and password reset
 */

import { createClient } from '@/lib/supabase/client';
import type { AuthResponse, SignUpRequest, SignInRequest } from '@/types/api';

export const supabaseAuthService = {
  /**
   * Sign up a new user with Supabase Auth
   */
  signUp: async (data: SignUpRequest): Promise<AuthResponse> => {
    const supabase = createClient();
    
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          full_name: data.full_name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!authData.user) {
      throw new Error('Sign up failed');
    }

    // Create profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: data.username,
        full_name: data.full_name,
        email: data.email,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't throw - profile might be created by trigger
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        username: data.username,
        full_name: data.full_name,
      },
      token: authData.session?.access_token || '',
    };
  },

  /**
   * Sign in with email and password
   */
  signIn: async (data: SignInRequest): Promise<AuthResponse> => {
    const supabase = createClient();
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!authData.user || !authData.session) {
      throw new Error('Sign in failed');
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        username: profile?.username || '',
        full_name: profile?.full_name || '',
      },
      token: authData.session.access_token,
    };
  },

  /**
   * Sign in with OAuth provider (Google, GitHub)
   */
  signInWithProvider: async (provider: 'google' | 'github'): Promise<void> => {
    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async (): Promise<void> => {
    const supabase = createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
    }

    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  /**
   * Send password reset email
   */
  forgotPassword: async (email: string): Promise<void> => {
    const supabase = createClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Update password
   */
  updatePassword: async (newPassword: string): Promise<void> => {
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Send magic link (OTP) to email
   */
  sendMagicLink: async (email: string): Promise<void> => {
    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Verify OTP token
   */
  verifyOTP: async (email: string, token: string): Promise<AuthResponse> => {
    const supabase = createClient();
    
    const { data: authData, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!authData.user || !authData.session) {
      throw new Error('OTP verification failed');
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        username: profile?.username || '',
        full_name: profile?.full_name || '',
      },
      token: authData.session.access_token,
    };
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const session = await supabaseAuthService.getSession();
    return !!session;
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const supabase = createClient();
    return supabase.auth.onAuthStateChange(callback);
  },
};
