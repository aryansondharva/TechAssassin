import founderImg from '@/assets/founder.png';
import manthanImg from '@/assets/manthan.png';
import flagImg from '@/assets/flag.webp';
import we1Img from '@/assets/we1.webp';
import we2Img from '@/assets/we2.webp';
import we3Img from '@/assets/we3.webp';

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Code2,
  Github,
  MapPin,
  Rocket,
  Star,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    key: "builders",
    fallbackValue: 167,
    label: "builders",
    color: "bg-[#5ccdbc]",
    className: "max-w-[21.25rem] lg:-ml-24 lg:w-[27.25rem] lg:max-w-none",
  },
  {
    key: "projects",
    fallbackValue: 4,
    label: "projects",
    color: "bg-[#03df79]",
    className: "max-w-[18.75rem] lg:-ml-24 lg:w-[23.75rem] lg:max-w-none",
  },
  {
    key: "hackathons",
    fallbackValue: 1,
    label: "hackathons",
    color: "bg-[#81a2ed]",
    className: "max-w-[17rem] lg:-ml-24 lg:w-[22rem] lg:max-w-none",
  },
];

type CommunityStatsResponse = {
  builders?: number;
  projects?: number;
  hackathons?: number;
};

const formatStatValue = (value: number) => {
  const formatted = new Intl.NumberFormat("en-US").format(value);
  return value > 0 ? `${formatted}+` : formatted;
};

const impactSlides = [
  {
    src: we1Img,
    alt: "Tech Assassin community event 1",
    imageClassName: "object-cover object-center",
  },
  {
    src: we2Img,
    alt: "Tech Assassin community event 2",
    imageClassName: "object-cover object-center",
  },
  {
    src: we3Img,
    alt: "Tech Assassin community event 3",
    imageClassName: "object-cover object-center",
  },
];

const missions = [
  {
    title: "CodeSprint 2026",
    date: "Comming soon",
    location: "Online",
    tag: "Hackathon",
    marker: "bg-red-600",
    chip: "bg-red-600 text-white",
    block: "bg-emerald-400",
  },
  {
    title: "Open-Source Lab",
    date: "Comming soon",
    location: "Discord",
    tag: "Mission",
    marker: "bg-blue-500",
    chip: "bg-blue-50 text-blue-600",
    block: "bg-yellow-300",
  },
  {
    title: "AI Builder Week",
    date: "Comming soon",
    location: "Global",
    tag: "Workshop",
    marker: "bg-emerald-400",
    chip: "bg-emerald-50 text-emerald-700",
    block: "bg-red-100",
  },
];

const storyBlocks = [
  {
    step: "1",
    icon: BookOpen,
    title: "Your builder profile stays alive",
    body: "Collect your work, skills, links, missions, and shipped projects in one place that keeps growing with you.",
    cta: "Create profile",
    mockup: "profile",
  },
  {
    step: "2",
    icon: Code2,
    title: "A showcase of serious projects",
    body: "Give weekend experiments, hackathon builds, and open-source work a space where mentors and peers can understand the craft behind them.",
    cta: "Add project",
    mockup: "projects",
  },
  {
    step: "3",
    icon: Rocket,
    title: "Your portal to build missions",
    body: "Browse missions, join squads, submit proof, receive feedback, and keep moving without losing momentum.",
    cta: "Explore missions",
    mockup: "missions",
  },
];

const testimonials = [
  {
    quote:
      "Tech Assassin makes unfinished ideas feel finishable. The best part is the mix of accountability, feedback, and people who actually want to build.",
    name: "Aryan Sondharva",
    role: "Founder",
    image: founderImg,
  },
  {
    quote:
      "The community is practical. You do not just talk about projects, you ship them, get reviewed, and learn what to improve next.",
    name: "Manthan Rajpurohit",
    role: "Community Chief",
    image: manthanImg,
  },
];

const collaboratorItems = [
  "Workshops",
  "Hackathons",
  "Sponsorships",
  "Hiring Talent",
  "Product Feedback",
  "Mentorship",
  "Brand Presence",
  "Campus Events",
  "Internship Connect",
  "Startup Collaboration",
  "Community Growth",
  "Student Innovation",
];

const CommunitySection = () => {
  return (
    <>
      <ImpactSection />
      <HappeningNowSection />
      <QuoteSection />
      <IdentitySection />
      <BuilderStorySection />
      <CompaniesCollaboratorsSection />
      <DeveloperVoicesSection />
      <CommunityCtaSection />
    </>
  );
};

const ImpactSection = () => (
  <section id="community" className="relative overflow-hidden bg-white py-12 md:py-20">
    <div className="container relative mx-auto px-6">
      <div className="mx-auto grid max-w-[68rem] items-center gap-7 md:grid-cols-[1.05fr_0.95fr] md:gap-5 lg:gap-8">
        <div className="relative z-10">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_70px_-45px_rgba(15,23,42,0.8)]">
            <ImpactImageSwap />
          </div>
          <FloatingChip className="-bottom-4 left-4 sm:-bottom-5 sm:left-8" color="bg-yellow-300" text="JS" />
          <FloatingChip className="-right-3 top-6 sm:-right-6 sm:top-8" color="bg-emerald-400" text="{ }" />
        </div>

        <div className="relative z-20">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-red-600">
            We ship momentum
          </p>
          <h2 className="text-[1.85rem] font-black leading-tight text-slate-950 sm:text-[2.2rem] md:text-[2.45rem]">
            A community where learners become builders.
          </h2>
          <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-[1.05rem] sm:leading-8">
            We run missions, reviews, workshops, and project showcases so students
            can move from tutorials to real work with a squad around them.
          </p>
          <ImpactStats />
        </div>
      </div>
    </div>
  </section>
);

const ImpactStats = () => {
  const [liveStats, setLiveStats] = useState<CommunityStatsResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    api
      .get<CommunityStatsResponse>("/community/stats")
      .then((data) => {
        if (mounted) setLiveStats(data);
      })
      .catch(() => {
        if (mounted) setLiveStats(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative z-20 mt-7 space-y-3 md:mt-8">
      {stats.map((stat) => {
        const value = liveStats?.[stat.key as keyof CommunityStatsResponse] ?? stat.fallbackValue;

        return (
          <div
            key={stat.label}
            className={`mx-auto flex w-full items-center justify-center gap-3 rounded-full px-4 py-2.5 text-white shadow-[0_24px_55px_-32px_rgba(15,23,42,0.7)] min-[420px]:gap-4 min-[420px]:px-4 sm:gap-5 sm:px-6 md:py-3.5 lg:mx-0 lg:justify-start lg:px-8 ${stat.color} ${stat.className}`}
          >
            <span className="font-heading text-[1.7rem] font-black leading-none min-[420px]:text-[2.15rem] sm:text-[2.55rem] lg:text-[2.55rem]">
              {formatStatValue(value)}
            </span>
            <span className="text-base font-semibold leading-none tracking-[0.08em] min-[420px]:text-lg sm:text-xl">
              {stat.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const ImpactImageSwap = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const swapTimer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % impactSlides.length);
    }, 2000);

    return () => window.clearInterval(swapTimer);
  }, []);

  return (
    <div className="relative h-[15.3rem] w-full bg-slate-950 sm:h-[20.4rem] md:h-[29rem] lg:h-[37.4rem]">
      {impactSlides.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${slide.imageClassName} ${
            index === activeSlide ? "opacity-100" : "opacity-0"
          }`}
          loading={index === 0 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
};

const HappeningNowSection = () => (
  <section className="relative overflow-hidden bg-white py-16 md:py-24">
    <div className="absolute inset-x-0 top-0 h-px bg-slate-100" aria-hidden="true" />
    <div className="container relative mx-auto px-6">
      <div className="mx-auto mb-11 max-w-4xl text-center">
        <p className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-red-600">
          Live missions
        </p>
        <h2 className="text-[2.25rem] font-black leading-tight text-slate-950 sm:text-[2.75rem] md:text-[3.15rem]">
          Happening{" "}
          <span className="relative inline-block">
            now
            <span className="absolute -bottom-1.5 left-0 right-0 h-2 bg-red-500" />
          </span>
        </h2>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {missions.map((mission, index) => (
          <article
            key={mission.title}
            className="group relative min-h-[21rem] overflow-hidden rounded-lg border border-slate-200 bg-white p-7 shadow-[0_28px_80px_-50px_rgba(15,23,42,0.9)] transition-all hover:-translate-y-1 hover:border-slate-950 hover:shadow-[0_34px_90px_-52px_rgba(15,23,42,0.95)] sm:p-8"
          >
            <span className={`absolute inset-x-0 top-0 h-2 ${mission.marker}`} aria-hidden="true" />
            <span
              className={`absolute -right-8 -top-8 h-24 w-24 rotate-12 rounded-lg opacity-90 transition-transform group-hover:rotate-6 ${mission.block}`}
              aria-hidden="true"
            />
            <div className="relative mb-7 flex items-center justify-between gap-4">
              <span className={`rounded px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] ${mission.chip}`}>
                {mission.tag}
              </span>
              {/* <span className={`flex h-9 w-9 items-center justify-center rounded-lg shadow-sm ${mission.icon}`}>
                <Rocket className="h-4 w-4" />
              </span> */}
            </div>
            <div className="relative mb-5 flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={`h-3.5 w-20 rounded-full ${mission.marker}`} />
            </div>
            <h3 className="relative text-[1.55rem] font-black leading-snug text-slate-950 sm:text-[1.65rem]">
              {mission.title}
            </h3>
            <div className="relative mt-6 space-y-3 text-[1.05rem] font-semibold text-slate-600">
              <p className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-red-600" />
                {mission.date}
              </p>
              <p className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-red-600" />
                {mission.location}
              </p>
            </div>
            <Link
              to="/events?status=live"
              className="relative mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-[1.05rem] font-black text-white transition-colors hover:bg-red-600"
            >
              View events <ArrowRight className="h-5 w-5" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const QuoteSection = () => (
  <section className="bg-white py-16 md:py-24">
    <div className="container mx-auto px-6">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_0.9fr] md:gap-14">
        <div>
          <h2 className="text-[2rem] font-black leading-[1.08] text-red-600 sm:text-[2.35rem] md:text-[2.65rem] lg:text-[3rem]">
            Built by a student,
            <br />
            for students who are ready to build.
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            Tech Assassin exists for students with unfinished ideas, late-night
            commits, and the hunger to create something real. Our goal is to
            give every student a space to learn, collaborate, ship projects,
            and grow with a builder mindset.
          </p>
          <div className="mt-8 max-w-2xl border-l-4 border-slate-950 pl-5">
            <p className="text-xl font-black leading-8 text-slate-950">
              "We are not creating just a community. We are creating a
              launchpad for student builders."
            </p>
            <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Aryan Sondharva, Founder
            </p>
          </div>
        </div>
        <div className="relative justify-self-center">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_34px_90px_-48px_rgba(15,23,42,0.9)]">
            <img
              src={founderImg}
              alt="Tech Assassin founder"
              className="h-[21rem] w-full max-w-sm object-cover sm:h-[27rem] sm:w-[22rem] md:h-[30rem] md:w-[24rem] lg:h-[32rem] lg:w-[25rem]"
              loading="lazy"
            />
          </div>
          <FloatingChip className="-left-4 top-4 sm:-left-7 sm:top-5" color="bg-yellow-300" text="23" />
          <FloatingChip className="-bottom-4 right-5 sm:-bottom-6 sm:right-6" color="bg-blue-500" text="01" light />
        </div>
      </div>
    </div>
  </section>
);

const IdentitySection = () => (
  <section className="relative bg-white py-20 md:py-28">
    <div className="container relative mx-auto px-6 text-center">
      <div className="mx-auto mb-12 flex h-72 max-w-2xl items-center justify-center md:h-80 lg:h-96">
        <div className="relative h-72 w-72 md:h-80 md:w-80 lg:h-96 lg:w-96">
          <img 
            src={flagImg} 
            alt="Tech Assassin Flag" 
            className="h-full w-full object-contain scale-[1.25] md:scale-[1.4]" 
          />
        </div>
      </div>
      <h2 className="mx-auto flex max-w-5xl items-end justify-center gap-3 text-[2.65rem] font-black leading-none text-slate-800 sm:text-[3.75rem] md:text-[4.7rem] lg:text-[5.35rem]">
        <span>Tech Assassin is</span>
        <span className="mb-2 h-2 flex-1 bg-blue-500 sm:mb-3 md:mb-4" aria-hidden="true" />
        <span>.</span>
      </h2>
    </div>
  </section>
);

const BuilderStorySection = () => (
  <section className="bg-white py-20 md:py-28">
    <div className="container mx-auto space-y-20 px-6 md:space-y-28">
      {storyBlocks.map((block, index) => {
        const Icon = block.icon;
        const flipped = index % 2 === 1;

        return (
          <div
            key={block.title}
            className={`mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16 ${flipped ? "md:[&>*:first-child]:order-2" : ""}`}
          >
            <div>
              <div className="mb-6 flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-base font-black text-white">
                  {block.step}
                </span>
                <span className="h-4 w-20 rounded-full bg-emerald-400" />
                <Icon className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-[1.85rem] font-black leading-tight text-slate-950 sm:text-[2.15rem] md:text-[2.45rem]">
                {block.title}
              </h3>
              <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-600">
                {block.body}
              </p>
              <Link
                to="/signup"
                className="mt-7 inline-flex h-12 items-center gap-2 rounded bg-blue-50 px-5 text-[1.05rem] font-black text-blue-600 transition-colors hover:bg-blue-100"
              >
                {block.cta} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <ProductMockup type={block.mockup} />
          </div>
        );
      })}
    </div>
  </section>
);

const DeveloperVoicesSection = () => (
  <section id="developers-say" className="bg-white py-20 md:py-28">
    <div className="container mx-auto px-6">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-[2.25rem] font-black leading-tight text-slate-950 sm:text-[2.75rem] md:text-[3.15rem]">
          We speak, we listen, we discuss, we grow.
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-8 text-slate-600">
          Real progress comes from feedback loops. These are the voices we are
          building for.
        </p>
      </div>
      <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-2">
        {testimonials.map((item) => (
          <article key={item.name} className="rounded-lg border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.8)]">
            <div className="mb-7 flex items-center gap-1.5 text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="text-lg font-bold leading-8 text-slate-800 sm:text-[1.2rem]">
              "{item.quote}"
            </p>
            <div className="mt-9 flex items-center gap-5">
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                loading="lazy"
              />
              <div>
                <h3 className="text-lg font-black text-slate-950">{item.name}</h3>
                <p className="text-base font-medium text-slate-500">{item.role}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const CompaniesCollaboratorsSection = () => (
  <section id="collaborators" className="relative overflow-hidden bg-white py-20 md:py-28">
    <div className="absolute inset-x-0 top-0 h-px bg-slate-100" aria-hidden="true" />
    <div className="container mx-auto px-6">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:gap-14">
        <div>
          <p className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-red-600">
            For companies & collaborators
          </p>
          <h2 className="text-[2.25rem] font-black leading-tight text-slate-950 sm:text-[2.75rem] md:text-[3.15rem] lg:text-[3.45rem]">
            Partner with the next generation of student builders.
          </h2>
        </div>
        <div>
          <p className="text-xl font-black leading-8 text-slate-950 md:text-[1.45rem] md:leading-9">
            Collaborate with Tech Assassin to reach students who are ready to
            learn, build, test, and ship real projects.
          </p>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
            Tech Assassin connects companies and tech organizations with
            passionate student developers through practical workshops,
            hackathons, mentorship sessions, sponsorship opportunities, hiring
            support, and real product feedback.
          </p>
          <Link
            to="/collaborate"
            className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-slate-950 px-7 text-lg font-black text-white transition-colors hover:bg-red-600"
          >
            Collaborate With Us <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>

    <div className="relative mt-14 overflow-hidden border-y border-slate-100 bg-slate-50/70 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white via-white/90 to-transparent sm:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white via-white/90 to-transparent sm:w-40" />
      <div className="partner-marquee-track flex w-max gap-3 px-3">
        {[...collaboratorItems, ...collaboratorItems].map((item, index) => (
          <span
            key={`${item}-${index}`}
            aria-hidden={index >= collaboratorItems.length}
            className="flex h-12 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black uppercase tracking-[0.12em] text-slate-950 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.8)]"
          >
            <span className="h-2 w-2 rounded-full bg-red-600" />
            {item}
          </span>
        ))}
      </div>
    </div>
  </section>
);

const CommunityCtaSection = () => (
  <section className="bg-yellow-300 py-20 md:py-28">
    <div className="container mx-auto px-6 text-center">
      <p className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-slate-800">
        Tech Assassin for communities
      </p>
      <h2 className="mx-auto max-w-4xl text-[2.25rem] font-black leading-tight text-slate-950 sm:text-[2.8rem] md:text-[3.25rem] lg:text-[3.5rem]">
        Run missions, collect builders, and turn ideas into proof.
      </h2>
      <p className="mx-auto mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-700">
        Student clubs, mentors, and organizers can bring their people together
        with missions, reviews, and showcases.
      </p>
      <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href="https://discord.gg/S6V3KNUu"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-14 items-center gap-2 rounded-lg bg-slate-950 px-7 text-lg font-black text-white transition-colors hover:bg-red-600"
        >
          <Users className="h-6 w-6" />
          Join Community
        </a>
        <a
          href="https://github.com/aryansondharva/TechAssassin"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-14 items-center gap-2 rounded-lg border border-slate-900/20 bg-white px-7 text-lg font-black text-slate-950 transition-colors hover:bg-slate-50"
        >
          <Github className="h-6 w-6" />
          Open Source
        </a>
      </div>
    </div>
  </section>
);

const ProductMockup = ({ type }: { type: string }) => (
  <div className="relative mx-auto w-full max-w-lg">
    <div className="absolute -bottom-4 -left-4 hidden h-24 w-24 bg-yellow-100 sm:block md:-bottom-7 md:-left-7 md:h-32 md:w-32" />
    <div className="absolute -right-4 bottom-8 hidden h-24 w-24 bg-emerald-300 sm:block md:-right-7 md:h-28 md:w-28" />
    <div className="relative rounded-lg border border-slate-200 bg-white p-7 shadow-[0_32px_90px_-54px_rgba(15,23,42,0.9)]">
      <div className="mb-6 flex items-center gap-2.5 border-b border-slate-100 pb-5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-300" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
      </div>
      <div className="space-y-5">
        <div className="h-4 w-1/2 rounded bg-blue-500" />
        <div className="grid grid-cols-[1fr_6rem] gap-5">
          <div className="space-y-3">
            <div className="h-4 rounded bg-slate-100" />
            <div className="h-4 w-4/5 rounded bg-slate-100" />
            <div className="h-4 w-3/5 rounded bg-slate-100" />
          </div>
          <div className="rounded bg-blue-50 p-4 text-center text-xs font-black uppercase text-blue-600">
            {type}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-28 rounded bg-slate-100" />
          <div className="h-28 rounded bg-blue-100" />
          <div className="h-28 rounded bg-slate-100" />
        </div>
      </div>
      <div className="absolute left-4 top-20 rounded bg-blue-700 px-4 py-2.5 text-xs font-black text-white shadow-lg sm:-left-5">
        {type === "profile" ? "Verified work" : type === "projects" ? "Review ready" : "Mission live"}
      </div>
    </div>
  </div>
);

const FloatingChip = ({
  className,
  color,
  text,
  light = false,
}: {
  className: string;
  color: string;
  text: string;
  light?: boolean;
}) => (
  <div className={`absolute flex h-10 w-10 rotate-12 items-center justify-center rounded-lg shadow-lg sm:h-12 sm:w-12 md:h-14 md:w-14 ${className} ${color} ${light ? "text-white" : "text-slate-950"}`}>
    <span className="font-heading text-sm font-black sm:text-base md:text-lg">{text}</span>
  </div>
);

export default CommunitySection;
