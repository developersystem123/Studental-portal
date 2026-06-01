import Link from "next/link";
import Icon from "@/components/icons";
import { Badge, Button, Card, CardBody } from "@/components/ui";

export const metadata = {
  title: "Press & Media — EduPortal",
  description:
    "Press releases, media kit, brand assets, and contact info for journalists, podcasters, and partners covering EduPortal.",
};

const releases = [
  {
    date: "2026-04-22",
    title: "EduPortal closes $42M Series B to bring AI-powered tutoring to 10M students",
    excerpt:
      "The round is led by Pinepoint Ventures with participation from Lumina Capital and existing investors. Funds will accelerate curriculum, AI safety research, and expansion into Latin America and Southeast Asia.",
    tag: "Funding",
  },
  {
    date: "2026-03-08",
    title: "EduPortal launches Verified Career Tracks, a job-aligned learning path",
    excerpt:
      "Career Tracks pair our courses with industry mentors and a portfolio capstone, designed so graduates can apply to entry-level roles immediately. Launch partners include Stripe, Atlassian, and Figma.",
    tag: "Product",
  },
  {
    date: "2026-01-17",
    title: "EduPortal partners with the IIT system to bring AI study tools to 28,000 students",
    excerpt:
      "Students at all 23 IITs will get free Pro access for the 2026 academic year. The partnership also opens a research collaboration on AI-supported learning outcomes.",
    tag: "Partnership",
  },
  {
    date: "2025-11-04",
    title: "EduPortal hits 1 million active monthly learners",
    excerpt:
      "Just 30 months after launch, EduPortal crosses the 1M monthly active learner mark. Top growth markets include India, Brazil, Nigeria, and Indonesia.",
    tag: "Milestone",
  },
  {
    date: "2025-08-19",
    title: "New AI Quiz Generator turns any topic into a personalized practice set",
    excerpt:
      "Our most-requested feature: convert any topic, link, or PDF into an interactive quiz tailored to your level. Available to all Pro members today.",
    tag: "Feature",
  },
];

const mentions = [
  { outlet: "TechCrunch", headline: "EduPortal is rewriting how the world studies", date: "2026-04-23", color: "from-orange-500/10 text-orange-600 dark:text-orange-400" },
  { outlet: "The Verge",  headline: "Inside EduPortal's bet that AI tutors really can teach", date: "2026-03-12", color: "from-violet-500/10 text-violet-600 dark:text-violet-400" },
  { outlet: "WIRED",      headline: "When the textbook can talk back: AI in classrooms", date: "2026-02-04", color: "from-sky-500/10 text-sky-600 dark:text-sky-400" },
  { outlet: "Forbes",     headline: "The 30 EdTech companies to watch in 2026", date: "2026-01-29", color: "from-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { outlet: "Bloomberg",  headline: "EdTech's quiet comeback, led by AI-first platforms", date: "2025-12-11", color: "from-amber-500/10 text-amber-600 dark:text-amber-400" },
];

const facts = [
  { label: "Founded",          value: "2023",                   icon: <Icon.Calendar size={18} /> },
  { label: "Headquarters",     value: "Bengaluru, India",        icon: <Icon.Pin size={18} /> },
  { label: "Team size",        value: "84 people, 17 countries", icon: <Icon.Users size={18} /> },
  { label: "Monthly learners", value: "1.2M+",                  icon: <Icon.TrendingUp size={18} /> },
  { label: "Courses",          value: "320+ / 18 categories",   icon: <Icon.Book size={18} /> },
  { label: "Funding to date",  value: "$57M",                   icon: <Icon.Award size={18} /> },
];

const TAG_COLORS: Record<string, string> = {
  Funding:     "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Product:     "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  Partnership: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Milestone:   "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Feature:     "bg-[var(--primary-soft)] text-[var(--primary)]",
};

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function BrandKitIllustration() {
  return (
    <svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="bk-bg"      x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#071a0f" /><stop offset="100%" stopColor="#0d2818" /></linearGradient>
        <linearGradient id="bk-green"   x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#16a34a" /><stop offset="100%" stopColor="#4ade80" /></linearGradient>
        <linearGradient id="bk-green-h" x1="0%" y1="0%" x2="100%" y2="0%"  ><stop offset="0%" stopColor="#16a34a" /><stop offset="100%" stopColor="#4ade80" /></linearGradient>
        <linearGradient id="bk-card"    x1="0%" y1="0%" x2="0%" y2="100%"  ><stop offset="0%" stopColor="#132a1c" /><stop offset="100%" stopColor="#0e2118" /></linearGradient>
        <filter id="bk-glow"><feGaussianBlur stdDeviation="12" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
      </defs>
      <rect width="640" height="400" fill="url(#bk-bg)" />
      {[80,160,240,320,400,480,560].map(x => (<line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#1a3d25" strokeWidth="0.5" />))}
      {[80,160,240,320].map(y => (<line key={y} x1="0" y1={y} x2="640" y2={y} stroke="#1a3d25" strokeWidth="0.5" />))}
      <ellipse cx="540" cy="60" rx="120" ry="80" fill="#16a34a" opacity="0.12" filter="url(#bk-glow)" />
      <ellipse cx="90" cy="340" rx="100" ry="70" fill="#4ade80" opacity="0.08" filter="url(#bk-glow)" />
      <text x="28" y="38" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="700" fill="#4ade80" letterSpacing="3">BRAND GUIDELINES · 2026</text>
      <line x1="28" y1="44" x2="380" y2="44" stroke="#1e4d30" strokeWidth="1" />
      <rect x="28" y="56" width="180" height="108" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <rect x="68" y="72" width="40" height="40" rx="10" fill="url(#bk-green)" />
      <path d="M88 81.5 L78 87.5 L88 93.5 L98 87.5 Z" fill="white" opacity="0.95" />
      <path d="M80.5 89.5 V97.5 Q88 100.5 95.5 97.5 V89.5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="99" y1="87.5" x2="99" y2="95" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <text x="118" y="90" fontFamily="system-ui,sans-serif" fontSize="17" fontWeight="800" fill="url(#bk-green-h)">EduPortal</text>
      <text x="118" y="104" fontFamily="system-ui,sans-serif" fontSize="7" fontWeight="600" fill="#5f8971" letterSpacing="2">LEARN · BUILD · GROW</text>
      <rect x="40" y="125" width="72" height="28" rx="6" fill="#0a1a10" stroke="#1e4d30" strokeWidth="1" />
      <text x="76" y="143" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="800" fill="white">EduPortal</text>
      <rect x="120" y="125" width="72" height="28" rx="6" fill="white" />
      <text x="156" y="143" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="800" fill="#16a34a">EduPortal</text>
      <text x="28" y="176" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">LOGO VARIANTS</text>
      <rect x="28" y="190" width="180" height="120" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <text x="40" y="208" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">COLOR PALETTE</text>
      {[{ x: 40, color: "#16a34a", name: "Primary", hex: "#16a34a" },{ x: 80, color: "#4ade80", name: "Accent", hex: "#4ade80" },{ x: 120, color: "#f0fdf4", name: "Light", hex: "#f0fdf4" },{ x: 160, color: "#071a0f", name: "Dark", hex: "#071a0f" }].map((s) => (
        <g key={s.name}>
          <rect x={s.x} y="216" width="32" height="32" rx="8" fill={s.color} stroke="#1e4d30" strokeWidth={s.color === "#071a0f" ? "1" : "0"} />
          <text x={s.x + 16} y="260" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="6.5" fontWeight="600" fill="#86b89a">{s.name}</text>
          <text x={s.x + 16} y="269" textAnchor="middle" fontFamily="system-ui,monospace" fontSize="6" fill="#5f8971">{s.hex}</text>
        </g>
      ))}
      <defs><linearGradient id="bk-swatch-bar" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#16a34a" /><stop offset="50%" stopColor="#22c55e" /><stop offset="100%" stopColor="#4ade80" /></linearGradient></defs>
      <rect x="40" y="278" width="152" height="8" rx="4" fill="url(#bk-swatch-bar)" />
      <text x="40" y="298" fontFamily="system-ui,sans-serif" fontSize="6.5" fill="#5f8971" fontWeight="600">Brand gradient — primary → accent</text>
      <rect x="224" y="56" width="194" height="108" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <text x="236" y="74" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">TYPOGRAPHY</text>
      <text x="236" y="98" fontFamily="system-ui,sans-serif" fontSize="22" fontWeight="800" fill="white" opacity="0.95">Aa</text>
      <text x="272" y="88" fontFamily="system-ui,sans-serif" fontSize="8" fontWeight="700" fill="#e8f5ee">Geist Sans</text>
      <text x="272" y="99" fontFamily="system-ui,sans-serif" fontSize="7" fill="#5f8971">UI / Headlines</text>
      <text x="236" y="118" fontFamily="monospace" fontSize="12" fontWeight="600" fill="#4ade80" opacity="0.9">Geist Mono</text>
      <text x="236" y="130" fontFamily="system-ui,sans-serif" fontSize="7" fill="#5f8971">Code & data labels</text>
      <text x="236" y="149" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971">Size scale: 12 · 14 · 16 · 20 · 24 · 32 · 48 · 64</text>
      <rect x="224" y="176" width="194" height="134" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <text x="236" y="194" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">BRAND VOICE</text>
      {[{ label: "Tone", value: "Warm · Direct · Hopeful" },{ label: "Never", value: "Corporate-speak or jargon" },{ label: "Always", value: "Human, accessible, curious" }].map((item, i) => (
        <g key={item.label}>
          <rect x="236" y={205 + i * 30} width="170" height="22" rx="6" fill="#0d2818" stroke="#1e4d30" strokeWidth="1" />
          <text x="246" y={220 + i * 30} fontFamily="system-ui,sans-serif" fontSize="7.5" fontWeight="700" fill="#4ade80">{item.label}</text>
          <text x="276" y={220 + i * 30} fontFamily="system-ui,sans-serif" fontSize="7.5" fill="#86b89a">{item.value}</text>
        </g>
      ))}
      <rect x="236" y="296" width="170" height="8" rx="4" fill="#0d2818" />
      <text x="321" y="302" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="7" fill="#5f8971">— "Learn smarter, finish faster." —</text>
      <rect x="434" y="56" width="182" height="254" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <text x="446" y="74" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">PRODUCT PREVIEW</text>
      <rect x="444" y="80" width="164" height="218" rx="8" fill="#071a0f" stroke="#1e4d30" strokeWidth="1" />
      <rect x="444" y="80" width="164" height="22" rx="8" fill="#0d2818" />
      <rect x="444" y="90" width="164" height="12" fill="#0d2818" />
      <circle cx="455" cy="91" r="3.5" fill="#16a34a" />
      <rect x="464" y="87" width="60" height="8" rx="4" fill="#1a3d25" />
      <rect x="580" y="86" width="20" height="10" rx="5" fill="url(#bk-green)" />
      <rect x="444" y="102" width="34" height="196" fill="#0a1a10" />
      {[0,1,2,3,4,5,6].map(i => (<g key={i}><rect x="450" y={112 + i * 25} width="22" height="14" rx="4" fill={i === 0 ? "url(#bk-green)" : "#132a1c"} />{i === 0 && <rect x="453" y="116" width="16" height="6" rx="3" fill="white" opacity="0.5" />}{i !== 0 && <rect x="453" y={116 + i * 25} width={8 + (i % 3) * 4} height="4" rx="2" fill="#1e4d30" />}</g>))}
      <rect x="480" y="102" width="126" height="50" fill="#0d2818" />
      <text x="486" y="118" fontFamily="system-ui,sans-serif" fontSize="8" fontWeight="700" fill="white">Dashboard</text>
      {[0,1,2].map(i => (<g key={i}><rect x={486 + i * 38} y="124" width="32" height="22" rx="4" fill="#132a1c" /><rect x={490 + i * 38} y="128" width={16 + (i % 2) * 4} height="4" rx="2" fill={i === 0 ? "url(#bk-green)" : "#1e4d30"} /><rect x={490 + i * 38} y="135" width="14" height="4" rx="2" fill="#1e4d30" /></g>))}
      <rect x="480" y="158" width="126" height="130" fill="#0d2818" />
      <rect x="28" y="322" width="390" height="54" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <text x="46" y="340" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">DOWNLOAD INCLUDES</text>
      {[{ x: 46, label: "SVG / PNG logos (all variants)" },{ x: 220, label: "Color tokens & Figma file" },{ x: 46, label: "Brand guidelines PDF", y: 370 },{ x: 220, label: "Product screenshots (2x)", y: 370 }].map((item, i) => (<g key={i}><circle cx={item.x - 6} cy={(item as {y?: number}).y ?? 355} r="3" fill="#16a34a" /><text x={item.x + 2} y={((item as {y?: number}).y ?? 355) + 4} fontFamily="system-ui,sans-serif" fontSize="7.5" fill="#86b89a">{item.label}</text></g>))}
      <rect x="434" y="322" width="182" height="54" rx="12" fill="#0d2818" stroke="#1e4d30" strokeWidth="1" />
      <text x="525" y="340" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">CURRENT VERSION</text>
      <text x="525" y="362" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="20" fontWeight="800" fill="url(#bk-green-h)">v3.2.1</text>
      <text x="525" y="373" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="7" fill="#5f8971">Updated April 2026</text>
    </svg>
  );
}

export default function PressPage() {
  return (
    <div className="overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute -top-32 right-0 w-[600px] h-[500px] rounded-full bg-gradient-to-bl from-[var(--primary)]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 lg:pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="reveal-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-5">
              <Icon.Megaphone size={12} /> Press & Media
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-[3.3rem] font-bold tracking-tight leading-[1.1] text-balance">
              Resources for{" "}
              <span className="gradient-text">journalists</span> &amp; partners.
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)] leading-relaxed max-w-lg">
              Reporting on EduPortal? Working on a story about AI and education? Here&apos;s everything you need —
              announcements, facts, and approved brand assets.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="mailto:press@eduportal.app">
                <Button size="lg">
                  <Icon.Mail size={16} /> press@eduportal.app
                </Button>
              </a>
              <Link href="#assets">
                <Button size="lg" variant="outline">
                  <Icon.Download size={16} /> Brand assets
                </Button>
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-1.5"><Icon.Clock size={13} className="text-[var(--primary)]" /> Replies within 24 hours</span>
              <span className="flex items-center gap-1.5"><Icon.CheckCircle size={13} className="text-[var(--primary)]" /> Founder interviews available</span>
            </div>
          </div>

          {/* Right: newsroom photo */}
          <div className="hidden lg:block relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700&h=480&fit=crop&q=85"
                alt="Journalist at desk working on story"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
            {/* Floating: press inquiries */}
            <div className="absolute -bottom-5 -left-5 bg-[var(--surface)] rounded-2xl px-4 py-3 border border-[var(--border)] shadow-xl flex items-center gap-3 pop-in">
              <div className="h-9 w-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <Icon.Mail size={15} />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">press@eduportal.app</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">24h response guarantee</p>
              </div>
            </div>
            {/* Floating: funding badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl px-4 py-3 shadow-lg shadow-green-500/25 pop-in" style={{ animationDelay: "0.2s" }}>
              <p className="text-xl font-extrabold">$57M</p>
              <p className="text-[10px] font-semibold opacity-85">Raised to date</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick facts ── */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-2">
                <span className="h-px w-5 bg-[var(--primary)] inline-block" /> Company fact sheet
              </div>
              <h2 className="text-2xl font-bold">Quick facts</h2>
            </div>
            <a
              href="mailto:press@eduportal.app?subject=Fact sheet (PDF) request"
              className="text-sm text-[var(--primary)] hover:underline font-semibold inline-flex items-center gap-1.5"
            >
              <Icon.Download size={14} /> Download PDF
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {facts.map((f, i) => {
              const colors = [
                "from-violet-500/12 text-violet-600 dark:text-violet-400",
                "from-emerald-500/12 text-emerald-600 dark:text-emerald-400",
                "from-sky-500/12 text-sky-600 dark:text-sky-400",
                "from-amber-500/12 text-amber-600 dark:text-amber-400",
                "from-rose-500/12 text-rose-600 dark:text-rose-400",
                "from-green-500/12 text-[var(--primary)]",
              ];
              return (
                <Card key={f.label} className="hover-lift">
                  <CardBody className="flex items-start gap-3 p-5">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} to-transparent flex items-center justify-center border border-[var(--border)] shrink-0`}>
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--muted-2)] font-bold">{f.label}</p>
                      <p className="mt-0.5 text-base font-bold leading-snug">{f.value}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Press releases ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-2">
              <span className="h-px w-5 bg-[var(--primary)] inline-block" /> Announcements
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Latest from EduPortal</h2>
          </div>
          <a
            href="mailto:press@eduportal.app"
            className="text-sm text-[var(--primary)] hover:underline font-semibold inline-flex items-center gap-1.5"
          >
            <Icon.Mail size={14} /> Request full release
          </a>
        </div>
        <ul className="space-y-4">
          {releases.map((r) => (
            <li key={r.title}>
              <Card className="group hover-lift cursor-pointer">
                <CardBody className="p-6 space-y-2.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TAG_COLORS[r.tag] ?? "bg-[var(--surface-2)] text-[var(--muted)]"}`}>
                      {r.tag}
                    </span>
                    <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                      <Icon.Calendar size={11} /> {formatDate(r.date)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold leading-snug group-hover:text-[var(--primary)] transition-colors">{r.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{r.excerpt}</p>
                  <a
                    href="mailto:press@eduportal.app?subject=Full release request"
                    className="text-sm text-[var(--primary)] hover:underline font-semibold inline-flex items-center gap-1 pt-1"
                  >
                    Request full release <Icon.ChevronRight size={13} />
                  </a>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* ── In the news ── */}
      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-2">
              <span className="h-px w-5 bg-[var(--primary)] inline-block" /> In the news
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Recent coverage</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentions.map((m) => (
              <Card key={m.outlet + m.date} className="group hover-lift">
                <CardBody className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${m.color} to-transparent`}>
                      {m.outlet}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">{formatDate(m.date)}</span>
                  </div>
                  <p className="text-sm font-semibold leading-snug group-hover:text-[var(--primary)] transition-colors">
                    &ldquo;{m.headline}&rdquo;
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand assets ── */}
      <section id="assets" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
              <span className="h-px w-5 bg-[var(--primary)] inline-block" /> Brand assets
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Logos, colors &amp; screenshots</h2>
            <p className="mt-4 text-[var(--muted)] leading-relaxed">
              Use our wordmark and logo at full color or single-color. Don&apos;t recolor, distort, or place on
              low-contrast backgrounds. Keep our name as one word: <strong className="text-[var(--foreground)]">EduPortal</strong>.
            </p>

            {/* Brand rules */}
            <div className="mt-6 space-y-2.5">
              {[
                { icon: <Icon.CheckCircle size={14} className="text-emerald-500" />, text: "Full-color logo on white or light backgrounds" },
                { icon: <Icon.CheckCircle size={14} className="text-emerald-500" />, text: "White logo on dark or brand-green backgrounds" },
                { icon: <Icon.X size={14} className="text-[var(--danger)]" />, text: "Don't change the logo colors or proportions" },
                { icon: <Icon.X size={14} className="text-[var(--danger)]" />, text: "Don't add drop shadows or effects to the logo" },
              ].map((rule) => (
                <div key={rule.text} className="flex items-center gap-2.5 text-sm">
                  <span className="shrink-0">{rule.icon}</span>
                  <span className="text-[var(--foreground)]">{rule.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <a href="mailto:press@eduportal.app?subject=Brand kit request">
                <Button>
                  <Icon.Download size={15} /> Download brand kit (ZIP)
                </Button>
              </a>
              <a href="mailto:press@eduportal.app?subject=Screenshot pack request">
                <Button variant="outline">
                  <Icon.Camera size={15} /> Product screenshots
                </Button>
              </a>
            </div>
          </div>

          <Card className="overflow-hidden shadow-xl shadow-black/8">
            <div className="aspect-[16/10] relative bg-[#0a1a10]">
              <BrandKitIllustration />
            </div>
          </Card>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
          <div className="absolute inset-0 bg-dots opacity-15 mix-blend-overlay pointer-events-none" />
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />

          <div className="relative grid lg:grid-cols-2 gap-8 items-center px-8 sm:px-12 py-12 lg:py-16">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight">Working on a story?</h2>
              <p className="mt-3 text-white/80 max-w-md leading-relaxed">
                We respond to most press inquiries within 24 hours. For interviews with our founders or product team,
                include your outlet, deadline, and topic.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="mailto:press@eduportal.app">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 shadow-lg shadow-black/20 font-semibold">
                    <Icon.Mail size={16} /> press@eduportal.app
                  </Button>
                </a>
                <Link href="/contact?reason=Press">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Use contact form
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/60">For urgent inquiries please include URGENT in the subject line.</p>
            </div>

            {/* Right: small photo */}
            <div className="hidden lg:block">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&h=300&fit=crop&q=85"
                  alt="Founders being interviewed"
                  className="w-full h-[240px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
