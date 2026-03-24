import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-hero text-hero-foreground">
      {/* CTA Banner */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-primary rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-primary-foreground mb-2">
              Join the Online Round
            </h3>
            <p className="text-primary-foreground/80">
              Register before Feb 21, 2025 to secure your spot.
            </p>
          </div>
          <a
            href="#hero"
            className="bg-primary-foreground text-primary px-8 py-3.5 rounded-md font-semibold hover:bg-primary-foreground/90 transition-colors whitespace-nowrap"
          >
            Register Now
          </a>
        </div>
      </div>

      {/* Footer links */}
      <div className="border-t border-hero-foreground/10">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-heading font-bold text-xl mb-3">
                Tech<span className="text-primary"> Assassin</span>
              </h4>
              <p className="text-hero-muted text-sm leading-relaxed max-w-xs">
                A hackathon community bringing together the brightest minds to
                build, learn, and innovate.
              </p>
            </div>
            <div>
              <h5 className="font-heading font-semibold mb-3">Quick Links</h5>
              <ul className="space-y-2 text-hero-muted text-sm">
                <li>
                  <a href="#prizes" className="hover:text-hero-foreground transition-colors">
                    Prizes
                  </a>
                </li>
                <li>
                  <a href="#tracks" className="hover:text-hero-foreground transition-colors">
                    Tracks
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-hero-foreground transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-heading font-semibold mb-3">Community</h5>
              <ul className="space-y-2 text-hero-muted text-sm">
                <li>
                  <a href="#" className="hover:text-hero-foreground transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-hero-foreground transition-colors">
                    Twitter / X
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-hero-foreground transition-colors">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-hero-foreground/10">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-hero-muted text-xs">
          <p>© 2026 Tech Assassin. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart size={12} className="text-primary" /> by Tech Assassin
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
