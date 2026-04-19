import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { Calendar, Copy, ExternalLink, Loader2, ShieldAlert, Star, Video } from 'lucide-react';

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
    // Jitsi room names are safest with letters, numbers and hyphens.
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
      setMessage('Unable to copy video call link. Please copy manually after opening the call.');
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage('');
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
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }
      }

      try {
        const me = await api.get<{ is_mentor_available: boolean }>('/community/mentors/me');
        setMentorAvailabilityEnabled(Boolean(me.is_mentor_available));
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load mentor program data');
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
    if (mentorList.length > 0 && !mentorList.find((mentor) => mentor.id === selectedMentorId)) {
      setSelectedMentorId(mentorList[0].id);
    }
  };

  const submitHelpRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedMentorId) {
      setMessage('Select a mentor before sending a request.');
      return;
    }
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
      setMessage('Mentor request sent.');
      const myRequests = await api.get<MentorRequest[]>('/community/mentors/requests');
      setRequests(myRequests);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit request');
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline' | 'cancel' | 'confirm_complete') => {
    try {
      await api.patch(`/community/mentors/requests/${requestId}`, { action });
      const myRequests = await api.get<MentorRequest[]>('/community/mentors/requests');
      setRequests(myRequests);
      const mentorStats = await api.get<MentorStats>('/community/mentors/stats');
      setStats(mentorStats);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update request');
    }
  };

  const submitFeedback = async (sessionId: string, rating: number) => {
    try {
      await api.post(`/community/mentors/sessions/${sessionId}/feedback`, { rating });
      setMessage('Feedback submitted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit feedback');
    }
  };

  const updateMyMentorAvailability = async () => {
    try {
      await api.patch('/community/mentors/me', {
        is_mentor_available: !mentorAvailabilityEnabled,
        mentor_visibility: 'public'
      });
      setMentorAvailabilityEnabled((current) => !current);
      setMessage('Mentor availability updated.');
      await applyFilters();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update mentor settings');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Active Mentors" value={stats.activeMentors} />
        <MetricCard label="Open Requests" value={stats.openHelpRequests} />
        <MetricCard label="Matches This Week" value={stats.successfulMatchesThisWeek} />
        <button
          onClick={updateMyMentorAvailability}
          className="rounded-xl border border-border bg-card px-4 py-4 text-left hover:border-red-500/50 transition"
        >
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Mentor Opt-In</div>
          <div className="text-xl font-black mt-1">{mentorAvailabilityEnabled ? 'Enabled' : 'Disabled'}</div>
        </button>
      </div>

      {message && (
        <div className="text-xs bg-red-600/10 border border-red-600/30 text-primary rounded-lg px-3 py-2">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <h3 className="text-lg font-black uppercase tracking-widest">Mentor Directory</h3>
          <div className="grid sm:grid-cols-4 gap-3">
            <input value={filters.skill} onChange={(e) => setFilters((f) => ({ ...f, skill: e.target.value }))} placeholder="Skill" className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
            <select value={filters.experienceLevel} onChange={(e) => setFilters((f) => ({ ...f, experienceLevel: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
              <option value="">Experience</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="expert">Expert</option>
            </select>
            <input value={filters.language} onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))} placeholder="Language" className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
            <button onClick={applyFilters} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-bold uppercase tracking-widest px-3 py-2">Apply</button>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-auto">
            {mentors.map((mentor) => (
              <button
                key={mentor.id}
                onClick={() => setSelectedMentorId(mentor.id)}
                className={`w-full text-left p-3 rounded-xl border transition ${selectedMentorId === mentor.id ? 'border-red-500 bg-red-600/10' : 'border-border bg-muted/50 hover:border-border/80'}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">{mentor.full_name || mentor.username}</div>
                    <div className="text-xs text-muted-foreground">@{mentor.username}</div>
                  </div>
                  <div className="text-xs text-yellow-500 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {formatRating(mentor.mentor_rating)} ({mentor.mentor_rating_count})
                  </div>
                </div>
                <div className="text-xs text-muted-foreground/80 mt-2">{mentor.bio || 'No bio yet.'}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">
                  {mentor.mentor_experience_level || 'unspecified'} • {mentor.mentor_timezone || 'timezone TBD'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submitHelpRequest} className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-lg font-black uppercase tracking-widest">Beginner Help Request</h3>
          <div className="text-xs text-muted-foreground">
            Selected mentor: {selectedMentor ? selectedMentor.full_name || selectedMentor.username : 'None'}
          </div>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} required minLength={3} maxLength={120} placeholder="Topic (e.g., React state management)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} required minLength={10} maxLength={1000} placeholder="What do you want to achieve in the session?" className="w-full h-28 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none" />
          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-bold uppercase tracking-widest px-3 py-2">
            Send Request
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-widest">My Mentorship Requests</h3>
        {requests.length === 0 && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Sign in to manage requests.
          </div>
        )}
        {requests.map((request) => (
          <div key={request.id} className="border border-border rounded-xl p-3 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{request.topic}</div>
                <div className="text-xs text-muted-foreground">
                  Mentor: {request.mentor?.full_name || request.mentor?.username || 'Unknown'} • Beginner: {request.beginner?.full_name || request.beginner?.username || 'Unknown'}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-primary">{request.status}</span>
            </div>
            <p className="text-sm text-muted-foreground/80 mt-2">{request.goal}</p>
            {request.session?.scheduled_for && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground bg-card border border-border rounded-md px-2 py-1">
                <Calendar className="w-3 h-3 text-red-400" />
                {formatSessionSchedule(request.session.scheduled_for)}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {request.canRespond && (
                <>
                  <button onClick={() => handleRequestAction(request.id, 'accept')} className="px-3 py-1 rounded-md text-xs bg-green-100 text-green-700 hover:bg-green-200">Accept</button>
                  <button onClick={() => handleRequestAction(request.id, 'decline')} className="px-3 py-1 rounded-md text-xs bg-red-100 text-red-700 hover:bg-red-200">Decline</button>
                </>
              )}
              {(request.status === 'pending' || request.status === 'accepted') && (
                <button onClick={() => handleRequestAction(request.id, 'cancel')} className="px-3 py-1 rounded-md text-xs bg-muted hover:bg-muted-foreground/10">Cancel</button>
              )}
              {request.canConfirmComplete && (
                <button onClick={() => handleRequestAction(request.id, 'confirm_complete')} className="px-3 py-1 rounded-md text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">Confirm Complete</button>
              )}
              {request.status === 'completed' && request.session && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((ratingValue) => (
                    <button
                      key={ratingValue}
                      onClick={() => submitFeedback(request.session.id, ratingValue)}
                      aria-label={`Rate session ${ratingValue} out of 5 stars`}
                      className="px-2 py-1 rounded-md text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    >
                      {ratingValue}★
                    </button>
                  ))}
                </div>
              )}
              {hasActiveSession(request) && (
                <>
                  <a
                    href={getVideoCallUrl(request)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  >
                    <Video className="w-3 h-3" />
                    Join Call
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => copyVideoCallUrl(request)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs bg-muted hover:bg-muted-foreground/10"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Link
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {stats.topMentors.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-lg font-black uppercase tracking-widest mb-3">Top Mentors by Impact</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {stats.topMentors.map((mentor) => (
              <div key={mentor.id} className="rounded-xl border border-border bg-muted/50 p-3">
                <div className="font-semibold">{mentor.full_name || mentor.username}</div>
                <div className="text-xs text-muted-foreground">@{mentor.username}</div>
                <div className="text-xs text-yellow-500 mt-2">Rating: {formatRating(mentor.mentor_rating)}</div>
                <div className="text-xs text-muted-foreground">Sessions: {mentor.mentor_total_sessions}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-border bg-card px-4 py-4">
    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    <div className="text-2xl font-black mt-1">{value}</div>
  </div>
);

export default MentorProgramPanel;
