import { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useUser } from '@clerk/react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Users, Video, X, Maximize2, Minimize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  timestamp: number;
}

interface PresenceUser {
  userId: string;
  username: string;
  avatarUrl: string;
  onlineAt: number;
}

export default function MentorshipLiveChat() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const onlineUsersRef = useRef<Map<string, PresenceUser>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (!user || !supabase || typeof supabase.channel !== 'function') return;

    // Create a unique channel for the mentorship lounge
    const room = supabase.channel('mentorship_lounge', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });
    channelRef.current = room;

    room
      .on('presence', { event: 'sync' }, () => {
        const state = room.presenceState();
        const users = new Map<string, PresenceUser>();
        
        for (const [key, presences] of Object.entries(state)) {
          if (presences.length > 0) {
            const p = presences[0] as unknown as PresenceUser;
            users.set(key, {
              userId: key,
              username: p.username,
              avatarUrl: p.avatarUrl,
              onlineAt: p.onlineAt
            });
          }
        }
        setOnlineUsers(users);
      })
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await room.track({
            username: user.username || user.firstName || 'Anonymous Operative',
            avatarUrl: user.imageUrl,
            onlineAt: Date.now(),
          });
        }
      });

    return () => {
      supabase.removeChannel(room);
    };
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !channelRef.current) return;

    const payload: ChatMessage = {
      id: crypto.randomUUID(),
      userId: user.id,
      username: user.username || user.firstName || 'Anonymous Operative',
      avatarUrl: user.imageUrl,
      text: newMessage.trim(),
      timestamp: Date.now(),
    };

    // Optimistic update
    setMessages(prev => [...prev, payload]);
    setNewMessage('');

    // Broadcast explicitly to others
    await channelRef.current.send({
      type: 'broadcast',
      event: 'chat_message',
      payload,
    });
  };

  const startInstantCall = () => {
    const meetUrl = `https://meet.jit.si/techassassin-lounge-${Math.random().toString(36).substring(7)}`;
    window.open(meetUrl, '_blank');
    
    // Broadcast the invite to the chat
    if (channelRef.current && user) {
      const payload: ChatMessage = {
        id: crypto.randomUUID(),
        userId: user.id,
        username: user.username || user.firstName || 'Anonymous Operative',
        avatarUrl: user.imageUrl,
        text: `🚀 I just started an open Jitsi Meet video lounge! Join here: ${meetUrl}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, payload]);
      channelRef.current.send({
        type: 'broadcast',
        event: 'chat_message',
        payload,
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col mb-4 ${
              isExpanded ? 'w-[450px] h-[600px] sm:w-[500px] sm:h-[700px]' : 'w-[320px] h-[450px] sm:w-[360px] sm:h-[500px]'
            }`}
          >
            {/* Header */}
            <div className="bg-primary/5 border-b border-border p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-none">Global Lounge</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                    {onlineUsers.size} Operatives Live
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={startInstantCall}
                  title="Start Open Video Lounge"
                  className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-muted/20">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary opacity-50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">The lounge is quiet.</p>
                  <p className="text-xs text-muted-foreground/60 max-w-[200px]">Send a message to ping the active ops or start a live video room.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.userId === user?.id;
                  const isSystem = msg.userId === 'system';
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <span className="text-[10px] uppercase tracking-widest bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {msg.text}
                        </span>
                      </div>
                    )
                  }

                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <img src={msg.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0 border border-border" />
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground/80">{isMe ? 'You' : msg.username}</span>
                          <span className="text-[9px] text-muted-foreground uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isMe 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-muted border border-border text-foreground rounded-tl-sm'
                        }`}>
                          {/* Basic link parsing */}
                          {msg.text.includes('https://meet.jit.si') ? (
                            <span>
                              {msg.text.split(/(https:\/\/meet\.jit\.si[^\s]+)/).map((part, i) => 
                                part.startsWith('https://') ? (
                                  <a key={i} href={part} target="_blank" rel="noreferrer" className="underline font-bold text-white block mt-1 py-1 px-2 bg-black/20 rounded-md">
                                    Join Video Room
                                  </a>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </span>
                          ) : (
                            msg.text
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-card border-t border-border shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Communicate with live operatives..."
                  className="w-full bg-muted border border-border rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-1.5 p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:scale-95 transition-all hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_0_30px_rgba(255,0,0,0.3)] hover:shadow-[0_0_40px_rgba(255,0,0,0.5)] transition-shadow border-2 border-primary-foreground/20"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            {onlineUsers.size > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 border-2 border-primary rounded-full text-[8px] font-bold flex items-center justify-center">
                {onlineUsers.size}
              </span>
            )}
          </div>
        )}
      </motion.button>
    </div>
  );
}
