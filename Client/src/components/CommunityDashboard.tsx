import { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Search,
  ChevronRight,
  Zap,
  Medal,
  Loader2,
  ChevronDown,
  Activity,
  Code,
  ShieldAlert,
  Sword,
  ShieldCheck,
  Star,
  Globe,
  Monitor,
  Github,
  Handshake
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import MentorProgramPanel from '@/components/MentorProgramPanel';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  team: string;
  score: number;
  events: number;
  badges: string[];
  avatar: string;
  trend: 'up' | 'down' | 'same';
}

interface HackathonActivity {
  id: string;
  type: 'event' | 'achievement' | 'milestone' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  event: string;
  points?: number;
  participants?: number;
}

interface UpcomingEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  participants: number;
  maxParticipants: number;
  prize: string;
  status: 'upcoming' | 'registration_open' | 'ongoing';
}

interface Contributor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  contributions: number;
  role: string;
  githubUrl: string;
}

const CommunityDashboard = () => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'activities' | 'contributors' | 'mentors'>('leaderboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<HackathonActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([
    { id: '1', name: 'Aryan Sondharva', username: 'aryansondharva', avatar: 'https://github.com/aryansondharva.png', contributions: 156, role: 'Lead Architect', githubUrl: 'https://github.com/aryansondharva' },
    { id: '2', name: 'Hetvi Lad', username: 'hlad-2317', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shadow', contributions: 89, role: 'Senior Developer', githubUrl: '#' },
    { id: '3', name: 'Ghost Hacker', username: 'ghost_hacker', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ghost', contributions: 67, role: 'Security Analyst', githubUrl: '#' }
  ]);
  const [stats, setStats] = useState([
    { label: 'Active Operatives', value: '450+', change: '+12', icon: Users, color: 'text-red-500' },
    { label: 'Live Now', value: '0', change: 'Online', icon: Activity, color: 'text-red-600' },
    { label: 'Bounty Pool', value: '₹5L+', change: '+50K', icon: Award, color: 'text-yellow-500' },
    { label: 'Total Operatives', value: '24', change: 'Github', icon: Github, color: 'text-green-500' }
  ]);
  const [presence, setPresence] = useState({ onlineCount: 0, activities: [] });

  useEffect(() => {
    loadDashboardData();
    const presenceInterval = setInterval(fetchPresence, 10000); // Update every 10s
    return () => clearInterval(presenceInterval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [leaderboardData, activitiesData, eventsData, statsData, contributorsData, presenceData] = await Promise.all([
        fetchLeaderboard(),
        fetchActivities(),
        fetchUpcomingEvents(),
        fetchStats(),
        fetchContributors(),
        fetchPresence()
      ]);

      setLeaderboard(leaderboardData);
      setActivities(activitiesData);
      setUpcomingEvents(eventsData);
      if (contributorsData && contributorsData.length > 0) {
        setContributors(contributorsData);
      }
      if (statsData.length > 0) {
        // Merge presence count into stats
        const updatedStats = [...statsData];
        if (presenceData) {
          updatedStats[1] = { ...updatedStats[1], value: `${presenceData.onlineCount || 0}` };
        }
        setStats(updatedStats);
      }
      if (presenceData) setPresence(presenceData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const fetchPresence = async () => {
    try {
      const data = await api.get<any>('/community/presence');
      setPresence(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch presence:', error);
      return null;
    }
  };

  const fetchContributors = async (): Promise<Contributor[]> => {
    try {
      return await api.get<Contributor[]>('/community/contributors');
    } catch (error) {
      console.error('Failed to fetch contributors:', error);
      return [];
    }
  };

  const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    try {
      return await api.get<LeaderboardEntry[]>('/community/leaderboard');
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  };

  const fetchActivities = async (): Promise<HackathonActivity[]> => {
    try {
      return await api.get<HackathonActivity[]>('/community/activities');
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      return [];
    }
  };

  const fetchUpcomingEvents = async (): Promise<UpcomingEvent[]> => {
    try {
      return await api.get<UpcomingEvent[]>('/events/upcoming');
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error);
      return [];
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get<any>('/community/stats');
      return [
        { label: 'Active Operatives', value: `${data.activeHackers || 0}+`, change: `+${data.newHackers || 0}`, icon: Users, color: 'text-red-500' },
        { label: 'Live Now', value: '...', change: 'Online', icon: Activity, color: 'text-red-600' },
        { label: 'Total Bounty Pool', value: `₹${data.totalPrizePool || 0}L+`, change: `+${data.newPrizePool || 0}K`, icon: Award, color: 'text-yellow-500' },
        { label: 'Total Contributors', value: `${data.totalContributors || 0}`, change: `+${data.newContributors || 0}`, icon: Github, color: 'text-green-500' }
      ];
    } catch (error) {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 bg-[#0a0a0b]" />
        <div className="absolute inset-0 bg-[url('/textures/grunge-overlay.png')] opacity-10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-red-900/10 to-transparent pointer-events-none" />

        <div className="relative text-center">
          <div className="w-20 h-20 mb-6 mx-auto relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-2 border-b-white/20 border-t-transparent border-r-transparent border-l-transparent rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-8 h-8 text-red-600 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-1">Synchronizing</h2>
          <p className="text-white/40 text-sm font-mono">LINKING TO NEURAL NETWORK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white relative overflow-hidden font-sans">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/textures/grunge-overlay.png')] opacity-20" />
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-red-900/20 via-red-900/5 to-transparent shadow-inner" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]" />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-12 md:py-24">
        {/* Hero Section - Full Screen Entry */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] text-center mb-32 relative"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none">
            <h2 className="text-[25rem] md:text-[35rem] font-black italic tracking-tighter uppercase leading-none">AS</h2>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold tracking-widest uppercase text-white/70">Secure Community Access</span>
            </div>

            <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-red-500 to-red-800 text-animate-gradient drop-shadow-[0_0_30px_rgba(220,38,38,0.3)] pb-2 px-4 overflow-visible">
              COMMUNITY HUB
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mb-8 blur-[1px] animate-pulse" />

            <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed mb-16 px-4">
              The elite network of Tech Assassins. Dismantling monoliths, mastering frameworks,
              and claiming the digital throne.
            </p>

            {/* Tactical Stats Grid /*/}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto w-full px-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/5 transition-all duration-300 rounded-2xl border border-white/10 group-hover:border-red-600/30 backdrop-blur-md" />
                  <div className="relative p-6 flex flex-col items-center">
                    <div className={`mb-4 p-3 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-black font-mono tracking-tight mb-1">{stat.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 truncate">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Scroll Down Hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/20">Briefing Below</span>
            <div className="w-px h-12 bg-gradient-to-b from-red-600 to-transparent" />
          </motion.div>
        </motion.div>




        {/* Real-time Activity Ticker */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md overflow-hidden relative">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-600/30">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Live Feed</span>
              </div>
              <div className="flex-1 overflow-hidden h-6 relative">
                 <AnimatePresence mode="wait">
                    {presence.activities.length > 0 ? (
                      <motion.div
                        key={presence.activities[0]?.id || 'static'}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center gap-3"
                      >
                         <img 
                           src={presence.activities[0]?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${presence.activities[0]?.user}`} 
                           className="w-5 h-5 rounded-full border border-white/10" 
                           alt="" 
                         />
                         <span className="text-sm font-mono text-white/70">
                           <span className="text-red-500 font-bold uppercase italic">@{presence.activities[0]?.user}</span> 
                           {" "}{presence.activities[0]?.message}
                         </span>
                         <span className="text-[10px] text-white/20 uppercase font-black ml-auto">
                           {new Date(presence.activities[0]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </motion.div>
                    ) : (
                      <div className="text-sm font-mono text-white/30 uppercase tracking-widest">Scanning network for operative activity...</div>
                    )}
                 </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-6xl mx-auto">
          {/* Navigation Bar - Tactical Style */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10 p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            {(['leaderboard', 'activities', 'contributors', 'mentors'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-500 overflow-hidden ${activeTab === tab
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
                  }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-red-600 rounded-xl"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab === 'leaderboard' && <Trophy className="w-4 h-4" />}
                  {tab === 'activities' && <Activity className="w-4 h-4" />}
                  {tab === 'contributors' && (
                    <div className="flex -space-x-2 mr-2">
                      {contributors.slice(0, 3).map((c, i) => (
                        <div key={c.id} className="w-5 h-5 rounded-full border border-[#0a0a0b] overflow-hidden bg-white/10 ring-1 ring-white/5">
                          <img src={c.avatar} alt={c.username} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  {tab === 'contributors' && contributors.length === 0 && <Github className="w-4 h-4" />}
                  {tab === 'mentors' && <Handshake className="w-4 h-4" />}
                  {tab}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative min-h-[400px]"
            >
              {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative group max-w-md mx-auto mb-12">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Locate target in database..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all placeholder:text-white/20"
                    />
                  </div>

                  {/* Leaderboard Entries */}
                  <div className="space-y-3">
                    {leaderboard
                      .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((user, idx) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group relative bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-red-600/30 rounded-2xl p-4 md:p-6 transition-all duration-300 backdrop-blur-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="relative">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl italic ${user.rank === 1 ? 'text-yellow-500 bg-yellow-500/10' :
                                  user.rank === 2 ? 'text-slate-400 bg-slate-400/10' :
                                    user.rank === 3 ? 'text-amber-700 bg-amber-700/10' : 'text-white/40 bg-white/5'
                                  }`}>
                                  {user.rank}
                                </div>
                                {user.rank <= 3 && (
                                  <div className="absolute -top-1 -right-1">
                                    <Star className={`w-4 h-4 fill-current ${user.rank === 1 ? 'text-yellow-500' :
                                      user.rank === 2 ? 'text-slate-400' : 'text-amber-700'
                                      }`} />
                                  </div>
                                )}
                              </div>

                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 border border-white/10 group-hover:border-red-600/30 transition-all"
                              />

                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-red-500 transition-colors uppercase italic">{user.name}</h3>
                                  {user.badges.map((badge, i) => (
                                    <span key={i} className="text-xs filter grayscale group-hover:grayscale-0 transition-all">{badge}</span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white/30">
                                  <span className="text-red-500/80">@{user.username}</span>
                                  <span>•</span>
                                  <span>{user.events} Missions Completed</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-12 text-right">
                              <div className="hidden md:block">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Rank Trend</div>
                                <div className="text-2xl">{user.trend === 'up' ? '📈' : user.trend === 'down' ? '📉' : '➡️'}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Assessment</div>
                                <div className="text-3xl font-black italic text-red-600 font-mono tracking-tighter">{user.score}</div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {activities.map((activity, idx) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="grid grid-cols-[auto,1fr] gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.08] transition-all group"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 h-full flex flex-col items-center">
                          <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600">
                            {activity.type === 'event' && <Globe className="w-6 h-6" />}
                            {activity.type === 'achievement' && <Trophy className="w-6 h-6" />}
                            {activity.type === 'milestone' && <Target className="w-6 h-6" />}
                            {activity.type === 'announcement' && <Zap className="w-6 h-6" />}
                          </div>
                          <div className="w-0.5 h-full bg-white/5 my-4" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-bold uppercase italic text-white/90 group-hover:text-red-500 transition-colors">
                            {activity.title}
                          </h4>
                          <span className="text-xs font-mono text-white/30 uppercase tracking-widest">{activity.timestamp}</span>
                        </div>
                        <p className="text-white/50 text-sm leading-relaxed mb-4">{activity.description}</p>
                        <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-[0.15em] text-white/20">
                          <span className="text-red-600/80"># {activity.event}</span>
                          {activity.points && <span>POINTS EARNED: +{activity.points}</span>}
                          {activity.participants && <span>SEEN BY: {activity.participants} OTHERS</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'contributors' && (
                <div className="space-y-6">
                  {/* Search Bar for Contributors */}
                  <div className="relative group max-w-md mx-auto mb-12">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Identify operative by username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all placeholder:text-white/20"
                    />
                  </div>

                  <div className="flex overflow-x-auto scrollbar-hide snap-x gap-8 pb-8 -mx-4 px-4 items-center">
                    {contributors
                      .filter(c => c.username.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((contributor, idx) => (
                        <motion.div
                          key={contributor.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group flex-none flex flex-col items-center gap-4 snap-center cursor-pointer"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-red-600/20 rounded-full blur-xl group-hover:bg-red-600/40 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-red-600/50 to-transparent border border-white/10 group-hover:border-red-600/50 transition-all duration-500 shadow-2xl">
                              <img
                                src={contributor.avatar}
                                alt={contributor.username}
                                className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                              />
                              <div className="absolute bottom-1 right-1 bg-red-600 rounded-full p-2 border-2 border-[#0a0a0b] shadow-lg transform group-hover:scale-110 transition-transform">
                                <Github className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-center space-y-1">
                            <h3 className="text-sm font-black italic uppercase tracking-widest text-white/50 group-hover:text-red-600 transition-all">
                              {contributor.username}
                            </h3>
                            <div className="w-0 group-hover:w-full h-[1px] bg-red-600 transition-all duration-500" />
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}

              {activeTab === 'mentors' && (
                <MentorProgramPanel />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Futuristic Bottom Accents */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-30 shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
    </div>
  );
};

export default CommunityDashboard;
