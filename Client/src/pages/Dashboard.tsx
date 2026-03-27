import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { authService, profileService } from '@/services';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, LogOut, Calendar, Settings, Heart } from 'lucide-react';
import type { Profile } from '@/types/api';
import { getRealtimeManager } from '@/lib/services/realtime-manager';
import { getPresenceService } from '@/lib/services/presence-service';
import { ConnectionStatusIndicator } from '@/components/ConnectionStatusIndicator';
import { OnlineUsersList } from '@/components/OnlineUsersList';
import { ActivityFeed } from '@/components/ActivityFeed';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    // Initialize real-time services
    const initializeRealtime = async () => {
      try {
        const realtimeManager = getRealtimeManager();
        const presenceService = getPresenceService();

        // Connect to realtime
        await realtimeManager.connect();

        // Initialize presence service with user ID
        const userId = authService.getCurrentUserId() || 'guest-user';
        await presenceService.initialize(userId);

        // Track presence on dashboard page
        presenceService.trackPresence({
          type: 'page',
          id: 'dashboard',
        });

        // Update status to online
        await presenceService.updateStatus('online');

        // Subscribe to presence changes to update online count
        presenceService.onPresenceChange((state) => {
          const count = presenceService.getActiveCount({
            type: 'page',
            id: 'dashboard',
          });
          setOnlineCount(count);
        });
      } catch (error) {
        console.error('Failed to initialize realtime services:', error);
      }
    };

    initializeRealtime();

    // Cleanup on unmount
    return () => {
      const presenceService = getPresenceService();
      presenceService.stopTracking();
      presenceService.cleanup();
    };
  }, []);

  useEffect(() => {
    // For testing purposes, create mock data and show dashboard
    setIsLoading(false);
    
    // Mock profile data
    const mockProfile: Profile = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'John Doe',
      phone: null,
      aadhaar_number: null,
      avatar_url: null,
      github_url: null,
      bio: null,
      address: null,
      education: null,
      university: null,
      graduation_year: null,
      interests: null,
      banner_url: null,
      is_email_public: false,
      is_phone_public: false,
      is_address_public: false,
      is_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setProfile(mockProfile);
    
    // Only try to fetch real profile if authenticated
    if (authService.isAuthenticated()) {
      const fetchProfile = async () => {
        try {
          const data = await profileService.getMyProfile();
          setProfile(data);
        } catch (error) {
          if (error instanceof ApiError) {
            if (error.status === 401) {
              console.log('Profile not available, using mock data');
            } else {
              toast({
                title: 'Error',
                description: 'Failed to load profile',
                variant: 'destructive',
              });
            }
          }
        }
      };
      fetchProfile();
    }
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      // Stop presence tracking before signing out
      const presenceService = getPresenceService();
      presenceService.stopTracking();
      
      await authService.signOut();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully',
      });
      navigate('/signin');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator position="top-right" />

      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img src="/favicon.ico" alt="TechAssassin" className="w-8 h-8" />
              <h1 className="text-xl font-black italic uppercase tracking-tighter text-gray-900 border-l-2 border-red-600 pl-4">Command Center</h1>
            </div>
            <div className="flex items-center gap-3">
              {onlineCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-green-700">
                    {onlineCount} online
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-xl border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Hackathon Button */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Operative Status
                </h2>
                <Card className="bg-white border-2 border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 cursor-pointer overflow-hidden rounded-[2rem] group" onClick={() => navigate('/events')}>
                  <CardContent className="p-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="max-w-[70%]">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">Mission Operations</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">Access tactical briefing and deployment parameters for live operations.</p>
                      </div>
                      <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Calendar className="h-10 w-10 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-10 py-6 rounded-2xl shadow-lg shadow-blue-600/20">
                        Analyze Missions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Edit Profile Button */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Neural Configuration
                </h2>
                <Card className="bg-white border-2 border-gray-100 shadow-sm hover:shadow-2xl hover:border-green-100 transition-all duration-500 cursor-pointer overflow-hidden rounded-[2rem] group" onClick={() => navigate('/edit-profile')}>
                  <CardContent className="p-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="max-w-[70%]">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 mb-3 group-hover:text-green-600 transition-colors">Operative Identity</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">Modify your global footprint and synchronize your skill matrix with the network.</p>
                      </div>
                      <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Settings className="h-10 w-10 text-green-600" />
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-xs px-10 py-6 rounded-2xl shadow-lg shadow-green-600/20"
                      >
                        Sync Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Activity Feed */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" /> Network Activity
              </h2>
              <ActivityFeed showFilters={true} pageSize={10} />
            </motion.div>
          </div>

          {/* Right Column - Online Users */}
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Active Operatives
              </h2>
              <OnlineUsersList 
                location={{ type: 'page', id: 'dashboard' }}
                maxDisplay={10}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer - Same as Home Screen */}
      <footer className="bg-hero text-hero-foreground">
        {/* Footer links */}
        <div className="border-t border-hero-foreground/10">
          <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-heading font-bold text-xl mb-3">
                  Tech<span className="text-primary">Assassin</span>
                </h4>
                <p className="text-hero-muted text-sm leading-relaxed max-w-xs">
                  A hackathon community bringing together the brightest minds to
                  build, learn, and innovate.
                </p>
              </div>
              <div>
                <h5 className="font-heading font-semibold mb-3">Quick Links</h5>
                <ul className="space-y-2 text-hero-muted text-sm">
                  <li>
                    <a href="#prizes" className="hover:text-hero-foreground transition-colors">
                      Prizes
                    </a>
                  </li>
                  <li>
                    <a href="#tracks" className="hover:text-hero-foreground transition-colors">
                      Tracks
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-hero-foreground transition-colors">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="font-heading font-semibold mb-3">Community</h5>
                <ul className="space-y-2 text-hero-muted text-sm">
                  <li>
                    <a href="#" className="hover:text-hero-foreground transition-colors">
                      Discord
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-hero-foreground transition-colors">
                      Twitter / X
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-hero-foreground transition-colors">
                      Instagram
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="border-t border-hero-foreground/10">
          <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-hero-muted text-xs">
            <p>© 2026 TechAssasin. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with <Heart size={12} className="text-primary" /> by TechAssasin
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
