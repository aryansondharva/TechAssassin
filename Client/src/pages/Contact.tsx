import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Github,
  Mail,
  MessageSquare,
  Send,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import keyChainImg from "@/assets/key_chain.png";

const contactEmail = "admin@techassassin.com";

const contactChannels = [
  {
    icon: Mail,
    label: "Email",
    value: contactEmail,
    href: `mailto:${contactEmail}`,
  },
  {
    icon: MessageSquare,
    label: "Discord",
    value: "Join the builder room",
    href: "https://discord.gg/S6V3KNUu",
  },
  {
    icon: Github,
    label: "GitHub",
    value: "Open an issue",
    href: "https://github.com/aryansondharva/TechAssassin",
  },
];

const Contact = () => {
  const [status, setStatus] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const topic = String(formData.get("topic") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const subject = encodeURIComponent(`Tech Assassin contact: ${topic || "General"}`);
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Email: ${email}`,
        `Topic: ${topic || "General"}`,
        "",
        message,
      ].join("\n")
    );

    setStatus("Opening your email client with the message ready.");
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navbar dark={false} />

      <main className="pt-24">
        <section className="container mx-auto px-6 pb-16 pt-8 md:pb-20 md:pt-14">
          <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-red-600">
                Contact us
              </p>
              <h1 className="max-w-xl text-[2.15rem] font-black leading-tight text-slate-950 sm:text-[2.6rem] md:text-[3rem]">
                Tell us what you want to build next.
              </h1>
              <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-[1.05rem] sm:leading-8">
                Questions, partnerships, mission ideas, mentor requests, and
                community support all come through here.
              </p>

              <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.9)]">
                <img
                  src={keyChainImg}
                  alt="Tech Assassin key chain"
                  className="h-64 w-full object-cover sm:h-80"
                />
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {contactChannels.map((channel) => {
                  const Icon = channel.icon;

                  return (
                    <a
                      key={channel.label}
                      href={channel.href}
                      target={channel.href.startsWith("http") ? "_blank" : undefined}
                      rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
                      className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                          {channel.label}
                        </span>
                        <span className="mt-1 block text-base font-bold text-slate-950">
                          {channel.value}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-58px_rgba(15,23,42,0.9)] sm:p-8">
              <div className="mb-8 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[1.55rem] font-black leading-tight text-slate-950">
                    Send a message
                  </h2>
                  <p className="mt-2 text-base font-medium text-slate-600">
                    Your email app will open with everything filled in.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                  <Clock3 className="h-4 w-4" />
                  Usually fast
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" name="name" placeholder="Aryan Sondharva" />
                  <Field label="Email" name="email" type="email" placeholder="name@example.com" />
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                    Topic
                  </span>
                  <select
                    name="topic"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-medium text-slate-900 outline-none transition-colors focus:border-red-300"
                    defaultValue="Partnership"
                  >
                    <option>Partnership</option>
                    <option>Mission idea</option>
                    <option>Mentorship</option>
                    <option>Support</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                    Message
                  </span>
                  <textarea
                    name="message"
                    required
                    rows={7}
                    placeholder="Tell us what you need."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-base font-medium leading-7 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-red-300"
                  />
                </label>

                <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-6 py-3 text-base font-black text-white transition-colors hover:bg-red-600"
                  >
                    Send message <Send className="h-4 w-4" />
                  </button>

                  {status && (
                    <p className="text-sm font-semibold text-slate-500">
                      {status}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const Field = ({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
    </span>
    <input
      name={name}
      type={type}
      required
      placeholder={placeholder}
      className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-red-300"
    />
  </label>
);

const Metric = ({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: string;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-3">
    <span className="flex h-11 w-11 items-center justify-center rounded bg-white text-red-600 shadow-sm">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
    </div>
  </div>
);

export default Contact;
