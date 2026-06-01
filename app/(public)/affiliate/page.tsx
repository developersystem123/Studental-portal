"use client";

import * as React from "react";
import Link from "next/link";
import Icon from "@/components/icons";
import { Button, Card, CardBody, Input, Label, Select, Textarea, useToast } from "@/components/ui";

const perks = [
  {
    icon: <Icon.TrendingUp size={22} />,
    title: "30% recurring commission",
    description: "For every Pro subscription you refer, you earn 30% — for as long as they stay subscribed.",
  },
  {
    icon: <Icon.Clock size={22} />,
    title: "60-day cookie window",
    description: "Plenty of time between click and signup. We attribute fairly across devices.",
  },
  {
    icon: <Icon.Award size={22} />,
    title: "Tiered bonuses",
    description: "Hit 25, 50, or 100 referrals/quarter and unlock bonus payouts and exclusive perks.",
  },
  {
    icon: <Icon.PieChart size={22} />,
    title: "Real-time dashboard",
    description: "Track clicks, signups, and earnings with UTM-level insights and downloadable reports.",
  },
  {
    icon: <Icon.Send size={22} />,
    title: "Creative kit",
    description: "Banners, social cards, demo videos, and copy templates — refreshed every quarter.",
  },
  {
    icon: <Icon.Mail size={22} />,
    title: "Dedicated affiliate manager",
    description: "Once you hit 50 referrals/quarter, get a direct line to a real human at EduPortal.",
  },
];

const audiences = [
  {
    title: "Creators & educators",
    description: "YouTubers, newsletter writers, course teachers — your audience already trusts your recs.",
    icon: <Icon.Video size={20} />,
  },
  {
    title: "Communities & forums",
    description: "Discord admins, subreddit mods, Slack workspace owners — give your community a member perk.",
    icon: <Icon.Users size={20} />,
  },
  {
    title: "Bloggers & SEO sites",
    description: "Review sites, tutorial blogs, comparison guides — we'll provide everything you need to rank.",
    icon: <Icon.Globe size={20} />,
  },
];

const tiers = [
  { name: "Starter", min: "0", perks: ["30% recurring", "60-day cookie", "Creative kit"] },
  { name: "Plus", min: "25", perks: ["All Starter perks", "+5% bonus on Pro annual", "Affiliate Slack access"] },
  { name: "Elite", min: "100", perks: ["All Plus perks", "+10% bonus + custom UTMs", "Co-marketing slots", "Direct manager"] },
];

const faqs = [
  {
    q: "Who can join the program?",
    a: "Anyone with an audience — creators, educators, bloggers, community admins. We approve based on alignment with our learner community.",
  },
  {
    q: "When do I get paid?",
    a: "Monthly payouts on the 15th, via Stripe, PayPal, or wire. Minimum payout is $50; balances roll over.",
  },
  {
    q: "Can I promote on paid ads?",
    a: "Yes, with restrictions — no bidding on EduPortal-branded keywords, no incentivized clicks. Full policy is in the affiliate agreement.",
  },
  {
    q: "Do you support multi-language audiences?",
    a: "Yes! Our platform serves learners in 30+ countries. Localized landing pages are available in 8 languages today.",
  },
];

export default function AffiliatePage() {
  const toast = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    audience: "Creator (video / podcast)",
    size: "1k - 10k",
    pitch: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof form, string>>>({});

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email.";
    if (form.pitch.trim().length < 20) next.pitch = "Tell us a bit more about your audience.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setForm({ name: "", email: "", audience: "Creator (video / podcast)", size: "1k - 10k", pitch: "" });
      toast.push({
        title: "Application received",
        description: "We'll review and send your unique link within 2-3 days.",
        tone: "success",
      });
    }, 800);
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-5">
              <Icon.TrendingUp size={12} /> Affiliate program
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-[3.3rem] font-bold tracking-tight leading-[1.1] text-balance">
              Earn while you <span className="gradient-text">share what you love</span>.
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)] leading-relaxed max-w-lg">
              Tell your audience about EduPortal and earn <strong className="text-[var(--foreground)]">30% recurring commission</strong> on every Pro subscription. Honest tools, generous payouts, no hard sells.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="#apply">
                <Button size="lg">
                  Join the program <Icon.ChevronRight size={18} />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline">
                  How it works
                </Button>
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-1.5"><Icon.Check size={13} className="text-emerald-500" /> Free to join</span>
              <span className="flex items-center gap-1.5"><Icon.Check size={13} className="text-emerald-500" /> Monthly payouts</span>
              <span className="flex items-center gap-1.5"><Icon.Check size={13} className="text-emerald-500" /> 60-day cookie</span>
            </div>
          </div>

          {/* Right: image + earnings card */}
          <div className="relative">
            {/* Main photo */}
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=700&h=480&fit=crop&q=85"
                alt="Content creator at desk with laptop"
                className="w-full h-[320px] object-cover"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Floating earnings card */}
            <div className="absolute -bottom-5 -left-5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl p-4 pop-in min-w-[160px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-2)] mb-1">Top earner / mo</p>
              <p className="text-2xl font-extrabold gradient-text">$8,992</p>
              <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-0.5"><Icon.TrendingUp size={10} /> 250 referrals</p>
            </div>

            {/* Floating commission badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl px-4 py-3 shadow-lg shadow-green-500/25 pop-in" style={{ animationDelay: "0.2s" }}>
              <p className="text-xl font-extrabold">30%</p>
              <p className="text-[10px] font-semibold opacity-85">Recurring commission</p>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings simulator - now as full-width section */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Earnings simulator</p>
            <h2 className="text-2xl font-bold mt-1">What could you make?</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { referrals: "10/mo", earnings: "$359/mo", note: "After year 1", highlight: false },
              { referrals: "50/mo", earnings: "$1,798/mo", note: "After year 1", highlight: false },
              { referrals: "100/mo", earnings: "$3,597/mo", note: "After year 1", highlight: true },
              { referrals: "250/mo", earnings: "$8,992/mo", note: "Elite tier", highlight: false },
            ].map((t) => (
              <Card key={t.referrals} className={t.highlight ? "ring-2 ring-[var(--primary)] relative" : ""}>
                {t.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold">Most popular</div>
                )}
                <CardBody className="text-center space-y-2 py-5">
                  <p className="text-xs text-[var(--muted)] font-semibold">{t.referrals} referrals</p>
                  <p className="text-2xl font-bold gradient-text">{t.earnings}</p>
                  <p className="text-[10px] text-[var(--muted-2)]">{t.note}</p>
                </CardBody>
              </Card>
            ))}
          </div>
          <p className="text-center mt-4 text-xs text-[var(--muted)]">
            Assumes Pro plan at $9.99/mo · avg 12-month retention · no annual upgrades
          </p>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[var(--border)] bg-[var(--surface)]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
              <span className="h-px w-6 bg-[var(--primary)] inline-block" /> Why join
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">A program built for serious creators</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {perks.map((p, i) => {
              const colors = [
                "from-emerald-500/15 to-teal-400/10 text-emerald-600 dark:text-emerald-400",
                "from-sky-500/15 to-blue-400/10 text-sky-600 dark:text-sky-400",
                "from-amber-500/15 to-orange-400/10 text-amber-600 dark:text-amber-400",
                "from-violet-500/15 to-purple-400/10 text-violet-600 dark:text-violet-400",
                "from-rose-500/15 to-pink-400/10 text-rose-600 dark:text-rose-400",
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


      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
            <span className="h-px w-6 bg-[var(--primary)] inline-block" /> Who it&apos;s for
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">Built for these creators</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {audiences.map((a, i) => {
            const imgs = [
              "photo-1611532736597-de2d4265fba3",
              "photo-1543269865-cbf427effbad",
              "photo-1519389950473-47ba0277781c",
            ];
            return (
              <Card key={a.title} className="h-full overflow-hidden group hover-lift">
                <div className="relative h-36 overflow-hidden bg-[var(--surface-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://images.unsplash.com/${imgs[i]}?w=400&h=200&fit=crop&q=80`}
                    alt={a.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 h-8 w-8 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center border border-white/25">
                    {a.icon}
                  </div>
                </div>
                <CardBody className="space-y-2">
                  <h3 className="font-bold text-lg">{a.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{a.description}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
              <span className="h-px w-6 bg-[var(--primary)] inline-block" /> Commission tiers
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">The more you refer, the more you earn</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {tiers.map((t, i) => (
              <Card key={t.name} className={`relative ${i === 2 ? "ring-2 ring-[var(--primary)] shadow-lg shadow-green-500/10" : ""}`}>
                {i === 2 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold">
                    Most powerful
                  </div>
                )}
                <CardBody className="space-y-4 pt-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[var(--muted-2)] font-bold">{t.name}</p>
                    <p className="text-2xl font-bold mt-1">
                      {t.min}+ <span className="text-sm text-[var(--muted)] font-normal">referrals/quarter</span>
                    </p>
                  </div>
                  <ul className="space-y-2.5 pt-1 border-t border-[var(--border)]">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm">
                        <Icon.CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
            <span className="h-px w-6 bg-[var(--primary)] inline-block" /> Apply
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">Get your unique link</h2>
          <p className="mt-4 text-[var(--muted)] leading-relaxed">
            Tell us about your audience. We review and approve most applications within 2–3 business days. No upfront fees, no minimums to start.
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
                  <Label htmlFor="a-name">Your name</Label>
                  <Input
                    id="a-name"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    error={errors.name}
                  />
                </div>
                <div>
                  <Label htmlFor="a-email">Email</Label>
                  <Input
                    id="a-email"
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
                  <Label htmlFor="a-audience">Type of audience</Label>
                  <Select
                    id="a-audience"
                    value={form.audience}
                    onChange={(e) => update("audience", e.target.value)}
                  >
                    {[
                      "Creator (video / podcast)",
                      "Newsletter writer",
                      "Blogger / SEO site",
                      "Community / forum",
                      "Educator",
                      "Other",
                    ].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="a-size">Audience size</Label>
                  <Select id="a-size" value={form.size} onChange={(e) => update("size", e.target.value)}>
                    {["< 1k", "1k - 10k", "10k - 100k", "100k - 1M", "1M+"].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="a-pitch">Tell us about your audience</Label>
                <Textarea
                  id="a-pitch"
                  rows={5}
                  placeholder="What do you publish, who reads it, and how would you promote EduPortal?"
                  value={form.pitch}
                  onChange={(e) => update("pitch", e.target.value)}
                  error={errors.pitch}
                />
              </div>
              <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                <p className="text-xs text-[var(--muted)]">
                  You&apos;ll need to agree to our affiliate{" "}
                  <Link href="/terms" className="text-[var(--primary)] hover:underline">
                    terms
                  </Link>
                  .
                </p>
                <Button type="submit" loading={submitting}>
                  <Icon.Send size={16} /> Apply
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </section>

      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">FAQ</p>
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
