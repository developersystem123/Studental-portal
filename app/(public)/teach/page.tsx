"use client";

import * as React from "react";
import Link from "next/link";
import Icon from "@/components/icons";
import { Badge, Button, Card, CardBody, Input, Label, Select, Textarea, useToast } from "@/components/ui";

const benefits = [
  {
    icon: <Icon.TrendingUp size={22} />,
    title: "Earn up to 70%",
    description: "Industry-leading revenue share. Keep more of what you make on every enrollment.",
  },
  {
    icon: <Icon.Users size={22} />,
    title: "Reach 48,000+ learners",
    description: "Tap into an engaged global audience actively looking for what you teach.",
  },
  {
    icon: <Icon.Sparkles size={22} />,
    title: "AI-assisted authoring",
    description: "Auto-generate quizzes, transcripts, and study guides. Spend more time teaching, less editing.",
  },
  {
    icon: <Icon.Award size={22} />,
    title: "Verifiable credentials",
    description: "Your students earn certificates that carry your name and link back to your profile.",
  },
  {
    icon: <Icon.PieChart size={22} />,
    title: "Real-time analytics",
    description: "See where learners thrive, where they drop off, and what to improve — for every chapter.",
  },
  {
    icon: <Icon.Heart size={22} />,
    title: "Dedicated success team",
    description: "Onboarding coach, launch reviews, and a private community of fellow instructors.",
  },
];

const steps = [
  {
    n: "01",
    title: "Apply",
    description: "Share your background, topic, and a short outline. Approvals usually take 3–5 days.",
  },
  {
    n: "02",
    title: "Build with us",
    description: "Use our authoring studio, recording guides, and editor support to ship a polished course.",
  },
  {
    n: "03",
    title: "Launch & grow",
    description: "We co-promote your launch, then keep the funnel flowing — newsletters, recommendations, and SEO.",
  },
];

const earningsTiers = [
  { label: "100 students/mo", price: "$9.99 course", earnings: "$700/mo" },
  { label: "500 students/mo", price: "$9.99 course", earnings: "$3,500/mo" },
  { label: "1,000 students/mo", price: "$19.99 course", earnings: "$14,000/mo" },
];

const faqs = [
  {
    q: "What kinds of courses can I create?",
    a: "Anything we don't already cover deeply: programming, design, business, data, languages, creative skills, soft skills. If you can teach it well, there's likely an audience for it.",
  },
  {
    q: "What equipment do I need?",
    a: "A decent USB mic, a quiet room, and your laptop. We provide a recording guide, lighting suggestions, and slide templates. Editing is included in our authoring studio.",
  },
  {
    q: "How long does a course take to build?",
    a: "Most instructors ship their first 3–5 hour course in 6–10 weeks. We pair you with an editor to keep things moving.",
  },
  {
    q: "When and how do I get paid?",
    a: "Monthly payouts on the 5th, via Stripe, PayPal, or wire — to 180+ countries. You can track earnings in real time from your instructor dashboard.",
  },
];

function TeachHeroIllustration() {
  return (
    <svg
      viewBox="0 0 560 380"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="th-screen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#dcfce7" />
        </linearGradient>
        <linearGradient id="th-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id="th-bar" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>
        <linearGradient id="th-avatar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <filter id="th-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.22" />
        </filter>
        <filter id="th-card-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* ── Background blobs ── */}
      <circle cx="460" cy="60" r="90" fill="white" opacity="0.06" />
      <circle cx="80" cy="310" r="70" fill="white" opacity="0.05" />

      {/* ── Laptop body ── */}
      <rect x="120" y="60" width="310" height="210" rx="14" fill="url(#th-screen)" filter="url(#th-shadow)" />
      {/* Laptop titlebar */}
      <rect x="120" y="60" width="310" height="32" rx="14" fill="#e8f5ee" />
      <rect x="120" y="76" width="310" height="16" fill="#e8f5ee" />
      {/* Traffic lights */}
      <circle cx="143" cy="76" r="5.5" fill="#fca5a5" />
      <circle cx="160" cy="76" r="5.5" fill="#fde68a" />
      <circle cx="177" cy="76" r="5.5" fill="#86efac" />
      {/* URL bar */}
      <rect x="200" y="68" width="170" height="16" rx="8" fill="white" stroke="#bbf7d0" strokeWidth="1" />
      <rect x="210" y="73" width="80" height="6" rx="3" fill="#d1fae5" />
      {/* Laptop base / hinge */}
      <rect x="100" y="268" width="350" height="14" rx="7" fill="#c1d8cb" />
      <rect x="175" y="269" width="200" height="8" rx="4" fill="#a8c5b2" />

      {/* ── Course builder UI inside laptop ── */}
      {/* Left panel — chapter list */}
      <rect x="127" y="96" width="90" height="175" fill="#f0fdf4" />
      <rect x="133" y="104" width="76" height="22" rx="6" fill="url(#th-green)" />
      <text x="171" y="119" textAnchor="middle" fontFamily="system-ui" fontSize="8" fontWeight="700" fill="white">My Course</text>
      {[0,1,2,3,4,5].map((i) => (
        <g key={i}>
          <rect x="133" y={133 + i * 22} width="76" height="16" rx="4" fill={i === 1 ? "#dcfce7" : "transparent"} />
          <rect x="137" y={137 + i * 22} width={i === 1 ? 28 : 20 + (i % 3) * 8} height="5" rx="2.5" fill={i === 1 ? "#16a34a" : "#a7c5b3"} />
          <circle cx="133" cy={145 + i * 22} r="3" fill={i === 0 || i === 1 ? "#22c55e" : "#d1fae5"} />
        </g>
      ))}

      {/* Main content area — video editor */}
      <rect x="220" y="96" width="204" height="110" rx="0" fill="#071a0f" />
      {/* Video placeholder — recording screen */}
      <rect x="230" y="105" width="184" height="88" rx="6" fill="#0d2818" />
      {/* Instructor avatar in video */}
      <circle cx="322" cy="131" r="22" fill="#1a3d25" />
      <circle cx="322" cy="124" r="11" fill="#22c55e" opacity="0.9" />
      <path d="M306 149a16 16 0 0 1 32 0" fill="#22c55e" opacity="0.9" />
      {/* Mic badge */}
      <rect x="309" y="155" width="26" height="12" rx="6" fill="url(#th-green)" />
      <text x="322" y="164" textAnchor="middle" fontFamily="system-ui" fontSize="6" fontWeight="700" fill="white">● LIVE</text>
      {/* Camera icon top-right */}
      <rect x="392" y="108" width="20" height="14" rx="3" fill="#16a34a" opacity="0.8" />
      <polygon points="412,113 418,110 418,119 412,116" fill="#16a34a" opacity="0.8" />
      {/* Recording time */}
      <text x="236" y="115" fontFamily="system-ui,monospace" fontSize="7" fill="#ef4444" fontWeight="700">● REC  02:14:38</text>
      {/* Timeline bar */}
      <rect x="230" y="186" width="184" height="6" rx="3" fill="#1a3d25" />
      <rect x="230" y="186" width="110" height="6" rx="3" fill="url(#th-green)" />
      <circle cx="340" cy="189" r="5" fill="white" stroke="#22c55e" strokeWidth="1.5" />

      {/* Progress & stats panel */}
      <rect x="220" y="210" width="204" height="58" rx="0" fill="white" />
      <rect x="226" y="218" width="60" height="8" rx="4" fill="#d1fae5" />
      <rect x="226" y="230" width="90" height="5" rx="2.5" fill="#bbf7d0" />
      <rect x="226" y="230" width="62" height="5" rx="2.5" fill="url(#th-green)" />
      {/* Mini bar chart */}
      {[18,30,22,38,28,42,35].map((h, i) => (
        <rect key={i} x={294 + i * 16} y={262 - h} width="9" height={h} rx="2.5" fill={i === 5 ? "url(#th-green)" : "#bbf7d0"} />
      ))}
      <text x="226" y="264" fontFamily="system-ui" fontSize="7" fill="#6b7280">Enrolled students</text>
      <text x="380" y="264" textAnchor="end" fontFamily="system-ui" fontSize="7" fontWeight="700" fill="#16a34a">+24%</text>

      {/* ── Floating card 1: New enrollment (top-right) ── */}
      <g filter="url(#th-card-shadow)" style={{ animation: "float-slow 5.5s ease-in-out infinite" }}>
        <rect x="392" y="40" width="148" height="62" rx="14" fill="white" />
        <circle cx="416" cy="71" r="14" fill="#dcfce7" />
        <text x="416" y="75" textAnchor="middle" fontSize="14">🎉</text>
        <text x="436" y="57" fontFamily="system-ui" fontSize="8.5" fontWeight="700" fill="#0f172a">New enrolment!</text>
        <text x="436" y="69" fontFamily="system-ui" fontSize="7.5" fill="#16a34a" fontWeight="600">Python Mastery</text>
        <text x="436" y="81" fontFamily="system-ui" fontSize="7" fill="#94a3b8">Student #1,248</text>
        <rect x="436" y="86" width="72" height="5" rx="2.5" fill="#dcfce7" />
        <rect x="436" y="86" width="48" height="5" rx="2.5" fill="url(#th-green)" />
      </g>

      {/* ── Floating card 2: Rating (left) ── */}
      <g filter="url(#th-card-shadow)" style={{ animation: "float-slow 6s ease-in-out infinite 0.8s" }}>
        <rect x="12" y="100" width="108" height="66" rx="14" fill="white" />
        <text x="66" y="128" textAnchor="middle" fontSize="20">⭐</text>
        <text x="66" y="148" textAnchor="middle" fontFamily="system-ui" fontSize="18" fontWeight="800" fill="#0f172a">4.9</text>
        <text x="66" y="160" textAnchor="middle" fontFamily="system-ui" fontSize="7" fill="#94a3b8">Course rating</text>
      </g>

      {/* ── Floating card 3: Students (bottom-left) ── */}
      <g filter="url(#th-card-shadow)" style={{ animation: "float-slow 7s ease-in-out infinite 0.4s" }}>
        <rect x="12" y="200" width="112" height="68" rx="14" fill="white" />
        <text x="68" y="224" textAnchor="middle" fontFamily="system-ui" fontSize="9" fontWeight="700" fill="#0f172a">Active students</text>
        <text x="68" y="247" textAnchor="middle" fontFamily="system-ui" fontSize="22" fontWeight="800" fill="#16a34a">1,248</text>
        <text x="68" y="262" textAnchor="middle" fontFamily="system-ui" fontSize="7" fill="#22c55e" fontWeight="600">↑ 18 this week</text>
      </g>

      {/* ── Floating card 4: AI badge (top-left area) ── */}
      <g filter="url(#th-card-shadow)" style={{ animation: "float-slow 4.5s ease-in-out infinite 1.2s" }}>
        <rect x="390" y="180" width="140" height="54" rx="14" fill="white" />
        <circle cx="412" cy="207" r="11" fill="url(#th-green)" />
        <text x="412" y="211" textAnchor="middle" fontFamily="system-ui" fontSize="8" fill="white" fontWeight="700">AI</text>
        <text x="430" y="200" fontFamily="system-ui" fontSize="8.5" fontWeight="700" fill="#0f172a">Quiz generated</text>
        <text x="430" y="211" fontFamily="system-ui" fontSize="7.5" fill="#16a34a">10 MCQs · Python</text>
        <text x="430" y="223" fontFamily="system-ui" fontSize="7" fill="#94a3b8">Ready to publish</text>
      </g>

      {/* Accent dots */}
      <circle cx="500" cy="290" r="5.5" fill="#fbbf24" opacity="0.8" style={{ animation: "float-slow 8s ease-in-out infinite" }} />
      <circle cx="30" cy="60" r="4" fill="white" opacity="0.35" style={{ animation: "float-slow 9s ease-in-out infinite 2s" }} />
      <rect x="495" y="140" width="13" height="13" rx="3" fill="white" opacity="0.25" transform="rotate(-18 501 146)" style={{ animation: "float-slow 7s ease-in-out infinite 1s" }} />
    </svg>
  );
}

export default function TeachPage() {
  const toast = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    expertise: "Programming",
    experience: "1-3 years",
    pitch: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof form, string>>>({});

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email.";
    if (form.pitch.trim().length < 30) next.pitch = "Pitch should be at least 30 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          reason: "Instructor application",
          message: `Expertise: ${form.expertise}\nExperience: ${form.experience}\n\n${form.pitch}`,
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        toast.push({ title: "Couldn't send application", description: data.error ?? "Please try again.", tone: "danger" });
        return;
      }
      setForm({ name: "", email: "", expertise: "Programming", experience: "1-3 years", pitch: "" });
      toast.push({
        title: "Application received",
        description: "We'll review it and get back within 3-5 business days.",
        tone: "success",
      });
    } catch {
      toast.push({ title: "Network error", description: "Please check your connection and try again.", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden">
      <section className="relative">
        {/* Background */}
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute -top-32 right-0 w-[600px] h-[500px] rounded-full bg-gradient-to-bl from-[var(--primary)]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="reveal-up">
            <Badge variant="primary" className="mb-5">
              <Icon.Sparkles size={12} /> Now accepting instructors
            </Badge>
            <h1 className="text-4xl sm:text-5xl xl:text-[3.3rem] font-bold tracking-tight leading-[1.1] text-balance">
              Turn your expertise into a <span className="gradient-text">thriving course</span>.
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)] leading-relaxed max-w-lg">
              Whether you&apos;ve taught for years or want to share what you know for the first time, EduPortal gives
              you the tools, audience, and AI assist to do it well.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="#apply">
                <Button size="lg">
                  Apply to teach <Icon.ChevronRight size={18} />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline">
                  How it works
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-1.5"><Icon.Check size={14} className="text-emerald-500" /> Free to apply</span>
              <span className="flex items-center gap-1.5"><Icon.Check size={14} className="text-emerald-500" /> No exclusivity</span>
              <span className="flex items-center gap-1.5"><Icon.Check size={14} className="text-emerald-500" /> Keep 70% revenue</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-[var(--primary)]/20 via-transparent to-[var(--accent)]/20 blur-3xl rounded-3xl pointer-events-none" />
            <Card className="relative overflow-hidden">
              <div className="aspect-[5/4] bg-gradient-to-br from-green-800 via-green-600 to-emerald-400 relative">
                {/* radial overlay for depth */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,.22),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,.18),transparent_60%)]" />

                <TeachHeroIllustration />

                {/* Bottom stat bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
                  <div className="flex-1 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 p-3">
                    <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Paid out last year</p>
                    <p className="text-xl font-extrabold text-white leading-tight">$2.4M+</p>
                  </div>
                  <div className="rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 p-3 text-center min-w-[80px]">
                    <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Top earner</p>
                    <p className="text-lg font-extrabold text-white leading-tight">$184k</p>
                  </div>
                  <div className="rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 p-3 text-center min-w-[72px]">
                    <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Avg. rating</p>
                    <p className="text-lg font-extrabold text-white leading-tight">4.7 ★</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Real instructor photo strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-3 gap-3 rounded-3xl overflow-hidden">
          {[
            { src: "photo-1524178232363-1fb2b075b655", alt: "Teacher presenting to students" },
            { src: "photo-1531482615713-2afd69097998", alt: "Online class in session" },
            { src: "photo-1516321318423-f06f85e504b3", alt: "Instructor recording a course" },
          ].map((img, i) => (
            <div key={i} className="relative aspect-video overflow-hidden rounded-2xl group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://images.unsplash.com/${img.src}?w=400&h=250&fit=crop&q=80`}
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
              <span className="h-px w-6 bg-[var(--primary)] inline-block" /> What you get
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Built for instructors who care</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => {
              const colors = [
                "from-emerald-500/15 to-teal-400/10 text-emerald-600 dark:text-emerald-400",
                "from-violet-500/15 to-purple-400/10 text-violet-600 dark:text-violet-400",
                "from-sky-500/15 to-blue-400/10 text-sky-600 dark:text-sky-400",
                "from-amber-500/15 to-orange-400/10 text-amber-600 dark:text-amber-400",
                "from-rose-500/15 to-pink-400/10 text-rose-600 dark:text-rose-400",
                "from-green-500/15 to-emerald-400/10 text-[var(--primary)]",
              ];
              return (
                <Card key={b.title} className="h-full group hover-lift">
                  <CardBody className="space-y-4">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center border border-[var(--border)] group-hover:scale-105 transition-transform`}>
                      {b.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{b.title}</h3>
                      <p className="text-sm text-[var(--muted)] leading-relaxed mt-1.5">{b.description}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
            <span className="h-px w-6 bg-[var(--primary)] inline-block" /> How it works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">From idea to launch in three steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />
          {steps.map((s, i) => (
            <Card key={s.n} className="h-full relative hover-lift">
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-extrabold gradient-text">{s.n}</span>
                  {i < steps.length - 1 && (
                    <Icon.ChevronRight size={18} className="text-[var(--border-strong)] hidden md:block" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{s.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed mt-1.5">{s.description}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Earnings potential</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">What you could make</h2>
            <p className="mt-3 text-[var(--muted)]">
              Estimates at our 70% revenue share. Actual earnings depend on pricing, traffic, and reviews.
            </p>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {earningsTiers.map((t, i) => (
              <Card key={t.label} className={i === 1 ? "ring-2 ring-[var(--primary)]" : undefined}>
                <CardBody className="text-center space-y-2">
                  <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold">{t.label}</p>
                  <p className="text-3xl sm:text-4xl font-bold gradient-text">{t.earnings}</p>
                  <p className="text-xs text-[var(--muted)]">at {t.price}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Apply</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Tell us what you&apos;d teach</h2>
          <p className="mt-4 text-[var(--muted)] leading-relaxed">
            We review every application. Be specific — a clear pitch beats a long résumé. We&apos;ll get back within
            3–5 business days.
          </p>
          <div className="mt-6 space-y-3">
            {faqs.slice(0, 2).map((f) => (
              <Card key={f.q}>
                <CardBody>
                  <p className="font-semibold text-sm">{f.q}</p>
                  <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">{f.a}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
        <Card className="lg:col-span-3">
          <CardBody className="p-6 lg:p-8">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="t-name">Your name</Label>
                  <Input
                    id="t-name"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    error={errors.name}
                  />
                </div>
                <div>
                  <Label htmlFor="t-email">Email</Label>
                  <Input
                    id="t-email"
                    type="email"
                    icon={<Icon.Mail size={16} />}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    error={errors.email}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="t-exp">Area of expertise</Label>
                  <Select id="t-exp" value={form.expertise} onChange={(e) => update("expertise", e.target.value)}>
                    {["Programming", "Data Science", "Design", "Business", "Marketing", "Languages", "Other"].map(
                      (x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ),
                    )}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="t-years">Years of experience</Label>
                  <Select
                    id="t-years"
                    value={form.experience}
                    onChange={(e) => update("experience", e.target.value)}
                  >
                    {["< 1 year", "1-3 years", "3-7 years", "7+ years"].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="t-pitch">What would you teach, and for whom?</Label>
                <Textarea
                  id="t-pitch"
                  rows={6}
                  placeholder="e.g., A 6-hour intro to React for backend developers who already know JavaScript fundamentals…"
                  value={form.pitch}
                  onChange={(e) => update("pitch", e.target.value)}
                  error={errors.pitch}
                />
              </div>
              <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                <p className="text-xs text-[var(--muted)]">
                  By applying you agree to our{" "}
                  <Link href="/terms" className="text-[var(--primary)] hover:underline">
                    terms
                  </Link>
                  .
                </p>
                <Button type="submit" loading={submitting}>
                  <Icon.Send size={16} /> Submit application
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </section>

      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Instructor FAQ</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Common questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <Card key={f.q}>
                <CardBody>
                  <p className="font-semibold">{f.q}</p>
                  <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">{f.a}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
