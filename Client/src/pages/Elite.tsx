import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Github, 
  Linkedin, 
  Twitter, 
  Terminal, 
  Zap, 
  Activity, 
  Shield, 
  Globe, 
  Cpu,
  Layers,
  Database,
  ExternalLink,
  Code,
  Trophy,
  Loader2,
  Lock
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authService, profileService } from "@/services";

interface GitHubStats {
  followers: number;
  public_repos: number;
  total_stars: number;
  recent_repos: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    updated_at: string;
    url: string;
  }>;
}

export default function Elite() {
  const [profile, setProfile] = useState<any>(null);
  const [ghStats, setGhStats] = useState<GitHubStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const userData = await profileService.getMyProfile();
      setProfile(userData);
      
      if (userData?.github_url) {
        await fetchGitHubData(userData.github_url);
      }
    } catch (error) {
      console.error("Failed to load elite data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGitHubData = async (url: string) => {
    const match = url.match(/github\.com\/([^/]+)/);
    if (!match) return;
    const username = match[1];
    
    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=4`)
      ]);
      
      const user = await userRes.json();
      const repos = await reposRes.json();
      
      setGhStats({
        followers: user.followers,
        public_repos: user.public_repos,
        total_stars: repos.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0),
        recent_repos: repos.map((repo: any) => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          updated_at: repo.updated_at,
          url: repo.html_url
        }))
      });
    } catch (error) {
      console.error("GitHub fetch error", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-600/30">
      <Navbar />
      
      {/* Background Matrix Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.05)_0%,transparent_70%)]"></div>
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pt-32 pb-20 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-red-600 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500">System Link: Active</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8]">
              ELITE<br />
              <span className="text-white/20">OPERATIVE</span>
            </h1>
            <p className="max-w-md text-gray-400 font-bold italic border-l-2 border-red-600/50 pl-4 py-1 text-sm md:text-base">
              Synchronizing external identity streams. Real-time data extraction from GitHub, LinkedIn, and professional networks.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
             <StatMini icon={<Database className="w-3 h-3" />} label="Identity" value="V3.1" />
             <StatMini icon={<Globe className="w-3 h-3" />} label="Uplink" value="Encrypted" />
             <StatMini icon={<Activity className="w-3 h-3" />} label="Ping" value="12ms" />
          </div>
        </div>

        {/* Tactical Navigation */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 mb-12 w-fit">
          {['overview', 'github', 'professional', 'status'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? "bg-red-600 text-white shadow-xl shadow-red-600/20" : "text-white/40 hover:text-white/70"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
             <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-red-600" />
                <Shield className="w-6 h-6 absolute inset-0 m-auto text-white" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 animate-pulse">Decrypting Identity Streams...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Data Stream */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* GitHub Pulse Card */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <Card className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden p-8 relative group">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-all group-hover:scale-125">
                     <Github size={280} />
                  </div>
                  
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                             <Github className="w-6 h-6" />
                          </div>
                          <div>
                             <h3 className="text-2xl font-black italic uppercase tracking-tighter">GitHub Pulse</h3>
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Repository Identity</p>
                          </div>
                       </div>
                       <Badge className="bg-red-600/10 text-red-500 border-none rounded-lg text-[9px] font-black uppercase px-3 py-1">Source Live</Badge>
                    </div>

                    {!ghStats ? (
                      <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                         <Lock size={40} className="mx-auto mb-4 text-white/10" />
                         <p className="text-xs text-gray-500 font-black uppercase italic">Uplink required. Please provide GitHub token in settings.</p>
                         <Button onClick={() => window.open(profile?.github_url || '#', '_blank')} className="mt-6 rounded-xl bg-white text-black px-8 font-black uppercase text-xs">Link Source</Button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <DataTile label="Total Followers" value={ghStats.followers} icon={<Globe size={14} className="text-red-500" />} />
                           <DataTile label="Active Repos" value={ghStats.public_repos} icon={<Layers size={14} className="text-red-500" />} />
                           <DataTile label="Elite Stars" value={ghStats.total_stars} icon={<Trophy size={14} className="text-red-500" />} />
                        </div>

                        <div className="space-y-4 pt-4">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Recently Compiled Missions</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {ghStats.recent_repos.map((repo, i) => (
                                <a key={i} href={repo.url} target="_blank" rel="noreferrer" className="group/repo p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:border-red-600 transition-all">
                                   <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-black text-lg italic tracking-tight group-hover/repo:text-red-500 transition-colors">{repo.name}</h5>
                                      <Code size={14} className="text-white/20" />
                                   </div>
                                   <p className="text-xs text-gray-500 line-clamp-1 mb-4 italic font-bold">{repo.description || 'System integration without description.'}</p>
                                   <div className="flex items-center gap-4 text-[9px] font-black uppercase text-white/40">
                                      <span className="flex items-center gap-1"><Zap size={10} className="text-red-500" /> {repo.language}</span>
                                      <span className="flex items-center gap-1"><Trophy size={10} /> {repo.stars} Stars</span>
                                   </div>
                                </a>
                              ))}
                           </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* LinkedIn & Professional Pulse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-all">
                       <Linkedin size={80} />
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                          <Linkedin className="w-5 h-5 text-blue-500" />
                       </div>
                       <h4 className="text-xl font-black italic tracking-tighter uppercase">LinkedIn Node</h4>
                    </div>
                    <div className="space-y-4">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 border-l-2 border-l-blue-600">
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Current Status</p>
                          <p className="text-sm font-black italic">Operative profile indexed. Career data sync active.</p>
                       </div>
                       <Button variant="outline" className="w-full rounded-xl border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest h-11" onClick={() => window.open(profile?.linkedin_url, '_blank')}>
                          Access Professional Bio <ExternalLink size={12} className="ml-2" />
                       </Button>
                    </div>
                 </Card>

                 <Card className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-all">
                       <Twitter size={80} />
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10">
                          <Twitter className="w-5 h-5 text-white" />
                       </div>
                       <h4 className="text-xl font-black italic tracking-tighter uppercase">X Neural Stream</h4>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-3">
                          <div className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center shrink-0">
                                <Zap size={14} className="text-red-500" />
                             </div>
                             <div className="space-y-1">
                                <div className="text-[9px] font-black text-white/40 uppercase">Latest Transmission</div>
                                <p className="text-[11px] text-gray-400 font-bold italic leading-tight">"Weaponizing code to build the future of community intelligence. #TechAssassin #Elite"</p>
                             </div>
                          </div>
                       </div>
                       <Button variant="ghost" className="w-full rounded-xl hover:bg-white/5 text-[10px] font-black uppercase tracking-widest h-11">
                          Intercept Signal
                       </Button>
                    </div>
                 </Card>
              </div>
            </div>

            {/* RIGHT COLUMN: System Identity */}
            <div className="lg:col-span-4 space-y-8">
               <Card className="bg-red-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-red-600/20">
                  <div className="absolute bottom-0 right-0 p-12 opacity-20 rotate-12">
                     <Shield size={160} />
                  </div>
                  <div className="relative z-10 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg">
                           <img src={profile?.avatar_url || 'https://tech-assassin.vercel.app/favicon.ico'} className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{profile?.username || 'ELITE_OP'}</h3>
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Assassin</p>
                        </div>
                     </div>

                     <div className="space-y-5">
                        <div className="flex justify-between items-center border-b border-white/20 pb-4">
                           <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Rank</span>
                           <span className="text-lg font-black italic">SUPREME</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/20 pb-4">
                           <span className="text-[11px] font-black uppercase tracking-widest opacity-60">X-Score</span>
                           <span className="text-lg font-black italic">14,205</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/20 pb-4">
                           <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Mission Streak</span>
                           <span className="text-lg font-black italic">14 Days</span>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                           <span>System Power</span>
                           <span>85%</span>
                        </div>
                        <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"></motion.div>
                        </div>
                     </div>
                  </div>
               </Card>

               <Card className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6">
                  <div className="flex items-center gap-3 text-red-600">
                     <Cpu size={18} />
                     <h4 className="text-[12px] font-black uppercase tracking-[0.2em]">Application Build Status</h4>
                  </div>
                  <div className="space-y-4">
                     <BuildStat label="Core Engine" status="Optimized" pulse />
                     <BuildStat label="Data Scraper" status="Active" pulse />
                     <BuildStat label="Social Link" status="Standby" />
                     <BuildStat label="Neural API" status="Syncing" pulse className="text-yellow-500" />
                  </div>
                  <div className="pt-4">
                     <div className="p-4 bg-black/40 rounded-2xl space-y-3 border border-white/5 font-mono text-[10px]">
                        <div className="text-red-500/50">{'>'} INITIALIZING_SCRAPER_V3</div>
                        <div className="text-white/40">{'>'} EXTRACTING_SOCIAL_METADATA</div>
                        <div className="text-white/40">{'>'} SYNC_COMPLETE: GITHUB_ID_742</div>
                        <div className="flex gap-2 items-center text-green-500">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                           {'>'} SYSTEMS_OPERATIONAL
                        </div>
                     </div>
                  </div>
               </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function StatMini({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
       <span className="text-red-600">{icon}</span>
       <div className="flex flex-col">
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">{label}</span>
          <span className="text-[11px] font-black uppercase italic text-white tracking-widest">{value}</span>
       </div>
    </div>
  );
}

function DataTile({ label, value, icon }: any) {
  return (
    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-2">
       <div className="flex items-center gap-2">
          {icon}
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
       </div>
       <div className="text-4xl font-black italic tracking-tighter text-white">{value}</div>
    </div>
  );
}

function BuildStat({ label, status, pulse, className }: any) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-xs font-bold text-gray-400 italic">{label}</span>
       <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${className || 'text-white'}`}>
          {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>}
          {status}
       </div>
    </div>
  );
}
