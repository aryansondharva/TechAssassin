/**
 * Authentication Service
 * 
 * Handles user authentication operations including sign up, sign in, sign out, and password reset.
 */

import { api, setAuthToken, clearAuthToken, API_URL } from '@/lib/api-client';
import type {
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  ResetPasswordRequest,
} from '@/types/api';

// OTP related types
interface ForgotPasswordRequest {
  email: string;
}

interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export const authService = {
  /**
   * Sign up a new user via Supabase
   */
  signUp: async (data: SignUpRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    
    // Store auth token and user
    if (response.token) {
      setAuthToken(response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
    }
    
    return response;
  },

  /**
   * Sign in via Supabase
   */
  signIn: async (data: SignInRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signin', data);
    
    // Store auth token and user
    if (response.token) {
      setAuthToken(response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
    }
    
    return response;
  },

  /**
   * Sign out the current user
   */
  signOut: async (): Promise<void> => {
    try {
      await api.post('/auth/signout');
    } catch (e) { /* ignore if already invalid */ }
    
    // Clear everything
    clearAuthToken();
    localStorage.removeItem('auth_user');
  },

  /**
   * Alias for signOut (used in Navbar)
   */
  logout: function() {
    this.signOut();
  },

  /**
   * Get the current authenticated user's profile
   */
  getUser: (): any | null => {
    try {
      const user = localStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('Identity corrupted, resetting link...');
      localStorage.removeItem('auth_user');
      return null;
    }
  },

  /**
   * Get the current authenticated user's ID
   */
  getCurrentUserId: (): string | null => {
    const user = authService.getUser();
    return user?.id || null;
  },

  /**
   * Request password reset OTP
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post('/auth/forgot-password', data);
  },

  /**
   * Verify OTP for password reset
   */
  verifyOTP: async (data: VerifyOTPRequest): Promise<void> => {
    await api.post('/auth/verify-otp', data);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
  /**
   * Sign in with Social Provider (OAuth)
   */
  signInWithProvider: async (provider: 'github' | 'google'): Promise<void> => {
    // In a real app with Supabase, this would call supabase.auth.signInWithOAuth
    // Since we are proxying, we redirect to a backend endpoint that handles the redirect
    window.location.href = `${API_URL}/auth/social?provider=${provider}`;
  },

  /**
   * Request Magic Link (Email OTP)
   */
  sendMagicLink: async (email: string): Promise<void> => {
    await api.post('/auth/magic-link', { email });
  },

  /**
   * Verify Magic Link OTP
   */
  verifyMagicLink: async (email: string, otp: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/verify-magic-link', { email, otp });
    
    if (response.token) {
      setAuthToken(response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
    }
    
    return response;
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (data: { email: string, otp: string, password: string }): Promise<void> => {
    await api.post('/auth/reset-password', data);
  },
};
