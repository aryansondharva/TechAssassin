import heroBg from "@/assets/hero-bg.png";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background - Full screen including navbar area */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="TechAssassin cyberpunk background"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-hero/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center pt-24 pb-20 md:pt-32 md:pb-32">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/40 bg-white/10">
          <span className="text-white text-sm font-semibold tracking-wide uppercase">
            Hackathon Community
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-hero-foreground mb-4 tracking-tight leading-tight">
          Tech<span className="text-primary">Assassin</span>
        </h1>

        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-primary font-heading font-semibold text-lg md:text-2xl">
            Feb 21, 2025
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-hero-muted text-sm">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <span>Hybrid Event</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />
            <span>7 Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <span>200+ Participants</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-md font-semibold text-base hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            Register Now
          </Link>
          <a
            href="#tracks"
            className="border border-hero-muted/30 text-hero-foreground px-8 py-3.5 rounded-md font-semibold text-base hover:bg-hero-foreground/5 transition-colors"
          >
            View Tracks
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
