import { motion } from 'framer-motion';
import CommunityDashboard from '@/components/CommunityDashboard';
import CommunityGuidelines from '@/components/CommunityGuidelines';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Community = () => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <Navbar dark={false} />
      
      <main className="pt-24">
        {/* Primary Dashboard Area */}
        <section id="dashboard" className="px-6">
          <div className="max-w-7xl mx-auto py-12">
             <CommunityDashboard />
          </div>
        </section>

        {/* Mid-Section Tactical Break */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-red-600/10 to-transparent my-12" />

        {/* Community Guidelines Area */}
        <section id="guidelines" className="bg-white border-y border-slate-50">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <CommunityGuidelines />
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Community;
