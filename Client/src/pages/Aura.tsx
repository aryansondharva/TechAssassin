import { motion } from "framer-motion";
import { Github, ExternalLink, Shield, Zap, Target, Layers, Cpu, Globe, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";

const Aura = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-red-100 selection:text-red-600">
      <Navbar dark={false} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,0,0,0.05),transparent)] pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <Link 
            to="/projects" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-red-600 transition-colors uppercase font-black text-[10px] tracking-[0.3em] mb-12 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Armory
          </Link>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 text-red-600 text-[11px] font-black uppercase tracking-[0.2em] mb-8">
              <Shield className="w-3 h-3" /> Tech Assassin Group Project #1
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-slate-900 mb-6 uppercase">
              Project <span className="text-red-600">Aura</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed mb-10 max-w-3xl mx-auto">
              A premium, high-performance ecosystem designed for the modern digital operative. 
              Engineered for speed, secured for the mission.
            </p>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="relative aspect-video max-w-2xl mx-auto mb-16 rounded-[2rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 bg-slate-50"
            >
              <img 
                src="/aura_hero.png" 
                alt="Aura Interface" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
            </motion.div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://github.com/aryansondharva/Aura" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <Github className="w-5 h-5" /> View Command Center
              </a>
              <button className="flex items-center gap-3 px-8 py-4 rounded-full bg-white border border-slate-200 text-slate-900 font-black uppercase tracking-widest hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
                <ExternalLink className="w-5 h-5" /> Live Deployment
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap}
              title="Hyper-Fast"
              description="Optimized with cutting-edge architectures to ensure sub-millisecond response times."
            />
            <FeatureCard 
              icon={Cpu}
              title="Modern Core"
              description="Built on a stack that defines the future of development. Clean, type-safe, and scalable."
            />
            <FeatureCard 
              icon={Globe}
              title="Global Scale"
              description="Distributed infrastructure that stays up when the heat is on. Ready for operation."
            />
          </div>
        </div>
      </section>

      {/* Tech Assassin Branding Section */}
      <section className="py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
              <Shield className="w-full h-full text-white translate-x-1/4 translate-y-1/4 rotate-12" />
            </div>
            
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase mb-6">
                The <span className="text-red-600">Tech Assassin</span> Standard
              </h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                Aura isn't just a project; it's a testament to the Tech Assassin Group's commitment to excellence. 
                We don't just build software; we engineer dominance in the digital realm.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold uppercase tracking-widest text-sm">Precision</h4>
                    <p className="text-slate-500 text-xs">Zero bloat code</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Layers className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold uppercase tracking-widest text-sm">Modular</h4>
                    <p className="text-slate-500 text-xs">Plug & Play Logic</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / CTA */}
      <footer className="py-20 border-t border-slate-100 text-center">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <span className="font-black italic tracking-tighter text-2xl uppercase text-slate-900">
              TECH<span className="text-red-600"> ASSASSIN</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm uppercase tracking-[0.3em] font-black">
            Executing Excellence Since 2024
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group"
  >
    <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mb-8 border border-red-100 group-hover:bg-red-600 transition-colors duration-500">
      <Icon className="w-8 h-8 text-red-600 group-hover:text-white transition-colors duration-500" />
    </div>
    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-4">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-medium">{description}</p>
  </motion.div>
);

export default Aura;
