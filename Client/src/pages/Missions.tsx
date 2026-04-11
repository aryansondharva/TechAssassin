import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MissionsHub from '@/components/MissionsHub';
import { Target, ShieldCheck } from 'lucide-react';

const Missions = () => {
  return (
    <div className="bg-[#0a0a0b] min-h-screen text-white">
      <Navbar dark={true} />
      
      <main className="pt-24 pb-20">
        {/* Header Section */}
        <div className="relative overflow-hidden mb-12">
          <div className="absolute inset-0 bg-[url('/textures/grunge-overlay.png')] opacity-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-xl"
            >
              <ShieldCheck className="w-4 h-4 text-red-600" />
              <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Operative Assignments</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 leading-none text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">
              MY <span className="text-red-600">MISSIONS</span>
            </h1>
            
            <p className="text-white/40 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
              Complete these tactical objectives to earn XP, increase your rank, and unlock higher-tier bounties. The grid waits for no one.
            </p>
          </div>
        </div>

        {/* Missions Hub Area */}
        <section id="missions-hub" className="px-6">
          <MissionsHub />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Missions;
