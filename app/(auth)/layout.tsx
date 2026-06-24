import type { ReactNode } from "react";
import Icon from "@/components/icons";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="force-light min-h-screen grid lg:grid-cols-2">
      {/* Left: Form panel — justify-between so the logo pins to the top and the
          footer to the bottom (mirroring the right panel), with the form
          centered between them. This fills the full column height on large
          screens instead of clustering everything in the middle. gap-10 keeps
          a comfortable minimum spacing on short viewports. */}
      <div className="relative flex flex-col p-6 sm:p-10 justify-between gap-10 overflow-hidden bg-[var(--background)]">
        {/* Background blobs */}
        <div className="absolute -top-48 -left-48 h-96 w-96 rounded-full bg-[var(--primary)]/7 blur-[100px] pointer-events-none" aria-hidden />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[var(--accent)]/6 blur-[80px] pointer-events-none" aria-hidden />

        {/* Logo */}
        <div className="relative flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Logo"
              width={34}
              height={34}
              className="rounded-xl shadow-md shadow-green-500/25 group-hover:shadow-green-500/40 group-hover:scale-105 transition-all duration-200 shrink-0"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold gradient-text">EduPortal</span>
              <span className="text-[10px] text-[var(--muted-2)] -mt-0.5 tracking-widest uppercase">Learn · Build · Grow</span>
            </div>
          </Link>

          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <Icon.ArrowLeft size={13} /> Back to home
          </Link>
        </div>

        {/* Form content */}
        <div className="relative flex justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Footer strip */}
        <div className="relative space-y-3">
          <div className="flex items-center justify-center gap-5 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <Icon.Lock size={11} className="text-[var(--primary)]" /> Secure & encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <Icon.CheckCircle size={11} className="text-[var(--primary)]" /> Free to join
            </span>
            <span className="flex items-center gap-1.5">
              <Icon.Sparkles size={11} className="text-[var(--primary)]" /> AI-powered
            </span>
          </div>
          <p className="text-xs text-[var(--muted-2)] text-center">
            © {new Date().getFullYear()} EduPortal. By continuing, you agree to our{" "}
            <Link href="/terms" className="hover:text-[var(--primary)] transition-colors underline underline-offset-2">Terms</Link>
            {" & "}
            <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Right: Illustration panel — intentionally theme-locked to always show green */}
      <div className="hidden lg:flex relative overflow-hidden m-5 rounded-3xl bg-linear-to-br from-green-700 via-green-600 to-green-500 text-white">
        <AuthArtworkBackground />
        <div className="relative p-10 flex flex-col justify-between w-full">
          {/* Top content */}
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border !border-white/20 font-medium">
              <Icon.Sparkles size={11} /> Powered by Claude AI
            </span>
            <div>
              <h1 className="text-[2.6rem] font-bold leading-tight mt-2">
                Learn smarter,<br />
                <span className="opacity-85">finish faster.</span>
              </h1>
              <p className="mt-3 text-white/80 max-w-sm text-sm leading-relaxed">
                Personalized study plans, AI tutoring, quiz generation, and assignment help —
                all in one beautiful learning hub.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { icon: <Icon.Sparkles size={11} />, label: "AI Tutor 24/7" },
                { icon: <Icon.Award size={11} />, label: "Certificates" },
                { icon: <Icon.TrendingUp size={11} />, label: "Progress tracking" },
              ].map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/12 border !border-white/15 font-medium">
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Hero illustration */}
          <div className="relative flex-1 flex items-center justify-center my-6">
            <AuthHeroSVG />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Active learners" value="12k+" />
            <Stat label="Courses" value="120+" />
            <Stat label="Avg. rating" value="4.8 ★" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-sm border !border-white/40 p-4 hover:bg-white/15 transition-colors">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-white/75 mt-0.5">{label}</p>
    </div>
  );
}

function AuthArtworkBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay">
        <svg viewBox="0 0 600 600" className="w-full h-full" aria-hidden>
          <defs>
            <pattern id="auth-dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-dots)" />
        </svg>
      </div>
      {/* Glow blobs */}
      <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/12 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-96 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
    </div>
  );
}

function AuthHeroSVG() {
  return (
    <svg
      viewBox="0 0 500 420"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md drop-shadow-[0_30px_50px_rgba(0,0,0,0.30)]"
      role="img"
      aria-label="EduPortal dashboard illustration"
    >
      <defs>
        <linearGradient id="h-pill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id="h-win" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
        <linearGradient id="h-orange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="h-purple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="h-sf" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.14" />
        </filter>
        <filter id="h-wf" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodOpacity="0.20" />
        </filter>
      </defs>

      {/* Background glows */}
      <circle cx="80" cy="80" r="55" fill="white" opacity="0.07" />
      <circle cx="440" cy="355" r="65" fill="white" opacity="0.06" />

      {/* Main app window */}
      <rect x="65" y="65" width="362" height="244" rx="18" fill="url(#h-win)" filter="url(#h-wf)" />
      <rect x="65" y="65" width="362" height="36" rx="18" fill="#f0fdf4" />
      <rect x="65" y="83" width="362" height="18" fill="#f0fdf4" />
      <circle cx="90" cy="83" r="5.5" fill="#fca5a5" />
      <circle cx="108" cy="83" r="5.5" fill="#fde68a" />
      <circle cx="126" cy="83" r="5.5" fill="#86efac" />
      <rect x="175" y="74" width="168" height="18" rx="9" fill="white" stroke="#bbf7d0" strokeWidth="1" />
      <rect x="190" y="80" width="80" height="6" rx="3" fill="#e2e8f0" />

      {/* Sidebar */}
      <rect x="65" y="101" width="78" height="208" fill="#f0fdf4" />
      <rect x="65" y="101" width="3" height="208" fill="url(#h-pill)" />
      <rect x="78" y="112" width="26" height="26" rx="7" fill="url(#h-pill)" />
      <text x="91" y="129" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="12" fontWeight="800" fill="white">E</text>
      <rect x="74" y="150" width="60" height="22" rx="8" fill="#dcfce7" />
      <rect x="80" y="157" width="32" height="6" rx="3" fill="#16a34a" />
      <rect x="78" y="184" width="48" height="5" rx="2.5" fill="#cbd5e1" />
      <rect x="78" y="200" width="40" height="5" rx="2.5" fill="#cbd5e1" />
      <rect x="78" y="216" width="44" height="5" rx="2.5" fill="#cbd5e1" />
      <rect x="78" y="232" width="36" height="5" rx="2.5" fill="#cbd5e1" />
      <circle cx="104" cy="286" r="13" fill="url(#h-pill)" />
      <text x="104" y="290" textAnchor="middle" fontFamily="system-ui" fontSize="8" fill="white" fontWeight="700">AS</text>

      {/* Content */}
      <text x="160" y="120" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700" fill="#0f172a">My Learning</text>
      <text x="160" y="133" fontFamily="system-ui,sans-serif" fontSize="7.5" fill="#94a3b8">3 in progress · 2 completed</text>

      {/* Course card 1 */}
      <rect x="158" y="142" width="126" height="86" rx="10" fill="white" stroke="#f0f0f0" strokeWidth="1" />
      <rect x="158" y="142" width="126" height="34" rx="10" fill="url(#h-orange)" />
      <rect x="158" y="160" width="126" height="16" fill="url(#h-orange)" />
      <text x="221" y="163" textAnchor="middle" fontFamily="system-ui" fontSize="9" fill="white" opacity="0.95">Python 101</text>
      <text x="166" y="191" fontFamily="system-ui" fontSize="7.5" fontWeight="600" fill="#0f172a">Python Basics</text>
      <text x="166" y="202" fontFamily="system-ui" fontSize="6.5" fill="#94a3b8">12 lessons · 4h 30m</text>
      <rect x="166" y="210" width="108" height="4" rx="2" fill="#f1f5f9" />
      <rect x="166" y="210" width="73" height="4" rx="2" fill="url(#h-orange)" />
      <text x="276" y="218" textAnchor="end" fontFamily="system-ui" fontSize="6" fill="#f97316" fontWeight="700">67%</text>

      {/* Course card 2 */}
      <rect x="296" y="142" width="122" height="86" rx="10" fill="white" stroke="#f0f0f0" strokeWidth="1" />
      <rect x="296" y="142" width="122" height="34" rx="10" fill="url(#h-purple)" />
      <rect x="296" y="160" width="122" height="16" fill="url(#h-purple)" />
      <text x="357" y="163" textAnchor="middle" fontFamily="system-ui" fontSize="9" fill="white" opacity="0.95">UI / UX Design</text>
      <text x="304" y="191" fontFamily="system-ui" fontSize="7.5" fontWeight="600" fill="#0f172a">UI Design Pro</text>
      <text x="304" y="202" fontFamily="system-ui" fontSize="6.5" fill="#94a3b8">18 lessons · 6h</text>
      <rect x="304" y="210" width="106" height="4" rx="2" fill="#f1f5f9" />
      <rect x="304" y="210" width="46" height="4" rx="2" fill="url(#h-purple)" />
      <text x="410" y="218" textAnchor="end" fontFamily="system-ui" fontSize="6" fill="#7c3aed" fontWeight="700">43%</text>

      {/* AI Chat */}
      <rect x="158" y="240" width="260" height="54" rx="10" fill="#fafafa" stroke="#f0f0f0" strokeWidth="1" />
      <circle cx="176" cy="259" r="11" fill="url(#h-pill)" />
      <text x="176" y="263" textAnchor="middle" fontFamily="system-ui" fontSize="8" fill="white" fontWeight="700">AI</text>
      <rect x="194" y="249" width="210" height="22" rx="8" fill="white" stroke="#e8e8e8" strokeWidth="1" />
      <text x="202" y="259" fontFamily="system-ui" fontSize="7" fill="#0f172a">How can I help you learn today?</text>
      <text x="202" y="268" fontFamily="system-ui" fontSize="6.5" fill="#94a3b8">Ask me anything about your courses</text>
      <rect x="194" y="279" width="153" height="10" rx="5" fill="white" stroke="#e8e8e8" strokeWidth="1" />
      <text x="200" y="287" fontFamily="system-ui" fontSize="6" fill="#d1d5db">Type a question...</text>
      <rect x="353" y="278" width="30" height="12" rx="6" fill="url(#h-pill)" />
      <text x="368" y="287" textAnchor="middle" fontFamily="system-ui" fontSize="10" fill="white">›</text>

      {/* Floating card 1: Achievement */}
      <g filter="url(#h-sf)" style={{ animation: "float-slow 6s ease-in-out infinite" }}>
        <rect x="6" y="12" width="118" height="54" rx="14" fill="white" />
        <circle cx="32" cy="39" r="18" fill="#fef9c3" />
        <text x="32" y="44" textAnchor="middle" fontSize="16">🏆</text>
        <text x="57" y="29" fontFamily="system-ui" fontSize="8" fontWeight="700" fill="#0f172a">Achievement!</text>
        <text x="57" y="40" fontFamily="system-ui" fontSize="7" fill="#16a34a" fontWeight="600">Course Complete</text>
        <text x="57" y="51" fontFamily="system-ui" fontSize="6.5" fill="#94a3b8">Python Basics ✓</text>
      </g>

      {/* Floating card 2: AI Tutor */}
      <g filter="url(#h-sf)" style={{ animation: "float-slow 5s ease-in-out infinite 0.6s" }}>
        <rect x="368" y="10" width="124" height="62" rx="14" fill="white" />
        <circle cx="388" cy="30" r="12" fill="url(#h-pill)" />
        <text x="388" y="34" textAnchor="middle" fontFamily="system-ui" fontSize="8" fill="white" fontWeight="700">AI</text>
        <text x="406" y="24" fontFamily="system-ui" fontSize="8.5" fontWeight="700" fill="#0f172a">AI Tutor</text>
        <circle cx="443" cy="20" r="4" fill="#22c55e" />
        <text x="450" y="24" fontFamily="system-ui" fontSize="6.5" fill="#94a3b8">Online</text>
        <text x="406" y="35" fontFamily="system-ui" fontSize="6.5" fill="#94a3b8">Available 24 / 7</text>
        <rect x="380" y="44" width="100" height="6" rx="3" fill="#f1f5f9" />
        <rect x="380" y="44" width="65" height="6" rx="3" fill="url(#h-pill)" opacity="0.5" />
        <text x="380" y="62" fontFamily="system-ui" fontSize="6.5" fill="#16a34a">Generating answer...</text>
      </g>

      {/* Floating card 3: Progress ring */}
      <g filter="url(#h-sf)" style={{ animation: "float-slow 5.5s ease-in-out infinite 0.4s" }}>
        <rect x="5" y="306" width="92" height="84" rx="14" fill="white" />
        <circle cx="51" cy="344" r="23" fill="none" stroke="#f1f5f9" strokeWidth="5.5" />
        <circle cx="51" cy="344" r="23" fill="none" stroke="#16a34a" strokeWidth="5.5"
          strokeDasharray="108 36" strokeLinecap="round"
          transform="rotate(-90 51 344)" />
        <text x="51" y="348" textAnchor="middle" fontFamily="system-ui" fontSize="10" fontWeight="800" fill="#0f172a">75%</text>
        <text x="51" y="372" textAnchor="middle" fontFamily="system-ui" fontSize="6.5" fill="#94a3b8">Overall</text>
        <text x="51" y="381" textAnchor="middle" fontFamily="system-ui" fontSize="6.5" fill="#94a3b8">Progress</text>
      </g>

      {/* Floating card 4: Learners */}
      <g filter="url(#h-sf)" style={{ animation: "float-slow 7s ease-in-out infinite 1s" }}>
        <rect x="362" y="308" width="132" height="58" rx="14" fill="white" />
        <text x="376" y="330" fontFamily="system-ui" fontSize="18" fontWeight="800" fill="#0f172a">12k+</text>
        <text x="376" y="342" fontFamily="system-ui" fontSize="7" fill="#94a3b8">Active Learners</text>
        <circle cx="376" cy="356" r="8" fill="#86efac" stroke="white" strokeWidth="2" />
        <circle cx="390" cy="356" r="8" fill="url(#h-pill)" stroke="white" strokeWidth="2" />
        <circle cx="404" cy="356" r="8" fill="url(#h-orange)" stroke="white" strokeWidth="2" />
        <circle cx="418" cy="356" r="8" fill="url(#h-purple)" stroke="white" strokeWidth="2" />
        <text x="432" y="360" fontFamily="system-ui" fontSize="6.5" fill="#94a3b8">+11,996</text>
      </g>

      {/* Tiny accents */}
      <circle cx="460" cy="200" r="5" fill="#fbbf24" style={{ animation: "float-slow 7s ease-in-out infinite" }} />
      <circle cx="30" cy="190" r="4" fill="white" opacity="0.4" style={{ animation: "float-slow 9s ease-in-out infinite 2s" }} />
      <rect x="456" y="132" width="12" height="12" rx="3" fill="white" opacity="0.3"
        transform="rotate(-15 462 138)"
        style={{ animation: "float-slow 8s ease-in-out infinite 1s" }} />
      <circle cx="250" cy="22" r="5" fill="#fbbf24" opacity="0.8"
        style={{ animation: "float-slow 6s ease-in-out infinite 0.5s" }} />
    </svg>
  );
}
