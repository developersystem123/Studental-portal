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
    description: "Every product decision starts with one question: does this help a student actually learn?",
  },
  {
    icon: <Icon.TrendingUp size={22} />,
    title: "Mastery over memorization",
    description: "We design for understanding — not for quick wins that fade after the test.",
  },
  {
    icon: <Icon.Award size={22} />,
    title: "Honest credentials",
    description: "Certificates that mean something, because they reflect real, verifiable progress.",
  },
];

const team = [
  { name: "Ananya Sharma", role: "Co-founder, Curriculum", initials: "AS" },
  { name: "Rohan Verma", role: "Co-founder, Engineering", initials: "RV" },
  { name: "Maya Patel", role: "Head of Design", initials: "MP" },
  { name: "Karan Mehta", role: "Head of Growth", initials: "KM" },
];

const stats = [
  { value: "48k+", label: "Active learners" },
  { value: "120+", label: "Expert courses" },
  { value: "92%", label: "Completion rate" },
  { value: "4.8", label: "Avg. rating" },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">About EduPortal</p>
          <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            We&apos;re building the most useful{" "}
            <span className="gradient-text">learning companion</span> in the world.
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)]">
            EduPortal started as a tiny experiment: what if every student had a patient, brilliant tutor available
            24/7? Today, we combine carefully crafted courses with AI assistance to make that real — for anyone, anywhere.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold gradient-text">{s.value}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Our mission</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Make great learning feel inevitable</h2>
          <p className="mt-4 text-[var(--muted)] leading-relaxed">
            Quality education is still gated by geography, cost, and confidence. We&apos;re tearing those walls down.
            Our platform pairs world-class instructors with an AI that adapts to how <em>you</em> learn — so progress
            stops feeling rare and starts feeling routine.
          </p>
          <p className="mt-4 text-[var(--muted)] leading-relaxed">
            We believe motivation is downstream of clarity. When a concept clicks, you keep going. EduPortal is engineered
            for those clicks.
          </p>
        </div>
        <Card className="overflow-hidden">
          <div className="aspect-[4/3] bg-gradient-to-br from-green-700 via-green-600 to-emerald-400 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,.3),transparent_60%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
              <Icon.Sparkles size={32} className="opacity-90" />
              <p className="mt-4 text-2xl sm:text-3xl font-semibold leading-tight max-w-md">
                &ldquo;The best teacher is the one who&apos;s patient enough to explain it twice.&rdquo;
              </p>
              <p className="mt-3 text-sm opacity-80">— EduPortal philosophy</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Values */}
      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">What we value</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Principles that guide our work</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {values.map((v) => (
              <Card key={v.title} className="h-full">
                <CardBody className="space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-400/15 text-[var(--primary)] flex items-center justify-center">
                    {v.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{v.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{v.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">The team</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Built by educators and engineers</h2>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {team.map((m) => (
            <Card key={m.name} className="h-full">
              <CardBody className="text-center">
                <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold inline-flex items-center justify-center text-2xl">
                  {m.initials}
                </div>
                <p className="mt-4 font-semibold">{m.name}</p>
                <p className="text-xs text-[var(--muted)]">{m.role}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 lg:p-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Come learn with us</h2>
          <p className="mt-3 text-[var(--muted)] max-w-xl mx-auto">
            Whether you&apos;re leveling up your career or curious about something new, there&apos;s a path here for you.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg">
                Get started free <Icon.ChevronRight size={18} />
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline">
                <Icon.Compass size={18} /> Browse courses
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
