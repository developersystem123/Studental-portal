import Link from "next/link";
import Icon from "@/components/icons";
import { Badge, Button, Card, CardBody } from "@/components/ui";

export const metadata = {
  title: "For Business — EduPortal",
  description:
    "Upskill your whole team with EduPortal for Business. Curated learning paths, AI tutoring, and admin reporting in one platform.",
};

const features = [
  {
    icon: <Icon.Users size={22} />,
    title: "Unlimited seats",
    description: "Bring 5 or 5,000 teammates. Invite them by email or sync via SCIM with one click.",
  },
  {
    icon: <Icon.ListChecks size={22} />,
    title: "Custom learning paths",
    description: "Bundle our courses (or your own) into role-specific paths for engineering, ops, sales, and more.",
  },
  {
    icon: <Icon.MessageSquare size={22} />,
    title: "Private AI tutor",
    description: "Your team's AI tutor stays inside your workspace and can be trained on your internal docs.",
  },
  {
    icon: <Icon.PieChart size={22} />,
    title: "Admin reporting",
    description: "Track engagement, completion, and skill growth — export to your HRIS or LMS in one click.",
  },
  {
    icon: <Icon.Lock size={22} />,
    title: "SSO & SCIM",
    description: "Okta, Google, Azure AD — plus role-based access control and audit logs for compliance teams.",
  },
  {
    icon: <Icon.Award size={22} />,
    title: "Co-branded certificates",
    description: "Issue certificates with your logo alongside ours, on completion of any path.",
  },
];

const useCases = [
  {
    title: "Engineering onboarding",
    description:
      "Get new hires productive in 30 days with role-specific paths covering your stack, codebase patterns, and team rituals.",
    icon: <Icon.Sparkles size={20} />,
  },
  {
    title: "Continuous upskilling",
    description:
      "Quarterly skill paths keep your team ahead of the curve. AI assesses gaps and recommends what to learn next.",
    icon: <Icon.TrendingUp size={20} />,
  },
  {
    title: "Compliance & certification",
    description:
      "Roll out mandatory training (security, accessibility, privacy) with deadline tracking and audit-ready logs.",
    icon: <Icon.CheckCircle size={20} />,
  },
];

const customers = [
  { name: "Lumenstack", quote: "Onboarding time dropped from 6 weeks to 19 days.", person: "Director of Eng" },
  { name: "Northwind Labs", quote: "90% of our engineers finished the security path in month one.", person: "CISO" },
  { name: "Helio Pay", quote: "The AI tutor handles questions our internal docs never could.", person: "Head of People" },
];

const compare = [
  { label: "Seats", team: "Up to 5", business: "Unlimited" },
  { label: "All courses", team: "Yes", business: "Yes + custom" },
  { label: "AI tutor", team: "Standard", business: "Private, trainable" },
  { label: "Admin reporting", team: "Basic", business: "Advanced + export" },
  { label: "SSO / SCIM", team: "—", business: "Included" },
  { label: "Custom paths", team: "—", business: "Unlimited" },
  { label: "Dedicated CSM", team: "—", business: "Yes" },
  { label: "SLA & priority support", team: "—", business: "24/7" },
];

export default function BusinessPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Badge variant="primary" className="mb-4">
              <Icon.Sparkles size={12} /> EduPortal for Business
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Skill up your <span className="gradient-text">entire team</span>, in one place.
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)]">
              The same AI-powered learning platform individuals love — now with admin controls, custom paths, and SSO.
              Trusted by teams from 10 to 10,000.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="/contact?reason=Partnership">
                <Button size="lg">
                  Talk to sales <Icon.ChevronRight size={18} />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  See pricing
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-[var(--muted-2)] uppercase tracking-wider font-semibold">
              Trusted by teams at
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
              <span>Lumenstack</span>
              <span>Northwind Labs</span>
              <span>Helio Pay</span>
              <span>Atrius</span>
              <span>Pinepoint</span>
            </div>
          </div>
          <Card className="relative overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-[var(--primary-soft)] to-transparent">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-[var(--muted)] uppercase font-semibold tracking-wider">Team dashboard</p>
                  <p className="text-lg font-bold mt-1">Engineering · Q2 2026</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3">
                  <p className="text-xs text-[var(--muted)]">Seats</p>
                  <p className="text-xl font-bold">128</p>
                </div>
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3">
                  <p className="text-xs text-[var(--muted)]">Active</p>
                  <p className="text-xl font-bold">94%</p>
                </div>
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3">
                  <p className="text-xs text-[var(--muted)]">Hours</p>
                  <p className="text-xl font-bold">1,204</p>
                </div>
              </div>
              <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                {[
                  { path: "Backend onboarding", progress: 86 },
                  { path: "AWS fundamentals", progress: 62 },
                  { path: "Security 101", progress: 100 },
                  { path: "React in depth", progress: 41 },
                ].map((p) => (
                  <div key={p.path} className="px-4 py-3 border-b border-[var(--border)] last:border-b-0">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium">{p.path}</span>
                      <span className="text-[var(--muted)] text-xs">{p.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">What you get</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Everything your team needs to learn</h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="h-full">
                <CardBody className="space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-400/15 text-[var(--primary)] flex items-center justify-center">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{f.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Common use cases</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">How teams use EduPortal</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {useCases.map((u) => (
            <Card key={u.title} className="h-full">
              <CardBody className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                  {u.icon}
                </div>
                <h3 className="font-semibold text-lg">{u.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{u.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Plans</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Team vs. Business</h2>
            <p className="mt-3 text-[var(--muted)]">
              Most teams under 5 do great on the Team plan. Need more? Business unlocks the full stack.
            </p>
          </div>
          <Card className="overflow-hidden">
            <div className="grid grid-cols-3 text-sm">
              <div className="bg-[var(--surface-2)] p-4 font-semibold text-[var(--muted)] uppercase tracking-wider text-xs">
                Feature
              </div>
              <div className="bg-[var(--surface-2)] p-4 font-semibold text-center text-xs uppercase tracking-wider text-[var(--muted)]">
                Team ($29/mo)
              </div>
              <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] p-4 font-semibold text-center text-xs uppercase tracking-wider text-white">
                Business
              </div>
              {compare.map((row, i) => (
                <div key={row.label} className="contents">
                  <div
                    className={
                      "p-4 border-t border-[var(--border)] font-medium" +
                      (i === compare.length - 1 ? " rounded-bl-2xl" : "")
                    }
                  >
                    {row.label}
                  </div>
                  <div className="p-4 border-t border-[var(--border)] text-center text-[var(--muted)]">
                    {row.team}
                  </div>
                  <div className="p-4 border-t border-[var(--border)] text-center font-semibold text-[var(--primary)]">
                    {row.business}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Customer stories</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Teams shipping faster</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {customers.map((c) => (
            <Card key={c.name} className="h-full">
              <CardBody className="space-y-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Icon.Star key={i} size={14} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed">&ldquo;{c.quote}&rdquo;</p>
                <div className="pt-2 border-t border-[var(--border)]">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-[var(--muted)]">{c.person}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-10 lg:p-14 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,.25),transparent_60%)]" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Ready to upskill your team?
              </h2>
              <p className="mt-3 text-white/85 max-w-md">
                Book a 30-minute call. We&apos;ll show you the admin console, scope your needs, and have you live in a
                week or less.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
              <Link href="/contact?reason=Partnership">
                <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90">
                  Talk to sales <Icon.ChevronRight size={18} />
                </Button>
              </Link>
              <a href="mailto:sales@eduportal.app">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  <Icon.Mail size={18} /> Email us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
