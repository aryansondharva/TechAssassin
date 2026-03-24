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




        {/* Activation Sequence — Circular Flow */}
        <section className="mb-32 relative py-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="text-center mb-12 relative z-10">
            <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-3">Activation Sequence</h2>
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Follow the clockwise protocol to achieve operational readiness.</p>
          </div>

          {/* 3-col layout: left cards | SVG | right cards */}
          <div className="flex items-center justify-center gap-4 xl:gap-8 max-w-6xl mx-auto px-4">

            {/* Left column: step 04 top, step 03 bottom */}
            <div className="hidden lg:flex flex-col justify-between shrink-0 w-48 xl:w-56 self-stretch py-12">
              {[gettingStarted[3], gettingStarted[2]].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className="group text-right space-y-2"
                >
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="text-xs font-black uppercase tracking-widest text-red-600">0{i === 0 ? 4 : 3}</span>
                  </div>
                  <h4 className="text-lg font-black italic uppercase tracking-tight text-white group-hover:text-red-500 transition-colors">{step.title}</h4>
                  <p className="text-white/40 text-sm leading-relaxed">{step.description}</p>
                  <div className="inline-block text-[10px] font-black uppercase tracking-widest text-red-600/70 border border-red-600/20 px-3 py-1.5 rounded">{step.action}</div>
                </motion.div>
              ))}
            </div>

            {/* Center SVG Circular Flow */}
            <div className="shrink-0 w-[340px] h-[340px] md:w-[460px] md:h-[460px]">
              <svg viewBox="0 0 600 600" className="w-full h-full" style={{ overflow: 'visible' }}>
                <defs>
                  {/* Glow filter */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                {/* ── Segment 1 (top, 228°→312°, bright red) ── */}
                <path d="M 156.1 140.2 A 215 215 0 0 1 443.9 140.2 L 393.7 196 A 140 140 0 0 0 206.3 196 Z"
                  fill="#ef4444" opacity="0.92" filter="url(#glow)" />
                {/* Arrow tip 1 – points bottom-right at 312° */}
                <polygon points="433,167 404,145 420,192" fill="#ef4444" />
                {/* Label 01 */}
                <text x="300" y="125" textAnchor="middle" fill="white" fontSize="32" fontWeight="900" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>01</text>

                {/* ── Segment 2 (right, 317°→43°, orange-red) ── */}
                <path d="M 457.2 153.4 A 215 215 0 0 1 457.2 446.6 L 402.4 395.5 A 140 140 0 0 0 402.4 204.5 Z"
                  fill="#dc2626" opacity="0.90" filter="url(#glow)" />
                {/* Arrow tip 2 – points bottom-left at 43° */}
                <polygon points="430,437 458,408 412,410" fill="#dc2626" />
                {/* Label 02 */}
                <text x="478" y="312" textAnchor="middle" fill="white" fontSize="32" fontWeight="900" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>02</text>

                {/* ── Segment 3 (bottom, 48°→132°, crimson) ── */}
                <path d="M 443.9 459.8 A 215 215 0 0 1 156.1 459.8 L 206.3 404 A 140 140 0 0 0 393.7 404 Z"
                  fill="#b91c1c" opacity="0.90" filter="url(#glow)" />
                {/* Arrow tip 3 – points top-left at 132° */}
                <polygon points="167,433 196,455 180,408" fill="#b91c1c" />
                {/* Label 03 */}
                <text x="300" y="490" textAnchor="middle" fill="white" fontSize="32" fontWeight="900" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>03</text>

                {/* ── Segment 4 (left, 137°→222°, dark red) ── */}
                <path d="M 142.8 446.6 A 215 215 0 0 1 142.8 153.4 L 197.6 204.5 A 140 140 0 0 0 197.6 395.5 Z"
                  fill="#991b1b" opacity="0.90" filter="url(#glow)" />
                {/* Arrow tip 4 – points top-right at 222° */}
                <polygon points="168,162 140,192 187,190" fill="#991b1b" />
                {/* Label 04 */}
                <text x="122" y="312" textAnchor="middle" fill="white" fontSize="32" fontWeight="900" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>04</text>

                {/* ── Center Hub ── */}
                <line x1="262" y1="337" x2="338" y2="337" stroke="#dc2626" strokeWidth="2" />
                <text x="300" y="283" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="900" letterSpacing="4"></text>
                <text x="300" y="306" textAnchor="middle" fill="white" fontSize="24" fontWeight="900" fontStyle="italic">TECH</text>
                <text x="300" y="328" textAnchor="middle" fill="white" fontSize="24" fontWeight="900" fontStyle="italic">ASSASSIN</text>
                <line x1="262" y1="337" x2="338" y2="337" stroke="#dc2626" strokeWidth="2" />
              </svg>
            </div>

            {/* Right column: step 01 top, step 02 bottom */}
            <div className="hidden lg:flex flex-col justify-between shrink-0 w-48 xl:w-56 self-stretch py-12">
              {[gettingStarted[0], gettingStarted[1]].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className="group text-left space-y-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black uppercase tracking-widest text-red-600">0{i + 1}</span>
                  </div>
                  <h4 className="text-lg font-black italic uppercase tracking-tight text-white group-hover:text-red-500 transition-colors">{step.title}</h4>
                  <p className="text-white/40 text-sm leading-relaxed">{step.description}</p>
                  <div className="inline-block text-[10px] font-black uppercase tracking-widest text-red-600/70 border border-red-600/20 px-3 py-1.5 rounded">{step.action}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile 2x2 fallback grid */}
          <div className="lg:hidden grid grid-cols-2 gap-4 max-w-xl mx-auto mt-10 px-4">
            {gettingStarted.map((step, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">0{i + 1}</span>
                <h4 className="text-sm font-black italic uppercase tracking-tight text-white">{step.title}</h4>
                <p className="text-white/35 text-[10px] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>



        {/* Operational Standard - Tactical Format */}
        <section className="mb-32 max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white-600 flex items-center justify-center gap-6">
              <div className="h-px w-10 bg-white-600/30 md:block hidden" />
              Operational Standard
              <div className="h-px w-10 bg-white-600/30 md:block hidden" />
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Sector 01: Authorized Behavior */}
            <div className="p-10 md:p-14 bg-[#0d0d0e]/80 hover:bg-white/[0.01] transition-colors group">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                <div className="space-y-1">
                  <h4 className="text-2xl font-black italic uppercase tracking-tight text-white">Authorized Behavior</h4>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500">Protocol Compliant</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              <ul className="space-y-6">
                {['Welcoming Operatives', 'Constructive Debugging', 'Community Mentorship', 'High-Trust Collaboration'].map((item, i) => (
                  <li key={i} className="flex items-center gap-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                    <span className="text-sm font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors duration-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sector 02: Forbidden Vector */}
            <div className="p-10 md:p-14 bg-red-600/[0.02] hover:bg-red-600/[0.04] transition-colors group border-t md:border-t-0 md:border-l border-white/5">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 text-right md:text-left">
                <div className="space-y-1">
                  <h4 className="text-2xl font-black italic uppercase tracking-tight text-white">Forbidden Vector</h4>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600">Immediate Violation</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <ul className="space-y-6">
                {['Trolling & Harassment', 'Personal Hostility', 'Intel Theft', 'Grid Disruptions'].map((item, i) => (
                  <li key={i} className="flex items-center gap-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600/40 shadow-[0_0_8px_rgba(220,38,38,0.3)]" />
                    <span className="text-sm font-black uppercase tracking-widest text-white/30 group-hover:text-white transition-colors duration-300">{item}</span>
                  </li>
                ))}
              </ul>
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
