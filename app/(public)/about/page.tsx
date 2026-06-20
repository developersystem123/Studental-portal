import Link from "next/link";
import Icon from "@/components/icons";
import { Button, Card, CardBody } from "@/components/ui";

export const metadata = {
  title: "About — EduPortal",
  description:
    "EduPortal blends expert-led courses with AI tutoring, so students learn faster, deeper, and at their own pace.",
};

const values = [
  {
    icon: <Icon.Sparkles size={22} />,
    title: "Learners first",
    description:
      "Every product decision starts with one question: does this genuinely help a student learn better?",
    color: "from-violet-500/15 to-purple-400/10 text-violet-600 dark:text-violet-400",
  },
  {
    icon: <Icon.TrendingUp size={22} />,
    title: "Mastery over memorization",
    description:
      "We design for deep understanding — not quick wins that fade after the exam.",
    color: "from-emerald-500/15 to-teal-400/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: <Icon.Award size={22} />,
    title: "Honest credentials",
    description:
      "Certificates that mean something, because they reflect real, verifiable progress.",
    color: "from-amber-500/15 to-orange-400/10 text-amber-600 dark:text-amber-400",
  },
  {
    icon: <Icon.Users size={22} />,
    title: "Access for everyone",
    description:
      "World-class education shouldn't depend on your zip code, bank account, or background.",
    color: "from-sky-500/15 to-blue-400/10 text-sky-600 dark:text-sky-400",
  },
  {
    icon: <Icon.Lock size={22} />,
    title: "Privacy by design",
    description:
      "Your learning data is yours. We never sell personal information to third parties.",
    color: "from-rose-500/15 to-pink-400/10 text-rose-600 dark:text-rose-400",
  },
  {
    icon: <Icon.Sparkles size={22} />,
    title: "AI as a tutor, not a crutch",
    description:
      "Our AI guides thinking, asks questions, and explains — it doesn't just give answers.",
    color: "from-green-500/15 to-emerald-400/10 text-[var(--primary)]",
  },
];

const team = [
  {
    name: "Ananya Sharma",
    role: "Co-founder & CEO",
    department: "Curriculum",
    bio: "Former IIT professor. Built courses for 200k+ students before founding EduPortal.",
    initials: "AS",
    color: "from-violet-500 to-purple-600",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&q=80",
  },
  {
    name: "Rohan Verma",
    role: "Co-founder & CTO",
    department: "Engineering",
    bio: "Ex-Google. Believes every engineer should be able to explain what they build to a 12-year-old.",
    initials: "RV",
    color: "from-sky-500 to-blue-600",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80",
  },
  {
    name: "Maya Patel",
    role: "Head of Design",
    department: "Product",
    bio: "Previously led design at Notion India. Obsessed with making complex things feel simple.",
    initials: "MP",
    color: "from-rose-500 to-pink-600",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&q=80",
  },
  {
    name: "Karan Mehta",
    role: "Head of Growth",
    department: "Marketing",
    bio: "Grew two edtech startups from 0 to 1M users. Passionate about democratizing learning.",
    initials: "KM",
    color: "from-amber-500 to-orange-600",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&q=80",
  },
];

const stats = [
  { value: "48k+", label: "Active learners", icon: <Icon.Users size={20} />, color: "text-violet-500" },
  { value: "120+", label: "Expert courses",  icon: <Icon.Book size={20} />,  color: "text-emerald-500" },
  { value: "92%",  label: "Completion rate", icon: <Icon.Award size={20} />, color: "text-amber-500"  },
  { value: "4.8",  label: "Avg. rating",     icon: <Icon.Star size={20} />,  color: "text-sky-500"   },
];

const milestones = [
  { year: "2021", title: "The idea sparks", description: "Two professors, frustrated by expensive EdTech, sketch EduPortal on a whiteboard." },
  { year: "2022", title: "First 1,000 students", description: "Beta launch with 12 courses. Students in 34 countries within 6 months." },
  { year: "2023", title: "AI tutor launched", description: "First EdTech platform to integrate Claude AI as a real-time, Socratic tutor." },
  { year: "2024", title: "48k+ learners", description: "Expanded to 120+ courses, physical class network, and Pro subscription tier." },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden">

      {/* ── Hero ────────────────────────────────── */}
      <section className="relative">
        {/* Background */}
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute -top-40 right-0 w-[700px] h-[600px] rounded-full bg-gradient-to-bl from-[var(--primary)]/10 via-[var(--accent)]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 lg:pt-20 pb-16 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Left */}
            <div className="reveal-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold mb-5 uppercase tracking-wider">
                <Icon.Sparkles size={12} /> About EduPortal
              </div>
              <h1 className="text-4xl sm:text-5xl xl:text-[3.4rem] font-bold tracking-tight leading-[1.1] text-balance">
                We&apos;re building the world&apos;s most{" "}
                <span className="gradient-text">useful learning companion</span>.
              </h1>
              <p className="mt-5 text-lg text-[var(--muted)] leading-relaxed max-w-lg">
                EduPortal started as a tiny experiment: what if every student had a patient, brilliant tutor available 24/7?
                Today, we combine carefully crafted courses with AI assistance to make that real — for anyone, anywhere.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button size="lg">
                    Join EduPortal <Icon.ChevronRight size={16} />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline">
                    <Icon.Book size={16} /> Explore courses
                  </Button>
                </Link>
              </div>

              {/* Quick trust row */}
              <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <Icon.CheckCircle size={13} className="text-[var(--primary)]" /> Free to join
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon.CheckCircle size={13} className="text-[var(--primary)]" /> No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon.CheckCircle size={13} className="text-[var(--primary)]" /> AI tutor included
                </span>
              </div>
            </div>

            {/* Right — hero image */}
            <div className="hidden lg:block relative">
              {/* Main image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&h=520&fit=crop&q=85"
                  alt="Students collaborating and learning together"
                  className="w-full h-[420px] object-cover"
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Floating: students count */}
              <div className="absolute -bottom-5 -left-6 bg-[var(--surface)] rounded-2xl px-4 py-3 border border-[var(--border)] shadow-xl shadow-black/10 flex items-center gap-3 pop-in">
                <div className="flex -space-x-2">
                  {["photo-1535713875002-d1d0cf377fde", "photo-1494790108377-be9c29b29330", "photo-1507003211169-0a1dd7228f2d"].map((id, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={`https://images.unsplash.com/${id}?w=40&h=40&fit=crop&q=80`} alt=""
                      className="h-8 w-8 rounded-full ring-2 ring-[var(--surface)] object-cover" />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold">48k+ learners</p>
                  <p className="text-[10px] text-[var(--muted)]">Join the community</p>
                </div>
              </div>

              {/* Floating: rating */}
              <div className="absolute -top-5 -right-4 bg-[var(--surface)] rounded-2xl px-4 py-3 border border-[var(--border)] shadow-xl shadow-black/10 pop-in" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Icon.Star size={17} className="fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-none">4.8 / 5</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">Avg. course rating</p>
                  </div>
                </div>
              </div>

              {/* Floating: AI badge */}
              <div className="absolute top-1/2 -left-6 -translate-y-1/2 flex items-center gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-xl px-3 py-2 shadow-lg shadow-green-500/25 pop-in text-xs font-bold" style={{ animationDelay: "0.4s" }}>
                <Icon.Sparkles size={12} /> AI-Powered
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────── */}
      <section className="relative border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center group">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[var(--surface-2)] mb-3 mx-auto transition-transform group-hover:scale-110 ${s.color}`}>
                  {s.icon}
                </div>
                <p className="text-3xl sm:text-4xl font-bold gradient-text">{s.value}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 items-center">
        {/* Image */}
        <div className="relative order-2 lg:order-1">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/12 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=640&h=500&fit=crop&q=85"
              alt="Engaged classroom learning session"
              className="w-full h-[420px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          {/* Overlay card */}
          <div className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-[var(--surface)]/95 backdrop-blur-sm rounded-2xl p-4 border border-[var(--border)] shadow-lg">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <Icon.Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  &ldquo;The best teacher is the one who&apos;s patient enough to explain it twice.&rdquo;
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">— EduPortal philosophy</p>
              </div>
            </div>
          </div>

          {/* Completion badge */}
          <div className="absolute -top-4 -right-4 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl px-4 py-3 shadow-lg shadow-green-500/20 text-center">
            <p className="text-2xl font-bold">92%</p>
            <p className="text-[10px] font-medium opacity-85">completion rate</p>
          </div>
        </div>

        {/* Text */}
        <div className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
            <span className="h-px w-6 bg-[var(--primary)] inline-block" /> Our mission
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
            Make great learning feel <span className="gradient-text">inevitable</span>
          </h2>
          <div className="mt-5 space-y-4 text-[var(--muted)] leading-relaxed">
            <p>
              Quality education is still gated by geography, cost, and confidence. We&apos;re tearing those walls down.
              Our platform pairs world-class instructors with an AI that adapts to how <em className="text-[var(--foreground)] not-italic font-medium">you</em> learn.
            </p>
            <p>
              We believe motivation is downstream of clarity. When a concept clicks, you keep going. EduPortal is engineered for those clicks.
            </p>
          </div>

          {/* Mission bullets */}
          <div className="mt-7 space-y-3">
            {[
              "AI tutor that adapts to your pace and style",
              "Expert-crafted curriculum, not recycled slides",
              "Verifiable certificates with blockchain backing",
              "Offline support & mobile-first design",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm text-[var(--foreground)]">
                <span className="h-5 w-5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon.Check size={11} strokeWidth={3} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our story / Timeline ────────────────── */}
      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
              <span className="h-px w-6 bg-[var(--primary)] inline-block" /> Our story
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">From whiteboard sketch to 48k learners</h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--border-strong)] to-transparent hidden md:block" />

            <div className="space-y-10 md:space-y-0">
              {milestones.map((m, i) => (
                <div key={m.year} className={`md:grid md:grid-cols-2 md:gap-8 items-center ${i % 2 !== 0 ? "md:rtl" : ""}`}>
                  {/* Content */}
                  <div className={`pb-8 md:pb-0 ${i % 2 !== 0 ? "md:ltr text-right" : ""}`}>
                    <Card className="p-5 hover-lift inline-block w-full text-left">
                      <div className="flex items-start gap-4">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[var(--primary-soft)] to-[var(--surface-2)] text-[var(--primary)] font-bold text-sm flex items-center justify-center shrink-0 border border-[var(--primary)]/15">
                          {m.year}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--foreground)]">{m.title}</p>
                          <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">{m.description}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Center dot */}
                  <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 translate-y-4">
                    <div className="h-4 w-4 rounded-full bg-[var(--primary)] ring-4 ring-[var(--background)] shadow-sm" />
                  </div>

                  {/* Spacer */}
                  <div />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
            <span className="h-px w-6 bg-[var(--primary)] inline-block" /> What we value
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">Principles that guide every decision</h2>
          <p className="mt-3 text-[var(--muted)]">
            We hold these not as slogans but as actual filters — things we check ourselves against when building.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((v, i) => (
            <Card key={v.title} className="h-full group hover-lift">
              <CardBody className="space-y-4">
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center shadow-sm border border-[var(--border)] group-hover:scale-105 transition-transform`}>
                  {v.icon}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-2)] mb-1.5">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-bold text-lg leading-snug">{v.title}</h3>
                  <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">{v.description}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Team ────────────────────────────────── */}
      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
              <span className="h-px w-6 bg-[var(--primary)] inline-block" /> The team
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Built by educators and engineers</h2>
            <p className="mt-3 text-[var(--muted)]">
              People who&apos;ve been students, teachers, and builders — and know the gap between those worlds.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((m) => (
              <Card key={m.name} className="h-full group hover-lift overflow-hidden">
                {/* Photo area */}
                <div className="relative h-48 overflow-hidden bg-[var(--surface-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                  {/* Department badge */}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 text-white text-[10px] font-bold">
                    {m.department}
                  </div>
                </div>

                <CardBody className="space-y-3">
                  <div>
                    <p className="font-bold text-[var(--foreground)]">{m.name}</p>
                    <p className="text-xs text-[var(--primary)] font-semibold mt-0.5">{m.role}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{m.bio}</p>

                  {/* Social links placeholder */}
                  <div className="flex items-center gap-2 pt-1">
                    <button className="h-7 w-7 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] text-[var(--muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all" aria-label="Twitter">
                      <Icon.Send size={12} />
                    </button>
                    <button className="h-7 w-7 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] text-[var(--muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all" aria-label="LinkedIn">
                      <Icon.Users size={12} />
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Hiring CTA */}
          <div className="mt-12 text-center">
            <p className="text-[var(--muted)] text-sm mb-3">We&apos;re growing the team.</p>
            <Link href="/careers">
              <Button variant="outline">
                <Icon.Users size={15} /> View open roles
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Culture image strip ──────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-3xl overflow-hidden">
          {[
            { src: "photo-1531482615713-2afd69097998", alt: "Team workshop session" },
            { src: "photo-1519389950473-47ba0277781c", alt: "Students working on laptops" },
            { src: "photo-1543269865-cbf427effbad", alt: "Online learning at home" },
            { src: "photo-1552664730-d307ca884978", alt: "Collaborative study group" },
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

      {/* ── CTA ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] via-[color-mix(in_oklab,var(--primary)_70%,var(--accent))] to-[var(--accent)] text-white">
          {/* Dot pattern */}
          <div className="absolute inset-0 bg-dots opacity-15 mix-blend-overlay pointer-events-none" />
          {/* Glow blobs */}
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/8 blur-3xl" />

          <div className="relative grid lg:grid-cols-2 gap-8 items-center px-8 sm:px-12 py-12 lg:py-16">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/15 border border-white/20 font-semibold mb-5">
                <Icon.Sparkles size={11} /> Join 48k+ learners
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                Come learn with us
              </h2>
              <p className="mt-3 text-white/80 max-w-md leading-relaxed">
                Whether you&apos;re leveling up your career or curious about something new — there&apos;s a path here for you.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 shadow-lg shadow-black/20 font-semibold">
                    Get started free <Icon.ChevronRight size={16} />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                    <Icon.Compass size={16} /> Browse courses
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/60">No credit card required. Free forever plan available.</p>
            </div>

            {/* Right: image */}
            <div className="hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&h=320&fit=crop&q=85"
                  alt="Student learning online with laptop"
                  className="w-full h-[260px] object-cover"
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
