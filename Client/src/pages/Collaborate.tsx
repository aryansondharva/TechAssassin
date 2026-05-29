import { FormEvent, useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Send,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type {
  CollaborationInterest,
  CollaborationOrganizationType,
  CollaborationRequest,
  CollaborationRequestCreateRequest,
} from "@/types/api";

type FormState = {
  organization_name: string;
  organization_type: CollaborationOrganizationType;
  contact_name: string;
  role_title: string;
  work_email: string;
  phone: string;
  website_url: string;
  collaboration_interests: CollaborationInterest[];
  budget_range: string;
  timeline: string;
  student_audience: string;
  message: string;
};

const initialFormState: FormState = {
  organization_name: "",
  organization_type: "company",
  contact_name: "",
  role_title: "",
  work_email: "",
  phone: "",
  website_url: "",
  collaboration_interests: ["workshops", "hackathons"],
  budget_range: "",
  timeline: "",
  student_audience: "",
  message: "",
};

const organizationTypes: Array<{ value: CollaborationOrganizationType; label: string }> = [
  { value: "company", label: "Company" },
  { value: "startup", label: "Startup" },
  { value: "sponsor", label: "Sponsor" },
  { value: "mentor", label: "Mentor" },
  { value: "tech_organization", label: "Tech organization" },
  { value: "university", label: "University" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

const interestOptions: Array<{ value: CollaborationInterest; label: string }> = [
  { value: "workshops", label: "Workshops" },
  { value: "hackathons", label: "Hackathons" },
  { value: "sponsorships", label: "Sponsorships" },
  { value: "hiring_talent", label: "Hiring Talent" },
  { value: "product_feedback", label: "Product Feedback" },
  { value: "mentorship", label: "Mentorship" },
  { value: "brand_presence", label: "Brand Presence" },
  { value: "campus_events", label: "Campus Events" },
  { value: "internship_connect", label: "Internship Connect" },
  { value: "startup_collaboration", label: "Startup Collaboration" },
  { value: "community_growth", label: "Community Growth" },
  { value: "student_innovation", label: "Student Innovation" },
];

const partnerHighlights = [
  // {
  //   icon: Target,
  //   title: "Reach builders",
  //   body: "Connect with students who are already learning, shipping, and joining real missions.",
  // },
  // {
  //   icon: Users,
  //   title: "Run programs",
  //   body: "Launch workshops, hackathons, campus events, mentorship tracks, and product feedback loops.",
  // },
  // {
  //   icon: Sparkles,
  //   title: "Create outcomes",
  //   body: "Build hiring pipelines, brand presence, sponsorship value, and student innovation together.",
  // },
];

const optional = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export default function Collaborate() {
  const { user } = useUser();
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<CollaborationRequest | null>(null);

  useEffect(() => {
    if (!user) return;

    setFormData((current) => ({
      ...current,
      contact_name: current.contact_name || user.fullName || user.username || "",
      work_email: current.work_email || user.primaryEmailAddress?.emailAddress || "",
    }));
  }, [user]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const toggleInterest = (interest: CollaborationInterest) => {
    setFormData((current) => {
      const hasInterest = current.collaboration_interests.includes(interest);
      return {
        ...current,
        collaboration_interests: hasInterest
          ? current.collaboration_interests.filter((item) => item !== interest)
          : [...current.collaboration_interests, interest],
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.collaboration_interests.length === 0) {
      toast({
        title: "Select one focus area",
        description: "Choose at least one collaboration type before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CollaborationRequestCreateRequest = {
        organization_name: formData.organization_name.trim(),
        organization_type: formData.organization_type,
        contact_name: formData.contact_name.trim(),
        role_title: optional(formData.role_title),
        work_email: formData.work_email.trim(),
        phone: optional(formData.phone),
        website_url: normalizeUrl(formData.website_url),
        collaboration_interests: formData.collaboration_interests,
        budget_range: optional(formData.budget_range),
        timeline: optional(formData.timeline),
        student_audience: optional(formData.student_audience),
        message: formData.message.trim(),
        source_page: "collaborate",
      };

      const request = await api.post<CollaborationRequest>("/collaboration-requests", payload);
      setSubmittedRequest(request);
      toast({
        title: "Collaboration request sent",
        description: "We received your partner intake and will review it soon.",
      });
    } catch (error) {
      const description = error instanceof ApiError ? error.message : "Could not submit your collaboration request.";
      toast({
        title: "Submission failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navbar dark={false} />

      <main className="pt-24">
        <section className="container mx-auto px-6 pb-16 pt-8 md:pb-24 md:pt-14">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-red-600">
                For companies & collaborators
              </p>
              <h1 className="max-w-2xl text-[2.35rem] font-black leading-tight text-slate-950 sm:text-[3rem] md:text-[3.6rem]">
                Partner with the next generation of student builders.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                Tell us what you want to build with Tech Assassin. We will map
                your goals to workshops, hackathons, sponsorships, hiring,
                mentorship, community events, or product feedback.
              </p>

              <div className="mt-9 grid gap-4">
                {partnerHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_22px_60px_-48px_rgba(15,23,42,0.8)]">
                      <div className="flex gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
                          <p className="mt-1 text-base font-medium leading-7 text-slate-600">{item.body}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_34px_90px_-56px_rgba(15,23,42,0.95)] sm:p-8">
              {submittedRequest ? (
                <div className="flex min-h-[34rem] flex-col items-center justify-center text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </span>
                  <h2 className="mt-6 text-3xl font-black leading-tight text-slate-950">
                    Request received.
                  </h2>
                  <p className="mt-4 max-w-xl text-lg font-medium leading-8 text-slate-600">
                    Your collaboration request for {submittedRequest.organization_name} is now in our partner review queue.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRequest(null);
                      setFormData(initialFormState);
                    }}
                    className="mt-8 inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-base font-black text-slate-950 transition-colors hover:bg-slate-50"
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-8 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-[1.75rem] font-black leading-tight text-slate-950">
                        Collaboration intake
                      </h2>
                      <p className="mt-2 text-base font-medium text-slate-600">
                        Companies, sponsors, mentors, hiring teams, and tech communities.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-sm font-black text-red-600">
                      <Clock3 className="h-4 w-4" />
                      Partner desk
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        label="Organization"
                        name="organization_name"
                        value={formData.organization_name}
                        onChange={(value) => updateField("organization_name", value)}
                        placeholder="Company or community name"
                      />
                      <label className="block">
                        <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                          Type
                        </span>
                        <select
                          value={formData.organization_type}
                          onChange={(event) => updateField("organization_type", event.target.value as CollaborationOrganizationType)}
                          className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-medium text-slate-900 outline-none transition-colors focus:border-red-300"
                        >
                          {organizationTypes.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        label="Contact name"
                        name="contact_name"
                        value={formData.contact_name}
                        onChange={(value) => updateField("contact_name", value)}
                        placeholder="Your full name"
                      />
                      <Field
                        label="Role"
                        name="role_title"
                        value={formData.role_title}
                        onChange={(value) => updateField("role_title", value)}
                        placeholder="Founder, HR, Developer Relations"
                        required={false}
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        label="Work email"
                        name="work_email"
                        type="email"
                        value={formData.work_email}
                        onChange={(value) => updateField("work_email", value)}
                        placeholder="name@company.com"
                      />
                      <Field
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(value) => updateField("phone", value)}
                        placeholder="+91 98765 43210"
                        required={false}
                      />
                    </div>

                    <Field
                      label="Website or profile"
                      name="website_url"
                      value={formData.website_url}
                      onChange={(value) => updateField("website_url", value)}
                      placeholder="https://company.com"
                      required={false}
                    />

                    <fieldset>
                      <legend className="mb-3 block text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                        Collaboration focus
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {interestOptions.map((option) => {
                          const checked = formData.collaboration_interests.includes(option.value);

                          return (
                            <label
                              key={option.value}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                                checked
                                  ? "border-red-200 bg-red-50 text-red-600"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleInterest(option.value)}
                                className="h-4 w-4 accent-red-600"
                              />
                              <span className="text-sm font-black">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    <div className="grid gap-5 sm:grid-cols-3">
                      <Field
                        label="Timeline"
                        name="timeline"
                        value={formData.timeline}
                        onChange={(value) => updateField("timeline", value)}
                        placeholder="This month, Q3"
                        required={false}
                      />
                      <Field
                        label="Budget"
                        name="budget_range"
                        value={formData.budget_range}
                        onChange={(value) => updateField("budget_range", value)}
                        placeholder="Optional"
                        required={false}
                      />
                      <Field
                        label="Audience"
                        name="student_audience"
                        value={formData.student_audience}
                        onChange={(value) => updateField("student_audience", value)}
                        placeholder="50, 200, all"
                        required={false}
                      />
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                        Partnership brief
                      </span>
                      <textarea
                        required
                        rows={7}
                        value={formData.message}
                        onChange={(event) => updateField("message", event.target.value)}
                        placeholder="Tell us your goal, target students, preferred format, and what success looks like."
                        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-base font-medium leading-7 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-red-300"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-7 text-lg font-black text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending
                        </>
                      ) : (
                        <>
                          Send Collaboration Request <Send className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const Field = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
    </span>
    <input
      name={name}
      type={type}
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-red-300"
    />
  </label>
);
