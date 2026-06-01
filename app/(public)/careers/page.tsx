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
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute -top-32 right-0 w-[600px] h-[500px] rounded-full bg-gradient-to-bl from-[var(--primary)]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="reveal-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-5">
              <Icon.Users size={12} /> Careers
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-[3.3rem] font-bold tracking-tight leading-[1.1] text-balance">
              Build the future of <span className="gradient-text">how people learn</span>.
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)] leading-relaxed max-w-lg">
              We&apos;re a small, focused team on a mission: give every learner an AI-powered tutor that meets them where they are. If that sounds like work worth doing, come build with us.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#open-roles">
                <Button size="lg">
                  See open roles <Icon.ChevronRight size={18} />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  <Icon.Users size={16} /> Meet the team
                </Button>
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-4">
              {[
                { value: "84", label: "Team members" },
                { value: "17", label: "Countries" },
                { value: "100%", label: "Remote-first" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-bold gradient-text">{s.value}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: team photo */}
          <div className="hidden lg:block relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&h=500&fit=crop&q=85"
                alt="EduPortal team working together"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
            {/* Floating: remote-first badge */}
            <div className="absolute -bottom-4 -left-5 bg-[var(--surface)] rounded-2xl px-4 py-3 border border-[var(--border)] shadow-xl flex items-center gap-3 pop-in">
              <div className="h-9 w-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <Icon.Globe size={16} />
              </div>
              <div>
                <p className="text-sm font-bold">Remote-first</p>
                <p className="text-[10px] text-[var(--muted)]">Work from anywhere</p>
              </div>
            </div>
            {/* Floating: roles badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl px-4 py-3 shadow-lg shadow-green-500/25 pop-in" style={{ animationDelay: "0.2s" }}>
              <p className="text-xl font-extrabold">{roles.length}</p>
              <p className="text-[10px] font-semibold opacity-85">Open roles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Culture photo strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-4 gap-3">
          {[
            { src: "photo-1531482615713-2afd69097998", alt: "Team workshop" },
            { src: "photo-1522202176988-66273c2fd55f", alt: "Collaboration session" },
            { src: "photo-1559136555-9303baea8ebd", alt: "Remote work setup" },
            { src: "photo-1552664730-d307ca884978", alt: "Team offsite" },
          ].map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-2xl group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://images.unsplash.com/${img.src}?w=300&h=300&fit=crop&q=80`}
                alt={img.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
              <span className="h-px w-6 bg-[var(--primary)] inline-block" /> Why EduPortal
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Benefits that work in real life</h2>
            <p className="mt-3 text-[var(--muted)]">
              We don&apos;t pad the careers page. Here&apos;s what every full-time teammate actually gets.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {perks.map((p, i) => {
              const colors = [
                "from-sky-500/15 to-blue-400/10 text-sky-600 dark:text-sky-400",
                "from-rose-500/15 to-pink-400/10 text-rose-600 dark:text-rose-400",
                "from-violet-500/15 to-purple-400/10 text-violet-600 dark:text-violet-400",
                "from-amber-500/15 to-orange-400/10 text-amber-600 dark:text-amber-400",
                "from-emerald-500/15 to-teal-400/10 text-emerald-600 dark:text-emerald-400",
                "from-green-500/15 to-emerald-400/10 text-[var(--primary)]",
              ];
              return (
                <Card key={p.title} className="h-full group hover-lift">
                  <CardBody className="space-y-4">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center border border-[var(--border)] group-hover:scale-105 transition-transform`}>
                      {p.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{p.title}</h3>
                      <p className="text-sm text-[var(--muted)] leading-relaxed mt-1.5">{p.description}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
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
