import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-white pt-16"
    >
      <div className="container relative z-10 mx-auto px-4 py-16 text-center sm:px-6 md:py-24">
        <div className="relative mx-auto max-w-6xl">
          <DecorativeMarks />

          <div className="relative z-10 mx-auto max-w-5xl pt-14 sm:pt-20 md:pt-24">
            <h1 className="text-4xl font-normal leading-[1.08] text-slate-800 sm:text-5xl md:text-6xl lg:text-7xl">
              Turning{" "}
              <span className="font-black text-slate-950">learners</span> into
              builders with{" "}
              <span className="relative inline-block font-black text-slate-950">
                real missions
                <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-red-500 md:h-2" />
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base md:mt-8 md:text-lg md:leading-8">
              Tech Assassin gives students the team, mentorship, feedback, and
              project runway they need to move from learning to building.
            </p>
          </div>

          <div className="relative z-10 mx-auto mt-12 max-w-xl md:mt-20">
            <p className="mb-4 text-xs font-black uppercase text-slate-800 sm:text-sm md:mb-5">
              Join us
            </p>
            <form action="/signup" className="flex items-center justify-center gap-3 sm:gap-4">
              <label className="sr-only" htmlFor="hero-email">
                Email address
              </label>
              <input
                id="hero-email"
                name="email"
                type="email"
                placeholder="Your email"
                className="h-12 min-w-0 flex-1 rounded-lg border border-slate-100 bg-white px-4 text-sm font-medium text-slate-900 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.65)] outline-none transition-colors placeholder:text-slate-400 focus:border-red-300 sm:h-14 sm:px-6 sm:text-base md:h-16 md:px-7 md:text-lg"
              />
              <button
                type="submit"
                aria-label="Join Tech Assassin"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700 sm:h-14 sm:w-14 md:h-16 md:w-16"
              >
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const DecorativeMarks = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 h-full min-h-[32rem]">
    <CodeFace
      className="left-[1%] top-[32%] hidden sm:block"
      rotate="-rotate-12"
      body="bg-emerald-400"
      accent="border-emerald-400"
    />
    <CodeFace
      className="left-[26%] top-[0%] hidden md:block"
      rotate="rotate-6"
      body="bg-yellow-100"
      accent="border-yellow-100"
    />
    <CodeFace
      className="right-[27%] top-[0%] hidden md:block"
      rotate="-rotate-6"
      body="bg-orange-300"
      accent="border-orange-300"
    />
    <CodeFace
      className="right-[2%] top-[29%] hidden sm:block"
      rotate="rotate-12"
      body="bg-yellow-300"
      accent="border-emerald-400"
    />
    <FloatingBadge
      className="left-[27%] bottom-[5%] hidden md:flex"
      rotate="rotate-6"
      bg="bg-blue-500"
      border="border-blue-500"
    />
    <FloatingBadge
      className="right-[24%] bottom-[3%] hidden md:flex"
      rotate="-rotate-12"
      bg="bg-red-600"
      border="border-red-700"
    />
    <div className="absolute bottom-[-1rem] left-[7%] hidden h-14 w-14 rotate-12 rounded-lg border border-blue-200 bg-blue-100 md:block lg:h-16 lg:w-16">
      <span className="absolute left-4 top-4 h-6 w-6 rounded-full bg-blue-500/70 lg:h-7 lg:w-7" />
      <span className="absolute bottom-3 right-3 h-2.5 w-2.5 rounded-full bg-red-500" />
    </div>
  </div>
);

const CodeFace = ({
  className,
  body,
  accent,
  rotate,
}: {
  className: string;
  body: string;
  accent: string;
  rotate: string;
}) => (
  <div className={`absolute ${className} ${rotate}`}>
    <div className={`relative h-12 w-20 overflow-hidden rounded-b-full rounded-t-md shadow-[0_22px_48px_-34px_rgba(15,23,42,0.8)] sm:h-14 sm:w-24 md:h-16 md:w-28 lg:h-[5.2rem] lg:w-32 ${body}`}>
      <span className="absolute left-7 top-4 h-6 w-10 rounded-b-full border-b-[3px] border-slate-800 sm:left-8 sm:top-5 sm:h-7 sm:w-11 md:left-10 md:top-5 md:h-8 md:w-12 lg:left-11 lg:top-6 lg:h-9 lg:w-14 lg:border-b-[4px]" />
      <span className="absolute right-5 top-4 h-2 w-2 rounded-full bg-slate-800 sm:right-6 sm:top-5 md:right-7 md:top-6 lg:right-8 lg:top-7 lg:h-2.5 lg:w-2.5" />
      <span className="absolute right-3 top-4 h-1.5 w-1.5 rounded-full bg-slate-800 sm:right-4 sm:top-5 md:top-5 lg:right-4 lg:top-6 lg:h-2 lg:w-2" />
    </div>
    <span className={`absolute -left-2 bottom-2 h-7 w-7 rounded-full border-l-[3px] sm:bottom-3 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:-left-3 lg:bottom-4 lg:h-10 lg:w-10 lg:border-l-4 ${accent}`} />
    <span className="absolute left-7 -top-3 h-7 w-4 rounded-b-full border-b-[3px] border-l-[3px] border-slate-800 sm:left-9 sm:-top-4 sm:h-9 sm:w-5 md:left-10 lg:left-12 lg:-top-5 lg:h-11 lg:w-6 lg:border-b-4 lg:border-l-4" />
  </div>
);

const FloatingBadge = ({
  className,
  bg,
  border,
  rotate,
}: {
  className: string;
  bg: string;
  border: string;
  rotate: string;
}) => (
  <div
    className={`absolute h-12 w-12 items-center justify-center rounded-lg border-2 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.7)] md:h-14 md:w-14 lg:h-16 lg:w-16 ${className} ${rotate} ${bg} ${border}`}
  >
    <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full border-2 border-white bg-red-500 lg:h-5 lg:w-5" />
    <span className="absolute left-3 top-3 h-5 w-5 rounded-full bg-white/40 md:left-4 md:top-4 md:h-6 md:w-6" />
    <span className="absolute bottom-3 right-3 h-2.5 w-2.5 rounded-full bg-white/70 lg:bottom-4 lg:right-4 lg:h-3 lg:w-3" />
  </div>
);

export default HeroSection;
