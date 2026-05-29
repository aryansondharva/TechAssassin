import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventsService } from '@/services';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Calendar, MapPin, Users, ArrowRight, Target, Trophy, Clock, Search } from 'lucide-react';
import type { EventWithParticipants } from '@/types/api';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';

type EventFilter = 'all' | 'live' | 'upcoming' | 'past';

const getEventFilter = (status: string | null): EventFilter => {
  return status === 'live' || status === 'upcoming' || status === 'past' ? status : 'all';
};

export default function Events() {
  const [allEvents, setAllEvents] = useState<EventWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<EventFilter>(() => getEventFilter(searchParams.get('status')));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const nextFilter = getEventFilter(searchParams.get('status'));
    setFilter((currentFilter) => (currentFilter === nextFilter ? currentFilter : nextFilter));
  }, [searchParams]);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const updateFilter = (nextFilter: EventFilter) => {
    setFilter(nextFilter);
    setSearchParams(nextFilter === 'all' ? {} : { status: nextFilter });
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await eventsService.list({
        status: filter === 'all' ? undefined : (filter as 'live' | 'upcoming' | 'past'),
      });
      setAllEvents(response.data);
    } catch (error) {
      let errorMessage = 'Failed to synchronize mission logs.';
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }
      toast({ 
        title: 'Sync Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter events by search query (client-side for real-time search)
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return allEvents;
    }
    
    const query = searchQuery.toLowerCase();
    return allEvents.filter(event => 
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query)
    );
  }, [allEvents, searchQuery]);

  // Get event counts by status for display
  const eventCounts = useMemo(() => {
    return {
      all: allEvents.length,
      live: allEvents.filter(e => e.status === 'live').length,
      upcoming: allEvents.filter(e => e.status === 'upcoming').length,
      past: allEvents.filter(e => e.status === 'past').length,
    };
  }, [allEvents]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar dark={false} />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Page Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
             <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                <Target className="w-4 h-4" />
                <span>Active Deployment Zone</span>
             </div>
             <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Community Missions</h1>
             <p className="text-slate-500 mt-2 font-medium">Explore and join high-impact tactical operations within the network.</p>
          </div>
          
          <div className="relative w-full md:w-80 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
             <Input 
                placeholder="Search missions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 rounded-2xl border-slate-200 bg-white shadow-sm focus-visible:ring-red-600/10"
             />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-12">
          <FilterButton active={filter === 'all'} onClick={() => updateFilter('all')} label="All Missions" count={eventCounts.all} />
          <FilterButton active={filter === 'live'} onClick={() => updateFilter('live')} label="Live" count={eventCounts.live} />
          <FilterButton active={filter === 'upcoming'} onClick={() => updateFilter('upcoming')} label="Upcoming" count={eventCounts.upcoming} />
          <FilterButton active={filter === 'past'} onClick={() => updateFilter('past')} label="Archive" count={eventCounts.past} />
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-red-600" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
             <Clock className="w-16 h-16 text-slate-200 mx-auto mb-6" />
             <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest italic">No missions detected in this sector.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <MissionCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterButton({ active, onClick, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        h-11 px-6 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3
        ${active 
          ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
          : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${active ? 'bg-white/20' : 'bg-slate-100'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function MissionCard({ event }: { event: EventWithParticipants }) {
  return (
    <Link to={`/events/${event.id}`} className="group">
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden group-hover:shadow-xl transition-all duration-500 h-full">
        <div className="h-56 overflow-hidden relative">
          <img
            src={event.image_urls?.[0] || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800'}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-6 left-6">
             <Badge className="bg-red-600 text-white border-none rounded-lg text-[10px] font-black uppercase py-1.5 px-3 tracking-widest shadow-lg">
               {event.status}
             </Badge>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-red-600 transition-colors line-clamp-1 uppercase italic">
            {event.title}
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium line-clamp-2 mt-2">
            {event.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-0 space-y-4">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
            <Calendar className="w-4 h-4 text-red-600" />
            <span>{new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
            <MapPin className="w-4 h-4 text-red-600" />
            <span className="truncate">{event.location}</span>
          </div>
          
          <div className="pt-4 flex items-center justify-between border-t border-slate-50">
             <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{event.participant_count}/{event.max_participants} Units</span>
             </div>
             {event.prizes && (
                <div className="flex items-center gap-2 text-red-600">
                   <Trophy className="w-4 h-4" />
                   <span className="text-xs font-black uppercase tracking-widest italic">{event.prizes['1st']} Bounty</span>
                </div>
             )}
          </div>
        </CardContent>

        <CardFooter className="p-8 pt-0">
            <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[11px] shadow-lg transition-all group-hover:scale-[1.02] active:scale-[0.98]" asChild>
               <span>
                  Mission Briefing <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </span>
            </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
