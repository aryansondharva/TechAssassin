import { Menu, X, Shield, ChevronRight, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { authService } from "@/services";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", href: "/", isRoute: true },
  { label: "Community", href: "/community", isRoute: true },
  { label: "Elite", href: "/elite", isRoute: true },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-4 py-6 pointer-events-none">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`container mx-auto max-w-7xl pointer-events-auto transition-all duration-500 ${
          scrolled ? "max-w-5xl" : "max-w-7xl"
        }`}
      >
        <div className={`
          relative flex items-center justify-between h-16 px-6 md:px-8 rounded-full 
          transition-all duration-700 ease-in-out
          ${scrolled 
            ? "bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
            : "bg-transparent border-transparent"
          }
        `}>
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
          
            <span className="text-white font-black italic tracking-tighter text-lg md:text-xl uppercase">
              TECH<span className="text-red-600"> ASSASSIN</span>
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 bg-white/5 border border-white/5 px-2 py-1 rounded-full">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`
                      px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative
                      ${isActive ? "text-white" : "text-white/40 hover:text-white/70"}
                    `}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active"
                        className="absolute inset-0 bg-white/10 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative group">
                <button
                  className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border border-white/20 overflow-hidden bg-gray-900">
                    {authService.getUser()?.avatar_url ? (
                      <img 
                        src={authService.getUser()?.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-[10px]">
                        {authService.getUser()?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                    {authService.getUser()?.username || 'Operative'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                </button>

                {/* Tactical Dropdown Menu */}
                <div className="absolute top-full right-0 mt-3 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-[110]">
                  <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Authenticated Operative</p>
                      <p className="text-sm font-bold text-white truncate">{authService.getUser()?.full_name || authService.getUser()?.username}</p>
                    </div>
                    
                    <div className="p-2">
                       <Link to="/profile" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all group/item">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:text-red-500 transition-colors">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">My Profile</span>
                      </Link>

                      <Link to="/edit-profile" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all group/item">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:text-red-500 transition-colors">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">Edit Profile</span>
                      </Link>

                      <div className="h-[1px] bg-white/5 my-1 mx-2" />

                      <Link to="/community/missions" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all group/item">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:text-red-500 transition-colors">
                          <Menu className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">My Missions</span>
                      </Link>

                      <Link to="/community/projects" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all group/item">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:text-red-500 transition-colors">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">My Projects</span>
                      </Link>

                      <div className="h-[1px] bg-white/5 my-1 mx-2" />

                      <Link to="/settings" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all group/item">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:text-red-500 transition-colors">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">Account Settings</span>
                      </Link>

                      <button 
                        onClick={() => { authService.logout(); window.location.href = '/'; }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link
                  to="/signin"
                  className="text-white/40 hover:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                >
                  Enter System
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-xl"
                >
                  Join Squad <Zap className="w-3 h-3 fill-current" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-24 left-4 right-4 p-8 rounded-[2rem] bg-black/90 backdrop-blur-3xl border border-white/10 shadow-2xl lg:hidden pointer-events-auto"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl font-black italic uppercase tracking-tighter text-white/50 hover:text-red-500 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-[1px] bg-white/10 my-2" />
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-4 rounded-2xl bg-red-600 text-white text-center font-black uppercase tracking-widest"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link
                    to="/signin"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-center font-black uppercase tracking-widest"
                  >
                    Enter System
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-4 rounded-2xl bg-white text-black text-center font-black uppercase tracking-widest"
                  >
                    Join Squad
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
