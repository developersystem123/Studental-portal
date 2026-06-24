import Link from "next/link";
import Icon from "@/components/icons";

const cols = [
  {
    title: "Product",
    links: [
      { href: "/courses", label: "Courses" },
      { href: "/pricing", label: "Pricing" },
      { href: "/business", label: "For Business" },
      { href: "/teach", label: "Become a Teacher" },
      { href: "/affiliate", label: "Affiliate program" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press & Media" },
      { href: "/testimonials", label: "Testimonials" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/help", label: "Help Center" },
      { href: "/faq", label: "FAQ" },
      { href: "/verify", label: "Verify a certificate" },
      { href: "/status", label: "Service status" },
      { href: "/sitemap", label: "Sitemap" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
      { href: "/refund", label: "Refunds" },
      { href: "/accessibility", label: "Accessibility" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 relative overflow-hidden">
      {/* Gradient top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-[var(--primary)]/4 blur-[80px]" />
      </div>

      <div className="relative bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-6 gap-x-8 gap-y-10">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <XtroEdgeLogo size={40} />
              <div className="flex flex-col leading-tight">
                <span className="text-base font-bold gradient-text">EduPortal</span>
                <span className="text-[10px] text-[var(--muted-2)] -mt-0.5 tracking-widest uppercase">Learn · Build · Grow</span>
              </div>
            </Link>

            <p className="mt-4 text-sm text-[var(--muted)] max-w-[260px] leading-relaxed">
              An AI-powered learning platform that helps students master new skills with personalized courses, quizzes, and real-time help.
            </p>

            {/* Social links */}
            <div className="mt-5 flex items-center gap-2">
              <a
                href="mailto:hello@eduportal.app"
                className="h-9 w-9 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] border border-[var(--border)] hover:border-[var(--primary)]/30 text-[var(--muted)] hover:text-[var(--primary)] inline-flex items-center justify-center transition-all"
                aria-label="Email us"
              >
                <Icon.Mail size={15} />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] border border-[var(--border)] hover:border-[var(--primary)]/30 text-[var(--muted)] hover:text-[var(--primary)] inline-flex items-center justify-center transition-all"
                aria-label="Twitter / X"
              >
                <Icon.Send size={15} />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] border border-[var(--border)] hover:border-[var(--primary)]/30 text-[var(--muted)] hover:text-[var(--primary)] inline-flex items-center justify-center transition-all"
                aria-label="LinkedIn"
              >
                <Icon.Users size={15} />
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/15 font-medium">
                <Icon.CheckCircle size={11} /> SOC 2 compliant
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)] font-medium">
                <Icon.Lock size={11} /> GDPR ready
              </span>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted-2)] font-bold mb-4">{c.title}</p>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors relative group w-fit block"
                    >
                      <span className="group-hover:text-[var(--primary)] transition-colors">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="relative">
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-center gap-3 text-xs text-[var(--muted)]">
            <p>© {new Date().getFullYear()} EduPortal. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function XtroEdgeLogo({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-label="XtroEdge" className="shrink-0">
      <defs>
        <linearGradient id="fe-g" x1="40" y1="0" x2="160" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="55%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <mask id="fe-m">
          <rect x="0" y="0" width="200" height="200" fill="white" />
          <polygon points="161,13 169,15 151,65 143,63" fill="black" />
          <polygon points="150,9 158,11 140,61 132,59" fill="black" />
          <polygon points="107,78 119,86 98,116 113,126 93,156 81,148 101,118 86,108" fill="black" />
        </mask>
      </defs>
      <g mask="url(#fe-m)">
        <polygon points="20,8 52,8 180,192 148,192" fill="url(#fe-g)" />
        <polygon points="148,8 180,8 52,192 20,192" fill="url(#fe-g)" />
      </g>
    </svg>
  );
}
