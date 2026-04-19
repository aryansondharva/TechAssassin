import { useState, useRef, useEffect } from "react";
import { Bell, Check, Zap, Target, Star, Briefcase } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell({ dark = true }: { dark?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'XP_EARNED': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'MENTOR_MATCH': return <Target className="w-4 h-4 text-green-500" />;
      case 'MATCH_ACCEPTED': return <Star className="w-4 h-4 text-blue-500" />;
      case 'EVENT_REMINDER': return <Zap className="w-4 h-4 text-red-500" />;
      default: return <Briefcase className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all duration-300 ${
          dark ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-900"
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-inherit rounded-full"></span>
        )}
      </button>

      {/* Dropdown Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-3 w-80 lg:w-96 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
              dark ? "bg-black/90 border-white/10 backdrop-blur-xl" : "bg-white border-slate-100"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? "border-white/10" : "border-slate-100"}`}>
              <h3 className={`font-black uppercase tracking-widest text-xs ${dark ? "text-white" : "text-slate-900"}`}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                    dark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className={`p-8 text-center text-sm font-medium ${dark ? "text-slate-500" : "text-slate-400"}`}>
                  No notifications yet.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors hover:bg-white/5 ${
                        !notification.is_read ? (dark ? "bg-white/5" : "bg-slate-50") : ""
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`shrink-0 mt-1 flex items-center justify-center w-8 h-8 rounded-full ${dark ? "bg-white/10" : "bg-slate-100"}`}>
                           {getIconForType(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${dark ? "text-slate-200" : "text-slate-900"}`}>
                            {notification.title}
                          </p>
                          {notification.content && (
                            <p className={`text-xs mt-1 leading-relaxed ${dark ? "text-slate-400" : "text-slate-500"}`}>
                              {notification.content}
                            </p>
                          )}
                          <p className={`text-[10px] uppercase tracking-wider mt-2 font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 shrink-0 bg-red-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
