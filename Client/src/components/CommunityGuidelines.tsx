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
        {/* Core Directives */}
        <section className="mb-32">

          {/* Section Header — centered with flanking lines */}
          <div className="flex items-center gap-6 mb-16">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <div className="text-center shrink-0">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-red-500 mb-1">Field Manual</p>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Core Directives</h2>
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>

          {/* Cards grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {guidelines.map((guideline, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`relative flex flex-col gap-4 p-7 rounded-2xl bg-[#0d0d0e] border ${guideline.border} hover:border-red-600/40 transition-all duration-500 group overflow-hidden`}
              >
                {/* Number badge — top right */}
                <span className="absolute top-4 right-5 text-5xl font-black italic text-white/[0.04] select-none leading-none">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Icon */}
                <div className={`self-start p-3.5 rounded-xl ${guideline.bg} ${guideline.color} group-hover:scale-110 transition-transform duration-500`}>
                  <guideline.icon className="w-5 h-5" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-black italic uppercase tracking-tight text-white group-hover:text-red-500 transition-colors leading-tight">
                  {guideline.title}
                </h3>

                {/* Description */}
                <p className="text-white/40 text-sm leading-relaxed font-medium">
                  {guideline.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>




        {/* Tactical Circular Process - Activation Sequence */}
        <section className="mb-48 relative py-20 overflow-visible">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 blur-[150px] opacity-20 pointer-events-none rounded-full" />
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-4">Activation Sequence</h2>
            <p className="text-white/30 text-sm font-bold uppercase tracking-widest">The clockwise path to operational readiness.</p>
          </div>

          <div className="relative max-w-5xl mx-auto h-[600px] md:h-[800px] flex items-center justify-center">
            
            {/* ─── The Central Core Hub ─── */}
            <div className="absolute z-20 w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#0a0a0b] border-4 border-white/5 flex flex-col items-center justify-center text-center shadow-[0_0_80px_rgba(220,38,38,0.1)] p-4 group">
              {/* Inner animated ring */}
              <div className="absolute inset-2 border border-dashed border-red-600/20 rounded-full animate-[spin_20s_linear_infinite]" />
              
              <div className="relative">
                <span className="block text-[10px] md:text-xs font-black text-red-600 uppercase tracking-[0.4em] mb-2 group-hover:animate-pulse">Protocol Hub</span>
                <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white">TECH<br/>ASSASSIN</h3>
                <div className="w-12 h-1 bg-red-600 mx-auto mt-4" />
              </div>
            </div>

            {/* ─── Circular Quadrant Layout ─── */}
            <div className="relative w-full h-full">
              
              {/* SVG Connectors - Curved Arrows */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 800 800">
                {/* Connector 1 to 2 */}
                <path d="M 280 150 Q 400 50 520 150" fill="none" stroke="red" strokeWidth="2" strokeDasharray="8 4" className="animate-[dash_20s_linear_infinite]" />
                <path d="M 520 150 L 510 140 M 520 150 L 510 160" fill="none" stroke="red" strokeWidth="2" />
                
                {/* Connector 2 to 3 */}
                <path d="M 650 280 Q 750 400 650 520" fill="none" stroke="red" strokeWidth="2" strokeDasharray="8 4" />
                <path d="M 650 520 L 660 510 M 650 520 L 640 510" fill="none" stroke="red" strokeWidth="2" />

                {/* Connector 3 to 4 */}
                <path d="M 520 650 Q 400 750 280 650" fill="none" stroke="red" strokeWidth="2" strokeDasharray="8 4" />
                <path d="M 280 650 L 290 660 M 280 650 L 290 640" fill="none" stroke="red" strokeWidth="2" />

                {/* Connector 4 to 1 */}
                <path d="M 150 520 Q 50 400 150 280" fill="none" stroke="red" strokeWidth="2" strokeDasharray="8 4" />
                <path d="M 150 280 L 140 290 M 150 280 L 160 290" fill="none" stroke="red" strokeWidth="2" />
              </svg>

              {gettingStarted.map((step, index) => {
                // Quadrant Positioning Logic
                const positions = [
                  "top-0 left-0",           // 01: Top-Left
                  "top-0 right-0",          // 02: Top-Right
                  "bottom-0 right-0",       // 03: Bottom-Right
                  "bottom-0 left-0"         // 04: Bottom-Left
                ];
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    viewport={{ once: true }}
                    className={`absolute ${positions[index]} w-full md:w-[45%] h-[40%] flex flex-col items-center justify-center p-6 md:p-10 z-10 group`}
                  >
                    <div className={`flex flex-col items-center gap-6 ${index % 2 === 0 ? "md:items-start md:text-left" : "md:items-end md:text-right"}`}>
                      
                      {/* Step Number Circle */}
                      <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/5 border-2 border-white/10 group-hover:border-red-600/50 flex items-center justify-center transition-all duration-500 relative">
                        <span className="text-4xl md:text-5xl font-black italic text-white group-hover:text-red-500 transition-colors">0{index + 1}</span>
                        {/* Orbiting Icon */}
                        <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 shadow-2xl backdrop-blur-md">
                          <step.icon className="w-6 h-6 md:w-8 h-8 group-hover:text-red-600 transition-colors" />
                        </div>
                      </div>

                      <div className="max-w-[200px] md:max-w-xs space-y-3">
                         <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-red-500 transition-colors">
                           {step.title}
                         </h3>
                         <p className="text-white/40 text-[10px] md:text-xs font-medium leading-relaxed uppercase tracking-wider">
                           {step.description}
                         </p>
                         <div className="inline-block p-1 bg-red-600/10 border border-red-600/20 text-red-600 text-[9px] font-black uppercase tracking-widest px-3 rounded">
                            {step.action}
                         </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

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
