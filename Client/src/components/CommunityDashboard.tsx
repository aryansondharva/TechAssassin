import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar,
  TrendingUp,
  Award,
  Target,
  Clock,
  Star,
  Search,
  Filter,
  ChevronRight,
  Zap,
  Medal,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';

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

const CommunityDashboard = () => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'activities' | 'events' | 'achievements'>('leaderboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<HackathonActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [stats, setStats] = useState([
    { label: 'Active Hackers', value: '0', change: '+0', icon: Users, color: 'text-blue-500' },
    { label: 'Total Events', value: '0', change: '+0', icon: Calendar, color: 'text-green-500' },
    { label: 'Prize Pool', value: '₹0', change: '+0', icon: Award, color: 'text-yellow-500' },
    { label: 'Teams Formed', value: '0', change: '+0', icon: Target, color: 'text-purple-500' }
  ]);

  // Load data from database
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [leaderboardData, activitiesData, eventsData, statsData] = await Promise.all([
        fetchLeaderboard(),
        fetchActivities(),
        fetchUpcomingEvents(),
        fetchStats()
      ]);

      setLeaderboard(leaderboardData);
      setActivities(activitiesData);
      setUpcomingEvents(eventsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    try {
      const response = await api.get('/community/leaderboard');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  };

  const fetchActivities = async (): Promise<HackathonActivity[]> => {
    try {
      const response = await api.get('/community/activities');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      return [];
    }
  };

  const fetchUpcomingEvents = async (): Promise<UpcomingEvent[]> => {
    try {
      const response = await api.get('/events/upcoming');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error);
      return [];
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/community/stats');
      const data = response.data || {};
      
      return [
        { 
          label: 'Active Hackers', 
          value: `${data.activeHackers || 0}+`, 
          change: `+${data.newHackers || 0}`, 
          icon: Users, 
          color: 'text-blue-500' 
        },
        { 
          label: 'Total Events', 
          value: `${data.totalEvents || 0}`, 
          change: `+${data.newEvents || 0}`, 
          icon: Calendar, 
          color: 'text-green-500' 
        },
        { 
          label: 'Prize Pool', 
          value: `₹${data.totalPrizePool || 0}L+`, 
          change: `+${data.newPrizePool || 0}K`, 
          icon: Award, 
          color: 'text-yellow-500' 
        },
        { 
          label: 'Teams Formed', 
          value: `${data.teamsFormed || 0}`, 
          change: `+${data.newTeams || 0}`, 
          icon: Target, 
          color: 'text-purple-500' 
        }
      ];
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return [
        { label: 'Active Hackers', value: '0', change: '+0', icon: Users, color: 'text-blue-500' },
        { label: 'Total Events', value: '0', change: '+0', icon: Calendar, color: 'text-green-500' },
        { label: 'Prize Pool', value: '₹0', change: '+0', icon: Award, color: 'text-yellow-500' },
        { label: 'Teams Formed', value: '0', change: '+0', icon: Target, color: 'text-purple-500' }
      ];
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'upcoming': 'bg-blue-500',
      'registration_open': 'bg-green-500',
      'ongoing': 'bg-yellow-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      'event': Calendar,
      'achievement': Trophy,
      'milestone': Target,
      'announcement': Star
    };
    return icons[type as keyof typeof icons] || Calendar;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading community data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Hackathon Community</h1>
              <p className="text-muted-foreground">Live data from PostgreSQL database</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadDashboardData}
                className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Loader2 className="w-4 h-4" />
                Refresh
              </button>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                View Events
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-xs text-green-500 font-semibold">{stat.change}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-card rounded-xl border border-border mb-6">
          <div className="flex border-b border-border">
            {['leaderboard', 'activities', 'events', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === tab
                    ? 'text-primary bg-primary/5 border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'leaderboard' && <Trophy className="w-4 h-4 inline mr-2" />}
                {tab === 'activities' && <TrendingUp className="w-4 h-4 inline mr-2" />}
                {tab === 'events' && <Calendar className="w-4 h-4 inline mr-2" />}
                {tab === 'achievements' && <Award className="w-4 h-4 inline mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">Live Leaderboard</h3>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search hackers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {leaderboard
                    .filter(entry => 
                      searchTerm === '' || 
                      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      entry.team.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-background border border-border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            entry.rank === 1 ? 'bg-yellow-500' :
                            entry.rank === 2 ? 'bg-gray-400' :
                            entry.rank === 3 ? 'bg-orange-600' : 'bg-gray-600'
                          }`}>
                            {entry.rank}
                          </div>
                        </div>
                        <img
                          src={entry.avatar}
                          alt={entry.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-semibold text-foreground">{entry.name}</div>
                          <div className="text-sm text-muted-foreground">{entry.team}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="font-bold text-foreground">{entry.score}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{entry.events}</div>
                          <div className="text-xs text-muted-foreground">events</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg">{getTrendIcon(entry.trend)}</div>
                        </div>
                        <div className="flex gap-1">
                          {entry.badges.slice(0, 2).map((badge, index) => (
                            <span key={index} className="text-lg" title={badge}>{badge}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mb-6">Recent Activities</h3>
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border hover:bg-accent transition-colors"
                      >
                        <div className={`p-3 rounded-lg bg-primary/10 text-primary`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground">{activity.title}</h4>
                            {activity.points && (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                +{activity.points} pts
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-2">{activity.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{activity.timestamp}</span>
                            <span>•</span>
                            <span>{activity.event}</span>
                            {activity.participants && (
                              <>
                                <span>•</span>
                                <span>{activity.participants} participants</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mb-6">Upcoming Hackathons</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 rounded-lg bg-background border border-border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">{event.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Calendar className="w-4 h-4" />
                            <span>{event.date}</span>
                            <span>•</span>
                            <span>{event.location}</span>
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`} />
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{event.participants}/{event.maxParticipants}</span>
                        </div>
                        <div className="font-semibold text-primary">{event.prize}</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(event.participants / event.maxParticipants) * 100}%` }}
                        />
                      </div>
                      <Link
                        to={`/events/${event.id}`}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-foreground mb-6">Community Achievements</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      <h4 className="font-semibold text-foreground">Hackathon Champion</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Win first place in any hackathon event
                    </p>
                    <div className="flex items-center gap-2">
                      <Medal className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Awarded to top performers</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="w-6 h-6 text-blue-500" />
                      <h4 className="font-semibold text-foreground">Speed Coder</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete a project in record time
                    </p>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">For fast developers</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-6 h-6 text-green-500" />
                      <h4 className="font-semibold text-foreground">Team Player</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Participate in 5+ team events
                    </p>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Team collaboration experts</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Star className="w-6 h-6 text-purple-500" />
                      <h4 className="font-semibold text-foreground">Rising Star</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Top 10 in first hackathon
                    </p>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">New talent recognition</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDashboard;
