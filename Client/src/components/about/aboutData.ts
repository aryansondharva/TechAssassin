import founderImg from '@/assets/founder.png';
import manthanImg from '@/assets/manthan.png';
import rajImg from '@/assets/raj.png';
import advisorBanner from '@/assets/advisor_banner.webp';
import founderBanner from '@/assets/founder_banner.webp';
import communityChiefBanner from '@/assets/community_chief_banner.webp';
import missHackerImg from '@/assets/miss_hacker.png';
import hackerBanner from '@/assets/hacker_banner.webp'
import professorImg from '@/assets/professor.png';
import marketingLeadBanner from '@/assets/marketing-lead-banner.webp';
import type { Member } from "./types";

export const teamMembers: Member[] = [
  {
    name: "Raj Ribadiya",
    role: "Advisor",
    accent: "bg-emerald-600",
    image: rajImg ,
    banner: advisorBanner,
    links: {
    portfolio: "https://syncwithraj.vercel.app/",
    discord: "https://discord.gg/S6V3KNUu",
    github: "https://github.com/SyncWithRaj",
    twitter: "https://x.com/ribadiya_rajj",
    linkedin: "https://www.linkedin.com/in/raj-ribadiya/",
  },
  },
  {
    name: "Manthan Rajpurohit",
    role: "Community chief",
    accent: "bg-blue-600",
    image: manthanImg,
    banner: communityChiefBanner,
    links: {
    portfolio: "https://manthan.vercel.app/",
    discord: "https://discord.gg/S6V3KNUu",
    github: "https://github.com/manthansingh26",
    twitter: "https://x.com/Manthansingh26",
    linkedin: "https://www.linkedin.com/in/manthan-shravansingh-rajpurohit",
  },
  },
  {
    name: "Miss Hacker",
    role: "Community",
    accent: "bg-emerald-600",
    image: missHackerImg,
    banner: hackerBanner,
  },
  {
    name: "Shrey Kansara ",
    role: "Marketing Lead",
    accent: "bg-amber-500",
    image: professorImg,
    banner: marketingLeadBanner,
  },
];

export const founderMember: Member = {
  name: "Aryan Sondharva",
  role: "Founder",
  accent: "bg-red-600",
  image: founderImg,
  banner: founderBanner,
  links: {
    portfolio: "https://aryan-sondharva.vercel.app/",
    discord: "https://discord.gg/S6V3KNUu",
    github: "https://github.com/aryansondharva",
    twitter: "https://x.com/aryansondharva",
    linkedin: "https://www.linkedin.com/in/aryan-sondharva",
  },
};
