import { 
  Menu, X, Shield, ChevronRight, Zap, User, Settings, 
  Target, Briefcase, Sparkles, Layout, QrCode, LogOut, 
  PenSquare, Compass, Gift, BarChart
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { authService } from "@/services";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", href: "/", isRoute: true },
  { label: "Community", href: "/community", isRoute: true },
  { label: "Projects", href: "/projects", isRoute: true },
];

const Navbar = ({ dark = true }: { dark?: boolean }) => {
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

  const handleLogout = async () => {
    await authService.signOut();
    window.location.href = '/';
  };

  const user = authService.getUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-4 py-6 pointer-events-none text-sans">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`container mx-auto pointer-events-auto transition-all duration-500 ${
          scrolled ? "max-w-5xl" : "max-w-7xl"
        }`}
      >
        <div className={`
          relative flex items-center justify-between h-16 px-6 md:px-8 rounded-full 
          transition-all duration-700 ease-in-out
          ${scrolled 
            ? dark 
              ? "bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
              : "bg-white/80 backdrop-blur-2xl border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
            : "bg-transparent border-transparent"
          }
        `}>
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <span className={`font-black italic tracking-tighter text-lg md:text-xl uppercase transition-colors ${dark ? 'text-white' : 'text-slate-900'}`}>
              TECH<span className="text-red-600"> ASSASSIN</span>
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className={`hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 ${dark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'} border px-2 py-1 rounded-full`}>
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`
                      px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative
                      ${isActive 
                        ? dark ? "text-white" : "text-slate-900" 
                        : dark ? "text-white/40 hover:text-white/70" : "text-slate-400 hover:text-slate-600"
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active"
                        className={`absolute inset-0 ${dark ? 'bg-white/10' : 'bg-slate-200/50'} rounded-full`}
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
                  className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300 group ${
                    dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  } border`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border border-white/20 overflow-hidden">
                    {user?.avatar_url ? (
                      <img 
                        src={user?.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-[10px]">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${
                    dark ? 'text-white/70 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'
                  }`}>
                    {user?.username || 'Operative'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                </button>

                {/* Tactical Dropdown Menu (Devfolio Style) */}
                <div className="absolute top-full right-0 mt-3 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-[110]">
                   <div className="bg-[#2D333B] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-2 py-3 space-y-0.5">
                       <DropdownItem to="/profile" icon={Shield} label="My Assassin" />
                       <DropdownItem to="/edit-profile" icon={PenSquare} label="Edit Profile" />
                       
                       <div className="h-[1px] bg-white/5 my-2 mx-2" />
                       
                       <DropdownItem to="/missions" icon={Target} label="My Missions" />
                       <DropdownItem to="/community" icon={Briefcase} label="My Projects" />
                       <DropdownItem to="/claims" icon={Sparkles} label="My Claims" />
                       
                       <div className="h-[1px] bg-white/5 my-2 mx-2" />
                       
                       <DropdownItem to="/organizer" icon={BarChart} label="Organizer Dashboard" />
                       
                       <div className="h-[1px] bg-white/5 my-2 mx-2" />
                       
                       <DropdownItem to="/qr" icon={QrCode} label="Show QR Code" />
                       <DropdownItem to="/settings" icon={Settings} label="Account Settings" />
                       
                       <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg hover:bg-white/5 text-slate-300 transition-all group/logout"
                      >
                        <LogOut className="w-5 h-5 text-slate-400 group-hover/logout:text-white" />
                        <span className="text-[13px] font-medium">Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link
                  to="/signin"
                  className={`text-[11px] font-black uppercase tracking-widest transition-colors ${dark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  Enter System
                </Link>
                <Link
                  to="/signup"
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl ${
                    dark ? 'bg-white text-black hover:bg-white/90' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Join Squad <Zap className="w-3 h-3 fill-current" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${
              dark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
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
            className={`absolute top-24 left-4 right-4 p-8 rounded-[2rem] border shadow-2xl lg:hidden pointer-events-auto ${
              dark ? 'bg-black/90 border-white/10' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-2xl font-black italic uppercase tracking-tighter transition-colors ${
                    dark ? 'text-white/50 hover:text-red-500' : 'text-slate-400 hover:text-red-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className={`h-[1px] my-2 ${dark ? 'bg-white/10' : 'bg-slate-100'}`} />
              {isAuthenticated ? (
                <div className="flex flex-col gap-4">
                   <Link to="/profile" className="text-white/70 font-bold uppercase tracking-widest">My Assassin</Link>
                   <Link to="/edit-profile" className="text-white/70 font-bold uppercase tracking-widest">Edit Profile</Link>
                   <Link to="/missions" className="text-white/70 font-bold uppercase tracking-widest">My Missions</Link>
                   <Link to="/dashboard" className="text-white/70 font-bold uppercase tracking-widest">Dashboard</Link>
                   <button onClick={handleLogout} className="text-red-500 font-bold uppercase tracking-widest text-left">Log Out</button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link
                    to="/signin"
                    onClick={() => setMobileOpen(false)}
                    className={`w-full py-4 rounded-2xl border text-center font-black uppercase tracking-widest ${
                      dark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    Enter System
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className={`w-full py-4 rounded-2xl text-center font-black uppercase tracking-widest ${
                      dark ? 'bg-white text-black' : 'bg-slate-900 text-white'
                    }`}
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

function DropdownItem({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
  return (
    <Link 
      to={to} 
      className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg hover:bg-white/10 text-slate-300 transition-all group/item"
    >
      <Icon className="w-5 h-5 text-slate-400 group-hover/item:text-white" />
      <span className="text-[13px] font-medium">{label}</span>
    </Link>
  );
}

export default Navbar;
