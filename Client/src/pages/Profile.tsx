import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Github, 
  Linkedin, 
  MapPin, 
  Calendar, 
  Trophy, 
  Code, 
  ExternalLink,
  Share2,
  Terminal,
  Shield,
  Zap,
  Globe
} from "lucide-react";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("home");
  const user = authService.getUser();
  
  // Mock data matching the user image provided
  const profileData = {
    full_name: user?.full_name || "ARYAN SONDHARVA",
    username: user?.username || "aryansondharva",
    tagline: "SI VIS PACEM , PARA BELLUM",
    location: "Surat, India",
    joinedDate: "January 2024",
    skills: ["React", "Data Analysis", "Machine Learning", "Data Science", "Natural Language Processing"],
    stats: {
      hackathons: 12,
      projects: 24,
      contributions: 156
    }
  };

  const tabs = [
    { id: "home", label: "HOME", icon: Shield },
    { id: "projects", label: "PROJECTS", icon: Terminal },
    { id: "readme", label: "README.MD", icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-4">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto max-w-5xl relative">
        {/* Profile Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 mb-8 shadow-2xl overflow-hidden relative"
        >
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 p-1">
             <div className="w-16 h-16 border-t-2 border-r-2 border-red-600/30 rounded-tr-3xl" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start relative">
            {/* Avatar Orb */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-red-600 to-red-900 p-1 relative z-10">
                <div className="w-full h-full rounded-full bg-zinc-900 p-1 overflow-hidden">
                   <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.username}`} 
                    alt="Operative" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <div className="absolute inset-0 bg-red-600 opacity-20 blur-2xl rounded-full scale-110 animate-pulse" />
            </div>

            {/* Identity Info */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase drop-shadow-lg">
                    {profileData.full_name}
                  </h1>
                  <p className="text-red-500 font-bold tracking-[0.2em] text-sm mt-1">
                    @{profileData.username}
                  </p>
                </div>
                
                {/* Social Actions */}
                <div className="flex items-center gap-3">
                  <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/5 transition-all">
                    <Github className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/5 transition-all">
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg hover:translate-y-[-2px]">
                    <Share2 className="w-3 h-3" /> Share Profile
                  </button>
                </div>
              </div>

              <p className="text-lg text-white/60 font-medium italic tracking-wide">
                "{profileData.tagline}"
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  {profileData.location}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  Joined {profileData.joinedDate}
                </div>
              </div>

              {/* Skills Matrix */}
              <div className="pt-4 flex flex-wrap gap-2">
                {profileData.skills.map((skill) => (
                  <span 
                    key={skill}
                    className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tactical Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-1 rounded-2xl flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all relative
                    ${activeTab === tab.id ? "text-white" : "text-white/30 hover:text-white/60"}
                  `}
                >
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="active-profile-tab"
                      className="absolute inset-0 bg-white/5 rounded-xl border border-white/10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? "text-red-500" : ""}`} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 min-h-[400px]"
              >
                {activeTab === "home" && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Neural Readout</h3>
                    <p className="text-white/60 leading-relaxed">
                      Operative identity verified. Specializing in high-performance neural networks and cinematic UI development. 
                      Currently participating in global hackathons to expand the Tech Assassin influence.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                        <Trophy className="w-6 h-6 text-red-500 mb-2" />
                        <p className="text-2xl font-black text-white">{profileData.stats.hackathons}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Missions Deployed</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                        <Zap className="w-6 h-6 text-red-500 mb-2" />
                        <p className="text-2xl font-black text-white">{profileData.stats.contributions}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Lethal Commits</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "projects" && (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-4">
                    <Terminal className="w-12 h-12 text-white/20" />
                    <p className="text-white/40 font-black uppercase tracking-widest text-sm">No Active Projects Found</p>
                    <button className="px-6 py-2 rounded-full border border-red-500/50 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/10">
                      Deploy Mission
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-8">
             <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
               <h3 className="text-sm font-black italic uppercase tracking-widest text-white/40 mb-6">Combat Stats</h3>
               <div className="space-y-6">
                 <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Success Rate</p>
                   <p className="text-sm font-black text-red-500">98.2%</p>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="w-[98.2%] h-full bg-red-600" />
                 </div>

                 <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Neural Stability</p>
                   <p className="text-sm font-black text-white">STABLE</p>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="w-[85%] h-full bg-white/20 animate-pulse" />
                 </div>
               </div>
               <button className="w-full mt-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                 View Global Rank
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
