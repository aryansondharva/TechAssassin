import founderImg from '@/assets/founder.png';
import manthanImg from '@/assets/manthan.png';
import type { Member } from "./types";

export const teamMembers: Member[] = [
  {
    name: "Manthan Rajpurohit",
    role: "Co-Founder",
    accent: "bg-blue-600",
    image: manthanImg,
  },
  {
    name: "Berlin",
    role: "Community",
    accent: "bg-emerald-600",
    image: "/berlin.png",
  },
  {
    name: "Rio",
    role: "Engineering",
    accent: "bg-violet-600",
    image: "/rio.png",
  },
  {
    name: "Tokyo",
    role: "Design",
    accent: "bg-amber-500",
    image: "/tokyo.png",
  },
];

export const founderMember: Member = {
  name: "Aryan Sondharva",
  role: "Founder",
  accent: "bg-red-600",
  image: founderImg,
  links: {
    portfolio: "https://aryan-sondharva.vercel.app/",
    discord: "https://discord.gg/S6V3KNUu",
    github: "https://github.com/aryansondharva",
    twitter: "https://x.com/aryansondharva",
    linkedin: "https://www.linkedin.com/in/aryan-sondharva",
  },
};
