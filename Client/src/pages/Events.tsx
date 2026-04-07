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
<<<<<<< HEAD
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Community Missions</h1>
          <p className="text-white/40 font-medium">
            Analyze and deploy into upcoming tactical missions
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-red-600 hover:bg-red-700' : 'border-white/10 text-white/60'}
            onClick={() => setFilter('all')}
          >
            All Missions
          </Button>
          <Button
            variant={filter === 'live' ? 'default' : 'outline'}
            className={filter === 'live' ? 'bg-red-600 hover:bg-red-700' : 'border-white/10 text-white/60'}
            onClick={() => setFilter('live')}
          >
            Live
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            className={filter === 'upcoming' ? 'bg-red-600 hover:bg-red-700' : 'border-white/10 text-white/60'}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === 'past' ? 'default' : 'outline'}
            className={filter === 'past' ? 'bg-red-600 hover:bg-red-700' : 'border-white/10 text-white/60'}
            onClick={() => setFilter('past')}
          >
            Past
          </Button>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <p className="text-muted-foreground">No events found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-red-600/50 transition-all duration-500 flex flex-col group">
                {event.image_urls && event.image_urls.length > 0 && (
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={event.image_urls[0]}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                    <div className="absolute top-4 left-4">
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-red-500 transition-colors line-clamp-1">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 py-4">
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center text-white/40 font-medium">
                      <Calendar className="mr-2 h-4 w-4 text-red-500" />
                      {formatDate(event.start_date)}
                    </div>
                    <div className="flex items-center text-white/40 font-medium line-clamp-1">
                      <MapPin className="mr-2 h-4 w-4 text-red-500" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center text-white/70 font-bold">
                        <Users className="mr-2 h-4 w-4 text-red-500" />
                        {event.participant_count}/{event.max_participants}
                      </div>
                      {event.prizes && (
                        <div className="text-red-500 font-black italic tracking-tighter uppercase">
                          Bounty: {event.prizes['1st'] || 'TBA'}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-2">
                  <a 
                    href={event.id === 'luma-code4cause-2025' ? "https://luma.com/0hmim4ly" : `/events/${event.id}`} 
                    target={event.id === 'luma-code4cause-2025' ? "_blank" : "_self"}
                    rel={event.id === 'luma-code4cause-2025' ? "noopener noreferrer" : ""}
                    className="w-full"
                  >
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs py-6 rounded-2xl shadow-lg shadow-red-600/20">
                      {event.id === 'luma-code4cause-2025' ? 'Deploy Mission' : 'Mission Briefing'}
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
=======
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
>>>>>>> f0d1cf030861dfc9ace6981a38134a7c8235b705
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
