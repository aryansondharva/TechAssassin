import { useState, useEffect } from 'react';
import { Github, Users, Star, GitBranch, MessageSquare, Heart, ExternalLink, Trophy, Zap, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';

interface Contributor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  contributions: number;
  role: string;
  githubUrl: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  lastUpdated: string;
  tags: string[];
  githubUrl: string;
  demoUrl?: string;
}

const CommunitySection = () => {
  const [activeTab, setActiveTab] = useState<'contributors' | 'projects' | 'stats'>('contributors');
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const data = await api.get<Contributor[]>('/community/contributors');
        setContributors(data);
      } catch (error) {
        console.error('Failed to fetch contributors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContributors();
  }, []);

  const projects: Project[] = [
    {
      id: '1',
      name: 'TechAssassin Command Center',
      description: 'The central hub for the TechAssassin community, managing missions, operatives, and global impact.',
      stars: 1234,
      forks: 89,
      language: 'TypeScript',
      lastUpdated: '2 days ago',
      tags: ['React', 'Node.js', 'PostgreSQL'],
      githubUrl: 'https://github.com/aryansondharva/TechAssassin',
      demoUrl: 'https://community.techassassin.dev'
    },
    {
      id: '2',
      name: 'Mission Starter Kit',
      description: 'Boilerplate for launching new community missions and collaborative projects with elite workflows.',
      stars: 567,
      forks: 234,
      language: 'JavaScript',
      lastUpdated: '1 week ago',
      tags: ['Next.js', 'Tailwind CSS', 'Supabase'],
      githubUrl: 'https://github.com/TechAssassin/starter-kit'
    },
    {
      id: '3',
      name: 'Squad Assembly Engine',
      description: 'Intelligent squad formation based on operative skillsets and mission requirements.',
      stars: 234,
      forks: 45,
      language: 'Python',
      lastUpdated: '3 days ago',
      tags: ['Python', 'FastAPI', 'Machine Learning'],
      githubUrl: 'https://github.com/TechAssassin/team-formation'
    },
    {
      id: '4',
      name: 'Field Operative App',
      description: 'Real-time mission updates and operative communications on the go for active digital assassins.',
      stars: 189,
      forks: 67,
      language: 'React Native',
      lastUpdated: '5 days ago',
      tags: ['React Native', 'Firebase', 'Redux'],
      githubUrl: 'https://github.com/TechAssassin/mobile-app'
    }
  ];

  const stats = [
    { label: 'Total Operatives', value: '156+', icon: Users, color: 'text-blue-500' },
    { label: 'Active Missions', value: '23', icon: GitBranch, color: 'text-green-500' },
    { label: 'Global Impact', value: '3.2k+', icon: Star, color: 'text-yellow-500' },
    { label: 'Elite Members', value: '1.8k+', icon: Heart, color: 'text-red-500' }
  ];

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'TypeScript': 'bg-blue-500',
      'JavaScript': 'bg-yellow-500',
      'Python': 'bg-green-500',
      'React Native': 'bg-cyan-500'
    };
    return colors[language] || 'bg-gray-500';
  };

  return (
    <section id="community" className="py-20 bg-section-alt">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-primary font-semibold text-sm">Open Source Community</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            Join the <span className="text-primary">Global Elite</span> Squad
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            TechAssassin is powered by a community of elite operatives. Join the mission, 
            share intelligence, and evolve alongside the world's most capable builders.
          </p>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/aryansondharva/TechAssassin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <Github className="w-5 h-5" />
              Contribute on GitHub
            </a>
            <Link
              to="/community"
              className="inline-flex items-center gap-2 border border-border bg-background px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              <Users className="w-5 h-5" />
              Join Community
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-card rounded-xl p-6 text-center border border-border group hover:border-primary/50 transition-all duration-300">
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mb-3">{stat.label}</div>
                {stat.label === 'Total Operatives' && (
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-primary/10">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=contributor${i}`} 
                          alt="Contributor" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('contributors')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'contributors'
                  ? 'text-primary bg-primary/5 border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Operatives
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'projects'
                  ? 'text-primary bg-primary/5 border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GitBranch className="w-4 h-4 inline mr-2" />
              Missions
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'stats'
                  ? 'text-primary bg-primary/5 border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Elite Status
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'contributors' && (
              <div className="space-y-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <p className="text-white/40 font-black italic tracking-widest uppercase">Syncing Operatives...</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {contributors.map((contributor) => (
                        <div
                          key={contributor.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-background border border-border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={contributor.avatar}
                              alt={contributor.name}
                              className="w-12 h-12 rounded-full border border-primary/20"
                            />
                            <div>
                              <div className="font-semibold text-foreground">{contributor.name}</div>
                              <div className="text-sm text-muted-foreground">
                                @{contributor.username} • {contributor.role}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-semibold text-foreground">{contributor.contributions}</div>
                              <div className="text-xs text-muted-foreground">contributions</div>
                            </div>
                            <a
                              href={contributor.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Github className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                <div className="text-center pt-4">
                  <a
                    href="https://github.com/aryansondharva/TechAssassin/graphs/contributors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    View all contributors →
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 rounded-lg bg-background border border-border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{project.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {project.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getLanguageColor(project.language)}`} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {project.stars}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-4 h-4" />
                            {project.forks}
                          </span>
                          <span>{project.language}</span>
                          <span>Updated {project.lastUpdated}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {project.demoUrl && (
                            <a
                              href={project.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center pt-4">
                  <a
                    href="https://github.com/TechAssassin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    Explore all projects →
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Community Achievements</h3>
                  <p className="text-muted-foreground">Milestones and accomplishments from our amazing community</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy className="w-6 h-6 text-blue-500" />
                      <h4 className="font-semibold text-foreground">100+ Elite Operatives</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reached our first major milestone with over 100 active operatives from around the world.
                    </p>
                  </div>

                  <div className="p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="w-6 h-6 text-green-500" />
                      <h4 className="font-semibold text-foreground">5000+ Intelligence Reports</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Our squad has made over 5000 contributions, continuously optimizing the hub.
                    </p>
                  </div>

                  <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Star className="w-6 h-6 text-purple-500" />
                      <h4 className="font-semibold text-foreground">3.2k+ GitHub Stars</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Our projects have received overwhelming support from the developer community.
                    </p>
                  </div>

                  <div className="p-6 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Heart className="w-6 h-6 text-red-500" />
                      <h4 className="font-semibold text-foreground">Global Community</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contributors from 50+ countries working together to build amazing hackathon experiences.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <Link
                    to="/community/achievements"
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    View all achievements →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to Make an Impact?
          </h3>
          <p className="text-muted-foreground mb-6">
            Whether you're a developer, designer, or enthusiast, there's a place for you in our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/aryansondharva/TechAssassin/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Find an Issue to Solve
            </a>
            <Link
              to="/community/guidelines"
              className="inline-flex items-center gap-2 border border-border bg-background px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              <Heart className="w-5 h-5" />
              Contribution Guidelines
            </Link>
          </div>
          <div className="mt-4">
            <Link
              to="/mentorship"
              className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/15 transition-colors"
            >
              <Users className="w-5 h-5" />
              Explore Mentor Program
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
