"use client";

import Link from "next/link";
import Icon from "@/components/icons";
import { Button, Card, CardBody, Badge, Select } from "@/components/ui";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { COURSES, type CourseCategory } from "@/lib/mockData";
import { formatHours } from "@/lib/utils";
import { useAuth } from "@/lib/store";

const features = [
  {
    icon: <Icon.MessageSquare size={22} />,
    title: "AI Chat tutor",
    description: "Ask anything, anytime. Get clear, personalized explanations from your AI tutor.",
  },
  {
    icon: <Icon.ListChecks size={22} />,
    title: "Quiz generator",
    description: "Turn any topic into an instant quiz. Practice smarter, retain longer.",
  },
  {
    icon: <Icon.FilePen size={22} />,
    title: "Assignment helper",
    description: "Get unstuck on essays, problem sets, and projects without ever cheating yourself.",
  },
  {
    icon: <Icon.Award size={22} />,
    title: "Verified certificates",
    description: "Earn shareable certificates that prove what you learned, course by course.",
  },
];

const steps = [
  {
    n: "01",
    title: "Sign up free",
    description: "Create your account in under a minute. No credit card needed.",
  },
  {
    n: "02",
    title: "Pick your path",
    description: "Browse courses across web dev, design, data, business, languages, and more.",
  },
  {
    n: "03",
    title: "Learn with AI",
    description: "Watch chapters, take AI-generated quizzes, ask questions — at your own pace.",
  },
];

const testimonials = [
  {
    name: "Priya R.",
    role: "CS Student",
    quote:
      "The AI tutor explained recursion in a way three textbooks couldn't. I aced my finals.",
  },
  {
    name: "Marco D.",
    role: "Career switcher",
    quote:
      "Went from zero to my first React job in five months. The course paths are unreal.",
  },
  {
    name: "Aisha K.",
    role: "Designer",
    quote:
      "I love that I can quiz myself on anything. It makes studying feel like a game.",
  },
];

const stats = [
  { value: 1_200_000, label: "Active learners", suffix: "+", format: "compact" as const },
  { value: 850, label: "Expert-led courses", suffix: "+", format: "plain" as const },
  { value: 60, label: "Countries reached", suffix: "+", format: "plain" as const },
  { value: 94, label: "Completion rate", suffix: "%", format: "plain" as const },
];

const categories: {
  name: CourseCategory;
  tagline: string;
  color: string;
  soft: string;
}[] = [
  { name: "Web Dev",       tagline: "Build modern, lightning-fast apps", color: "#8b5cf6", soft: "rgba(139,92,246,0.12)" },
  { name: "Data Science",  tagline: "Models, charts, and real insight", color: "#06b6d4", soft: "rgba(6,182,212,0.12)" },
  { name: "Design",        tagline: "Craft beautiful experiences",      color: "#ec4899", soft: "rgba(236,72,153,0.12)" },
  { name: "Business",      tagline: "Grow ideas into companies",        color: "#f59e0b", soft: "rgba(245,158,11,0.14)" },
  { name: "Languages",     tagline: "Speak the world's languages",      color: "#10b981", soft: "rgba(16,185,129,0.12)" },
  { name: "Math",          tagline: "Reason from first principles",     color: "#3b82f6", soft: "rgba(59,130,246,0.12)" },
];

const faqs = [
  {
    q: "Do I need to pay to get started?",
    a: "Nope — register free, browse hundreds of courses, and start with our free tier. Upgrade only when you want premium content and verified certificates.",
  },
  {
    q: "How does the AI tutor actually help?",
    a: "Ask any question on any course topic and get clear, contextual answers — code examples, step-by-step math, or plain-English explanations. It's like office hours that never close.",
  },
  {
    q: "Are the certificates recognized?",
    a: "Our certificates are verifiable, shareable on LinkedIn, and come with a unique URL. Many employers and universities accept them as proof of completion.",
  },
  {
    q: "Can I learn at my own pace?",
    a: "Yes. Every course is self-paced. Watch lessons, take AI-generated quizzes, and return whenever you have time. Your progress is saved automatically.",
  },
  {
    q: "Is there a mobile experience?",
    a: "The web app is fully responsive and works great on phones and tablets. A dedicated native app is on the roadmap for later this year.",
  },
  {
    q: "What if I'm stuck on an assignment?",
    a: "Try the Assignment Helper — it walks you through the approach without giving away the answer, so you learn rather than copy.",
  },
];

const COURSE_TYPES: Array<CourseCategory | "All"> = [
  "All",
  "Web Dev",
  "Data Science",
  "Design",
  "Business",
  "Languages",
  "Math",
];

type StatusFilter = "All" | "Free" | "Paid";
const COURSE_STATUSES: StatusFilter[] = ["All", "Free", "Paid"];

export default function HomePage() {
  const { user } = useAuth();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [typeFilter, setTypeFilter] = useState<CourseCategory | "All">("All");

  const filteredFeatured = useMemo(() => {
    return COURSES.filter((c) => {
      if (statusFilter === "Free" && c.price > 0) return false;
      if (statusFilter === "Paid" && c.price === 0) return false;
      if (typeFilter !== "All" && c.category !== typeFilter) return false;
      return true;
    }).slice(0, 6);
  }, [statusFilter, typeFilter]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="fade-in">
            <div className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-semibold">
              <Icon.Sparkles size={14} /> New: AI-powered study suite
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Learn anything,{" "}
              <span className="gradient-text">faster with AI</span>.
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)] max-w-xl">
              EduPortal blends world-class courses with an AI tutor, quiz generator, and assignment helper — so you stop
              memorizing and start understanding.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg">
                    Open dashboard <Icon.ChevronRight size={18} />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button size="lg">
                    Get started free <Icon.ChevronRight size={18} />
                  </Button>
                </Link>
              )}
              <Link href="/courses">
                <Button size="lg" variant="outline">
                  <Icon.Compass size={18} /> Browse courses
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-[var(--muted)]">
              <div className="flex items-center gap-2">
                <Icon.Check size={16} className="text-emerald-500" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon.Check size={16} className="text-emerald-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Decorative hero illustration */}
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-[var(--primary)]/20 via-transparent to-[var(--accent)]/20 blur-3xl rounded-3xl" />
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* Logo / trust strip */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold">
          <span>Trusted by students at</span>
          <span>Stanford</span>
          <span>IIT Bombay</span>
          <span>MIT</span>
          <span>Cambridge</span>
          <span>NUS</span>
          <span>Tsinghua</span>
        </div>
      </section>

      {/* Stats */}
      <StatsSection />

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Why EduPortal</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">An entire study suite, in one place</h2>
          <p className="mt-3 text-[var(--muted)]">
            Courses are the start. The real magic happens when AI helps you actually understand what you&apos;re learning.
          </p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="h-full">
              <CardBody className="space-y-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-400/15 text-[var(--primary)] flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{f.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* AI Tutor Showcase */}
      <AIShowcaseSection />

      {/* Course Categories */}
      <CategoriesSection />

      {/* Featured courses */}
      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="flex flex-col gap-6 mb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Popular this week</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Start with a course that fits you</h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
                  <span className="font-semibold uppercase tracking-wider">Select Status</span>
                  <div className="min-w-[160px]">
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      aria-label="Filter by status"
                    >
                      {COURSE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s === "All" ? "All statuses" : s}
                        </option>
                      ))}
                    </Select>
                  </div>
                </label>
                <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
                  <span className="font-semibold uppercase tracking-wider">Select Type</span>
                  <div className="min-w-[180px]">
                    <Select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as CourseCategory | "All")}
                      aria-label="Filter by type"
                    >
                      {COURSE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t === "All" ? "All types" : t}
                        </option>
                      ))}
                    </Select>
                  </div>
                </label>
              </div>
              <Link href="/courses" className="hidden md:inline-flex self-start sm:self-end">
                <Button variant="outline">
                  See all <Icon.ChevronRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
          {(statusFilter !== "All" || typeFilter !== "All") && (
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--muted)]">Filtering by:</span>
              {statusFilter !== "All" && (
                <button
                  onClick={() => setStatusFilter("All")}
                  className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-semibold hover:brightness-105"
                  aria-label={`Clear status filter ${statusFilter}`}
                >
                  {statusFilter}
                  <Icon.X size={12} />
                </button>
              )}
              {typeFilter !== "All" && (
                <button
                  onClick={() => setTypeFilter("All")}
                  className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-semibold hover:brightness-105"
                  aria-label={`Clear type filter ${typeFilter}`}
                >
                  {typeFilter}
                  <Icon.X size={12} />
                </button>
              )}
              <span className="text-[var(--muted-2)]">·</span>
              <span className="text-[var(--muted)]">
                {filteredFeatured.length} {filteredFeatured.length === 1 ? "course" : "courses"}
              </span>
            </div>
          )}
          {filteredFeatured.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] py-14 text-center">
              <p className="text-sm text-[var(--muted)]">
                No courses match those filters yet.
              </p>
              <button
                onClick={() => {
                  setStatusFilter("All");
                  setTypeFilter("All");
                }}
                className="mt-3 text-sm font-semibold text-[var(--primary)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFeatured.map((c) => (
              <Link href="/courses" key={c.id} className="group block">
                <Card className="overflow-hidden h-full hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <div className="relative h-44 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <Badge variant="primary" className="absolute top-3 left-3 backdrop-blur bg-white/85 dark:bg-black/40">
                      {c.category}
                    </Badge>
                    {c.price === 0 && (
                      <Badge variant="success" className="absolute top-3 right-3">
                        Free
                      </Badge>
                    )}
                  </div>
                  <CardBody className="space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-2 group-hover:text-[var(--primary)] transition">
                        {c.title}
                      </h3>
                      <p className="text-xs text-[var(--muted)] mt-1">{c.instructor}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <Icon.Star size={12} className="text-amber-500" />
                        {c.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon.Clock size={12} /> {formatHours(c.durationMinutes)}
                      </span>
                      <span>{c.level}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base font-bold">{c.price === 0 ? "Free" : `$${c.price}`}</span>
                      <span className="text-xs text-[var(--muted)]">{c.reviews.toLocaleString()} reviews</span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
          )}
          <div className="sm:hidden mt-6 text-center">
            <Link href="/courses">
              <Button variant="outline" className="w-full">
                See all courses <Icon.ChevronRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">How it works</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">From curious to confident, in three steps</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <Card key={s.n} className="h-full">
              <CardBody className="space-y-3">
                <span className="inline-block text-3xl font-extrabold gradient-text">{s.n}</span>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{s.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Loved by learners</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Stories from real students</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <Card key={t.name} className="h-full">
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Icon.Star key={i} size={14} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold inline-flex items-center justify-center text-sm">
                      {t.name[0]}
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-[var(--muted)]">{t.role}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-10 lg:p-16 text-white text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,.25),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Ready to learn smarter?
            </h2>
            <p className="mt-3 text-white/85 max-w-xl mx-auto">
              Join thousands of students using AI to study less, learn more, and actually enjoy it.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90">
                    Go to dashboard <Icon.ChevronRight size={18} />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90">
                    Create free account <Icon.ChevronRight size={18} />
                  </Button>
                </Link>
              )}
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  Talk to us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroIllustration() {
  const float = (s: number, d = 0) =>
    ({ animation: `float-slow ${s}s ease-in-out infinite ${d}s` } as CSSProperties);

  const containerRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<SVGGElement>(null);
  const playRef = useRef<SVGGElement>(null);
  const bookRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const chipRef = useRef<SVGGElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const squareRef = useRef<SVGGElement>(null);
  const triRef = useRef<SVGGElement>(null);

  useEffect(() => {
    // Respect users who prefer reduced motion — skip the parallax effect.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const layers: Array<[React.RefObject<SVGGElement | null>, number]> = [
      [orbRef, 22],
      [playRef, 18],
      [bookRef, 14],
      [ringRef, 20],
      [chipRef, 16],
      [dotRef, 10],
      [squareRef, 12],
      [triRef, 8],
    ];

    let rafId = 0;
    let nx = 0;
    let ny = 0;

    const apply = () => {
      rafId = 0;
      for (const [ref, depth] of layers) {
        const node = ref.current;
        if (!node) continue;
        node.style.transform = `translate(${(nx * depth).toFixed(2)}px, ${(ny * depth).toFixed(2)}px)`;
      }
    };

    const onMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      // Clamp so off-screen mouse positions don't push elements too far.
      nx = Math.max(-1.4, Math.min(1.4, nx));
      ny = Math.max(-1.4, Math.min(1.4, ny));
      if (!rafId) rafId = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      nx = 0;
      ny = 0;
      if (!rafId) rafId = requestAnimationFrame(apply);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const parallax: CSSProperties = {
    transition: "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    transformBox: "fill-box",
  };

  return (
    <div ref={containerRef} className="relative aspect-[4/3] w-full">
      <svg
        viewBox="0 0 600 450"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full drop-shadow-[0_25px_45px_rgba(22,163,74,0.18)]"
        role="img"
        aria-label="Illustration of AI-assisted learning"
      >
        <defs>
          <linearGradient id="hero-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#86efac" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="hero-window" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="hero-brand" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="hero-accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="hero-bar" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <radialGradient id="hero-glow" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <pattern id="hero-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#16a34a" opacity="0.18" />
          </pattern>
          <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Background blob + dot grid */}
        <rect x="0" y="0" width="600" height="450" rx="36" fill="url(#hero-bg)" />
        <rect x="0" y="0" width="600" height="450" rx="36" fill="url(#hero-dots)" />
        <circle cx="100" cy="80" r="80" fill="#22c55e" opacity="0.16" />
        <circle cx="520" cy="380" r="100" fill="#4ade80" opacity="0.16" />

        {/* App window shadow */}
        <rect x="92" y="90" width="416" height="270" rx="22" fill="#0f172a" opacity="0.15" filter="url(#hero-shadow)" />

        {/* App window */}
        <g transform="translate(80 78)">
          <rect x="0" y="0" width="416" height="270" rx="22" fill="url(#hero-window)" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="0" y="0" width="416" height="270" rx="22" fill="url(#hero-glow)" />

          {/* Top bar */}
          <rect x="0" y="0" width="416" height="38" rx="22" fill="#f1f5f9" />
          <rect x="0" y="20" width="416" height="18" fill="#f1f5f9" />
          <circle cx="20" cy="19" r="5" fill="#f87171" />
          <circle cx="38" cy="19" r="5" fill="#fbbf24" />
          <circle cx="56" cy="19" r="5" fill="#34d399" />
          <rect x="140" y="11" width="180" height="16" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="152" cy="19" r="3" fill="#94a3b8" />

          {/* Sidebar */}
          <rect x="0" y="38" width="92" height="232" fill="#fafbff" />
          <rect x="0" y="38" width="3" height="232" fill="url(#hero-brand)" />
          <rect x="14" y="56" width="64" height="10" rx="5" fill="url(#hero-brand)" opacity="0.9" />
          <rect x="14" y="78" width="48" height="6" rx="3" fill="#cbd5e1" />
          <rect x="14" y="92" width="56" height="6" rx="3" fill="#cbd5e1" />
          <rect x="14" y="106" width="44" height="6" rx="3" fill="#cbd5e1" />
          <rect x="14" y="120" width="52" height="6" rx="3" fill="#cbd5e1" />
          {/* Active item */}
          <rect x="10" y="136" width="72" height="22" rx="8" fill="#dcfce7" />
          <circle cx="20" cy="147" r="3" fill="#16a34a" />
          <rect x="28" y="144" width="42" height="6" rx="3" fill="#16a34a" />

          {/* Main content area */}
          <g transform="translate(108 54)">
            {/* Heading */}
            <rect x="0" y="0" width="160" height="12" rx="6" fill="#0f172a" />
            <rect x="0" y="20" width="220" height="6" rx="3" fill="#cbd5e1" />

            {/* AI chat bubble */}
            <g transform="translate(0 40)">
              <circle cx="12" cy="12" r="12" fill="url(#hero-brand)" />
              <path d="M12 6 l1.5 4 L18 12 l-4.5 2 L12 18 l-1.5 -4 L6 12 l4.5 -2 z" fill="#ffffff" />
              <rect x="32" y="2" width="252" height="22" rx="11" fill="#f1f5f9" />
              <rect x="42" y="9" width="180" height="4" rx="2" fill="#94a3b8" />
              <rect x="42" y="16" width="120" height="4" rx="2" fill="#cbd5e1" />
            </g>

            {/* User reply bubble */}
            <g transform="translate(0 76)">
              <rect x="60" y="0" width="224" height="22" rx="11" fill="url(#hero-brand)" />
              <rect x="74" y="7" width="160" height="4" rx="2" fill="#ffffff" opacity="0.85" />
              <rect x="74" y="14" width="100" height="4" rx="2" fill="#ffffff" opacity="0.7" />
            </g>

            {/* Progress card */}
            <g transform="translate(0 112)">
              <rect x="0" y="0" width="284" height="60" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              <rect x="12" y="12" width="78" height="8" rx="4" fill="#0f172a" />
              <rect x="12" y="26" width="120" height="5" rx="2.5" fill="#cbd5e1" />
              {/* Progress bar */}
              <rect x="12" y="42" width="260" height="6" rx="3" fill="#eef2ff" />
              <rect x="12" y="42" width="170" height="6" rx="3" fill="url(#hero-bar)" />
              {/* Percent chip */}
              <rect x="232" y="10" width="40" height="16" rx="8" fill="#dcfce7" />
              <text x="240" y="22" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="700" fill="#16a34a">
                65%
              </text>
            </g>
          </g>
        </g>

        {/* Floating: sparkle orb (top-right) */}
        <g transform="translate(508 96)">
          <g ref={orbRef} style={parallax}>
            <g style={float(5.5, 0.2)}>
              <circle cx="0" cy="0" r="30" fill="#ffffff" />
              <circle cx="0" cy="0" r="30" fill="url(#hero-brand)" opacity="0.12" />
              <path d="M0 -14 L3.5 -3.5 L14 0 L3.5 3.5 L0 14 L-3.5 3.5 L-14 0 L-3.5 -3.5 Z" fill="url(#hero-brand)" />
            </g>
          </g>
        </g>

        {/* Floating: play button (top-left) */}
        <g transform="translate(70 130)">
          <g ref={playRef} style={parallax}>
            <g style={float(6, 0.8)}>
              <circle cx="0" cy="0" r="26" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              <circle cx="0" cy="0" r="26" fill="url(#hero-accent)" opacity="0.15" />
              <path d="M-6 -8 L10 0 L-6 8 Z" fill="url(#hero-accent)" />
            </g>
          </g>
        </g>

        {/* Floating: book (bottom-left) */}
        <g transform="translate(36 296)">
          <g ref={bookRef} style={parallax}>
            <g style={float(5, 0.4)}>
              <rect x="0" y="0" width="92" height="64" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              <rect x="0" y="0" width="6" height="64" rx="3" fill="url(#hero-brand)" />
              <rect x="16" y="14" width="58" height="6" rx="3" fill="#0f172a" />
              <rect x="16" y="26" width="64" height="4" rx="2" fill="#cbd5e1" />
              <rect x="16" y="36" width="50" height="4" rx="2" fill="#cbd5e1" />
              <rect x="16" y="46" width="40" height="4" rx="2" fill="#cbd5e1" />
            </g>
          </g>
        </g>

        {/* Floating: progress ring + score (bottom-right) */}
        <g transform="translate(508 326)">
          <g ref={ringRef} style={parallax}>
            <g style={float(6.5, 1)}>
              <circle cx="0" cy="0" r="34" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              <circle cx="0" cy="0" r="22" fill="none" stroke="#eef2ff" strokeWidth="5" />
              <circle
                cx="0"
                cy="0"
                r="22"
                fill="none"
                stroke="url(#hero-brand)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="104 140"
                transform="rotate(-90)"
              />
              <text x="0" y="4" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="700" fill="#0f172a">
                A+
              </text>
            </g>
          </g>
        </g>

        {/* Floating: notification chip (mid-right) */}
        <g transform="translate(450 218)">
          <g ref={chipRef} style={parallax}>
            <g style={float(5.8, 0.6)}>
              <rect x="0" y="0" width="118" height="40" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              <circle cx="20" cy="20" r="11" fill="#fef3c7" />
              <path d="M20 14 v8 M16 22 h8" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
              <rect x="38" y="11" width="64" height="6" rx="3" fill="#0f172a" />
              <rect x="38" y="23" width="44" height="5" rx="2.5" fill="#cbd5e1" />
              <circle cx="106" cy="10" r="5" fill="#ef4444" />
            </g>
          </g>
        </g>

        {/* Tiny floating accents */}
        <g ref={dotRef} style={parallax}>
          <g style={float(7, 0)}>
            <circle cx="296" cy="42" r="6" fill="#fbbf24" />
          </g>
        </g>
        <g ref={squareRef} style={parallax}>
          <g style={float(8, 1.2)}>
            <rect x="44" y="60" width="14" height="14" rx="4" fill="#22c55e" opacity="0.9" transform="rotate(-12 51 67)" />
          </g>
        </g>
        <g ref={triRef} style={parallax}>
          <g style={float(6.5, 0.5)}>
            <path d="M560 250 l6 -10 l6 10 z" fill="#f472b6" opacity="0.9" />
          </g>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================
   Shared hooks — IntersectionObserver-driven enter, count-up
   ============================================================ */
function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, start: boolean, durationMs = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, durationMs]);
  return value;
}

function formatStat(value: number, format: "compact" | "plain") {
  if (format === "compact") {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (value >= 1_000) return Math.round(value / 1_000) + "K";
  }
  return value.toLocaleString();
}

/* ============================================================
   Stats section — animated count-up + decorative SVG glyphs
   ============================================================ */
function StatsSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
      <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((s, i) => (
          <StatCard key={s.label} stat={s} index={i} start={inView} />
        ))}
      </div>
    </section>
  );
}

function StatCard({
  stat,
  index,
  start,
}: {
  stat: (typeof stats)[number];
  index: number;
  start: boolean;
}) {
  const value = useCountUp(stat.value, start);
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] card-shadow p-5 sm:p-6 slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative z-10">
        <div className="text-3xl sm:text-4xl font-extrabold gradient-text leading-none">
          {formatStat(value, stat.format)}
          <span>{stat.suffix}</span>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">{stat.label}</p>
      </div>
      <StatGlyph index={index} />
    </div>
  );
}

function StatGlyph({ index }: { index: number }) {
  const common = "absolute -right-4 -bottom-4 opacity-15 pointer-events-none";
  switch (index) {
    case 0:
      return (
        <svg className={common} width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="42" cy="42" r="14" fill="#16a34a" />
          <path d="M22 88 c0 -14 12 -22 20 -22 s20 8 20 22 z" fill="#16a34a" />
          <circle cx="82" cy="48" r="11" fill="#4ade80" />
          <path d="M64 96 c0 -10 8 -18 18 -18 s18 8 18 18 z" fill="#4ade80" />
        </svg>
      );
    case 1:
      return (
        <svg className={common} width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
          <rect x="22" y="76" width="78" height="14" rx="3" fill="#22c55e" />
          <rect x="28" y="58" width="66" height="14" rx="3" fill="#16a34a" />
          <rect x="34" y="40" width="54" height="14" rx="3" fill="#4ade80" />
        </svg>
      );
    case 2:
      return (
        <svg className={common} width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="34" fill="none" stroke="#22c55e" strokeWidth="3" />
          <ellipse cx="60" cy="60" rx="34" ry="14" fill="none" stroke="#22c55e" strokeWidth="2.5" />
          <line x1="26" y1="60" x2="94" y2="60" stroke="#22c55e" strokeWidth="2.5" />
          <circle cx="60" cy="60" r="5" fill="#22c55e" />
        </svg>
      );
    default:
      return (
        <svg className={common} width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r="32"
            fill="none"
            stroke="#10b981"
            strokeWidth="6"
            strokeDasharray="180 220"
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
          <path
            d="M46 60 L56 70 L76 50"
            fill="none"
            stroke="#10b981"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/* ============================================================
   AI Tutor showcase — bullets + animated chat SVG
   ============================================================ */
function AIShowcaseSection() {
  const bullets = [
    "Step-by-step explanations tuned to your level",
    "Code, math, essays — all from one tutor",
    "Cites the chapter so you can verify what you learn",
    "Never judges, never tires, never closes for the day",
  ];
  return (
    <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">AI inside every course</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">A tutor that actually helps you think</h2>
          <p className="mt-3 text-[var(--muted)] max-w-md">
            Stuck on a recursion problem at midnight? Confused by a paragraph in your textbook? Ask the
            EduPortal AI tutor — it knows your course and explains things the way you actually need.
          </p>
          <ul className="mt-6 space-y-3">
            {bullets.map((b, i) => (
              <li
                key={b}
                className="flex items-start gap-3 slide-up"
                style={{ animationDelay: `${i * 110 + 100}ms` }}
              >
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 12 l5 5 L19 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="check-draw"
                      style={{ animationDelay: `${i * 110 + 250}ms` }}
                    />
                  </svg>
                </span>
                <span className="text-sm text-[var(--foreground)]">{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link href="/ai/chat">
              <Button>
                Try the AI tutor <Icon.Sparkles size={16} />
              </Button>
            </Link>
            <Link href="/ai/quiz">
              <Button variant="outline">Generate a quiz</Button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <AIChatIllustration />
        </div>
      </div>
    </section>
  );
}

function AIChatIllustration() {
  return (
    <div className="relative aspect-[5/4] w-full">
      <div className="absolute -inset-6 bg-gradient-to-tr from-[var(--primary)]/15 via-transparent to-[var(--accent)]/20 blur-3xl rounded-3xl" />
      <svg
        viewBox="0 0 500 400"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full drop-shadow-[0_20px_45px_rgba(15,32,80,0.18)]"
        role="img"
        aria-label="Animated AI chat illustration"
      >
        <defs>
          <linearGradient id="ai-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dcfce7" />
            <stop offset="100%" stopColor="#d1fae5" />
          </linearGradient>
          <linearGradient id="ai-brand" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="ai-user" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="500" height="400" rx="28" fill="url(#ai-bg)" />

        <g transform="translate(40 40)">
          <rect x="0" y="0" width="420" height="320" rx="22" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="0" y="0" width="420" height="36" rx="22" fill="#f8fafc" />
          <rect x="0" y="18" width="420" height="18" fill="#f8fafc" />
          <circle cx="20" cy="18" r="5" fill="#f87171" />
          <circle cx="38" cy="18" r="5" fill="#fbbf24" />
          <circle cx="56" cy="18" r="5" fill="#34d399" />
          <rect x="148" y="11" width="124" height="14" rx="7" fill="#ffffff" stroke="#e2e8f0" />
          <text x="210" y="22" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="9" fill="#94a3b8">
            eduportal.app/tutor
          </text>

          {/* Chat messages */}
          <g transform="translate(20 56)">
            <g className="chat-pop" style={{ animationDelay: "100ms" }}>
              <circle cx="14" cy="14" r="14" fill="url(#ai-brand)" />
              <path d="M14 8 l2 4 L20 14 l-4 2 L14 20 l-2 -4 L8 14 l4 -2 z" fill="#ffffff" />
              <rect x="38" y="2" width="270" height="36" rx="14" fill="#f1f5f9" />
              <rect x="50" y="11" width="180" height="5" rx="2.5" fill="#94a3b8" />
              <rect x="50" y="22" width="220" height="5" rx="2.5" fill="#cbd5e1" />
            </g>

            <g className="chat-pop" style={{ animationDelay: "560ms" }} transform="translate(0 56)">
              <rect x="70" y="0" width="310" height="36" rx="14" fill="url(#ai-user)" />
              <rect x="84" y="9" width="200" height="5" rx="2.5" fill="#ffffff" opacity="0.9" />
              <rect x="84" y="20" width="140" height="5" rx="2.5" fill="#ffffff" opacity="0.7" />
            </g>

            <g className="chat-pop" style={{ animationDelay: "1080ms" }} transform="translate(0 112)">
              <circle cx="14" cy="14" r="14" fill="url(#ai-brand)" />
              <path d="M14 8 l2 4 L20 14 l-4 2 L14 20 l-2 -4 L8 14 l4 -2 z" fill="#ffffff" />
              <rect x="38" y="2" width="290" height="60" rx="14" fill="#f1f5f9" />
              <rect x="50" y="11" width="240" height="5" rx="2.5" fill="#94a3b8" />
              <rect x="50" y="22" width="180" height="5" rx="2.5" fill="#cbd5e1" />
              <rect x="50" y="32" width="220" height="22" rx="6" fill="#0f172a" />
              <rect x="58" y="40" width="60" height="3" rx="1.5" fill="#4ade80" />
              <rect x="58" y="46" width="120" height="3" rx="1.5" fill="#fbbf24" />
            </g>

            <g transform="translate(0 196)">
              <rect x="38" y="2" width="80" height="22" rx="11" fill="#f1f5f9" />
              <circle cx="56" cy="13" r="3" fill="#94a3b8" className="typing-dot" style={{ animationDelay: "0ms" }} />
              <circle cx="68" cy="13" r="3" fill="#94a3b8" className="typing-dot" style={{ animationDelay: "150ms" }} />
              <circle cx="80" cy="13" r="3" fill="#94a3b8" className="typing-dot" style={{ animationDelay: "300ms" }} />
            </g>
          </g>

          <g transform="translate(20 268)">
            <rect x="0" y="0" width="380" height="36" rx="18" fill="#f8fafc" stroke="#e2e8f0" />
            <rect x="14" y="14" width="180" height="6" rx="3" fill="#cbd5e1" />
            <circle cx="362" cy="18" r="12" fill="url(#ai-brand)" />
            <path d="M357 13 L368 18 L357 23 L360 18 z" fill="#ffffff" />
          </g>
        </g>

        <g style={{ animation: "float-slow 6s ease-in-out infinite" }}>
          <path d="M460 80 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z" fill="url(#ai-brand)" opacity="0.85" />
        </g>
        <g style={{ animation: "float-slow 7s ease-in-out infinite 0.5s" }}>
          <circle cx="34" cy="340" r="6" fill="#fbbf24" />
        </g>
        <g style={{ animation: "float-slow 5.5s ease-in-out infinite 1s" }}>
          <rect x="40" y="60" width="14" height="14" rx="4" fill="#22c55e" opacity="0.85" transform="rotate(-12 47 67)" />
        </g>
      </svg>
    </div>
  );
}

/* ============================================================
   Course Categories — 6 cards, each with a unique inline SVG
   ============================================================ */
function CategoriesSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
      <div className="flex flex-col gap-4 mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Explore by topic</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Pick a path that excites you</h2>
        </div>
        <p className="text-sm text-[var(--muted)] max-w-md">
          Six curated tracks, each with their own AI-personalised journey. Switch between them anytime.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((c, i) => (
          <Link href="/courses" key={c.name} className="group block focus:outline-none">
            <div
              className="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] card-shadow p-5 transition-all hover:-translate-y-1 hover:shadow-xl slide-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div
                className="absolute inset-x-0 -top-px h-1 opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${c.color}, transparent)` }}
                aria-hidden="true"
              />
              <div
                className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: c.soft }}
                aria-hidden="true"
              />
              <div className="relative flex items-start gap-4">
                <CategoryGlyph name={c.name} color={c.color} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg">{c.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{c.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] group-hover:gap-2 transition-all">
                    Explore <Icon.ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CategoryGlyph({ name, color }: { name: CourseCategory; color: string }) {
  const wrap =
    "h-14 w-14 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-3 group-hover:scale-105";
  const bg = { backgroundColor: `${color}1A` };
  switch (name) {
    case "Web Dev":
      return (
        <div className={wrap} style={bg}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="3" y="6" width="26" height="20" rx="3" stroke={color} strokeWidth="2" />
            <path d="M3 11 L29 11" stroke={color} strokeWidth="2" />
            <circle cx="6.5" cy="8.5" r="0.9" fill={color} />
            <circle cx="9" cy="8.5" r="0.9" fill={color} />
            <path d="M11 17 L8 20 L11 23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 17 L24 20 L21 23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 16 L14 24" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "Data Science":
      return (
        <div className={wrap} style={bg}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M5 26 L27 26" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <rect x="7" y="18" width="4" height="8" rx="1" fill={color} opacity="0.4" />
            <rect x="14" y="13" width="4" height="13" rx="1" fill={color} opacity="0.6" />
            <rect x="21" y="9" width="4" height="17" rx="1" fill={color} opacity="0.85" />
            <path d="M6 16 L13 11 L20 14 L27 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="27" cy="6" r="2" fill={color} />
          </svg>
        </div>
      );
    case "Design":
      return (
        <div className={wrap} style={bg}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M16 4 a12 12 0 0 0 0 24 c3 0 2 -3 4 -3 c3 0 6 0 6 -4 c0 -9 -6 -17 -10 -17 z"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="12" r="1.8" fill={color} />
            <circle cx="15" cy="8" r="1.8" fill={color} />
            <circle cx="21" cy="11" r="1.8" fill={color} />
            <circle cx="23" cy="17" r="1.8" fill={color} />
          </svg>
        </div>
      );
    case "Business":
      return (
        <div className={wrap} style={bg}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="5" y="10" width="22" height="16" rx="3" stroke={color} strokeWidth="2" />
            <path d="M12 10 V8 a2 2 0 0 1 2 -2 h4 a2 2 0 0 1 2 2 V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <path d="M9 17 L13 14 L17 16 L22 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M19 12 L22 12 L22 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      );
    case "Languages":
      return (
        <div className={wrap} style={bg}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M4 8 a3 3 0 0 1 3 -3 h11 a3 3 0 0 1 3 3 v6 a3 3 0 0 1 -3 3 h-5 l-5 4 v-4 h-1 a3 3 0 0 1 -3 -3 z"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M14 14 a3 3 0 0 0 3 3 h7 l4 3 v-3 a3 3 0 0 0 -3 -3 h-1"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
            />
            <text x="11" y="13" fontFamily="system-ui, sans-serif" fontSize="6.5" fontWeight="700" fill={color}>
              A
            </text>
            <text x="20" y="23" fontFamily="system-ui, sans-serif" fontSize="6.5" fontWeight="700" fill={color}>
              文
            </text>
          </svg>
        </div>
      );
    case "Math":
      return (
        <div className={wrap} style={bg}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="11" cy="10" r="5" stroke={color} strokeWidth="2" />
            <rect x="17" y="17" width="10" height="10" rx="1.5" stroke={color} strokeWidth="2" />
            <path d="M5 22 L9 18 L13 22 L9 26 Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill="none" />
            <path d="M19 8 L27 8 M23 4 L23 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );
  }
}

/* ============================================================
   FAQ accordion with animated expand + chevron rotation
   ============================================================ */
function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="relative text-center">
          <svg
            aria-hidden="true"
            width="64"
            height="64"
            viewBox="0 0 64 64"
            className="mx-auto mb-4"
            style={{ animation: "float-slow 5s ease-in-out infinite" }}
          >
            <defs>
              <linearGradient id="faq-spark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <path
              d="M32 8 l4 14 l14 4 l-14 4 l-4 14 l-4 -14 l-14 -4 l14 -4 z"
              fill="url(#faq-spark)"
              opacity="0.9"
            />
            <circle cx="14" cy="14" r="3" fill="var(--accent)" opacity="0.8" />
            <circle cx="52" cy="50" r="2.5" fill="var(--primary)" opacity="0.8" />
          </svg>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Frequently asked</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Answers before you ask</h2>
          <p className="mt-3 text-[var(--muted)] max-w-xl mx-auto">
            Curious how EduPortal works? These are the questions students ask us most.
          </p>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const open = openIdx === i;
            return (
              <div
                key={f.q}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between text-left px-5 py-4 gap-4 hover:bg-[var(--surface-2)]/60 transition-colors"
                >
                  <span className="font-semibold text-sm sm:text-base">{f.q}</span>
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)] transition-transform"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <Icon.ChevronDown size={16} />
                  </span>
                </button>
                {open && (
                  <div className="accordion-down px-5 pb-5 text-sm text-[var(--muted)] leading-relaxed">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
