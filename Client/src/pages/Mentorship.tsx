import { motion } from 'framer-motion';
import { Target, Users, Video, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MentorProgramPanel from '@/components/MentorProgramPanel';

const features = [
  {
    icon: Users,
    title: "Find Your Mentor",
    description: "Connect with industry veterans to accelerate your growth and career trajectory.",
  },
  {
    icon: Target,
    title: "Tactical Guidance",
    description: "Get one-on-one sessions for code reviews, architecture, and career advice.",
  },
  {
    icon: Video,
    title: "Live Sync",
    description: "Integrated secure video calls straight from the platform for immediate feedback.",
  },
  {
    icon: Globe,
    title: "Elite Networking",
    description: "Expand your professional network with pre-vetted tech professionals securely.",
  },
];

const Mentorship = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar dark={false} />

      <main className="pt-24 pb-20">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <motion.span 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4"
              >
                Mentor Command
              </motion.span>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-bold text-foreground mb-4 font-heading"
              >
                Mentor Program
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
              >
                Discover mentors, request support sessions, track mentorship progress, and connect instantly with integrated video-call links.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    key={feature.title}
                    className="text-center p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <Icon size={26} className="text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <div className="max-w-7xl mx-auto">
              <MentorProgramPanel />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Mentorship;
