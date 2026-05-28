import { 
  Menu, X, Shield, Zap, Target, QrCode, PenSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser, useClerk, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "./NotificationBell";

const navLinks = [
  { label: "About", href: "/about", isRoute: true },
  { label: "Testimonials", href: "/#developers-say", isRoute: false },
];

const Navbar = ({ dark = true }: { dark?: boolean }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!location.hash) return;

    let attempts = 0;
    let timeout: number;

    const scrollToTarget = () => {
      const target = document.getElementById(location.hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      attempts += 1;
      if (attempts < 12) {
        timeout = window.setTimeout(scrollToTarget, 75);
      }
    };

    timeout = window.setTimeout(scrollToTarget, 0);

    return () => window.clearTimeout(timeout);
  }, [location.hash, location.pathname]);

  const getIsActive = (href: string) => {
    const [pathname, hash] = href.split("#");

    if (hash) {
      return location.pathname === pathname && location.hash === `#${hash}`;
    }

    return location.pathname === href && !location.hash;
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);

    const [pathname, hash] = href.split("#");
    const isSamePageHash =
      Boolean(hash) &&
      location.pathname === pathname &&
      location.hash === `#${hash}`;

    if (isSamePageHash) {
      document
        .getElementById(hash)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-slate-200 bg-white px-4 py-2 shadow-sm pointer-events-none text-sans">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="container mx-auto max-w-7xl pointer-events-auto"
      >
        <div className={`
          relative flex items-center justify-between h-12 px-4 md:px-6 rounded-full
          border border-transparent bg-transparent shadow-none transition-colors duration-300
        `}>
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/tech_assassin_logo.png"
              alt="Tech Assassin"
              className="h-7 w-auto object-contain md:h-8"
            />
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 border border-transparent bg-transparent px-2 py-1 rounded-full">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = getIsActive(link.href);
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className={`
                      px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.18em] transition-all duration-300 relative
                      ${isActive 
                        ? "text-red-600"
                        : "text-slate-500 hover:text-slate-950"
                      }
                    `}
                  >
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
                <NotificationBell dark={false} />
                <UserButton>
                  <UserButton.MenuItems>
                    <UserButton.Link href={`/@${user?.username}`} label="My Assassin" labelIcon={<Shield className="w-4 h-4" />} />
                    <UserButton.Link href="/edit-profile" label="Edit Profile" labelIcon={<PenSquare className="w-4 h-4" />} />
                    <UserButton.Link href="/missions" label="My Missions" labelIcon={<Target className="w-4 h-4" />} />
                    <UserButton.Action label="Show QR Code" labelIcon={<QrCode className="w-4 h-4" />} onClick={() => window.location.href = '/qr'} />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <SignInButton mode="modal">
                  <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-950">
                    Enter System
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-105 hover:bg-red-600 active:scale-95">
                    Join Squad <Zap className="w-3 h-3 fill-current" />
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
            
            {/* Mobile Actions Container */}
            <div className="flex items-center gap-4 md:hidden">
              {isSignedIn && <NotificationBell dark={false} />}
              
              {/* Mobile Menu Button */}
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-950 transition-colors hover:bg-slate-100"
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
            className="absolute top-24 left-4 right-4 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl lg:hidden pointer-events-auto"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-2xl font-black italic uppercase tracking-tighter text-slate-500 transition-colors hover:text-red-600"
                >
                  {link.label}
                </Link>
              ))}
              {isSignedIn ? (
                <div className="flex flex-col gap-4">
                   <Link to={`/@${user?.username}`} className="font-bold uppercase tracking-widest text-slate-700" onClick={() => setMobileOpen(false)}>My Assassin</Link>
                   <Link to="/edit-profile" className="font-bold uppercase tracking-widest text-slate-700" onClick={() => setMobileOpen(false)}>Edit Profile</Link>
                   <Link to="/missions" className="font-bold uppercase tracking-widest text-slate-700" onClick={() => setMobileOpen(false)}>My Missions</Link>
                   <Link to={`/@${user?.username}`} className="font-bold uppercase tracking-widest text-slate-700" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                   <button onClick={handleLogout} className="text-red-500 font-bold uppercase tracking-widest text-left">Log Out</button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <SignInButton mode="modal">
                    <button
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 text-center font-black uppercase tracking-widest text-slate-900"
                    >
                      Enter System
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      className="w-full rounded-2xl bg-slate-900 py-4 text-center font-black uppercase tracking-widest text-white"
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

export default Navbar;
