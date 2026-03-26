import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsService } from '@/services';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import type { EventWithParticipants } from '@/types/api';
import Navbar from '@/components/Navbar';

export default function Events() {
  const [events, setEvents] = useState<EventWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  // Add Luma event data
  const lumaEvent: EventWithParticipants = {
    id: 'luma-code4cause-2025',
    title: 'Code4Cause: Social Impact Hackathon',
    description: 'Ready to Ignite Change? Step up and code for a cause! The Social Impact Hackathon isn\'t just an event; it\'s a movement. In this adrenaline-fueled 7-hour sprint, we\'re bridging the gap between technology and humanity. Whether you\'re a coding wizard, a design visionary, or a strategic thinker, your skills have the power to solve real-world crises.',
    start_date: '2025-02-21T09:00:00+05:30',
    end_date: '2025-02-21T16:15:00+05:30',
    location: 'Computer Seminar Hall | GIDC Degree Engineering College, Abrama, Gujarat',
    max_participants: 200,
    participant_count: 45,
    status: 'live',
    image_urls: ['/luma.png'],
    registration_open: true,
    prizes: {
      '1st': '5K INR',
      '2nd': '3K INR', 
      '3rd': '1K INR'
    },
    themes: ['Social Impact'],
    created_at: '2025-02-15T00:00:00+05:30'
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Only show Luma event
      const allEvents = [lumaEvent];
      
      // Filter based on selected filter
      const filteredEvents = filter === 'all' 
        ? allEvents 
        : allEvents.filter(event => event.status === filter);
      
      setEvents(filteredEvents);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Error',
          description: 'Failed to load events',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      live: 'default',
      upcoming: 'secondary',
      past: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Community Missions</h1>
          <p className="text-white/40 font-medium">
            Analyze and deploy into upcoming tactical missions
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-red-600 hover:bg-red-700' : 'border-white/10 text-white/60'}
            onClick={() => setFilter('all')}
          >
            All Missions
          </Button>
          <Button
            variant={filter === 'live' ? 'default' : 'outline'}
            className={filter === 'live' ? 'bg-red-600 hover:bg-red-700' : 'border-white/10 text-white/60'}
            onClick={() => setFilter('live')}
          >
            Live
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            className={filter === 'upcoming' ? 'bg-red-600 hover:bg-red-700' : 'border-white/10 text-white/60'}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === 'past' ? 'default' : 'outline'}
            className={filter === 'past' ? 'bg-red-600 hover:bg-red-700' : 'border-white/10 text-white/60'}
            onClick={() => setFilter('past')}
          >
            Past
          </Button>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <p className="text-muted-foreground">No events found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-red-600/50 transition-all duration-500 flex flex-col group">
                {event.image_urls && event.image_urls.length > 0 && (
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={event.image_urls[0]}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                    <div className="absolute top-4 left-4">
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-red-500 transition-colors line-clamp-1">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 py-4">
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center text-white/40 font-medium">
                      <Calendar className="mr-2 h-4 w-4 text-red-500" />
                      {formatDate(event.start_date)}
                    </div>
                    <div className="flex items-center text-white/40 font-medium line-clamp-1">
                      <MapPin className="mr-2 h-4 w-4 text-red-500" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center text-white/70 font-bold">
                        <Users className="mr-2 h-4 w-4 text-red-500" />
                        {event.participant_count}/{event.max_participants}
                      </div>
                      {event.prizes && (
                        <div className="text-red-500 font-black italic tracking-tighter uppercase">
                          Bounty: {event.prizes['1st'] || 'TBA'}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-2">
                  <a 
                    href={event.id === 'luma-code4cause-2025' ? "https://luma.com/0hmim4ly" : `/events/${event.id}`} 
                    target={event.id === 'luma-code4cause-2025' ? "_blank" : "_self"}
                    rel={event.id === 'luma-code4cause-2025' ? "noopener noreferrer" : ""}
                    className="w-full"
                  >
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs py-6 rounded-2xl shadow-lg shadow-red-600/20">
                      {event.id === 'luma-code4cause-2025' ? 'Deploy Mission' : 'Mission Briefing'}
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
