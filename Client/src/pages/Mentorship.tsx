import { motion } from 'framer-motion';
import { Video, Handshake, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MentorProgramPanel from '@/components/MentorProgramPanel';

const Mentorship = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <Navbar dark={true} />

      <main className="pt-24 pb-20">
        <section className="relative overflow-hidden mb-10">
          <div className="absolute inset-0 bg-[url('/textures/grunge-overlay.png')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 via-transparent to-transparent" />

          <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-xl"
            >
              <Handshake className="w-4 h-4 text-red-600" />
              <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Mentor Command</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 leading-none text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">
              MENTOR <span className="text-red-600">PROGRAM</span>
            </h1>
            <p className="text-white/40 text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed">
              Discover mentors, request support sessions, track mentorship progress, and connect instantly with integrated video-call links.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-red-500" />
                Session Call Ready
              </div>
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                Tactical Guidance
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6">
          <MentorProgramPanel />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Mentorship;
