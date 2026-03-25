import { Lightbulb, Users, GraduationCap, Rocket } from "lucide-react";

const reasons = [
  {
    icon: Lightbulb,
    title: "Innovate & Evolve",
    description:
      "Exclusive tactical workshops and mentorship to sharpen your skills as an elite operative.",
  },
  {
    icon: Users,
    title: "Global Collaboration",
    description:
      "Connect with high-caliber peers and industry mentors in our secure digital network.",
  },
  {
    icon: GraduationCap,
    title: "Gain Elite Status",
    description:
      "Progress through ranks and earn recognition from top tech firms and community leaders.",
  },
  {
    icon: Rocket,
    title: "Launch Real Assets",
    description:
      "Go from mission brief to functional asset, building a high-impact portfolio.",
  },
];

const WhySection = () => {
  return (
    <section id="why" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            Why Us
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Why Our Community
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Beyond code — it's an elite network for digital assassins.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.title}
                className="text-center p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Icon size={26} className="text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">
                  {reason.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
