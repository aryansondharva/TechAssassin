import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Zap, Target, Shield, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

export default function Events() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white selection:bg-red-600 selection:text-white overflow-hidden relative">
      <Navbar />
      
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)',
          backgroundSize: '32px 32px' 
        }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>
      </div>

      <main className="container mx-auto px-4 pt-48 pb-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Status Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full"
          >
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">System Standing By</span>
          </motion.div>

          {/* Main Title */}
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none"
            >
              Missions <br />
              <span className="text-red-600">Encrypted.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-white/40 font-medium max-w-2xl mx-auto tracking-wide leading-relaxed"
            >
              The tactical grid is currently being recalibrated. New deployment opportunities and high-stakes operations are coming soon to the Tech Assassin network.
            </motion.p>
          </div>

          {/* Tactical Display */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12"
          >
            {[
              { icon: Zap, label: "Neural Link", desc: "Establishing Connection" },
              { icon: Target, label: "Objective", desc: "Target Identification" },
              { icon: Shield, label: "Protocol", desc: "Zero Trust Verified" }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-sm group hover:bg-white/[0.04] transition-all">
                <item.icon className="w-6 h-6 text-red-600 mb-4 mx-auto md:mx-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="text-left">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">{item.label}</h3>
                  <p className="text-sm font-bold text-white uppercase italic">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Call to Action */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pt-12 flex flex-col items-center gap-6"
          >
            <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Awaiting Central Command</p>
            <Button className="h-14 px-12 bg-white text-black hover:bg-red-600 hover:text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all group">
              Get Notified <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>

        {/* Scanline Effect */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] animate-scanline z-50"></div>
      </main>

      <Footer />

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scanline {
          background: linear-gradient(to bottom, transparent 50%, #fff 50%);
          background-size: 100% 4px;
          animation: scanline 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
