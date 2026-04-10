import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { authService, profileService } from '@/services';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
    if (authService.isAuthenticated()) {
      fetchProfile();
    }
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const data = await profileService.getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error(error);
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
           <StatCard icon={Activity} label="XP Earned" value="2.4k" color="text-red-600" />
           <StatCard icon={Target} label="Missions" value="08" color="text-red-600" />
           <StatCard icon={Award} label="Elite Rank" value="#42" color="text-amber-600" />
           <StatCard icon={Layers} label="Commits" value="156" color="text-emerald-600" />
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
