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
  Lightbulb,
  ShieldCheck,
  Target,
  Sword,
  ShieldAlert,
  Terminal,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const CommunityGuidelines = () => {
  const guidelines = [
    {
      icon: Heart,
      title: 'Honor & Inclusivity',
      description: 'The brotherhood remains strong through respect. Treat every operative with honor, regardless of their rank or origin.',
      color: 'text-red-500',
      bg: 'bg-red-500/5',
      border: 'border-red-500/20',
      examples: [
        'Use precise, professional language',
        'Respect diverse technical approaches',
        'Mentor junior operatives with patience',
        'Forge a circle of trust and respect'
      ]
    },
    {
      icon: Sword,
      title: 'Unyielding Code Quality',
      description: 'A dull blade fails the mission. Maintain the sharpest standards for code quality and documentation.',
      color: 'text-blue-500',
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/20',
      examples: [
        'Follow established design patterns',
        'Write atomic, meaningful commits',
        'Weaponize tests for every feature',
        'Leave documentation for future agents'
      ]
    },
    {
      icon: Users,
      title: 'Tactical Collaboration',
      description: 'No assassin works alone. Coordinate, communicate, and execute as a synchronized unit.',
      color: 'text-green-500',
      bg: 'bg-green-500/5',
      border: 'border-green-500/20',
      examples: [
        'Perform ruthless but fair reviews',
        'Provide actionable, tactical feedback',
        'Synchronize knowledge across the team',
        'Over-communicate critical intel'
      ]
    },
    {
      icon: ShieldCheck,
      title: 'Fortified Security',
      description: 'Zero leaks. Zero compromise. Follow the shadows of security best practices religiously.',
      color: 'text-purple-500',
      bg: 'bg-purple-500/5',
      border: 'border-purple-500/20',
      examples: [
        'Sanitize all input vectors',
        'Report structural flaws privately',
        'Maintain an airtight dependency chain',
        'Protect secrets like your life depends on it'
      ]
    }
  ];

  const contributionTypes = [
    {
      icon: Code,
      title: 'Infrastructure Maintenance',
      description: 'Architecting core systems, dismantling bugs, and optimizing critical paths.',
      skills: ['Engine Design', 'Debugging', 'Optimization'],
      difficulty: 'ELITE'
    },
    {
      icon: Terminal,
      title: 'Intel & Documentation',
      description: 'Mapping the system, creating field manuals, and briefing operatives.',
      skills: ['Technical Intel', 'Writing', 'Communication'],
      difficulty: 'OPERATIVE'
    },
    {
      icon: Zap,
      title: 'Field Support',
      description: 'Responding to distress signals and helping newcomers navigate the grid.',
      skills: ['Problem Solving', 'Instruction', 'Patience'],
      difficulty: 'RECRUIT'
    },
    {
      icon: Award,
      title: 'Visual Strategy',
      description: 'Mastering the user interface and ensuring aesthetic dominance across the platform.',
      skills: ['UI/UX Design', 'Aesthetics', 'Accessibility'],
      difficulty: 'STRATEGIST'
    }
  ];

  const gettingStarted = [
    {
      icon: BookOpen,
      title: 'Intelligence Gathering',
      description: 'Dissect the project blueprint. Understand the stack, the mission, and the endgame.',
      action: 'INITIATE README SCRUTINY'
    },
    {
      icon: ShieldAlert,
      title: 'Environment Calibration',
      description: 'Configure your tactical workstation. Clone the repo and establish local connectivity.',
      action: 'ZERO-IN WORKSPACE'
    },
    {
      icon: Target,
      title: 'Target Acquisition',
      description: 'Locate open bounties. Identify "good first issues" and claim your objective.',
      action: 'ASSIGN COMPONENT'
    },
    {
      icon: MessageSquare,
      title: 'Signal Broadcaster',
      description: 'Identify yourself to the network. Sync with the community on Discord or Discussions.',
      action: 'BROADCAST PRESENCE'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white selection:bg-red-600/30">
      {/* Cinematic Header Overlay */}
      <div className="relative border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/textures/grunge-overlay.png')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 to-transparent" />
        
        <div className="container mx-auto px-4 py-24 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-xl"
          >
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <span className="text-white/60 text-xs font-black uppercase tracking-[0.3em]">Code of Honor</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-8 leading-none">
            RULES OF <span className="text-red-600">ENGAGEMENT</span>
          </h1>
          
          <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed uppercase tracking-wide">
            The mission is simple: build the future. <br/>
            The execution must be flawless.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
        {/* Rules of Engagement */}
        <section className="mb-32">
          <div className="flex items-center gap-6 mb-16">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Core Directives</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {guidelines.map((guideline, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className={`p-10 rounded-[2.5rem] bg-[#0d0d0e] border ${guideline.border} hover:border-red-600/30 transition-all duration-500 group`}
              >
                <div className="flex items-start gap-8">
                  <div className={`p-5 rounded-3xl ${guideline.bg} ${guideline.color} group-hover:scale-110 transition-transform duration-500`}>
                    <guideline.icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black italic text-white group-hover:text-red-600 transition-colors uppercase mb-4">{guideline.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-8 font-medium">{guideline.description}</p>
                    <ul className="grid grid-cols-1 gap-3">
                      {guideline.examples.map((example, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">
                          <CheckCircle className="w-4 h-4 text-red-600" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Tactical Roles */}
        <section className="mb-32">
          <div className="flex items-center gap-6 mb-16">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Combat Specialties</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {contributionTypes.map((type, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-red-600/20 hover:bg-white/[0.04] transition-all duration-500 group"
              >
                <div className="p-4 rounded-2xl bg-white/5 text-white/40 group-hover:text-red-600 mb-8 inline-block transition-colors">
                  <type.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter text-white mb-3">{type.title}</h3>
                <p className="text-white/30 text-xs font-bold leading-relaxed mb-8 uppercase tracking-wide">{type.description}</p>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {type.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md bg-white/5 border border-white/10 text-white/40">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/20 underline decoration-red-600/30">Difficulty</span>
                     <span className="text-[10px] font-black text-red-600">{type.difficulty}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Master Deployment Flow */}
        <section className="mb-32 overflow-hidden relative p-12 md:p-24 rounded-[4rem] bg-[#0d0d0e] border border-white/5">
           <div className="absolute top-0 right-0 p-12 text-8xl font-black italic text-white/[0.02] select-none uppercase">Sequence</div>
           
           <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-center mb-24">Activation Sequence</h2>
           
           <div className="grid md:grid-cols-2 gap-x-12 gap-y-24 relative">
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-red-600/50 via-red-600/10 to-transparent" />
              
              {gettingStarted.map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex items-center gap-10 ${index % 2 === 0 ? 'md:text-right md:flex-row-reverse' : ''}`}
                >
                  <div className="flex-shrink-0 w-20 h-20 bg-red-600 text-white rounded-3xl flex items-center justify-center font-black italic text-4xl shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className={`flex items-center gap-3 mb-4 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                       <step.icon className="w-6 h-6 text-red-600" />
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white/90">{step.title}</h3>
                    </div>
                    <p className="text-white/40 text-sm font-medium mb-8 leading-relaxed max-w-md mx-auto">{step.description}</p>
                    <div className="inline-flex items-center gap-4 group cursor-pointer">
                       <span className="text-xs font-black uppercase tracking-[0.3em] text-red-600 group-hover:text-white transition-colors">[{step.action}]</span>
                    </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Professional Ethics */}
        <section className="mb-32">
          <div className="relative group p-12 md:p-20 rounded-[3.5rem] bg-gradient-to-br from-red-900/10 via-white/[0.01] to-transparent border border-white/5 overflow-hidden transition-all duration-1000">
            <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-1000" />
            
            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
              <div className="w-32 h-32 rounded-full border-2 border-red-600/30 flex items-center justify-center relative">
                 <ShieldAlert className="w-12 h-12 text-red-600" />
                 <div className="absolute inset-0 border-2 border-red-600 rounded-full animate-ping opacity-20" />
              </div>
              <div className="flex-1 text-center md:text-left">
                 <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">The Ethical Protocol</h2>
                 <p className="text-white/40 text-lg font-medium leading-relaxed uppercase tracking-wider">
                   Zero tolerance for harassment. No discrimination. No exceptions. 
                   Our strength lies in our diversity. Any breach of this protocol results in immediate network exclusion.
                 </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 mt-20 relative z-10 p-1 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
               <div className="p-8">
                  <h4 className="text-xl font-black italic uppercase tracking-tighter text-green-500 mb-6 flex items-center gap-3 leading-none">
                    <CheckCircle className="w-5 h-5" /> Authorized Behavior
                  </h4>
                  <ul className="space-y-4">
                    {['Welcoming Operatives', 'Constructive Debugging', 'Community Mentorship', 'High-Trust Collaboration'].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" /> {item}
                      </li>
                    ))}
                  </ul>
               </div>
               <div className="p-8 bg-red-600/5 rounded-2xl">
                  <h4 className="text-xl font-black italic uppercase tracking-tighter text-red-600 mb-6 flex items-center gap-3 leading-none">
                    <AlertCircle className="w-5 h-5" /> Forbidden Vector
                  </h4>
                  <ul className="space-y-4">
                    {['Trolling & Harassment', 'Personal Hostility', 'Intel Theft', 'Grid Disruptions'].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600/50" /> {item}
                      </li>
                    ))}
                  </ul>
               </div>
            </div>
          </div>
        </section>

        {/* Final Intel Hub */}
        <section className="text-center relative py-20">
          <div className="absolute inset-0 bg-red-600/20 blur-[150px] opacity-10 pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
            CLAIM YOUR SPECIALTY
          </h2>
          
          <p className="text-white/30 text-lg font-medium max-w-2xl mx-auto mb-16 uppercase tracking-widest">
            The grid is open. The targets are marked. <br/> Your contribution defines your legacy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://github.com/aryansondharva/TechAssassin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 bg-red-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-[0_20px_50px_rgba(220,38,38,0.3)] transition-all"
            >
              <Code className="w-5 h-5" /> INITIATE LINK
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://github.com/aryansondharva/TechAssassin/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 bg-white/5 border border-white/10 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-white/10 transition-all backdrop-blur-xl"
            >
              <Target className="w-5 h-5" /> ENGAGE TARGETS
            </motion.a>
          </div>
        </section>
      </div>

      {/* Futuristic Grid Accents */}
      <div className="fixed top-0 right-0 w-[1px] h-screen bg-gradient-to-b from-transparent via-red-600/20 to-transparent" />
      <div className="fixed top-0 left-0 w-[1px] h-screen bg-gradient-to-b from-transparent via-red-600/20 to-transparent" />
    </div>
  );
};

export default CommunityGuidelines;
