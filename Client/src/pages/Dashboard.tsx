import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { profileService, missionsService } from '@/services';
import { useAuth } from '@clerk/react';
import type { Mission } from '@/services/missions.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Calendar, 
  Settings, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Shield, 
  Zap, 
  ChevronRight,
  Database,
  Activity,
  Layers
} from 'lucide-react';
import type { Profile } from '@/types/api';
import Navbar from '@/components/Navbar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (userId) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [navigate, isLoaded, userId]);

  const fetchData = async () => {
    try {
      const [profileData, missionsData] = await Promise.all([
        profileService.getMyProfile(),
        missionsService.getAvailableMissions()
      ]);
      setProfile(profileData);
      setMissions(missionsData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-red-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar dark={false} />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Welcome Section */}
        <div className="mb-12">
           <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-[0.2em] mb-3">
              <Shield className="w-4 h-4" />
              <span>Session Active</span>
           </div>
           <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Command Center</h1>
           <p className="text-slate-500 mt-2 font-medium">Welcome back, operative. Initializing neural link and tactical overview.</p>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <StatCard icon={Activity} label="XP Earned" value={profile?.total_xp?.toString() || "0"} color="text-red-600" />
           <StatCard icon={Target} label="Streaks" value={profile?.current_streak?.toString() || "0"} color="text-red-600" />
           <StatCard icon={Award} label="Elite Rank" value={`#${profile?.rank_value || '?'}`} color="text-amber-600" />
           <StatCard icon={Layers} label="Global Tier" value={profile?.rank?.name || "Operative"} color="text-emerald-600" />
        </div>

        {/* Primary Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Mission Deployment Card */}
          <ActionCard 
            title="Mission Briefings"
            desc="Explore upcoming deployments, hackathons, and community-led operations."
            icon={Calendar}
            color="red"
            onClick={() => navigate('/events')}
            tag="Active Sector"
          />

          {/* Profile Configuration Card */}
          <ActionCard 
            title="Operative Dossier"
            desc="Synchronize your skill matrix, identity parameters, and project history."
            icon={Settings}
            color="slate"
            onClick={() => navigate('/edit-profile')}
            tag="Neural Sync"
          />
        </div>

        {/* Daily Mission Section */}
        {(() => {
          const dailyMission = missions.find(m => m.frequency === 'daily' && m.status !== 'completed');
          if (!dailyMission) return null;

          return (
            <div className="mt-12 mb-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Target className="w-32 h-32" />
               </div>
               <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                     <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">ACTIVE DAILY BOUNTY</h2>
                     <span className="px-2 py-1 rounded bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.max(0, Math.floor(dailyMission.time_remaining_ms / 3600000))}h Left
                     </span>
                  </div>
               </div>
               
               <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-red-50 border border-red-100/50 rounded-2xl flex items-center justify-center shrink-0">
                     <Target className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="flex-1">
                     <h3 className="text-xl font-black text-slate-900 mb-1">{dailyMission.title}</h3>
                     <p className="text-sm text-slate-500 font-medium italic mb-3">{dailyMission.description}</p>
                     
                     <div className="w-full bg-slate-50 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div className="bg-red-600 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Status: <span className="text-amber-500">Available</span></span>
                     </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 min-w-[120px] shrink-0 custom-xp-box">
                     <span className="text-xs font-bold text-slate-400 mb-1">REWARD</span>
                     <span className="text-2xl font-black text-red-600">+{dailyMission.xp_reward} <span className="text-[10px] text-slate-400 uppercase">XP</span></span>
                  </div>
               </div>
               
               <div className="mt-8 flex justify-end relative z-10">
                  <Button 
                    onClick={async () => {
                       try {
                         setIsClaiming(true);
                         await missionsService.verifyMission(dailyMission.mission_id, dailyMission.requirement_type);
                         toast({ title: 'Bounty Secured', description: `Assigned +${dailyMission.xp_reward} XP to your dossier.` });
                         fetchData();
                       } catch (e: any) {
                         toast({ title: 'Verification Failed', description: e.message || 'Could not claim bounty.', variant: 'destructive' });
                       } finally {
                         setIsClaiming(false);
                       }
                    }}
                    disabled={isClaiming}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 h-12 shadow-red-600/20 shadow-lg flex items-center gap-2 transition-all hover:-translate-y-1"
                  >
                     {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                     <span className="font-bold tracking-widest uppercase text-xs">Execute & Claim XP</span>
                  </Button>
               </div>
            </div>
          );
        })()}

        {/* Intelligence Feed Section */}
        <div className="mt-16 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
           <div className="flex items-center justify-between mb-10">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Intelligence Feed</h2>
              <button className="text-xs font-bold text-red-600 hover:underline uppercase tracking-widest">View Archives</button>
           </div>
           
           <div className="space-y-6">
              <FeedItem 
                 icon={Zap} 
                 title="System Uplink Established" 
                 time="3m ago" 
                 desc="A new mission 'Code4Cause' has been added to your sector." 
                 color="text-red-600 bg-red-50"
              />
              <FeedItem 
                 icon={Award} 
                 title="Achievement Unlocked" 
                 time="1h ago" 
                 desc="You've been ranked in the top 50 operatives this season." 
                 color="text-amber-500 bg-amber-50"
              />
              <FeedItem 
                 icon={Database} 
                 title="Profile Synchronized" 
                 time="2h ago" 
                 desc="GitHub contribution matrix successfully integrated into your dossier." 
                 color="text-emerald-500 bg-emerald-50"
              />
           </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white p-8 group hover:shadow-md transition-all">
       <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <div className={`p-3 rounded-xl bg-slate-50 ${color}`}>
                <Icon className="w-5 h-5" />
             </div>
             <TrendingUp className="w-4 h-4 text-slate-200" />
          </div>
          <div>
             <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
          </div>
       </div>
    </Card>
  );
}

function ActionCard({ title, desc, icon: Icon, color, onClick, tag }: any) {
   const colorClasses: any = {
      red: 'bg-red-600 text-white shadow-red-600/20',
      slate: 'bg-slate-900 text-white shadow-slate-900/20'
   };

   return (
      <Card 
        onClick={onClick}
        className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer p-10 flex flex-col justify-between min-h-[320px]"
      >
        <div>
           <div className="flex items-center justify-between mb-8">
              <div className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">{tag}</div>
              <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                 <Icon className="w-6 h-6" />
              </div>
           </div>
           <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 mb-4 group-hover:text-red-600 transition-colors">{title}</h3>
           <p className="text-slate-500 font-medium leading-relaxed italic opacity-80">{desc}</p>
        </div>
        <div className="flex items-center gap-3 pt-8 group-hover:translate-x-2 transition-transform duration-500">
           <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Execute Protocol</span>
           <ChevronRight className="w-4 h-4 text-red-600" />
        </div>
      </Card>
   );
}

function FeedItem({ icon: Icon, title, time, desc, color }: any) {
  return (
    <div className="flex gap-6 items-start group">
       <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${color}`}>
          <Icon className="w-5 h-5" />
       </div>
       <div className="flex-1 pb-6 border-b border-slate-50">
          <div className="flex items-center justify-between mb-1">
             <h4 className="text-sm font-black uppercase text-slate-900 tracking-tight">{title}</h4>
             <span className="text-[10px] font-bold text-slate-300 uppercase italic">{time}</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed italic">{desc}</p>
       </div>
    </div>
  );
}
