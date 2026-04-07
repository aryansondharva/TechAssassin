/**
 * Auth Callback Page
 * 
 * Handles OAuth and Magic Link callbacks from Supabase
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();
        
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error('No session found');
        }

        // Store auth token and user
        localStorage.setItem('auth_token', session.access_token);
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          localStorage.setItem('auth_user', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            username: profile.username,
            full_name: profile.full_name,
          }));
        }

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          navigate('/signin', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hero-bg via-hero-bg to-hero-bg">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-xl font-bold">Authentication Failed</div>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hero-bg via-hero-bg to-hero-bg">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-xl font-bold text-gray-900">Completing authentication...</p>
        <p className="text-sm text-gray-600">Please wait while we sign you in</p>
      </div>
    </div>
  );
}
