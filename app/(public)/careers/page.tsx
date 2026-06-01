import Link from "next/link";
import Icon from "@/components/icons";
import { Badge, Button, Card, CardBody } from "@/components/ui";

export const metadata = {
  title: "Careers — EduPortal",
  description:
    "Join the team building the world's most useful learning companion. Open roles, culture, and what life at EduPortal looks like.",
};

const perks = [
  {
    icon: <Icon.Globe size={22} />,
    title: "Remote-first",
    description: "Work from anywhere. We sync across timezones with overlap windows, not crunch.",
  },
  {
    icon: <Icon.Heart size={22} />,
    title: "Care, by default",
    description: "Generous health coverage for you and your family, plus monthly wellness stipend.",
  },
  {
    icon: <Icon.Sparkles size={22} />,
    title: "Learning budget",
    description: "$1,500/year for courses, books, and conferences — we eat our own cooking.",
  },
  {
    icon: <Icon.Calendar size={22} />,
    title: "Real time off",
    description: "Unlimited PTO with a 4-week minimum, plus a fully paid week between holidays.",
  },
  {
    icon: <Icon.TrendingUp size={22} />,
    title: "Meaningful equity",
    description: "Every full-time hire gets stock options with a 10-year exercise window.",
  },
  {
    icon: <Icon.Users size={22} />,
    title: "Twice-yearly offsites",
    description: "We come together for a week of building, hiking, and a bit too much coffee.",
  },
];

const values = [
  {
    title: "Default to clarity",
    description:
      "Write things down. Explain the why. If a teammate has to ask twice, we revise rather than repeat.",
  },
  {
    title: "Bias to taste",
    description:
      "Quality is non-negotiable, but speed is too. We prefer iterating in public to perfecting in private.",
  },
  {
    title: "Stay close to learners",
    description:
      "Every PM, engineer, and designer talks to students every month. The product follows.",
  },
];

const roles = [
  {
    id: "senior-fullstack",
    title: "Senior Full-Stack Engineer",
    team: "Engineering",
    location: "Remote (UTC −5 to +5)",
    type: "Full-time",
  },
  {
    id: "ml-researcher",
    title: "AI / ML Researcher",
    team: "AI",
    location: "Remote",
    type: "Full-time",
  },
  {
    id: "product-designer",
    title: "Senior Product Designer",
    team: "Design",
    location: "Remote (Europe)",
    type: "Full-time",
  },
  {
    id: "curriculum-lead",
    title: "Curriculum Lead, Data Science",
    team: "Curriculum",
    location: "Bengaluru or Remote",
    type: "Full-time",
  },
  {
    id: "growth-marketer",
    title: "Growth Marketing Manager",
    team: "Growth",
    location: "Remote",
    type: "Full-time",
  },
  {
    id: "support-specialist",
    title: "Student Support Specialist",
    team: "Operations",
    location: "Remote (Asia)",
    type: "Full-time",
  },
  {
    id: "video-producer",
    title: "Video Producer (Contract)",
    team: "Curriculum",
    location: "Remote",
    type: "Contract",
  },
];

const teamColors: Record<string, string> = {
  Engineering: "primary",
  AI: "info",
  Design: "warning",
  Curriculum: "success",
  Growth: "danger",
  Operations: "default",
};

export default function CareersPage() {
  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-20">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Careers</p>
          <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Build the future of <span className="gradient-text">how people learn</span>.
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)]">
            We&apos;re a small, focused team on a mission: give every learner an AI-powered tutor that meets them
            where they are. If that sounds like work worth doing, come build with us.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link href="#open-roles">
              <Button size="lg">
                See open roles <Icon.ChevronRight size={18} />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline">
                <Icon.Sparkles size={18} /> Meet the team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Why EduPortal</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Benefits that work in real life</h2>
            <p className="mt-3 text-[var(--muted)]">
              We don&apos;t pad the careers page. Here&apos;s what every full-time teammate actually gets.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {perks.map((p) => (
              <Card key={p.title} className="h-full">
                <CardBody className="space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-400/15 text-[var(--primary)] flex items-center justify-center">
                    {p.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{p.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{p.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 grid lg:grid-cols-5 gap-10 items-start">
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">How we work</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">A few things we&apos;re serious about</h2>
          <p className="mt-4 text-[var(--muted)] leading-relaxed">
            These aren&apos;t posters on a wall. They&apos;re the lens we use to make hard calls — what to ship, what
            to delete, and who to hire next.
          </p>
        </div>
        <div className="lg:col-span-3 space-y-4">
          {values.map((v, i) => (
            <Card key={v.title}>
              <CardBody className="flex gap-4">
                <span className="shrink-0 h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] inline-flex items-center justify-center font-bold text-sm">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">{v.description}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section id="open-roles" className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Open roles</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold">{roles.length} ways to join</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">
              Don&apos;t see your role?{" "}
              <Link href="/contact" className="text-[var(--primary)] hover:underline font-medium">
                Tell us anyway
              </Link>
              .
            </p>
          </div>
          <ul className="space-y-3">
            {roles.map((r) => (
              <li key={r.id}>
                <Card className="hover:border-[var(--primary)]/30 transition">
                  <CardBody className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base">{r.title}</h3>
                        <Badge variant={(teamColors[r.team] as "primary") ?? "default"}>{r.team}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon.Globe size={12} /> {r.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Icon.Clock size={12} /> {r.type}
                        </span>
                      </div>
                    </div>
                    <Link href={`mailto:careers@eduportal.app?subject=Application: ${encodeURIComponent(r.title)}`}>
                      <Button variant="outline">
                        Apply <Icon.ChevronRight size={16} />
                      </Button>
                    </Link>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-10 lg:p-14 text-white text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,.25),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Don&apos;t see a fit?</h2>
            <p className="mt-3 text-white/85 max-w-xl mx-auto">
              We always want to meet people who care deeply about education. Send us a note — even if there&apos;s no
              open role.
            </p>
            <div className="mt-7">
              <a href="mailto:careers@eduportal.app?subject=Open application">
                <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90">
                  <Icon.Mail size={18} /> careers@eduportal.app
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
