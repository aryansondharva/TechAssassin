/**
 * Leaderboard Page Example
 * 
 * Example page showing how to integrate the Leaderboard components
 * into a full page layout.
 * 
 * This is a reference implementation - adapt as needed for your app.
 */

import { useState, useEffect } from 'react';
import { Leaderboard, UserPosition } from '@/components/gamification';
import { createClient } from '@/lib/supabase/client';

export default function LeaderboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error('Failed to get current user:', error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
          <p className="text-white/60">
            Compete with other users and climb the ranks!
          </p>
        </div>

        {/* User Position (only show if logged in) */}
        {userId && (
          <div className="max-w-3xl mx-auto">
            <UserPosition userId={userId} />
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="max-w-4xl mx-auto">
          <Leaderboard defaultPeriod="all-time" limit={100} />
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">
              How to Earn XP
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Participate in events and challenges</li>
              <li>• Contribute code to the community</li>
              <li>• Engage with other members</li>
              <li>• Complete your profile</li>
              <li>• Help others in the community</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
