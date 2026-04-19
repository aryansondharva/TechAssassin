import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { Calendar, Copy, ExternalLink, Loader2, ShieldAlert, Star, Video, Users, Target, Zap, ChevronRight, Search, Filter } from 'lucide-react';
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
  mentor: { username: string; full_name: string | null } | null;
  beginner: { username: string; full_name: string | null } | null;
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
  const [filters, setFilters] = useState({ skill: '', experienceLevel: '', language: '', timezone: '' });
  const [message, setMessage] = useState<string>('');
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [mentorAvailabilityEnabled, setMentorAvailabilityEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'requests'>('directory');

  const selectedMentor = useMemo(
    () => mentors.find((mentor) => mentor.id === selectedMentorId),
    [mentors, selectedMentorId]
  );

  const formatRating = (rating: number | null | undefined) => {
    return (rating ?? 0).toFixed(1);
  };

  const formatSessionSchedule = (dateString: string) => {
    const date = new Date(dateString);
    const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    try {
      return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return date.toLocaleString(locale);
    }
  };

  const getVideoCallUrl = (request: MentorRequest) => {
    const roomSeed = request.id.replace(/[^a-zA-Z0-9-]/g, '-');
    return `${JITSI_BASE_URL}/${MENTORSHIP_ROOM_PREFIX}-${roomSeed}`;
  };

  const hasActiveSession = (request: MentorRequest) =>
    (request.status === 'accepted' || request.status === 'completed') && Boolean(request.session);

  const copyVideoCallUrl = async (request: MentorRequest) => {
    try {
      await navigator.clipboard.writeText(getVideoCallUrl(request));
      setMessage('Video call link copied.');
    } catch {
      setMessage('Unable to copy link.');
    }
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
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }

      try {
        const me = await api.get<{ is_mentor_available: boolean }>('/community/mentors/me');
        setMentorAvailabilityEnabled(Boolean(me.is_mentor_available));
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    const query: Record<string, string> = {};
    if (filters.skill.trim()) query.skill = filters.skill.trim();
    if (filters.language.trim()) query.language = filters.language.trim();
    if (filters.timezone.trim()) query.timezone = filters.timezone.trim();
    if (filters.experienceLevel) query.experienceLevel = filters.experienceLevel;

    const mentorList = await api.get<Mentor[]>('/community/mentors', query);
    setMentors(mentorList);
  };

  const submitHelpRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedMentorId) return setMessage('Select a mentor.');
    try {
      await api.post('/community/mentors/requests', {
        mentor_id: selectedMentorId,
        topic,
        goal,
        urgency: 'medium',
        session_type: 'call',
        preferred_time_slots: []
      });
      setTopic('');
      setGoal('');
      setMessage('Request sent successfully!');
      const myRequests = await api.get<MentorRequest[]>('/community/mentors/requests');
      setRequests(myRequests);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Submit failed');
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline' | 'cancel' | 'confirm_complete') => {
    try {
      await api.patch(`/community/mentors/requests/${requestId}`, { action });
      loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Update failed');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Synchronizing Mentorship Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={Users} label="Active Mentors" value={stats.activeMentors} color="blue" />
        <MetricCard icon={Target} label="Open Requests" value={stats.openHelpRequests} color="red" />
        <MetricCard icon={Zap} label="Weekly Matches" value={stats.successfulMatchesThisWeek} color="yellow" />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            try {
              await api.patch('/community/mentors/me', { is_mentor_available: !mentorAvailabilityEnabled, mentor_visibility: 'public' });
              setMentorAvailabilityEnabled(!mentorAvailabilityEnabled);
              setMessage('Mentor status updated.');
            } catch (err) { setMessage('Failed to update status.'); }
          }}
          className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
            mentorAvailabilityEnabled 
              ? 'border-green-500/20 bg-green-500/5 hover:border-green-500/40' 
              : 'border-border bg-card hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Expert Mode</span>
            <div className={`w-2 h-2 rounded-full ${mentorAvailabilityEnabled ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
          </div>
          <div className="text-xl font-black text-foreground">{mentorAvailabilityEnabled ? 'AVAILABLE' : 'OPT-IN'}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Accept mentorship requests</p>
        </motion.button>
      </div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium flex items-center justify-between">
          {message}
          <button onClick={() => setMessage('')} className="text-primary/60 hover:text-primary">✕</button>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border mb-8">
        <button 
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'directory' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Mentor Directory
          {activeTab === 'directory' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'requests' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Management Hub
          {activeTab === 'requests' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'directory' ? (
          <motion.div 
            key="directory"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-8"
          >
            {/* Left: Filter & List */}
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 items-center bg-muted/30 p-4 rounded-2xl border border-border">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    value={filters.skill} 
                    onChange={(e) => setFilters(f => ({ ...f, skill: e.target.value }))}
                    placeholder="Search by skill (e.g. React)..." 
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <select 
                  value={filters.experienceLevel} 
                  onChange={(e) => setFilters(f => ({ ...f, experienceLevel: e.target.value as any }))}
                  className="bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none"
                >
                  <option value="">Status</option>
                  <option value="expert">Expert</option>
                  <option value="senior">Senior</option>
                  <option value="mid">Mid</option>
                  <option value="junior">Junior</option>
                </select>
                <button onClick={applyFilters} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition-all">Filter</button>
              </div>

              <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {mentors.map((mentor) => (
                  <motion.button
                    layout
                    key={mentor.id}
                    onClick={() => setSelectedMentorId(mentor.id)}
                    className={`group relative p-5 rounded-2xl border text-left transition-all ${
                      selectedMentorId === mentor.id 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="shrink-0 relative">
                        <img src={mentor.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.username}`} className="w-14 h-14 rounded-2xl object-cover border border-border bg-muted" alt="" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-card rounded-full" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-foreground leading-tight">{mentor.full_name || mentor.username}</h4>
                            <p className="text-xs text-muted-foreground">@{mentor.username}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-black text-yellow-600">{formatRating(mentor.mentor_rating)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground/80 mt-2 line-clamp-2">{mentor.bio || 'Veteran tech operative ready to sync.'}</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <span className="px-2 py-1 bg-muted rounded-md text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border">
                            {mentor.mentor_experience_level || 'Elite'}
                          </span>
                          <span className="px-2 py-1 bg-primary/10 rounded-md text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/10">
                            {mentor.mentor_timezone || 'GMT'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${selectedMentorId === mentor.id ? 'translate-x-1 text-primary' : 'text-muted-foreground opacity-30 group-hover:opacity-100'}`} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Right: Connect Form */}
            <div className="space-y-6 lg:sticky lg:top-4">
              <div className="bg-card border border-border rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Target size={120} className="text-primary rotate-12" />
                </div>
                
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Initialize <span className="text-primary">Sync</span></h3>
                <p className="text-sm text-muted-foreground mb-8">Request a tactical session with your selected mentor.</p>

                {selectedMentor ? (
                  <form onSubmit={submitHelpRequest} className="space-y-5">
                    <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-border">
                      <img src={selectedMentor.avatar_url || ''} className="w-10 h-10 rounded-xl" alt="" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Target Mentor</p>
                        <p className="text-sm font-black">{selectedMentor.full_name || selectedMentor.username}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground px-1">Session Topic</label>
                      <input 
                        value={topic} onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Distributed Systems Architecture"
                        className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-3 text-sm focus:border-primary outline-none transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground px-1">Mission Goals</label>
                      <textarea 
                        value={goal} onChange={(e) => setGoal(e.target.value)}
                        placeholder="What are we solving today?"
                        className="w-full h-32 bg-muted/30 border border-border rounded-2xl px-5 py-4 text-sm focus:border-primary outline-none transition-all resize-none"
                        required
                      />
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      className="w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                    >
                      Establish Connection <ChevronRight size={18} />
                    </motion.button>
                  </form>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Search className="text-muted-foreground opacity-40" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Select a mentor from the directory<br/>to begin your request.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="requests"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {requests.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 border border-border rounded-3xl border-dashed">
                <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h4 className="font-bold text-foreground">No active connections.</h4>
                <p className="text-sm text-muted-foreground">Submit a request to a mentor to see it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map((request) => (
                  <div key={request.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                     {/* Status Banner */}
                     <div className={`absolute top-0 right-0 px-4 py-1 text-[9px] font-black uppercase tracking-[2px] rounded-bl-xl ${
                       request.status === 'accepted' ? 'bg-green-500 text-white' : 
                       request.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-muted text-muted-foreground'
                     }`}>
                       {request.status}
                     </div>

                     <div className="flex gap-4 mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                          <Target className="text-primary w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg leading-tight mb-1">{request.topic}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                            <span className="uppercase tracking-wider">Sync with {request.mentor?.full_name || request.mentor?.username}</span>
                            <span>•</span>
                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                     </div>

                     <p className="text-sm text-muted-foreground/90 bg-muted/30 p-4 rounded-2xl mb-6 line-clamp-3 italic">"{request.goal}"</p>

                     {request.session?.scheduled_for && (
                       <div className="flex items-center gap-3 mb-6 p-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                          <Calendar className="w-5 h-5 text-blue-500" />
                          <div className="text-sm font-bold text-blue-600">{formatSessionSchedule(request.session.scheduled_for)}</div>
                       </div>
                     )}

                     <div className="flex flex-wrap gap-2">
                        {request.canRespond && (
                          <>
                            <button onClick={() => handleRequestAction(request.id, 'accept')} className="flex-1 px-4 py-2 bg-green-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-green-600 transition-colors">Accept</button>
                            <button onClick={() => handleRequestAction(request.id, 'decline')} className="px-4 py-2 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-50 transition-colors">Decline</button>
                          </>
                        )}
                        {(request.status === 'pending' || request.status === 'accepted') && (
                          <button onClick={() => handleRequestAction(request.id, 'cancel')} className="flex-1 px-4 py-2 bg-muted text-muted-foreground text-xs font-black uppercase tracking-widest rounded-xl hover:bg-muted/80 transition-colors">Cancel Connection</button>
                        )}
                        {hasActiveSession(request) && (
                          <div className="w-full flex gap-2">
                             <a 
                               href={getVideoCallUrl(request)} target="_blank" rel="noreferrer"
                               className="flex-1 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                             >
                                <Video size={16} /> Enter Video Hub
                             </a>
                             <button onClick={() => copyVideoCallUrl(request)} className="p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                                <Copy size={16} />
                             </button>
                          </div>
                        )}
                     </div>
                  </div>
                ))}
              </div>
            )}
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
