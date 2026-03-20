import { 
  BookOpen, 
  Users, 
  Code, 
  Heart, 
  Shield, 
  Zap, 
  Award,
  MessageSquare,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';

const CommunityGuidelines = () => {
  const guidelines = [
    {
      icon: Heart,
      title: 'Be Respectful and Inclusive',
      description: 'Treat everyone with respect, regardless of their experience level, background, or perspective. We welcome contributors from all walks of life.',
      color: 'text-red-500',
      examples: [
        'Use inclusive language and avoid assumptions',
        'Respect different opinions and approaches',
        'Help newcomers learn and grow',
        'Celebrate diverse perspectives and backgrounds'
      ]
    },
    {
      icon: Code,
      title: 'Write Quality Code',
      description: 'Maintain high standards for code quality. Write clean, well-documented code that others can understand and build upon.',
      color: 'text-blue-500',
      examples: [
        'Follow the project\'s coding standards',
        'Write meaningful commit messages',
        'Include tests for new features',
        'Document your code and APIs'
      ]
    },
    {
      icon: Users,
      title: 'Collaborate Effectively',
      description: 'Work together as a team. Share knowledge, provide constructive feedback, and help others succeed.',
      color: 'text-green-500',
      examples: [
        'Review pull requests thoughtfully',
        'Provide helpful and constructive feedback',
        'Mentor others when possible',
        'Communicate clearly and professionally'
      ]
    },
    {
      icon: Shield,
      title: 'Maintain Security',
      description: 'Keep the project and community safe. Follow security best practices and report vulnerabilities responsibly.',
      color: 'text-purple-500',
      examples: [
        'Never expose sensitive information',
        'Report security issues privately',
        'Follow secure coding practices',
        'Keep dependencies updated'
      ]
    }
  ];

  const contributionTypes = [
    {
      icon: Code,
      title: 'Code Contributions',
      description: 'Write code, fix bugs, add features, and improve performance.',
      skills: ['Programming', 'Testing', 'Debugging', 'Performance Optimization'],
      difficulty: 'Varies by task'
    },
    {
      icon: MessageSquare,
      title: 'Documentation',
      description: 'Write guides, tutorials, API docs, and help improve existing documentation.',
      skills: ['Technical Writing', 'Teaching', 'Communication', 'Research'],
      difficulty: 'Beginner to Intermediate'
    },
    {
      icon: Zap,
      title: 'Community Support',
      description: 'Help others, answer questions, and participate in discussions.',
      skills: ['Communication', 'Problem Solving', 'Patience', 'Empathy'],
      difficulty: 'Beginner'
    },
    {
      icon: Award,
      title: 'Design & UX',
      description: 'Improve user experience, create designs, and enhance accessibility.',
      skills: ['UI/UX Design', 'Accessibility', 'User Research', 'Figma/Sketch'],
      difficulty: 'Intermediate'
    }
  ];

  const gettingStarted = [
    {
      icon: BookOpen,
      title: 'Read the Documentation',
      description: 'Familiarize yourself with the project structure, technologies used, and existing documentation.',
      action: 'Start with the README and explore the wiki'
    },
    {
      icon: GitBranch,
      title: 'Set Up Development Environment',
      description: 'Install necessary tools, clone the repository, and get the project running locally.',
      action: 'Follow the setup guide in the documentation'
    },
    {
      icon: CheckCircle,
      title: 'Find an Issue to Work On',
      description: 'Look for issues labeled "good first issue" or create a new one for bugs you discover.',
      action: 'Check the issues tab on GitHub'
    },
    {
      icon: MessageSquare,
      title: 'Introduce Yourself',
      description: 'Join our community channels and let us know you\'re interested in contributing.',
      action: 'Say hello in our discussions or Discord'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">Community Guidelines</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Welcome to the <span className="text-primary">TechAssassin</span> Community
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            We're thrilled to have you join our open source community! These guidelines will help you 
            contribute effectively and make the most of your experience with TechAssassin.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Core Principles */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Our Core Principles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {guidelines.map((guideline, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg bg-primary/10 ${guideline.color}`}>
                    <guideline.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">{guideline.title}</h3>
                    <p className="text-muted-foreground mb-4">{guideline.description}</p>
                    <div className="space-y-2">
                      {guideline.examples.map((example, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{example}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ways to Contribute */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Ways to Contribute</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contributionTypes.map((type, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow">
                <div className={`p-3 rounded-lg bg-primary/10 ${type.color} mb-4 inline-block`}>
                  <type.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{type.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{type.description}</p>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Skills needed:</div>
                  <div className="flex flex-wrap gap-1">
                    {type.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Difficulty: <span className="font-medium">{type.difficulty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Getting Started</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {gettingStarted.map((step, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <step.icon className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-3">{step.description}</p>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <p className="text-sm text-primary font-medium">{step.action}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Code of Conduct */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-8 border border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-foreground">Code of Conduct</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                Our community is dedicated to providing a harassment-free experience for everyone, regardless of 
                gender, gender identity and expression, sexual orientation, disability, physical appearance, 
                body size, race, ethnicity, age, religion, or nationality.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Expected Behavior
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Use welcoming and inclusive language</li>
                    <li>• Be respectful of different viewpoints and experiences</li>
                    <li>• Gracefully accept constructive criticism</li>
                    <li>• Focus on what is best for the community</li>
                    <li>• Show empathy towards other community members</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Unacceptable Behavior
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Harassment, trolling, or discriminatory language</li>
                    <li>• Personal attacks or insults</li>
                    <li>• Publishing private information without consent</li>
                    <li>• Spam or excessive self-promotion</li>
                    <li>• Disruptive behavior that affects others' ability to participate</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Helpful Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <Lightbulb className="w-6 h-6 text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">First-Time Contributors</h3>
              <p className="text-muted-foreground text-sm mb-4">
                New to open source? Check out our beginner-friendly resources and find your first contribution.
              </p>
              <a
                href="https://github.com/aryansondharva/TechAssassin/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Find Good First Issues →
              </a>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <MessageSquare className="w-6 h-6 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Get Help</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Stuck on something? Our community is here to help. Ask questions in discussions or join our Discord.
              </p>
              <a
                href="https://github.com/aryansondharva/TechAssassin/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Join Discussions →
              </a>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <Award className="w-6 h-6 text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Recognition</h3>
              <p className="text-muted-foreground text-sm mb-4">
                We celebrate our contributors! Learn about our recognition program and how you can earn badges.
              </p>
              <a
                href="/community/achievements"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                View Achievements →
              </a>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 border border-primary/20">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ready to Make Your First Contribution?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Every contribution, no matter how small, helps make TechAssassin better. 
              Join our community and start making an impact today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/aryansondharva/TechAssassin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <Code className="w-5 h-5" />
                Start Contributing
              </a>
              <a
                href="https://github.com/aryansondharva/TechAssassin/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-border bg-background px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Find Issues
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CommunityGuidelines;
