import { useState } from 'react';
import { 
  Github, 
  Users, 
  Star, 
  GitBranch, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Award,
  Code,
  BookOpen,
  HelpCircle,
  Bell,
  Search,
  Filter,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'contribution' | 'issue' | 'pull_request' | 'discussion';
  title: string;
  description: string;
  timestamp: string;
  author: string;
  avatar: string;
  project: string;
  tags: string[];
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  project: string;
  postedBy: string;
  postedAt: string;
  applicants: number;
}

const CommunityDashboard = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'contributions' | 'opportunities' | 'discussions'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with real data from backend
  const activities: Activity[] = [
    {
      id: '1',
      type: 'contribution',
      title: 'Fixed responsive navigation on mobile',
      description: 'Resolved CSS issues causing navigation overlap on mobile devices',
      timestamp: '2 hours ago',
      author: 'Sarah Chen',
      avatar: 'https://avatars.githubusercontent.com/u/87654321?v=4',
      project: 'TechAssassin Platform',
      tags: ['bug-fix', 'css', 'mobile']
    },
    {
      id: '2',
      type: 'pull_request',
      title: 'Add dark mode support',
      description: 'Implemented comprehensive dark mode with theme persistence',
      timestamp: '5 hours ago',
      author: 'Mike Johnson',
      avatar: 'https://avatars.githubusercontent.com/u/11223344?v=4',
      project: 'TechAssassin Platform',
      tags: ['feature', 'ui', 'dark-mode']
    },
    {
      id: '3',
      type: 'issue',
      title: 'Improve team formation algorithm',
      description: 'Looking for help optimizing the team matching logic for better compatibility',
      timestamp: '1 day ago',
      author: 'Alex Kumar',
      avatar: 'https://avatars.githubusercontent.com/u/99887766?v=4',
      project: 'Team Formation API',
      tags: ['enhancement', 'algorithm', 'python']
    },
    {
      id: '4',
      type: 'discussion',
      title: 'Best practices for hackathon organization',
      description: 'Community discussion on organizing successful hackathons',
      timestamp: '2 days ago',
      author: 'Emily Davis',
      avatar: 'https://avatars.githubusercontent.com/u/55667788?v=4',
      project: 'Community',
      tags: ['discussion', 'best-practices', 'organization']
    }
  ];

  const opportunities: Opportunity[] = [
    {
      id: '1',
      title: 'Add real-time notifications',
      description: 'Implement WebSocket-based real-time notifications for hackathon updates',
      difficulty: 'intermediate',
      tags: ['websocket', 'notifications', 'real-time'],
      project: 'TechAssassin Platform',
      postedBy: 'Aryan Sondharva',
      postedAt: '3 hours ago',
      applicants: 3
    },
    {
      id: '2',
      title: 'Improve mobile app performance',
      description: 'Optimize React Native app for better performance on lower-end devices',
      difficulty: 'advanced',
      tags: ['performance', 'react-native', 'optimization'],
      project: 'Hackathon Mobile App',
      postedBy: 'Sarah Chen',
      postedAt: '1 day ago',
      applicants: 5
    },
    {
      id: '3',
      title: 'Write API documentation',
      description: 'Create comprehensive API documentation for the team formation service',
      difficulty: 'beginner',
      tags: ['documentation', 'api', 'writing'],
      project: 'Team Formation API',
      postedBy: 'Mike Johnson',
      postedAt: '2 days ago',
      applicants: 8
    },
    {
      id: '4',
      title: 'Add unit tests for frontend',
      description: 'Write comprehensive unit tests for React components using Jest and Testing Library',
      difficulty: 'intermediate',
      tags: ['testing', 'jest', 'react'],
      project: 'TechAssassin Platform',
      postedBy: 'Emily Davis',
      postedAt: '3 days ago',
      applicants: 12
    }
  ];

  const stats = [
    { label: 'Your Contributions', value: '23', change: '+3', icon: Code, color: 'text-blue-500' },
    { label: 'Issues Resolved', value: '15', change: '+2', icon: GitBranch, color: 'text-green-500' },
    { label: 'Discussions', value: '8', change: '+1', icon: MessageSquare, color: 'text-purple-500' },
    { label: 'Community Points', value: '156', change: '+25', icon: Award, color: 'text-yellow-500' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'beginner': 'bg-green-500',
      'intermediate': 'bg-yellow-500',
      'advanced': 'bg-red-500'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-500';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      'contribution': Code,
      'issue': HelpCircle,
      'pull_request': GitBranch,
      'discussion': MessageSquare
    };
    return icons[type as keyof typeof icons] || Code;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'contributions' && activity.type === 'contribution') ||
      (activeFilter === 'opportunities' && activity.type === 'issue') ||
      (activeFilter === 'discussions' && activity.type === 'discussion');
    
    const matchesSearch = searchTerm === '' || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Community Dashboard</h1>
              <p className="text-muted-foreground">Connect, contribute, and collaborate with the TechAssassin community</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              </button>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Github className="w-4 h-4" />
                Your Profile
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
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filter */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'contributions', 'opportunities', 'discussions'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter as any)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeFilter === filter
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border border-border hover:bg-accent'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Activities Feed */}
            <div className="space-y-4">
              {filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="bg-card rounded-lg p-4 border border-border hover:bg-accent transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={activity.avatar}
                          alt={activity.author}
                          className="w-10 h-10 rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-foreground">{activity.title}</span>
                          <span className="text-xs text-muted-foreground">• {activity.timestamp}</span>
                        </div>
                        <p className="text-muted-foreground mb-3">{activity.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{activity.author}</span>
                            <span>•</span>
                            <span>{activity.project}</span>
                          </div>
                          <div className="flex gap-2">
                            {activity.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <a
                  href="https://github.com/aryansondharva/TechAssassin/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium">Report an Issue</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </a>
                <a
                  href="https://github.com/aryansondharva/TechAssassin/pulls"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium">View Pull Requests</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </a>
                <Link
                  to="/community/discussions"
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium">Start Discussion</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            </div>

            {/* Opportunities */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Contribution Opportunities</h3>
                <Link to="/community/opportunities" className="text-primary text-sm hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {opportunities.slice(0, 3).map((opportunity) => (
                  <div key={opportunity.id} className="p-3 rounded-lg bg-background border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${getDifficultyColor(opportunity.difficulty)}`} />
                      <span className="text-xs font-medium text-muted-foreground uppercase">{opportunity.difficulty}</span>
                    </div>
                    <h4 className="font-medium text-foreground mb-1">{opportunity.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{opportunity.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{opportunity.applicants} applicants</span>
                      <Link
                        to={`/community/opportunities/${opportunity.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Apply →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-4">Resources</h3>
              <div className="space-y-2">
                <a
                  href="https://github.com/aryansondharva/TechAssassin/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-sm">Contribution Guide</span>
                </a>
                <a
                  href="https://github.com/aryansondharva/TechAssassin/wiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Code className="w-4 h-4 text-primary" />
                  <span className="text-sm">Documentation</span>
                </a>
                <Link
                  to="/community/support"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">Get Help</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDashboard;
