import { motion } from 'framer-motion';
import CommunityDashboard from '@/components/CommunityDashboard';
import CommunityGuidelines from '@/components/CommunityGuidelines';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Community = () => {
  return (
    <div className="bg-[#0a0a0b] min-h-screen">
      <Navbar />
      

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
