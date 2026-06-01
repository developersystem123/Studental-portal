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
  },
  {
    date: "2026-03-08",
    title: "EduPortal launches Verified Career Tracks, a job-aligned learning path",
    excerpt:
      "Career Tracks pair our courses with industry mentors and a portfolio capstone, designed so graduates can apply to entry-level roles immediately. Launch partners include Stripe, Atlassian, and Figma.",
  },
  {
    date: "2026-01-17",
    title: "EduPortal partners with the IIT system to bring AI study tools to 28,000 students",
    excerpt:
      "Students at all 23 IITs will get free Pro access for the 2026 academic year. The partnership also opens a research collaboration on AI-supported learning outcomes.",
  },
  {
    date: "2025-11-04",
    title: "EduPortal hits 1 million active monthly learners",
    excerpt:
      "Just 30 months after launch, EduPortal crosses the 1M monthly active learner mark. Top growth markets include India, Brazil, Nigeria, and Indonesia.",
  },
  {
    date: "2025-08-19",
    title: "New AI Quiz Generator turns any topic into a personalized practice set",
    excerpt:
      "Our most-requested feature: convert any topic, link, or PDF into an interactive quiz tailored to your level. Available to all Pro members today.",
  },
];

const mentions = [
  { outlet: "TechCrunch", headline: "EduPortal is rewriting how the world studies", date: "2026-04-23" },
  { outlet: "The Verge", headline: "Inside EduPortal's bet that AI tutors really can teach", date: "2026-03-12" },
  { outlet: "WIRED", headline: "When the textbook can talk back: AI in classrooms", date: "2026-02-04" },
  { outlet: "Forbes", headline: "The 30 EdTech companies to watch in 2026", date: "2026-01-29" },
  { outlet: "Bloomberg", headline: "EdTech's quiet comeback, led by AI-first platforms", date: "2025-12-11" },
];

const facts = [
  { label: "Founded", value: "2023" },
  { label: "Headquarters", value: "Bengaluru, India" },
  { label: "Team size", value: "84 across 17 countries" },
  { label: "Monthly learners", value: "1.2M+" },
  { label: "Courses", value: "320+ across 18 categories" },
  { label: "Funding to date", value: "$57M" },
];

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function BrandKitIllustration() {
  return (
    <svg
      viewBox="0 0 640 400"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bk-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#071a0f" />
          <stop offset="100%" stopColor="#0d2818" />
        </linearGradient>
        <linearGradient id="bk-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id="bk-green-h" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id="bk-card" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#132a1c" />
          <stop offset="100%" stopColor="#0e2118" />
        </linearGradient>
        <filter id="bk-glow">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="640" height="400" fill="url(#bk-bg)" />

      {/* Subtle grid lines */}
      {[80,160,240,320,400,480,560].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#1a3d25" strokeWidth="0.5" />
      ))}
      {[80,160,240,320].map(y => (
        <line key={y} x1="0" y1={y} x2="640" y2={y} stroke="#1a3d25" strokeWidth="0.5" />
      ))}

      {/* Glowing blob top-right */}
      <ellipse cx="540" cy="60" rx="120" ry="80" fill="#16a34a" opacity="0.12" filter="url(#bk-glow)" />
      {/* Glowing blob bottom-left */}
      <ellipse cx="90" cy="340" rx="100" ry="70" fill="#4ade80" opacity="0.08" filter="url(#bk-glow)" />

      {/* ── Section label ── */}
      <text x="28" y="38" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="700" fill="#4ade80" letterSpacing="3">BRAND GUIDELINES · 2026</text>
      <line x1="28" y1="44" x2="380" y2="44" stroke="#1e4d30" strokeWidth="1" />

      {/* ══ LOGO PANEL ══ */}
      <rect x="28" y="56" width="180" height="108" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      {/* Logo icon */}
      <rect x="68" y="72" width="40" height="40" rx="10" fill="url(#bk-green)" />
      {/* Graduation cap icon paths */}
      <path d="M88 81.5 L78 87.5 L88 93.5 L98 87.5 Z" fill="white" opacity="0.95" />
      <path d="M80.5 89.5 V97.5 Q88 100.5 95.5 97.5 V89.5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="99" y1="87.5" x2="99" y2="95" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      {/* Wordmark */}
      <text x="118" y="90" fontFamily="system-ui,sans-serif" fontSize="17" fontWeight="800" fill="url(#bk-green-h)">EduPortal</text>
      <text x="118" y="104" fontFamily="system-ui,sans-serif" fontSize="7" fontWeight="600" fill="#5f8971" letterSpacing="2">LEARN · BUILD · GROW</text>

      {/* Logo on dark — reversed */}
      <rect x="40" y="125" width="72" height="28" rx="6" fill="#0a1a10" stroke="#1e4d30" strokeWidth="1" />
      <text x="76" y="143" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="800" fill="white">EduPortal</text>

      {/* Logo on white */}
      <rect x="120" y="125" width="72" height="28" rx="6" fill="white" />
      <text x="156" y="143" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="800" fill="#16a34a">EduPortal</text>

      {/* Label */}
      <text x="28" y="176" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">LOGO VARIANTS</text>

      {/* ══ COLOR PALETTE ══ */}
      <rect x="28" y="190" width="180" height="120" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <text x="40" y="208" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">COLOR PALETTE</text>

      {/* Swatches */}
      {[
        { x: 40, color: "#16a34a", name: "Primary", hex: "#16a34a" },
        { x: 80, color: "#4ade80", name: "Accent",  hex: "#4ade80" },
        { x: 120, color: "#f0fdf4", name: "Light",  hex: "#f0fdf4" },
        { x: 160, color: "#071a0f", name: "Dark",   hex: "#071a0f" },
      ].map((s) => (
        <g key={s.name}>
          <rect x={s.x} y="216" width="32" height="32" rx="8" fill={s.color} stroke="#1e4d30" strokeWidth={s.color === "#071a0f" ? "1" : "0"} />
          <text x={s.x + 16} y="260" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="6.5" fontWeight="600" fill="#86b89a">{s.name}</text>
          <text x={s.x + 16} y="269" textAnchor="middle" fontFamily="system-ui,monospace" fontSize="6" fill="#5f8971">{s.hex}</text>
        </g>
      ))}

      {/* Gradient bar */}
      <defs>
        <linearGradient id="bk-swatch-bar" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
      </defs>
      <rect x="40" y="278" width="152" height="8" rx="4" fill="url(#bk-swatch-bar)" />
      <text x="40" y="298" fontFamily="system-ui,sans-serif" fontSize="6.5" fill="#5f8971" fontWeight="600">Brand gradient — primary → accent</text>

      {/* ══ TYPOGRAPHY ══ */}
      <rect x="224" y="56" width="194" height="108" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <text x="236" y="74" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">TYPOGRAPHY</text>

      <text x="236" y="98" fontFamily="system-ui,sans-serif" fontSize="22" fontWeight="800" fill="white" opacity="0.95">Aa</text>
      <text x="272" y="88" fontFamily="system-ui,sans-serif" fontSize="8" fontWeight="700" fill="#e8f5ee">Geist Sans</text>
      <text x="272" y="99" fontFamily="system-ui,sans-serif" fontSize="7" fill="#5f8971">UI / Headlines</text>

      <text x="236" y="118" fontFamily="monospace" fontSize="12" fontWeight="600" fill="#4ade80" opacity="0.9">Geist Mono</text>
      <text x="236" y="130" fontFamily="system-ui,sans-serif" fontSize="7" fill="#5f8971">Code & data labels</text>

      <text x="236" y="149" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971">Size scale: 12 · 14 · 16 · 20 · 24 · 32 · 48 · 64</text>

      {/* ══ TONE STRIP ══ */}
      <rect x="224" y="176" width="194" height="134" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <text x="236" y="194" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">BRAND VOICE</text>

      {[
        { label: "Tone", value: "Warm · Direct · Hopeful" },
        { label: "Never", value: "Corporate-speak or jargon" },
        { label: "Always", value: "Human, accessible, curious" },
      ].map((item, i) => (
        <g key={item.label}>
          <rect x="236" y={205 + i * 30} width="170" height="22" rx="6" fill="#0d2818" stroke="#1e4d30" strokeWidth="1" />
          <text x="246" y={220 + i * 30} fontFamily="system-ui,sans-serif" fontSize="7.5" fontWeight="700" fill="#4ade80">{item.label}</text>
          <text x="276" y={220 + i * 30} fontFamily="system-ui,sans-serif" fontSize="7.5" fill="#86b89a">{item.value}</text>
        </g>
      ))}

      {/* Taglines */}
      <rect x="236" y="296" width="170" height="8" rx="4" fill="#0d2818" />
      <text x="321" y="302" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="7" fill="#5f8971">— "Learn smarter, finish faster." —</text>

      {/* ══ PRODUCT SCREENSHOT MOCK ══ */}
      <rect x="434" y="56" width="182" height="254" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <text x="446" y="74" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">PRODUCT PREVIEW</text>

      {/* Mini dashboard mock inside */}
      <rect x="444" y="80" width="164" height="218" rx="8" fill="#071a0f" stroke="#1e4d30" strokeWidth="1" />
      {/* Topbar */}
      <rect x="444" y="80" width="164" height="22" rx="8" fill="#0d2818" />
      <rect x="444" y="90" width="164" height="12" fill="#0d2818" />
      <circle cx="455" cy="91" r="3.5" fill="#16a34a" />
      <rect x="464" y="87" width="60" height="8" rx="4" fill="#1a3d25" />
      <rect x="580" y="86" width="20" height="10" rx="5" fill="url(#bk-green)" />

      {/* Left sidebar */}
      <rect x="444" y="102" width="34" height="196" fill="#0a1a10" />
      {[0,1,2,3,4,5,6].map(i => (
        <g key={i}>
          <rect x="450" y={112 + i * 25} width="22" height="14" rx="4" fill={i === 0 ? "url(#bk-green)" : "#132a1c"} />
          {i === 0 && <rect x="453" y="116" width="16" height="6" rx="3" fill="white" opacity="0.5" />}
          {i !== 0 && <rect x="453" y={116 + i * 25} width={8 + (i % 3) * 4} height="4" rx="2" fill="#1e4d30" />}
        </g>
      ))}

      {/* Main content */}
      <rect x="480" y="102" width="126" height="50" fill="#0d2818" />
      <text x="486" y="118" fontFamily="system-ui,sans-serif" fontSize="8" fontWeight="700" fill="white">Dashboard</text>
      {/* Stat cards row */}
      {[0,1,2].map(i => (
        <g key={i}>
          <rect x={486 + i * 38} y="124" width="32" height="22" rx="4" fill="#132a1c" />
          <rect x={490 + i * 38} y="128" width={16 + (i % 2) * 4} height="4" rx="2" fill={i === 0 ? "url(#bk-green)" : "#1e4d30"} />
          <rect x={490 + i * 38} y="135" width="14" height="4" rx="2" fill="#1e4d30" />
        </g>
      ))}

      {/* Course cards area */}
      <rect x="480" y="158" width="126" height="60" fill="#0d2818" />
      <text x="486" y="171" fontFamily="system-ui,sans-serif" fontSize="6.5" fontWeight="600" fill="#5f8971">MY COURSES</text>
      {[0,1].map(i => (
        <g key={i}>
          <rect x={486 + i * 62} y="176" width="56" height="36" rx="6" fill="#0a1a10" stroke="#1e4d30" strokeWidth="0.5" />
          <rect x={486 + i * 62} y="176" width="56" height="16" rx="6" fill={i === 0 ? "#16a34a" : "#7c3aed"} opacity="0.7" />
          <rect x={490 + i * 62} y="197" width="28" height="4" rx="2" fill="#1e4d30" />
          <rect x={490 + i * 62} y="202" width="20" height="3" rx="1.5" fill={i === 0 ? "#16a34a" : "#7c3aed"} opacity="0.6" />
        </g>
      ))}

      {/* AI Chat preview */}
      <rect x="480" y="224" width="126" height="68" fill="#0d2818" />
      <text x="486" y="237" fontFamily="system-ui,sans-serif" fontSize="6.5" fontWeight="600" fill="#5f8971">AI ASSISTANT</text>
      <rect x="486" y="242" width="114" height="12" rx="6" fill="#0a1a10" stroke="#1e4d30" strokeWidth="0.5" />
      <text x="493" y="251" fontFamily="system-ui,sans-serif" fontSize="6" fill="#86b89a">How can I help you learn today?</text>
      {/* Chat bubble */}
      <rect x="486" y="260" width="80" height="10" rx="5" fill="#132a1c" />
      <rect x="486" y="260" width="56" height="10" rx="5" fill="url(#bk-green)" opacity="0.7" />
      <text x="490" y="268" fontFamily="system-ui,sans-serif" fontSize="5.5" fill="white" opacity="0.9">Python closures explained…</text>
      <rect x="572" y="265" width="22" height="8" rx="4" fill="url(#bk-green)" />
      <text x="583" y="271" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="8" fill="white">›</text>

      {/* ══ BOTTOM ROW ══ */}
      {/* Download hint */}
      <rect x="28" y="322" width="390" height="54" rx="12" fill="url(#bk-card)" stroke="#1e4d30" strokeWidth="1" />
      <text x="46" y="340" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">DOWNLOAD INCLUDES</text>
      {[
        { x: 46,  label: "SVG / PNG logos (all variants)" },
        { x: 220, label: "Color tokens & Figma file" },
        { x: 46,  label: "Brand guidelines PDF", y: 370 },
        { x: 220, label: "Product screenshots (2x)", y: 370 },
      ].map((item, i) => (
        <g key={i}>
          <circle cx={item.x - 6} cy={(item as {y?: number}).y ?? 355} r="3" fill="#16a34a" />
          <text x={item.x + 2} y={((item as {y?: number}).y ?? 355) + 4} fontFamily="system-ui,sans-serif" fontSize="7.5" fill="#86b89a">{item.label}</text>
        </g>
      ))}

      {/* Version tag */}
      <rect x="434" y="322" width="182" height="54" rx="12" fill="#0d2818" stroke="#1e4d30" strokeWidth="1" />
      <text x="525" y="340" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="8" fill="#5f8971" fontWeight="600" letterSpacing="1">CURRENT VERSION</text>
      <text x="525" y="362" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="20" fontWeight="800" fill="url(#bk-green-h)">v3.2.1</text>
      <text x="525" y="373" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="7" fill="#5f8971">Updated April 2026</text>
    </svg>
  );
}

export default function PressPage() {
  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-20 lg:pb-16">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Press & Media</p>
          <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Resources for <span className="gradient-text">journalists</span> & partners.
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)]">
            Reporting on EduPortal? Working on a story about AI and education? Here&apos;s everything you need —
            announcements, facts, and approved brand assets.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href="mailto:press@eduportal.app">
              <Button>
                <Icon.Mail size={16} /> press@eduportal.app
              </Button>
            </a>
            <Link href="#assets">
              <Button variant="outline">
                <Icon.Download size={16} /> Brand assets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Company fact sheet</p>
              <h2 className="mt-2 text-2xl font-bold">Quick facts</h2>
            </div>
            <a
              href="mailto:press@eduportal.app?subject=Fact sheet (PDF) request"
              className="text-sm text-[var(--primary)] hover:underline font-medium inline-flex items-center gap-1"
            >
              <Icon.Download size={14} /> Download PDF
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {facts.map((f) => (
              <Card key={f.label}>
                <CardBody>
                  <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold">{f.label}</p>
                  <p className="mt-1 text-xl font-bold">{f.value}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Announcements</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Latest from EduPortal</h2>
        </div>
        <ul className="space-y-4">
          {releases.map((r) => (
            <li key={r.title}>
              <Card className="hover:border-[var(--primary)]/30 transition">
                <CardBody className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">Press release</Badge>
                    <span className="text-xs text-[var(--muted)]">{formatDate(r.date)}</span>
                  </div>
                  <h3 className="text-lg font-semibold leading-snug">{r.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{r.excerpt}</p>
                  <a
                    href="mailto:press@eduportal.app?subject=Full release request"
                    className="text-sm text-[var(--primary)] hover:underline font-medium inline-flex items-center gap-1 pt-1"
                  >
                    Request full release <Icon.ChevronRight size={14} />
                  </a>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">In the news</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Recent coverage</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {mentions.map((m) => (
              <li key={m.outlet + m.date}>
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold gradient-text">{m.outlet}</p>
                      <span className="text-xs text-[var(--muted)]">{formatDate(m.date)}</span>
                    </div>
                    <p className="text-sm font-medium leading-snug">&ldquo;{m.headline}&rdquo;</p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="assets" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Brand assets</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Logos, colors, and screenshots</h2>
            <p className="mt-4 text-[var(--muted)] leading-relaxed">
              Use our wordmark and logo at full color or single-color. Don&apos;t recolor, distort, or place on
              low-contrast backgrounds. Please keep our name as a single word: <strong>EduPortal</strong>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="mailto:press@eduportal.app?subject=Brand kit request">
                <Button>
                  <Icon.Download size={16} /> Download brand kit (ZIP)
                </Button>
              </a>
              <a href="mailto:press@eduportal.app?subject=Screenshot pack request">
                <Button variant="outline">
                  <Icon.Camera size={16} /> Product screenshots
                </Button>
              </a>
            </div>
          </div>
          <Card className="overflow-hidden">
            <div className="aspect-[16/10] relative bg-[#0a1a10]">
              <BrandKitIllustration />
            </div>
          </Card>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 lg:p-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Working on a story?</h2>
          <p className="mt-3 text-[var(--muted)] max-w-xl mx-auto">
            We respond to most press inquiries within 24 hours. For interviews with our founders or product team, please
            include your outlet, deadline, and topic.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:press@eduportal.app">
              <Button size="lg">
                <Icon.Mail size={18} /> press@eduportal.app
              </Button>
            </a>
            <Link href="/contact?reason=Press">
              <Button size="lg" variant="outline">
                Use contact form
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
