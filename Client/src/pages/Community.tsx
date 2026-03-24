import { motion } from 'framer-motion';
import CommunityDashboard from '@/components/CommunityDashboard';
import CommunityGuidelines from '@/components/CommunityGuidelines';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Community = () => {
  return (
    <div className="bg-[#0a0a0b] min-h-screen">
      <Navbar />
      
      {/* Cinematic Transition Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative py-20 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="text-8xl md:text-[12rem] font-black italic tracking-tighter text-white/[0.03] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none uppercase"
          >
            INTEGRITY
          </motion.h2>
        </div>
      </motion.div>

      {/* Primary Dashboard Area */}
      <section id="dashboard">
        <CommunityDashboard />
      </section>

      {/* Mid-Section Tactical Break */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-red-600/30 to-transparent my-12" />

      {/* Community Guidelines Area */}
      <section id="guidelines" className="bg-[#0d0d0e]">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <CommunityGuidelines />
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Community;
