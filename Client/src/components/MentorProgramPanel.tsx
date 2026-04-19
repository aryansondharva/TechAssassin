import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { Calendar, Copy, ExternalLink, Loader2, ShieldAlert, Star, Video, Users, Target, Zap, ChevronRight, Search, Check, ShieldCheck, Clock, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'expert';
type RequestStatus = 'pending' | 'accepted' | 'declined' | 'canceled' | 'completed';

interface Mentor {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  mentor_experience_level: ExperienceLevel | null;
  mentor_languages: string[] | null;
  mentor_timezone: string | null;
  mentor_focus_areas: string[] | null;
  mentor_availability: string | null;
  mentor_total_sessions: number;
  mentor_rating: number;
  mentor_rating_count: number;
  is_mentor_verified: boolean;
}

interface MentorRequestSession {
  id: string;
  scheduled_for: string | null;
  mentor_confirmed: boolean;
  beginner_confirmed: boolean;
}

interface MentorRequest {
  id: string;
  mentor_id: string;
  beginner_id: string;
  topic: string;
  goal: string;
  status: RequestStatus;
  created_at: string;
  canRespond: boolean;
  canConfirmComplete: boolean;
  session: MentorRequestSession | null;
  mentor: { username: string; full_name: string | null, avatar_url?: string } | null;
  beginner: { username: string; full_name: string | null, avatar_url?: string } | null;
}

interface MentorStats {
  activeMentors: number;
  openHelpRequests: number;
  successfulMatchesThisWeek: number;
  topMentors: Array<{
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    mentor_rating: number;
    mentor_total_sessions: number;
    is_mentor_verified?: boolean;
  }>;
}

const initialStats: MentorStats = {
  activeMentors: 0,
  openHelpRequests: 0,
  successfulMatchesThisWeek: 0,
  topMentors: []
};

const JITSI_BASE_URL = 'https://meet.jit.si';
const MENTORSHIP_ROOM_PREFIX = 'techassassin-mentorship';

const MentorProgramPanel = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [stats, setStats] = useState<MentorStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<Mentor | null>(null);
  
  const [filters, setFilters] = useState({ skill: '', experienceLevel: '', language: '', timezone: '' });
  const [message, setMessage] = useState<string>('');
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [activeTab, setActiveTab] = useState<'directory' | 'requests'>('directory');

  // Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState<MentorRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<MentorRequest | null>(null);
  const [pendingScheduleAt, setPendingScheduleAt] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const selectedMentor = useMemo(
    () => mentors.find((mentor) => mentor.id === selectedMentorId),
    [mentors, selectedMentorId]
  );

  const formatRating = (rating: number | null | undefined) => {
    return (rating ?? 0).toFixed(1);
  };

  const formatSessionSchedule = (dateString: string) => {
    const date = new Date(dateString);
    try {
      return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return date.toLocaleString();
    }
  };

  const getVideoCallUrl = (request: MentorRequest) => {
    const roomSeed = request.id.replace(/[^a-zA-Z0-9-]/g, '-');
    return `${JITSI_BASE_URL}/${MENTORSHIP_ROOM_PREFIX}-${roomSeed}`;
  };

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mentorList, mentorStats] = await Promise.all([
        api.get<Mentor[]>('/community/mentors'),
        api.get<MentorStats>('/community/mentors/stats')
      ]);
      setMentors(mentorList);
      setStats(mentorStats);
      if (mentorList.length > 0 && !selectedMentorId) {
        setSelectedMentorId(mentorList[0].id);
      }

      try {
        const myRequests = await api.get<MentorRequest[]>('/community/mentors/requests');
        setRequests(myRequests);
      } catch (err) {}

      try {
        const me = await api.get<Mentor>('/community/mentors/me');
        setMyProfile(me);
      } catch (err) {}
    } catch (error) {
      setMessage('Failed to load mission data.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAsMentor = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      bio: formData.get('bio'),
      mentor_experience_level: formData.get('expertise'),
      mentor_timezone: formData.get('timezone'),
      is_mentor_verified: true,
      is_mentor_available: true
    };

    try {
      await api.patch('/community/mentors/me', data);
      setShowApplyModal(false);
      setMessage('Expert profile verified! You now have the Mentor Badge.');
      loadData();
    } catch (err) {
      setMessage('Sync failed. Check connection.');
    }
  };

  const handleApplyFilters = async () => {
    const query: any = {};
    if (filters.skill.trim()) query.skill = filters.skill.trim();
    if (filters.experienceLevel) query.experienceLevel = filters.experienceLevel;
    const list = await api.get<Mentor[]>('/community/mentors', query);
    setMentors(list);
  };

  const submitHelpRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMentorId) return;
    try {
      await api.post('/community/mentors/requests', {
        mentor_id: selectedMentorId,
        topic,
        goal,
        urgency: 'medium',
        session_type: 'call',
        preferred_time_slots: []
      });
      setTopic(''); setGoal('');
      setMessage('Connection initializing... Mentor will ping back soon.');
      const list = await api.get<MentorRequest[]>('/community/mentors/requests');
      setRequests(list);
    } catch (err) { setMessage('Buffer overflow. Please retry.'); }
  };

  const handleAcceptWithSchedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!showAcceptModal) return;
    try {
      await api.patch(`/community/mentors/requests/${showAcceptModal.id}`, {
        action: 'accept',
        scheduled_for: new Date(pendingScheduleAt).toISOString()
      });
      setShowAcceptModal(null);
      setMessage('Session scheduled. Link generated.');
      loadData();
    } catch (err) { setMessage('Time sync error.'); }
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!showReviewModal?.session?.id) return;
    try {
      await api.post(`/community/mentors/sessions/${showReviewModal.session.id}/feedback`, {
        rating: reviewRating,
        review: reviewText
      });
      setShowReviewModal(null);
      setMessage('Debriefing complete. Rating synchronized.');
      loadData();
    } catch (err) { setMessage('Feedback loop failed.'); }
  };

  const handleRequestAction = async (requestId: string, action: any) => {
    try {
      await api.patch(`/community/mentors/requests/${requestId}`, { action });
      loadData();
    } catch (err) { setMessage('Action failed.'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-12 pb-20">
      {/* Stats & Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={Users} label="Active Mentors" value={stats.activeMentors} color="blue" />
        <MetricCard icon={ShieldCheck} label="Operational Links" value={stats.openHelpRequests} color="red" />
        <MetricCard icon={Zap} label="Matches Executed" value={stats.successfulMatchesThisWeek} color="yellow" />
        
        {myProfile?.is_mentor_verified ? (
           <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 shadow-sm">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-green-500/10 text-green-600">
               <ShieldCheck className="w-5 h-5 shadow-green-500/20 shadow-lg" />
             </div>
             <div className="text-[10px] uppercase tracking-[0.2em] font-black text-green-600/60">Badge Status</div>
             <div className="text-xl font-black mt-1 text-green-700 tracking-tight">VERIFIED MENTOR</div>
           </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowApplyModal(true)}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-left group hover:border-primary/40 transition-all border-dashed"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-primary text-white group-hover:shadow-[0_0_20px_rgba(255,0,0,0.3)]">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60">Become a Mentor</div>
            <div className="text-lg font-black mt-1 text-foreground leading-none">APPLY NOW</div>
          </motion.button>
        )}
      </div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium flex items-center justify-between shadow-sm">
          {message}
          <button onClick={() => setMessage('')} className="text-primary/60 hover:text-primary">✕</button>
        </motion.div>
      )}

      {/* Main Tabs */}
      <div className="flex gap-4 border-b border-border">
        {['directory', 'requests'].map((tab) => (
          <button 
            key={tab} onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab === 'directory' ? 'Operational Dossiers' : 'Mission Logs'}
            {activeTab === tab && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(255,0,0,0.3)]" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'directory' ? (
          <motion.div key="dir" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-8">
            {/* Directory Section */}
            <div className="space-y-6">
               <div className="flex gap-3 bg-muted/20 p-3 rounded-2xl border border-border">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:border-primary outline-none" placeholder="Search by tech stack..." value={filters.skill} onChange={e => setFilters(f => ({...f, skill: e.target.value}))} />
                  </div>
                  <button onClick={handleApplyFilters} className="bg-primary text-white px-8 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Scan</button>
               </div>

               <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                  {mentors.map(mentor => (
                    <motion.button
                      layout key={mentor.id} onClick={() => setSelectedMentorId(mentor.id)}
                      className={`relative p-5 rounded-3xl border text-left transition-all ${selectedMentorId === mentor.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/30'}`}
                    >
                      <div className="flex gap-5">
                         <div className="relative shrink-0">
                           <img src={mentor.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.username}`} className="w-16 h-16 rounded-2xl object-cover border-2 border-border shadow-inner" alt="" />
                           {mentor.is_mentor_verified && (
                             <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-card flex items-center justify-center text-white shadow-xl">
                               <ShieldCheck size={10} />
                             </div>
                           )}
                           <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card animate-pulse shadow-green-500 shadow-xl" />
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start">
                               <div>
                                 <h4 className="font-black text-xl tracking-tight">{mentor.full_name || mentor.username}</h4>
                                 <p className="text-xs font-bold text-muted-foreground">CODE: @{mentor.username}</p>
                               </div>
                               <div className="flex items-center gap-1.5 bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20">
                                 <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                 <span className="text-xs font-black text-yellow-600">{formatRating(mentor.mentor_rating)}</span>
                               </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-3 line-clamp-2 italic font-medium">"{mentor.bio || 'Strategic operative ready for mission assignment.'}"</p>
                            <div className="flex flex-wrap gap-2 mt-4">
                               {mentor.skills?.slice(0, 4).map(s => (
                                 <span key={s} className="px-3 py-1 bg-muted rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border">#{s}</span>
                               ))}
                            </div>
                         </div>
                      </div>
                    </motion.button>
                  ))}
               </div>
            </div>

            {/* Request Form */}
            <div className="relative">
              <div className="sticky top-4 bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none -rotate-12"><ShieldCheck size={160} className="text-primary" /></div>
                 
                 <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">Establish <span className="text-primary">Sync</span></h3>
                 <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-8">Secure Line Request</p>

                 {selectedMentor ? (
                   <form onSubmit={submitHelpRequest} className="space-y-6">
                      <div className="p-4 bg-muted/40 rounded-2xl border border-border flex items-center gap-4">
                         <img src={selectedMentor.avatar_url || ''} className="w-12 h-12 rounded-xl border border-border" alt="" />
                         <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Target</p>
                            <p className="font-black leading-none">{selectedMentor.full_name || selectedMentor.username}</p>
                         </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Mission Subject</label>
                        <input className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-primary transition-all shadow-inner" placeholder="e.g. System Scalability Design" required value={topic} onChange={e => setTopic(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Operational Goal</label>
                         <textarea className="w-full h-32 bg-muted/30 border border-border rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-primary transition-all resize-none shadow-inner" placeholder="Target objectives for this session..." required value={goal} onChange={e => setGoal(e.target.value)} />
                      </div>

                      <button type="submit" className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-3">
                         Send Direct Request <ChevronRight size={16} />
                      </button>
                   </form>
                 ) : (
                   <div className="py-24 text-center">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6"><Target className="text-muted-foreground opacity-20" size={32} /></div>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Awaiting Target Selection</p>
                   </div>
                 )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="req" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {requests.map(req => {
                  const isMentorRole = req.mentor_id === myProfile?.id;
                  const partner = isMentorRole ? req.beginner : req.mentor;

                  return (
                    <motion.div key={req.id} className="group bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                       {/* Status Badge */}
                       <div className={`absolute top-0 right-0 px-6 py-2 text-[9px] font-black uppercase tracking-[3px] rounded-bl-2xl shadow-sm ${
                         req.status === 'accepted' ? 'bg-indigo-600 text-white' : 
                         req.status === 'completed' ? 'bg-green-600 text-white' : 
                         req.status === 'pending' ? 'bg-yellow-500 text-white animate-pulse' : 'bg-muted text-muted-foreground'
                       }`}>
                         {req.status}
                       </div>

                       <div className="flex gap-4 mb-6">
                          <img src={partner?.avatar_url || ''} className="w-14 h-14 rounded-2xl border border-border shadow-sm group-hover:scale-105 transition-transform" alt="" />
                          <div className="flex-1">
                             <h4 className="font-black text-lg tracking-tight mb-1">{req.topic}</h4>
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">With {partner?.full_name || partner?.username}</p>
                          </div>
                       </div>

                       <p className="bg-muted/30 p-5 rounded-2xl text-sm font-medium italic text-muted-foreground/80 mb-6 border border-border">"{req.goal}"</p>

                       {req.session?.scheduled_for && (
                         <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl mb-6">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            <div className="text-sm font-black text-indigo-700 tracking-tight">{formatSessionSchedule(req.session.scheduled_for)}</div>
                         </div>
                       )}

                       <div className="flex flex-wrap gap-3">
                          {req.canRespond && (
                             <>
                               <button onClick={() => setShowAcceptModal(req)} className="flex-1 py-3 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">Authorize & Set Time</button>
                               <button onClick={() => handleRequestAction(req.id, 'decline')} className="px-5 py-3 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 hover:border-red-500 transition-all">Reject</button>
                             </>
                          )}

                          {req.canConfirmComplete && (
                            <button onClick={() => handleRequestAction(req.id, 'confirm_complete')} className="flex-1 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg shadow-primary/20">Mark Mission Complete</button>
                          )}

                          {req.status === 'completed' && !isMentorRole && (
                            <button onClick={() => { setShowReviewModal(req); setReviewRating(5); setReviewText(''); }} className="flex-1 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all">Leave Performance Review</button>
                          )}

                          {req.session && (req.status === 'accepted' || req.status === 'completed') && (
                            <div className="w-full flex gap-2 mt-2">
                               <a href={getVideoCallUrl(req)} target="_blank" rel="noreferrer" className="flex-1 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-all">
                                  <Video size={16} className="text-red-600" /> Enter Video Lounge
                               </a>
                               <button onClick={() => { navigator.clipboard.writeText(getVideoCallUrl(req)); setMessage('Link copied.'); }} className="p-4 bg-muted border border-border rounded-2xl hover:bg-white transition-all shadow-sm">
                                  <Copy size={16} />
                               </button>
                            </div>
                          )}
                       </div>
                    </motion.div>
                  );
                })}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {/* Mentor Application Form Modal */}
        {showApplyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm pointer-events-auto">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-card border border-border w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-indigo-600 to-primary shadow-[0_4px_10px_rgba(255,0,0,0.3)]" />
                <button onClick={() => setShowApplyModal(false)} className="absolute top-8 right-8 text-muted-foreground hover:text-foreground">✕</button>
                
                <div className="text-center mb-10">
                   <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 text-primary"><ShieldCheck size={32} /></div>
                   <h3 className="text-3xl font-black uppercase tracking-tighter">Mentor <span className="text-primary">Accreditation</span></h3>
                   <p className="text-sm text-muted-foreground font-medium">Clear this form to earn your Mentor Badge.</p>
                </div>

                <form onSubmit={handleApplyAsMentor} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Professional Bio</label>
                      <textarea name="bio" required className="w-full h-24 bg-muted/40 border border-border rounded-2xl p-5 text-sm outline-none focus:border-primary resize-none transition-all" placeholder="Strategic background and mission highlights..." />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Expertise Tier</label>
                         <select name="expertise" className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary">
                            <option value="junior">Junior Operative</option>
                            <option value="mid">Specialist</option>
                            <option value="senior" selected>Strategic Senior</option>
                            <option value="expert">Elite Expert</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Zone (Timezone)</label>
                         <input name="timezone" placeholder="e.g. UTC+5:30" className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" />
                      </div>
                   </div>
                   <button type="submit" className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all text-xs">Verify My Credentials</button>
                </form>
             </motion.div>
          </motion.div>
        )}

        {/* Accept Request Modal */}
        {showAcceptModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm pointer-events-auto">
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card border border-border w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
                <h3 className="text-xl font-black uppercase mb-6 tracking-tight">Set Mission <span className="text-indigo-600">Schedule</span></h3>
                <form onSubmit={handleAcceptWithSchedule} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Select Date & Time</label>
                      <input type="datetime-local" required className="w-full bg-muted border border-border rounded-xl p-4 text-sm" onChange={e => setPendingScheduleAt(e.target.value)} />
                   </div>
                   <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowAcceptModal(null)} className="flex-1 py-4 bg-muted rounded-xl text-xs font-black uppercase">Cancel</button>
                      <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-indigo-600/20">Finalize Link</button>
                   </div>
                </form>
             </motion.div>
          </motion.div>
        )}

        {/* Feedback Modal */}
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm pointer-events-auto">
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card border border-border w-full max-w-md rounded-[2rem] p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600"><Star size={24} fill="currentColor" /></div>
                <h3 className="text-xl font-black uppercase mb-2">Performance <span className="text-indigo-600">Debrief</span></h3>
                <p className="text-sm text-muted-foreground mb-8">Synchronize your experience with the mentor.</p>
                
                <form onSubmit={handleSubmitReview} className="space-y-6">
                   <div className="flex justify-center gap-3">
                      {[1,2,3,4,5].map(v => (
                        <button key={v} type="button" onClick={() => setReviewRating(v)} className={`w-12 h-12 rounded-xl text-lg font-black transition-all ${reviewRating >= v ? 'bg-yellow-400 text-white translate-y-[-4px] shadow-lg shadow-yellow-400/20' : 'bg-muted text-muted-foreground'}`}>
                          {v}
                        </button>
                      ))}
                   </div>
                   <textarea placeholder="Operational notes on your guidance..." className="w-full h-24 bg-muted border border-border rounded-xl p-4 text-sm resize-none outline-none focus:border-indigo-600 transition-all font-medium" value={reviewText} onChange={e => setReviewText(e.target.value)} />
                   <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl text-xs shadow-xl shadow-indigo-600/20">Submit Performance Log</button>
                </form>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }: { icon: any, label: string; value: number; color: 'red' | 'blue' | 'yellow' }) => {
  const colors = {
    red: 'text-red-500 bg-red-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10'
  };

  return (
    <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">{label}</div>
      <div className="text-3xl font-black mt-1 text-foreground leading-none">{value}</div>
    </motion.div>
  );
};

export default MentorProgramPanel;
