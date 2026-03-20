import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services";

const navLinks = [
  { label: "Events", href: "/events", isRoute: true },
  { label: "Community", href: "/community", isRoute: true },
  { label: "FAQ", href: "#faq" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthenticated = authService.isAuthenticated();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="text-hero-foreground font-heading font-bold text-xl tracking-tight">
          Tech<span className="text-primary">Assassin</span>
        </Link>

        {/* Desktop - Centered Navigation */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-hero-muted hover:text-hero-foreground transition-colors text-sm font-medium"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-hero-muted hover:text-hero-foreground transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>
        </div>

        {/* Right side - Auth buttons */}
        <div className="hidden md:flex items-center">
          {/* Temporary dashboard link for testing */}
          <Link
            to="/dashboard"
            className="text-hero-muted hover:text-hero-foreground transition-colors text-sm font-medium mr-3"
          >
            Dashboard (Test)
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/signin"
                className="text-hero-muted hover:text-hero-foreground transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-hero-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-hero/80 backdrop-blur-md px-4 pb-4">
          <div className="flex flex-col items-center space-y-4">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-hero-muted hover:text-hero-foreground transition-colors text-sm font-medium text-center"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-hero-muted hover:text-hero-foreground transition-colors text-sm font-medium text-center"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block mt-2 bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-semibold text-center hover:bg-primary/90 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <div className="space-y-2 mt-2">
              <Link
                to="/signin"
                onClick={() => setMobileOpen(false)}
                className="block bg-secondary text-secondary-foreground px-5 py-2 rounded-md text-sm font-semibold text-center hover:bg-secondary/90 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="block bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-semibold text-center hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
