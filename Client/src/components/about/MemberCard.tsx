import { Github, Linkedin } from "lucide-react";
import type { Member } from "./types";

type MemberCardProps = {
  member: Member;
  compact?: boolean;
  featured?: boolean;
};

const MemberCard = ({ member, compact = false, featured = false }: MemberCardProps) => {
  const socialLinks = [
    { label: "X", href: member.links?.twitter, icon: XIcon },
   // { label: "Discord", href: member.links?.discord, icon: DiscordIcon },
    { label: "GitHub", href: member.links?.github, icon: Github },
    { label: "LinkedIn", href: member.links?.linkedin, icon: Linkedin },
  ];

  // Map solid accent bg color to soft text/border colors for role badges
  const getAccentSoftStyles = (accentClass: string) => {
    switch (accentClass) {
      case "bg-blue-600":
        return "bg-blue-50/80 text-blue-600 border-blue-100 hover:bg-blue-100/50";
      case "bg-emerald-600":
        return "bg-emerald-50/80 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50";
      case "bg-violet-600":
        return "bg-violet-50/80 text-violet-600 border-violet-100 hover:bg-violet-100/50";
      case "bg-amber-500":
        return "bg-amber-50/80 text-amber-600 border-amber-100 hover:bg-amber-100/50";
      case "bg-red-600":
        return "bg-red-50/80 text-red-600 border-red-100 hover:bg-red-100/50";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100/50";
    }
  };

  const softStyles = getAccentSoftStyles(member.accent);

  return (
    <article
      className={`group relative mx-auto flex w-full max-w-[17.5rem] flex-col items-center rounded-2xl border bg-gradient-to-b from-white to-slate-50/30 p-6 pt-8 text-center transition-all duration-300 hover:-translate-y-1.5 ${
        featured
          ? "border-red-100 shadow-[0_24px_50px_-20px_rgba(220,38,38,0.12)] hover:border-red-200 hover:shadow-[0_30px_60px_-15px_rgba(220,38,38,0.22)]"
          : "border-slate-100 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.1)] hover:border-slate-200 hover:shadow-[0_25px_50px_-20px_rgba(15,23,42,0.18)]"
      }`}
    >
      {/* Dynamic Background Glow on Hover */}
      <div 
        className={`absolute top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full opacity-0 blur-[32px] transition-all duration-500 group-hover:opacity-20 ${member.accent}`} 
        aria-hidden="true"
      />

      <a
        href={member.links?.portfolio}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${member.name} portfolio`}
        className={`relative z-10 block ${member.links?.portfolio ? "cursor-pointer" : "pointer-events-none"}`}
      >
        {/* Avatar Container with spinning gradient ring (gold for featured/founder, silver for standard members) */}
        <div className="relative h-32 w-32 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          {featured ? (
            /* Rotating Golden Gradient Border */
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600 animate-[spin_8s_linear_infinite] shadow-[0_4px_15px_rgba(217,119,6,0.15)] group-hover:shadow-[0_8px_25px_rgba(217,119,6,0.35)]" />
          ) : (
            /* Rotating Silver Gradient Border */
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-slate-300 via-zinc-100 to-slate-400 animate-[spin_10s_linear_infinite] shadow-[0_4px_12px_rgba(148,163,184,0.15)] group-hover:shadow-[0_8px_20px_rgba(148,163,184,0.3)]" />
          )}
          
          <div className="relative rounded-full transition-all duration-500 h-[122px] w-[122px] bg-white p-[2px]">
            <img
              src={member.image}
              alt={`${member.name} avatar`}
              className="h-full w-full rounded-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          </div>
        </div>
      </a>

      {/* Name with elegant bold typography */}
      <h3 className="relative z-10 mt-5 text-[1.2rem] font-black tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-slate-950">
        {member.name}
      </h3>

      {/* Custom graphical badge banner or standard soft pill badge */}
      {member.banner ? (
        <div className="relative z-10 mt-3 h-10 w-full max-w-[12.5rem] overflow-hidden transition-transform duration-300 group-hover:scale-105">
          <img
            src={member.banner}
            alt={`${member.name} badge`}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className={`relative z-10 mt-2.5 inline-flex items-center rounded-full border px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider transition-all duration-300 ${softStyles}`}>
          {member.role}
        </div>
      )}

      {/* Social links styled as capsule buttons */}
      <div className={`relative z-10 mt-7 flex items-center justify-center gap-3 ${compact ? "opacity-90" : ""}`}>
        {socialLinks.map(({ label, href, icon: Icon }) =>
          href ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} ${label}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-950 hover:bg-slate-950 hover:text-white hover:shadow-[0_8px_20px_-6px_rgba(15,23,42,0.3)]"
            >
              <Icon className="h-4 w-4" />
            </a>
          ) : (
            <button
              key={label}
              type="button"
              aria-label={`${member.name} ${label}`}
              disabled
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-50 bg-slate-50/50 text-slate-300"
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        )}
      </div>
    </article>
  );
};

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.08.08 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.06.06 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.028 14.1 14.1 0 0 0 1.226-1.994.08.08 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.08.08 0 0 1-.008-.128c.126-.094.251-.192.372-.292a.07.07 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .078.01c.12.1.246.198.373.292a.08.08 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.08.08 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.08.08 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.08.08 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.334-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z" />
  </svg>
);

export default MemberCard;
