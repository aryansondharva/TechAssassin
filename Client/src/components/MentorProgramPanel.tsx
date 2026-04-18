import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { Loader2, ShieldAlert, Star } from 'lucide-react';

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
    if (rating === null || rating === undefined) return '0.0';
    return rating.toFixed(1);
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
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left hover:border-red-500/50 transition"
        >
          <div className="text-[10px] tracking-[0.2em] uppercase text-white/40">Mentor Opt-In</div>
          <div className="text-xl font-black mt-1">{mentorAvailabilityEnabled ? 'Enabled' : 'Disabled'}</div>
        </button>
      </div>

      {message && (
        <div className="text-xs bg-red-600/10 border border-red-600/30 text-red-300 rounded-lg px-3 py-2">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <h3 className="text-lg font-black uppercase tracking-widest">Mentor Directory</h3>
          <div className="grid sm:grid-cols-4 gap-3">
            <input value={filters.skill} onChange={(e) => setFilters((f) => ({ ...f, skill: e.target.value }))} placeholder="Skill" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm" />
            <select value={filters.experienceLevel} onChange={(e) => setFilters((f) => ({ ...f, experienceLevel: e.target.value }))} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm">
              <option value="">Experience</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="expert">Expert</option>
            </select>
            <input value={filters.language} onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))} placeholder="Language" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm" />
            <button onClick={applyFilters} className="bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold uppercase tracking-widest px-3 py-2">Apply</button>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-auto">
            {mentors.map((mentor) => (
              <button
                key={mentor.id}
                onClick={() => setSelectedMentorId(mentor.id)}
                className={`w-full text-left p-3 rounded-xl border transition ${selectedMentorId === mentor.id ? 'border-red-500 bg-red-600/10' : 'border-white/10 bg-black/20 hover:border-white/20'}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">{mentor.full_name || mentor.username}</div>
                    <div className="text-xs text-white/60">@{mentor.username}</div>
                  </div>
                  <div className="text-xs text-yellow-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {formatRating(mentor.mentor_rating)} ({mentor.mentor_rating_count})
                  </div>
                </div>
                <div className="text-xs text-white/70 mt-2">{mentor.bio || 'No bio yet.'}</div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider mt-2">
                  {mentor.mentor_experience_level || 'unspecified'} • {mentor.mentor_timezone || 'timezone TBD'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submitHelpRequest} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h3 className="text-lg font-black uppercase tracking-widest">Beginner Help Request</h3>
          <div className="text-xs text-white/60">
            Selected mentor: {selectedMentor ? selectedMentor.full_name || selectedMentor.username : 'None'}
          </div>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} required minLength={3} maxLength={120} placeholder="Topic (e.g., React state management)" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm" />
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} required minLength={10} maxLength={1000} placeholder="What do you want to achieve in the session?" className="w-full h-28 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none" />
          <button type="submit" className="w-full bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold uppercase tracking-widest px-3 py-2">
            Send Request
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-widest">My Mentorship Requests</h3>
        {requests.length === 0 && (
          <div className="text-sm text-white/60 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Sign in to manage requests.
          </div>
        )}
        {requests.map((request) => (
          <div key={request.id} className="border border-white/10 rounded-xl p-3 bg-black/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{request.topic}</div>
                <div className="text-xs text-white/60">
                  Mentor: {request.mentor?.full_name || request.mentor?.username || 'Unknown'} • Beginner: {request.beginner?.full_name || request.beginner?.username || 'Unknown'}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-red-300">{request.status}</span>
            </div>
            <p className="text-sm text-white/70 mt-2">{request.goal}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {request.canRespond && (
                <>
                  <button onClick={() => handleRequestAction(request.id, 'accept')} className="px-3 py-1 rounded-md text-xs bg-green-600/80 hover:bg-green-600">Accept</button>
                  <button onClick={() => handleRequestAction(request.id, 'decline')} className="px-3 py-1 rounded-md text-xs bg-red-600/80 hover:bg-red-600">Decline</button>
                </>
              )}
              {(request.status === 'pending' || request.status === 'accepted') && (
                <button onClick={() => handleRequestAction(request.id, 'cancel')} className="px-3 py-1 rounded-md text-xs bg-white/10 hover:bg-white/20">Cancel</button>
              )}
              {request.canConfirmComplete && (
                <button onClick={() => handleRequestAction(request.id, 'confirm_complete')} className="px-3 py-1 rounded-md text-xs bg-blue-600/80 hover:bg-blue-600">Confirm Complete</button>
              )}
              {request.status === 'completed' && request.session && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((ratingValue) => (
                    <button
                      key={ratingValue}
                      onClick={() => submitFeedback(request.session.id, ratingValue)}
                      aria-label={`Rate ${ratingValue} stars`}
                      className="px-2 py-1 rounded-md text-xs bg-yellow-600/70 hover:bg-yellow-500"
                    >
                      {ratingValue}★
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {stats.topMentors.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-black uppercase tracking-widest mb-3">Top Mentors by Impact</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {stats.topMentors.map((mentor) => (
              <div key={mentor.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="font-semibold">{mentor.full_name || mentor.username}</div>
                <div className="text-xs text-white/60">@{mentor.username}</div>
                <div className="text-xs text-yellow-400 mt-2">Rating: {formatRating(mentor.mentor_rating)}</div>
                <div className="text-xs text-white/60">Sessions: {mentor.mentor_total_sessions}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</div>
    <div className="text-2xl font-black mt-1">{value}</div>
  </div>
);

export default MentorProgramPanel;
