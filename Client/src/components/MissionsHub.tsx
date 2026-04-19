import { useState, useEffect } from 'react';
import {
  Github,
  Code,
  Target,
  Trophy,
  Clock,
  ChevronRight,
  Shield,
  CheckCircle2,
  Lock,
  Flame,
  Loader2,
  Medal,
  Activity,
  Zap,
  Star,
  ListChecks,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

// Supabase client is imported from @/lib/supabase (shared, JWT-injecting instance)

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Mission {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  frequency: 'daily' | 'weekly' | 'one-time';
  difficulty: 'easy' | 'medium' | 'hard';
  requirement_type?: string;
  status: 'in_progress' | 'pending_verification' | 'completed';
  progress: any;
  time_remaining_ms: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatTime = (ms: number) => {
  if (ms <= 0) return 'RESETTING...';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
};

const getRank = (xp: number) => {
  if (xp >= 2000) return { label: 'Legend', color: 'text-yellow-400' };
  if (xp >= 1000) return { label: 'Elite', color: 'text-purple-400' };
  if (xp >= 500)  return { label: 'Veteran', color: 'text-blue-400' };
  if (xp >= 100)  return { label: 'Operative', color: 'text-green-400' };
  return { label: 'Rookie', color: 'text-white/50' };
};

const freqStyle = (f: string) =>
  f === 'daily'
    ? 'bg-blue-600/20 text-blue-400 border-blue-500/20'
    : f === 'weekly'
    ? 'bg-orange-600/20 text-orange-400 border-orange-500/20'
    : 'bg-purple-600/20 text-purple-400 border-purple-500/20';

const diffIcon = (title: string) => {
  if (title.toLowerCase().includes('github')) return <Github className="w-4 h-4" />;
  if (title.toLowerCase().includes('leetcode') || title.toLowerCase().includes('code'))
    return <Code className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
};

// ─────────────────────────────────────────────
// Mission Card component
// ─────────────────────────────────────────────
interface CardProps {
  mission: Mission;
  index: number;
  verifyingId: string | null;
  solvingMissionId: string | null;
  proofLink: string;
  onVerify: (mission: Mission, link?: string) => void;
  onSetSolving: (id: string | null) => void;
  onSetProofLink: (link: string) => void;
}

const MissionCard = ({
  mission, index, verifyingId, solvingMissionId,
  proofLink, onVerify, onSetSolving, onSetProofLink,
}: CardProps) => {
  const isCompleted = mission.status === 'completed';
  const isSolving   = solvingMissionId === mission.id;
  const isVerifying = verifyingId === mission.id;

  const diffStyle =
    mission.difficulty === 'easy'   ? 'bg-green-600/10 text-green-500'  :
    mission.difficulty === 'medium' ? 'bg-yellow-600/10 text-yellow-500' :
                                       'bg-red-600/10 text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative overflow-hidden bg-[#0d0d0e] border rounded-2xl transition-all duration-500
        ${isCompleted
          ? 'border-green-500/20 opacity-80'
          : 'border-white/10 hover:border-red-600/40 hover:shadow-[0_0_30px_rgba(220,38,38,0.1)]'}`}
    >
      {/* Top badges */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${freqStyle(mission.frequency)}`}>
          {mission.frequency}
        </span>
        {isCompleted && (
          <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 border border-green-500/20 text-[8px] font-black uppercase flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> SECURED
          </span>
        )}
      </div>

      {/* XP */}
      <div className="absolute top-4 right-4 text-right z-10">
        <div className="text-lg font-black italic text-red-500 leading-none">+{mission.xp_reward}</div>
        <div className="text-[8px] font-black uppercase text-white/20 tracking-tighter">XP</div>
      </div>

      {/* Body */}
      <div className="p-6 pt-12 space-y-4">
        <div>
          <h4 className="text-lg font-black italic uppercase tracking-tight group-hover:text-red-500 transition-colors line-clamp-2 mb-1">
            {mission.title}
          </h4>
          <p className="text-xs text-white/40 leading-relaxed min-h-[36px]">{mission.description}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${diffStyle}`}>
              {diffIcon(mission.title)}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{mission.difficulty}</span>
          </div>
          {mission.frequency !== 'one-time' && !isCompleted && (
            <div className="flex items-center gap-1.5 text-white/30">
              <Clock className="w-3 h-3" />
              <span className="text-[9px] font-mono font-bold">{formatTime(mission.time_remaining_ms)}</span>
            </div>
          )}
        </div>

        {!isCompleted ? (
          <div className="space-y-2">
            <AnimatePresence>
              {isSolving && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <div className="text-[9px] font-black text-red-500 uppercase tracking-widest">Submit Proof (URL):</div>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={proofLink}
                    onChange={e => onSetProofLink(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-red-600 outline-none transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => onVerify(mission, isSolving ? proofLink : undefined)}
              disabled={isVerifying}
              className={`w-full h-11 border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2
                ${isSolving
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white/5 hover:bg-red-600 text-white/70 hover:text-white border-white/10 hover:border-red-600'}`}
            >
              {isVerifying
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{isSolving ? 'SUBMIT FOR SCANNING' : 'EXECUTE MISSION'}<ChevronRight className="w-4 h-4" /></>}
            </button>

            {isSolving && (
              <button
                onClick={() => { onSetSolving(null); onSetProofLink(''); }}
                className="w-full text-[9px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest"
              >[ ABORT ]</button>
            )}
          </div>
        ) : (
          <div className="w-full h-11 bg-green-500/5 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-green-500/50 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> MISSION SECURED
          </div>
        )}
      </div>

      {/* Hover scan line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-red-600/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
type FilterType = 'all' | 'daily' | 'weekly' | 'one-time';
type ViewType   = 'all' | 'my';

const MissionsHub = () => {
  const [missions,          setMissions]          = useState<Mission[]>([]);
  const [profile,           setProfile]           = useState<any>(null);
  const [userId,            setUserId]            = useState<string | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [activeFilter,      setActiveFilter]      = useState<FilterType>('all');
  const [activeView,        setActiveView]        = useState<ViewType>('all');
  const [verifyingId,       setVerifyingId]       = useState<string | null>(null);
  const [solvingMissionId,  setSolvingMissionId]  = useState<string | null>(null);
  const [proofLink,         setProofLink]         = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [missionsData, profileData] = await Promise.all([
        api.get<Mission[]>('/missions'),
        api.get<any>('/profile'),
      ]);

      setMissions(Array.isArray(missionsData) ? missionsData : []);
      setProfile(profileData ?? null);
      setUserId(profileData?.id ?? null);

    } catch (err) {
      console.error('fetchData error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (mission: Mission, link?: string) => {
    const needsLink = ['leetcode_solve', 'blog_post', 'os_contribution', 'ship_project', 'pr_review']
      .includes(mission.requirement_type || '');

    if (needsLink && !link && solvingMissionId !== mission.id) {
      setSolvingMissionId(mission.id);
      return;
    }

    if (!userId) return;
    setVerifyingId(mission.id);

    try {
      await api.post('/missions', {
        missionId: mission.id,
        requirementType: mission.requirement_type || 'generic',
        payload: { link: link || null },
      });

      toast({
        title: '🎯 MISSION ACCOMPLISHED',
        description: `+${mission.xp_reward} XP secured! Keep pushing, Operative.`,
      });
      setSolvingMissionId(null);
      setProofLink('');
      fetchData();
    } catch (err: any) {
      toast({
        title: 'SYSTEM ERROR',
        description: err?.message || 'Could not verify mission.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingId(null);
    }
  };

  // ── Derived ──
  const completedMissions = missions.filter(m => m.status === 'completed');
  const pendingMissions   = missions.filter(m => m.status !== 'completed');
  const totalXP           = profile?.total_xp ?? 0;
  const rank              = getRank(totalXP);
  const streak            = profile?.current_streak ?? 0;

  const displayedMissions =
    activeView === 'my'
      ? completedMissions
      : pendingMissions.filter(m => activeFilter === 'all' || m.frequency === activeFilter);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Syncing with grid...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-2xl">
        <Shield className="w-12 h-12 text-white/10 mb-4" />
        <h4 className="text-sm font-black uppercase tracking-widest text-white/30 mb-1">Authentication Required</h4>
        <p className="text-[11px] text-white/20 max-w-xs">Sign in to access your mission dossier.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:border-red-500/30 transition-all">
          <div>
            <div className="text-[9px] font-black uppercase text-white/30 tracking-[0.2em] mb-1">Daily Streak</div>
            <div className="text-2xl font-black italic text-red-500 flex items-center gap-1.5">
              <Flame className="w-5 h-5 animate-pulse" />
              {streak} Days
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black uppercase text-white/20 tracking-[0.15em] mb-1">XP Boost</div>
            <div className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 text-[9px] font-black">
              {streak >= 30 ? '2.0x' : streak >= 7 ? '1.5x' : '1.0x'} MULTIPLIER
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:border-blue-500/30 transition-all">
          <div>
            <div className="text-[9px] font-black uppercase text-white/30 tracking-[0.2em] mb-1">Current Rank</div>
            <div className={`text-2xl font-black italic ${rank.color} flex items-center gap-1.5`}>
              <Medal className="w-5 h-5" />
              {rank.label}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black uppercase text-white/20 tracking-[0.15em] mb-1">Total XP</div>
            <div className="flex items-center gap-1 justify-end text-sm font-black italic text-white">
              <Trophy className="w-4 h-4 text-yellow-500" />
              {totalXP.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:border-green-500/30 transition-all">
          <div>
            <div className="text-[9px] font-black uppercase text-white/30 tracking-[0.2em] mb-1">Missions Done</div>
            <div className="text-2xl font-black italic text-green-400 flex items-center gap-1.5">
              <Star className="w-5 h-5" />
              {completedMissions.length} / {missions.length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black uppercase text-white/20 tracking-[0.15em] mb-1">Progress</div>
            <div className="px-2.5 py-1 rounded-lg bg-green-600/20 text-green-400 text-[9px] font-black">
              {missions.length > 0 ? `${Math.round((completedMissions.length / missions.length) * 100)}% DONE` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ── View + Filter Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
        {/* View toggle */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
          {([
            { key: 'all', label: 'All Missions',       Icon: Target,     color: 'bg-red-600' },
            { key: 'my',  label: 'My Missions',         Icon: ListChecks, color: 'bg-green-600' },
          ] as const).map(({ key, label, Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === key ? `${color} text-white` : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {key === 'my' && completedMissions.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-green-500/30 text-green-300 text-[9px] flex items-center justify-center font-black">
                  {completedMissions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Frequency filter */}
          {activeView === 'all' && (
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
              {(['all', 'daily', 'weekly', 'one-time'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeFilter === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={fetchData}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Section label ── */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${activeView === 'my' ? 'bg-green-600' : 'bg-red-600'}`}>
          {activeView === 'my' ? <ListChecks className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="text-xl font-black italic uppercase tracking-tight">
            {activeView === 'my' ? 'Completed Missions' : 'Active Assignments'}
          </h3>
          <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">
            {activeView === 'my'
              ? `${completedMissions.length} mission${completedMissions.length !== 1 ? 's' : ''} secured`
              : `${displayedMissions.length} mission${displayedMissions.length !== 1 ? 's' : ''} available`}
          </p>
        </div>
      </div>

      {/* ── Grid ── */}
      {displayedMissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-2xl">
          {activeView === 'my' ? (
            <>
              <ListChecks className="w-12 h-12 text-white/10 mb-4" />
              <h4 className="text-sm font-black uppercase tracking-widest text-white/30 mb-2">No Missions Completed Yet</h4>
              <p className="text-[11px] text-white/20 max-w-xs">Execute missions from the All Missions tab to see them here.</p>
              <button
                onClick={() => setActiveView('all')}
                className="mt-6 px-6 py-2.5 bg-red-600/20 hover:bg-red-600 border border-red-600/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-white transition-all"
              >
                View Available Missions →
              </button>
            </>
          ) : (
            <>
              <Lock className="w-12 h-12 text-white/10 mb-4" />
              <h4 className="text-sm font-black uppercase tracking-widest text-white/30 mb-2">No Missions Found</h4>
              <p className="text-[11px] text-white/20 max-w-xs">Try switching the frequency filter to "All".</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedMissions.map((mission, idx) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              index={idx}
              verifyingId={verifyingId}
              solvingMissionId={solvingMissionId}
              proofLink={proofLink}
              onVerify={handleVerify}
              onSetSolving={setSolvingMissionId}
              onSetProofLink={setProofLink}
            />
          ))}

          {activeView === 'all' && (
            <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center opacity-40">
              <Lock className="w-7 h-7 text-white/20 mb-3" />
              <h5 className="text-xs font-black uppercase tracking-widest mb-1 text-white/50">Locked Bounty</h5>
              <p className="text-[10px] font-bold text-white/20 leading-relaxed">
                Reach Rank Elite to unlock legendary assignments.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MissionsHub;
