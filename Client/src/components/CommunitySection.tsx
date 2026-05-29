import founderImg from '@/assets/founder.png';
import manthanImg from '@/assets/manthan.png';
import flagImg from '@/assets/flag.webp';
import heroBgImg from '@/assets/hero-bg.webp';
import keyChainImg from '@/assets/key_chain.png';
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Code2,
  Github,
  MapPin,
  Rocket,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    value: "950,000+",
    label: "builders",
    color: "bg-[#5ccdbc]",
    className: "max-w-[25rem] lg:-ml-28 lg:w-[32rem] lg:max-w-none",
  },
  {
    value: "80,000+",
    label: "projects",
    color: "bg-[#03df79]",
    className: "max-w-[22rem] lg:-ml-28 lg:w-[28rem] lg:max-w-none",
  },
  {
    value: "1,500+",
    label: "hackathons",
    color: "bg-[#81a2ed]",
    className: "max-w-[20rem] lg:-ml-28 lg:w-[26rem] lg:max-w-none",
  },
];

const impactSlides = [
  {
    src: keyChainImg,
    alt: "Tech Assassin key chain",
    imageClassName: "object-cover object-center",
  },
  {
    src: heroBgImg,
    alt: "Tech Assassin community background",
    imageClassName: "object-cover object-center",
  },
  {
    src: flagImg,
    alt: "Tech Assassin flag",
    imageClassName: "object-contain bg-slate-950 p-8",
  },
];

const missions = [
  {
    title: "CodeSprint 2026",
    date: "June 12",
    location: "Online",
    tag: "Hackathon",
  },
  {
    title: "Open-Source Lab",
    date: "June 18",
    location: "Discord",
    tag: "Mission",
  },
  {
    title: "AI Builder Week",
    date: "June 24",
    location: "Global",
    tag: "Workshop",
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
    role: "Co-Founder",
    image: manthanImg,
  },
];

const CommunitySection = () => {
  return (
    <>
      <ImpactSection />
      <HappeningNowSection />
      <QuoteSection />
      <IdentitySection />
      <BuilderStorySection />
      <DeveloperVoicesSection />
      <CommunityCtaSection />
    </>
  );
};

const ImpactSection = () => (
  <section id="community" className="relative overflow-hidden bg-white py-14 md:py-24">
    <div className="container relative mx-auto px-6">
      <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-[1.05fr_0.95fr] md:gap-6 lg:gap-10">
        <div className="relative z-10">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_70px_-45px_rgba(15,23,42,0.8)]">
            <ImpactImageSwap />
          </div>
          <FloatingChip className="-bottom-4 left-4 sm:-bottom-5 sm:left-8" color="bg-yellow-300" text="JS" />
          <FloatingChip className="-right-3 top-6 sm:-right-6 sm:top-8" color="bg-emerald-400" text="{ }" />
        </div>

        <div className="relative z-20">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-red-600">
            We ship momentum
          </p>
          <h2 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl md:text-5xl">
            A community where learners become builders.
          </h2>
          <p className="mt-5 text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
            We run missions, reviews, workshops, and project showcases so students
            can move from tutorials to real work with a squad around them.
          </p>
          <ImpactStats />
        </div>
      </div>
    </div>
  </section>
);

const ImpactStats = () => (
  <div className="relative z-20 mt-8 space-y-4 md:mt-10">
    {stats.map((stat) => (
      <div
        key={stat.label}
        className={`mx-auto flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-white shadow-[0_24px_55px_-32px_rgba(15,23,42,0.7)] min-[420px]:px-5 sm:gap-3 sm:px-7 md:py-4 lg:mx-0 lg:justify-start lg:px-9 ${stat.color} ${stat.className}`}
      >
        <span className="font-heading text-2xl font-black leading-none min-[420px]:text-3xl sm:text-4xl lg:text-5xl">
          {stat.value}
        </span>
        <span className="text-lg font-medium leading-none min-[420px]:text-xl sm:text-2xl">
          {stat.label}
        </span>
      </div>
    ))}
  </div>
);

const ImpactImageSwap = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const swapTimer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % impactSlides.length);
    }, 2000);

    return () => window.clearInterval(swapTimer);
  }, []);

  return (
    <div className="relative h-72 w-full bg-slate-950 sm:h-96 md:h-[34rem] lg:h-[44rem]">
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
  <section className="bg-white py-12 md:py-16">
    <div className="container mx-auto px-6">
      <h2 className="mb-8 text-center text-xl font-black text-slate-950">
        Happening now
      </h2>
      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
        {missions.map((mission) => (
          <article key={mission.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                {mission.tag}
              </span>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </div>
            <h3 className="text-lg font-black text-slate-950">{mission.title}</h3>
            <div className="mt-4 space-y-2 text-sm font-medium text-slate-500">
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-red-600" />
                {mission.date}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                {mission.location}
              </p>
            </div>
            <a href="#community" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-red-600">
              View mission <ArrowRight className="h-4 w-4" />
            </a>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const QuoteSection = () => (
  <section className="bg-white py-14 md:py-20">
    <div className="container mx-auto px-6">
      <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[0.95fr_1.05fr] md:gap-10">
        <div>
          <p className="text-2xl font-black leading-tight text-red-600 md:text-3xl">
            The mission is simple: give every student a real shot at building
            something meaningful before motivation fades.
          </p>
          <p className="mt-5 text-sm font-bold text-slate-500">
            Tech Assassin exists for unfinished ideas, late-night commits, and
            the students who need the right room to keep going.
          </p>
        </div>
        <div className="relative justify-self-center">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_26px_70px_-42px_rgba(15,23,42,0.9)]">
            <img
              src={founderImg}
              alt="Tech Assassin founder"
              className="h-72 w-full max-w-xs object-cover sm:h-80 sm:w-72"
              loading="lazy"
            />
          </div>
          <FloatingChip className="-left-4 top-4 sm:-left-7 sm:top-5" color="bg-yellow-300" text="fx" />
          <FloatingChip className="-bottom-4 right-5 sm:-bottom-6 sm:right-6" color="bg-blue-500" text="Py" light />
        </div>
      </div>
    </div>
  </section>
);

const IdentitySection = () => (
  <section className="relative bg-white py-16 md:py-20">
    <div className="container relative mx-auto px-6 text-center">
      <div className="mx-auto mb-10 flex h-56 max-w-xl items-center justify-center md:h-64">
        <div className="relative h-56 w-56 md:h-64 md:w-64">
          <img 
            src={flagImg} 
            alt="Tech Assassin Flag" 
            className="h-full w-full object-contain scale-[1.3] md:scale-[1.5]" 
          />
        </div>
      </div>
      <h2 className="text-3xl font-black text-slate-950 md:text-5xl">
        Tech Assassin is{" "}
        <span className="relative inline-block">
          your build runway
          <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-blue-500" />
        </span>
      </h2>
    </div>
  </section>
);

const BuilderStorySection = () => (
  <section className="bg-white py-16 md:py-20">
    <div className="container mx-auto space-y-16 px-6 md:space-y-20">
      {storyBlocks.map((block, index) => {
        const Icon = block.icon;
        const flipped = index % 2 === 1;

        return (
          <div
            key={block.title}
            className={`mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2 md:gap-12 ${flipped ? "md:[&>*:first-child]:order-2" : ""}`}
          >
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                  {block.step}
                </span>
                <span className="h-4 w-16 rounded-full bg-emerald-400" />
                <Icon className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                {block.title}
              </h3>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-600 sm:text-base">
                {block.body}
              </p>
              <Link
                to="/signup"
                className="mt-6 inline-flex items-center gap-2 rounded bg-blue-50 px-4 py-2 text-sm font-black text-blue-600 transition-colors hover:bg-blue-100"
              >
                {block.cta} <ArrowRight className="h-4 w-4" />
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
  <section id="developers-say" className="bg-white py-16 md:py-20">
    <div className="container mx-auto px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
          We speak, we listen, we discuss, we grow.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-slate-600 sm:text-lg">
          Real progress comes from feedback loops. These are the voices we are
          building for.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
        {testimonials.map((item) => (
          <article key={item.name} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-1 text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-lg font-bold leading-8 text-slate-800">
              "{item.quote}"
            </p>
            <div className="mt-8 flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                loading="lazy"
              />
              <div>
                <h3 className="font-black text-slate-950">{item.name}</h3>
                <p className="text-sm font-medium text-slate-500">{item.role}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const CommunityCtaSection = () => (
  <section className="bg-yellow-300 py-16 md:py-20">
    <div className="container mx-auto px-6 text-center">
      <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-slate-800">
        Tech Assassin for communities
      </p>
      <h2 className="mx-auto max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl md:text-5xl">
        Run missions, collect builders, and turn ideas into proof.
      </h2>
      <p className="mx-auto mt-5 max-w-2xl text-base font-semibold text-slate-700 sm:text-lg">
        Student clubs, mentors, and organizers can bring their people together
        with missions, reviews, and showcases.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href="https://discord.gg/S6V3KNUu"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-6 py-3 font-black text-white transition-colors hover:bg-red-600"
        >
          <Users className="h-5 w-5" />
          Join Community
        </a>
        <a
          href="https://github.com/aryansondharva/TechAssassin"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-900/20 bg-white px-6 py-3 font-black text-slate-950 transition-colors hover:bg-slate-50"
        >
          <Github className="h-5 w-5" />
          Open Source
        </a>
      </div>
    </div>
  </section>
);

const ProductMockup = ({ type }: { type: string }) => (
  <div className="relative mx-auto w-full max-w-md">
    <div className="absolute -bottom-4 -left-4 hidden h-20 w-20 bg-yellow-100 sm:block md:-bottom-6 md:-left-6 md:h-28 md:w-28" />
    <div className="absolute -right-4 bottom-8 hidden h-20 w-20 bg-emerald-300 sm:block md:-right-6 md:h-24 md:w-24" />
    <div className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.9)]">
      <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </div>
      <div className="space-y-4">
        <div className="h-3 w-1/2 rounded bg-blue-500" />
        <div className="grid grid-cols-[1fr_5rem] gap-4">
          <div className="space-y-2">
            <div className="h-3 rounded bg-slate-100" />
            <div className="h-3 w-4/5 rounded bg-slate-100" />
            <div className="h-3 w-3/5 rounded bg-slate-100" />
          </div>
          <div className="rounded bg-blue-50 p-3 text-center text-[10px] font-black uppercase text-blue-600">
            {type}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 rounded bg-slate-100" />
          <div className="h-20 rounded bg-blue-100" />
          <div className="h-20 rounded bg-slate-100" />
        </div>
      </div>
      <div className="absolute left-3 top-16 rounded bg-blue-700 px-3 py-2 text-[10px] font-black text-white shadow-lg sm:-left-4">
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
