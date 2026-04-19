import { 
  Menu, X, Shield, ChevronRight, Zap, User, Settings, 
  Target, Briefcase, Sparkles, Layout, QrCode, LogOut, 
  PenSquare, Compass, Gift, BarChart
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser, useClerk, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "./NotificationBell";

const navLinks = [
  { label: "Home", href: "/", isRoute: true },
  { label: "Community", href: "/community", isRoute: true },
];

const Navbar = ({ dark = true }: { dark?: boolean }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

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
            {isSignedIn ? (
              <div className="flex items-center gap-6">
                <NotificationBell dark={dark} />
                <UserButton>
                  <UserButton.MenuItems>
                    <UserButton.Link href={`/@${user?.username}`} label="My Assassin" labelIcon={<Shield className="w-4 h-4" />} />
                    <UserButton.Link href="/edit-profile" label="Edit Profile" labelIcon={<PenSquare className="w-4 h-4" />} />
                    <UserButton.Link href="/missions" label="My Missions" labelIcon={<Target className="w-4 h-4" />} />
                    <UserButton.Link href="/community" label="My Projects" labelIcon={<Briefcase className="w-4 h-4" />} />
                    <UserButton.Action label="Show QR Code" labelIcon={<QrCode className="w-4 h-4" />} onClick={() => window.location.href = '/qr'} />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <SignInButton mode="modal">
                  <button className={`text-[11px] font-black uppercase tracking-widest transition-colors ${dark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}>
                    Enter System
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl ${
                    dark ? 'bg-white text-black hover:bg-white/90' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}>
                    Join Squad <Zap className="w-3 h-3 fill-current" />
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
            
            {/* Mobile Actions Container */}
            <div className="flex items-center gap-4 md:hidden">
              {isSignedIn && <NotificationBell dark={dark} />}
              
              {/* Mobile Menu Button */}
              <button
                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${
                  dark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
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
              {isSignedIn ? (
                <div className="flex flex-col gap-4">
                   <Link to={`/@${user?.username}`} className="text-white/70 font-bold uppercase tracking-widest" onClick={() => setMobileOpen(false)}>My Assassin</Link>
                   <Link to="/edit-profile" className="text-white/70 font-bold uppercase tracking-widest" onClick={() => setMobileOpen(false)}>Edit Profile</Link>
                   <Link to="/missions" className="text-white/70 font-bold uppercase tracking-widest" onClick={() => setMobileOpen(false)}>My Missions</Link>
                   <Link to={`/@${user?.username}`} className="text-white/70 font-bold uppercase tracking-widest" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                   <button onClick={handleLogout} className="text-red-500 font-bold uppercase tracking-widest text-left">Log Out</button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <SignInButton mode="modal">
                    <button
                      className={`w-full py-4 rounded-2xl border text-center font-black uppercase tracking-widest ${
                        dark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      Enter System
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      className={`w-full py-4 rounded-2xl text-center font-black uppercase tracking-widest ${
                        dark ? 'bg-white text-black' : 'bg-slate-900 text-white'
                      }`}
                    >
                      Join Squad
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

function DropdownItem({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) {
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
