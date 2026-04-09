import { useState, useEffect } from 'react';
import { 
  Plus, 
  Github, 
  Code, 
  Target, 
  Trophy, 
  Zap, 
  Clock, 
  ChevronRight, 
  ExternalLink,
  Shield,
  Search,
  CheckCircle2,
  Lock,
  Flame,
  Award,
  Loader2,
  Medal,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

interface Mission {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  frequency: 'daily' | 'weekly' | 'one-time';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'in_progress' | 'pending_verification' | 'completed';
  progress: any;
  time_remaining_ms: number;
}

const MissionsHub = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all'|'daily'|'weekly'|'one-time'>('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [solvingMissionId, setSolvingMissionId] = useState<string | null>(null);
  const [proofLink, setProofLink] = useState('');

  useEffect(() => {
    fetchMissions();
    
    // Refresh missions daily reset check
    const interval = setInterval(fetchMissions, 60000); 
    return () => clearInterval(interval);
  }, []);

  const fetchMissions = async () => {
    try {
      const data = await api.get<Mission[]>('/missions');
      setMissions(data);
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    } finally {
      if (loading) setLoading(false);
    }
  };

  const handleVerify = async (mission: Mission, link?: string) => {
    // If it's a mission that needs a link but none provided yet, switch to solving mode
    const needsLink = ['leetcode_solve', 'blog_post', 'os_contribution', 'ship_project'].includes((mission as any).requirement_type);
    if (needsLink && !link && solvingMissionId !== mission.id) {
       setSolvingMissionId(mission.id);
       return;
    }

    setVerifyingId(mission.id);
    try {
      const result = await api.post<any>('/missions', {
        missionId: mission.id,
        requirementType: (mission as any).requirement_type || 'default',
        payload: link ? { link } : {}
      });
      
      if (result.status === 'completed') {
        toast({
          title: "MISSION ACCOMPLISHED",
          description: `You've earned ${mission.xp_reward} XP! Multiplier applied if active.`,
          variant: "default",
        });
        setSolvingMissionId(null);
        setProofLink('');
        fetchMissions();
      } else {
        toast({
          title: "VERIFICATION FAILED",
          description: result.message || "We couldn't verify this instantly. Check your submission.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "SYSTEM ERROR",
        description: "Failed to verify mission. Check your connection to the grid.",
        variant: "destructive",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredMissions = missions.filter(m => 
    activeFilter === 'all' || m.frequency === activeFilter
  );

  const formatTime = (ms: number) => {
    if (ms <= 0) return "RESETTING...";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 grayscale opacity-50">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/50">Pulling Assignments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Tactical Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex items-center justify-between group hover:border-red-500/30 transition-all">
            <div className="space-y-1">
               <div className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">Daily Streak</div>
               <div className="text-3xl font-black italic text-red-600 flex items-center gap-2">
                  <Flame className="w-6 h-6 animate-pulse" />
                  <span>3 DAYS</span>
               </div>
            </div>
            <div className="text-right">
               <div className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] mb-1">XP Bonus</div>
               <div className="px-3 py-1 rounded-lg bg-red-600/20 text-red-500 text-[10px] font-black">1.2x MULTIPLIER</div>
            </div>
         </div>
         <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex items-center justify-between group hover:border-blue-500/30 transition-all">
            <div className="space-y-1">
               <div className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">Next Milestone</div>
               <div className="text-3xl font-black italic text-blue-500 flex items-center gap-2">
                  <Medal className="w-6 h-6" />
                  <span>Elite I</span>
               </div>
            </div>
            <div className="text-right">
               <div className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] mb-1">Progress</div>
               <div className="text-sm font-black italic">850 / 1000 XP</div>
            </div>
         </div>
         <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex items-center justify-between group hover:border-yellow-500/30 transition-all">
            <div className="space-y-1">
               <div className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">Rank Status</div>
               <div className="text-3xl font-black italic text-yellow-500 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  <span>Rank #12</span>
               </div>
            </div>
            <div className="text-right">
               <div className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] mb-1">Global Tier</div>
               <div className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-500 text-[10px] font-black italic">TOP 5%</div>
            </div>
         </div>
      </div>

      {/* Navigation & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]">
               <Target className="w-6 h-6" />
            </div>
            <div>
               <h3 className="text-2xl font-black italic uppercase tracking-tighter">Mission Control</h3>
               <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Active Operative: Synchronized</p>
            </div>
         </div>

         <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
            {(['all', 'daily', 'weekly', 'one-time'] as const).map(filter => (
               <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                     activeFilter === filter ? 'bg-red-600 text-white' : 'text-white/40 hover:text-white/60'
                  }`}
               >
                  {filter}
               </button>
            ))}
         </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredMissions.map((mission, idx) => (
            <motion.div
               key={mission.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.05 }}
               className={`group relative overflow-hidden bg-[#0d0d0e] border border-white/10 rounded-2xl transition-all duration-500 hover:border-red-600/40 hover:shadow-[0_0_30px_rgba(220,38,38,0.1)] ${
                  mission.status === 'completed' ? 'grayscale opacity-70 border-green-500/20' : ''
               }`}
            >
               {/* Frequency Badge */}
               <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                     mission.frequency === 'daily' ? 'bg-blue-600/20 text-blue-400' :
                     mission.frequency === 'weekly' ? 'bg-orange-600/20 text-orange-400' :
                     'bg-purple-600/20 text-purple-400'
                  }`}>
                     {mission.frequency}
                  </div>
                  {mission.status === 'completed' && (
                     <div className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> SECURED
                     </div>
                  )}
               </div>

               {/* XP Reward */}
               <div className="absolute top-4 right-4 text-right">
                  <div className="text-lg font-black italic text-red-600 leading-none">+{mission.xp_reward}</div>
                  <div className="text-[8px] font-black uppercase text-white/20 tracking-tighter">XP REWARD</div>
               </div>

               {/* Content */}
               <div className="p-8 pt-12 space-y-6">
                  <div className="space-y-2">
                     <h4 className="text-xl font-black italic uppercase tracking-tighter group-hover:text-red-500 transition-colors">
                        {mission.title}
                     </h4>
                     <p className="text-xs text-white/40 font-medium leading-relaxed min-h-[40px]">
                        {mission.description}
                     </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                     <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                           mission.difficulty === 'easy' ? 'bg-green-600/10 text-green-500' :
                           mission.difficulty === 'medium' ? 'bg-yellow-600/10 text-yellow-500' :
                           'bg-red-600/10 text-red-600'
                        }`}>
                           {mission.title.includes('GitHub') ? <Github className="w-4 h-4" /> : 
                            mission.title.includes('LeetCode') ? <Code className="w-4 h-4" /> :
                            <Activity className="w-4 h-4" />}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/20">
                           {mission.difficulty} Level
                        </div>
                     </div>

                     {mission.frequency !== 'one-time' && mission.status !== 'completed' && (
                        <div className="flex items-center gap-1.5 text-white/30">
                           <Clock className="w-3 h-3" />
                           <span className="text-[9px] font-mono font-bold">{formatTime(mission.time_remaining_ms)}</span>
                        </div>
                     )}
                  </div>

                  {mission.status !== 'completed' ? (
                     <div className="space-y-3 mt-4">
                        {solvingMissionId === mission.id && (
                           <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-2"
                           >
                              <div className="text-[9px] font-black text-red-500 uppercase tracking-widest pl-1">Submit Proof (URL):</div>
                              <input 
                                 type="text"
                                 placeholder="https://..."
                                 value={proofLink}
                                 onChange={(e) => setProofLink(e.target.value)}
                                 className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-red-600 outline-none transition-all"
                              />
                           </motion.div>
                        )}
                        <button
                           onClick={() => handleVerify(mission, solvingMissionId === mission.id ? proofLink : undefined)}
                           disabled={verifyingId === mission.id}
                           className={`w-full h-12 bg-white/5 hover:bg-red-600 text-white/70 hover:text-white border border-white/10 hover:border-red-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 shadow-inner ${
                              solvingMissionId === mission.id ? 'bg-red-600 text-white' : ''
                           }`}
                        >
                           {verifyingId === mission.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                           ) : (
                              <>
                                 {solvingMissionId === mission.id ? 'SUBMIT FOR SCANNING' : 'EXECUTE MISSION'} 
                                 <ChevronRight className="w-4 h-4" />
                              </>
                           )}
                        </button>
                        {solvingMissionId === mission.id && (
                           <button 
                              onClick={() => { setSolvingMissionId(null); setProofLink(''); }}
                              className="w-full text-[9px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest"
                           >
                              [ ABORT SUBMISSION ]
                           </button>
                        )}
                     </div>
                  ) : (
                     <div className="w-full h-12 mt-4 bg-green-500/5 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-green-500/50 flex items-center justify-center gap-2">
                        MISSION SECURED
                     </div>
                  )}
               </div>

               {/* Scanning Overlay Effect */}
               <div className="absolute inset-x-0 top-0 h-[1px] bg-red-600/30 animate-scan pointer-events-none opacity-0 group-hover:opacity-100" />
            </motion.div>
         ))}

         {/* Unlockable Hint */}
         <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center opacity-40">
            <Lock className="w-8 h-8 text-white/20 mb-3" />
            <h5 className="text-xs font-black uppercase tracking-widest mb-1 text-white/50">Next Assignment Pending</h5>
            <p className="text-[10px] font-bold text-white/20">Reach Rank ELITE II to unlock legendary bounties.</p>
         </div>
      </div>
    </div>
  );
};

export default MissionsHub;
