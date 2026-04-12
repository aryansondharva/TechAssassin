import { motion } from "framer-motion";
import { 
  Github, ExternalLink, Shield, Zap, Target, Layers, Cpu, Globe, 
  ArrowLeft, Terminal, Layout, FileText, Brain, MessageSquare, 
  BarChart3, ShieldCheck, Mail, Database, Bot, FastForward
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";

const Aura = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-red-100 selection:text-red-600 overflow-x-hidden">
      <Navbar dark={false} />
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20">
        <div className="container mx-auto px-6 relative z-10">
          <Link 
            to="/projects" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-red-600 transition-colors uppercase font-black text-[10px] tracking-[0.3em] mb-12 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Armory
          </Link>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] mb-10 shadow-xl shadow-slate-200 border border-white/10 group cursor-default">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                INTELLIGENCE • <span className="text-red-500">AURA</span> • PROJECT 01
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 mb-6 uppercase leading-[0.9]">
                PROJECT <span className="text-red-600 underline decoration-red-200 decoration-8 underline-offset-8">AURA</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-10 max-w-xl">
                Transform study materials into interactive, resumable learning experiences. 
                State-of-the-art education powered by Deep Analysis AI.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://techassasin.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-8 py-4 rounded-full bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200"
                >
                  <ExternalLink className="w-5 h-5" /> Launch Operation
                </a>
                <a 
                  href="https://github.com/aryansondharva/Aura" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-8 py-4 rounded-full bg-white border border-slate-200 text-slate-900 font-black uppercase tracking-widest hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
                >
                  <Github className="w-5 h-5" /> Source Code
                </a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-red-600/5 rounded-[3rem] blur-3xl" />
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] border-8 border-white bg-white">
                <img 
                  src="/aura_hero.png" 
                  alt="Aura Interface" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-red-600 font-black uppercase tracking-[0.4em] text-[10px] block mb-4">Core Protocols</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 italic">Technical Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Feature 1: Chat */}
            <BentoCard 
              className="md:col-span-2 md:row-span-1"
              icon={MessageSquare}
              title="Resumable Chat & History"
              description="Persistent storage of PDF-based conversations. Progress across sessions without losing a single data point."
              color="bg-blue-50 text-blue-600 border-blue-100"
            />
            {/* Feature 2: MCQ */}
            <BentoCard 
              className="md:col-span-1 md:row-span-1"
              icon={FastForward}
              title="Automated MCQ"
              description="Intelligent quiz creation via structured JSON formatting."
              color="bg-purple-50 text-purple-600 border-purple-100"
            />
            {/* Feature 3: Analysis */}
            <BentoCard 
              className="md:col-span-1 md:row-span-2"
              icon={BarChart3}
              title="Data-Driven Analysis"
              description="Analytical charts and historical score tracking for absolute performance mastery."
              color="bg-red-50 text-red-600 border-red-100"
            />
            {/* Feature 4: Profile */}
            <BentoCard 
              className="md:col-span-1 md:row-span-1"
              icon={Layout}
              title="Dual-Mode Interface"
              description="Distinct viewing and editing profiles for optimized data integrity."
              color="bg-emerald-50 text-emerald-600 border-emerald-100"
            />
            {/* Feature 5: Security */}
            <BentoCard 
              className="md:col-span-1 md:row-span-1"
              icon={ShieldCheck}
              title="Secure OTP"
              description="Mobile-based verification integrated via Twilio SMS API."
              color="bg-amber-50 text-amber-600 border-amber-100"
            />
            {/* Feature 6: Notifications */}
            <BentoCard 
              className="md:col-span-2 md:row-span-1"
              icon={Mail}
              title="Intelligence Feed"
              description="Granular controls for automated email alerts and study reminders so you never miss a mission."
              color="bg-slate-50 text-slate-600 border-slate-100"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 text-center border-t border-slate-200">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <span className="font-black italic tracking-tighter text-2xl uppercase text-slate-900">
              TECH<span className="text-red-600"> ASSASSIN</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs uppercase tracking-[0.5em] font-black">
             Engineered with 💖 for the Future of Learning
          </p>
        </div>
      </footer>
    </div>
  );
};

const BentoCard = ({ className, icon: Icon, title, description, color }: { className: string, icon: any, title: string, description: string, color: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`p-8 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between group cursor-default shadow-sm hover:shadow-xl ${className} ${color}`}
  >
    <div className="w-12 h-12 rounded-2xl bg-white/50 backdrop-blur-sm border border-black/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6" />
    </div>
    <div className="space-y-3">
      <h3 className="text-xl font-black uppercase tracking-tight leading-none">{title}</h3>
      <p className="text-sm font-medium opacity-70 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const StackColumn = ({ title, items }: { title: string, items: string[] }) => (
  <div className="space-y-6">
    <h4 className="text-red-600 font-black uppercase tracking-[0.3em] text-[10px]">{title}</h4>
    <div className="space-y-3">
      {items.map(item => (
        <div key={item} className="flex items-center gap-2 group">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-red-600 transition-colors" />
          <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{item}</span>
        </div>
      ))}
    </div>
  </div>
);

export default Aura;
