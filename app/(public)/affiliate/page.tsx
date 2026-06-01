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
    <div>
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Affiliate program</p>
            <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Earn while you <span className="gradient-text">share what you love</span>.
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)]">
              Tell your audience about EduPortal and earn 30% recurring commission on every Pro subscription. Honest
              tools, generous payouts, no hard sells.
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
          </div>
          <Card className="relative overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-[var(--primary-soft)] to-transparent">
              <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold">Earnings simulator</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
                  <p className="text-xs text-[var(--muted)]">10 referrals/mo</p>
                  <p className="text-2xl font-bold mt-1 gradient-text">$359/mo</p>
                  <p className="text-[10px] text-[var(--muted-2)] mt-0.5">After year 1</p>
                </div>
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
                  <p className="text-xs text-[var(--muted)]">50 referrals/mo</p>
                  <p className="text-2xl font-bold mt-1 gradient-text">$1,798/mo</p>
                  <p className="text-[10px] text-[var(--muted-2)] mt-0.5">After year 1</p>
                </div>
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
                  <p className="text-xs text-[var(--muted)]">100 referrals/mo</p>
                  <p className="text-2xl font-bold mt-1 gradient-text">$3,597/mo</p>
                  <p className="text-[10px] text-[var(--muted-2)] mt-0.5">After year 1</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white p-4">
                  <p className="text-xs opacity-85">250 referrals/mo</p>
                  <p className="text-2xl font-bold mt-1">$8,992/mo</p>
                  <p className="text-[10px] opacity-75 mt-0.5">After year 1</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Assumes Pro plan at $9.99/mo, average 12-month retention, no annual upgrades.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[var(--border)] bg-[var(--surface)]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Why join</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">A program built for serious creators</h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {perks.map((p) => (
              <Card key={p.title} className="h-full">
                <CardBody className="space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-400/15 text-[var(--primary)] flex items-center justify-center">
                    {p.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{p.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{p.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Who it&apos;s for</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Built for these creators</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {audiences.map((a) => (
            <Card key={a.title} className="h-full">
              <CardBody className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                  {a.icon}
                </div>
                <h3 className="font-semibold text-lg">{a.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{a.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Tiers</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">The more you refer, the more you earn</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {tiers.map((t, i) => (
              <Card key={t.name} className={i === 2 ? "ring-2 ring-[var(--primary)]" : undefined}>
                <CardBody className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold">{t.name}</p>
                  <p className="text-2xl font-bold">
                    {t.min}+ <span className="text-sm text-[var(--muted)] font-normal">referrals/quarter</span>
                  </p>
                  <ul className="space-y-2 pt-2">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm">
                        <Icon.CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
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
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Apply</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Get your unique link</h2>
          <p className="mt-4 text-[var(--muted)] leading-relaxed">
            Tell us about your audience. We review and approve most applications within 2–3 business days. No upfront
            fees, no minimums to start.
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
