"use client";

import * as React from "react";
import Icon from "@/components/icons";
import { Button, Card, CardBody, Input, Label, Select, Textarea, useToast } from "@/components/ui";
import { validateEmail, validateLength, validateName } from "@/lib/validation";
import { cn } from "@/lib/utils";

const reasons = [
  "General question",
  "Course suggestion",
  "Partnership",
  "Bug or feedback",
  "Press",
];

const channels = [
  {
    icon: <Icon.Mail size={20} />,
    title: "Email us",
    description: "We reply within 1 business day, guaranteed.",
    value: "hello@eduportal.app",
    href: "mailto:hello@eduportal.app",
    color: "from-violet-500/15 to-purple-400/10 text-violet-600 dark:text-violet-400",
    badge: "< 24h",
  },
  {
    icon: <Icon.MessageSquare size={20} />,
    title: "Live chat",
    description: "Instant answers from our team. Weekdays 9am–6pm.",
    value: "Open in-app chat",
    href: "/dashboard",
    color: "from-emerald-500/15 to-teal-400/10 text-[var(--primary)]",
    badge: "Online now",
    badgeLive: true,
  },
  {
    icon: <Icon.Users size={20} />,
    title: "Community forum",
    description: "3,000+ learners who can help you instantly.",
    value: "Visit the forum",
    href: "/forum",
    color: "from-sky-500/15 to-blue-400/10 text-sky-600 dark:text-sky-400",
    badge: "Community",
  },
  {
    icon: <Icon.Book size={20} />,
    title: "Help Center",
    description: "500+ articles and how-to guides. Search first.",
    value: "Search help docs",
    href: "/help",
    color: "from-amber-500/15 to-orange-400/10 text-amber-600 dark:text-amber-400",
    badge: "500+ articles",
  },
];

const faqs = [
  {
    q: "How fast will you respond?",
    a: "Email within 1 business day. Live chat is instant on weekdays. Community forum often answers within the hour.",
  },
  {
    q: "I have a bug — what info should I include?",
    a: "Your browser, OS, the page URL, and a short description of what you expected vs. what happened. A screenshot helps enormously.",
  },
  {
    q: "Can I request a refund?",
    a: "Yes — within 30 days of purchase with no questions asked. Select 'Bug or feedback' in the form and we'll process it fast.",
  },
  {
    q: "How do I become a teacher on EduPortal?",
    a: "Head to /teach and fill out the application. Our team reviews all applications within 3 business days.",
  },
];

export default function ContactPage() {
  const toast = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    reason: reasons[0],
    message: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof form, string>>>({});

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    const nameErr    = validateName(form.name, "Your name");
    const emailErr   = validateEmail(form.email);
    const messageErr = validateLength(form.message, "Message", 10, 2000);
    if (nameErr)    next.name    = nameErr;
    if (emailErr)   next.email   = emailErr;
    if (messageErr) next.message = messageErr;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        toast.push({ title: "Couldn't send message", description: data.error ?? "Please try again.", tone: "danger" });
        return;
      }
      setSubmittedEmail(form.email);
      setForm({ name: "", email: "", reason: reasons[0], message: "" });
      setSubmitted(true);
      toast.push({ title: "Message sent!", description: "Thanks — we'll be in touch shortly.", tone: "success" });
    } catch {
      toast.push({ title: "Network error", description: "Please check your connection and try again.", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden">

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative">
        {/* BG layers */}
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute -top-32 right-0 w-[600px] h-[500px] rounded-full bg-gradient-to-bl from-[var(--primary)]/10 via-[var(--accent)]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 lg:pt-20 pb-16 lg:pb-20">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Left */}
            <div className="reveal-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-5">
                <Icon.MessageSquare size={12} /> Get in touch
              </div>
              <h1 className="text-4xl sm:text-5xl xl:text-[3.3rem] font-bold tracking-tight leading-[1.1] text-balance">
                Talk to a{" "}
                <span className="gradient-text">real human</span>.
              </h1>
              <p className="mt-4 text-lg text-[var(--muted)] leading-relaxed max-w-lg">
                Questions about a course, a partnership idea, or just want to say hi? Drop us a note and we&apos;ll get back fast.
              </p>

              {/* Response time badges */}
              <div className="mt-7 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm shadow-sm">
                  <span className="status-dot online" />
                  <span className="font-medium text-[var(--foreground)]">Live chat online</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm shadow-sm">
                  <Icon.Clock size={14} className="text-[var(--primary)]" />
                  <span className="font-medium text-[var(--foreground)]">Email reply &lt; 24h</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm shadow-sm">
                  <Icon.CheckCircle size={14} className="text-emerald-500" />
                  <span className="font-medium text-[var(--foreground)]">99.8% satisfaction</span>
                </div>
              </div>
            </div>

            {/* Right — image */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&h=500&fit=crop&q=85"
                  alt="Friendly support team ready to help"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
              </div>

              {/* Floating: average reply time */}
              <div className="absolute -bottom-5 -left-6 bg-[var(--surface)] rounded-2xl px-4 py-3 border border-[var(--border)] shadow-xl flex items-center gap-3 pop-in">
                <div className="h-9 w-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Icon.Clock size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">Avg. 4 hours</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">Email response time</p>
                </div>
              </div>

              {/* Floating: satisfaction */}
              <div className="absolute -top-4 -right-4 bg-[var(--surface)] rounded-2xl px-4 py-3 border border-[var(--border)] shadow-xl flex items-center gap-3 pop-in" style={{ animationDelay: "0.25s" }}>
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Icon.Star size={16} className="fill-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">99.8%</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">Satisfaction rate</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Contact channels ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map((c) => (
            <a key={c.title} href={c.href} className="group block">
              <Card className="h-full card-interactive">
                <CardBody className="space-y-3.5 p-5">
                  {/* Icon */}
                  <div className={cn(
                    "h-11 w-11 rounded-2xl bg-gradient-to-br flex items-center justify-center border border-[var(--border)] shadow-sm group-hover:scale-105 transition-transform",
                    c.color,
                  )}>
                    {c.icon}
                  </div>

                  {/* Title + badge */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-[var(--foreground)]">{c.title}</p>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5",
                      c.badgeLive
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                        : "bg-[var(--surface-2)] text-[var(--muted)]",
                    )}>
                      {c.badgeLive && <span className="status-dot online" style={{ width: 6, height: 6 }} />}
                      {c.badge}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--muted)] leading-relaxed">{c.description}</p>

                  <p className="text-sm text-[var(--primary)] font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    {c.value} <Icon.ChevronRight size={13} />
                  </p>
                </CardBody>
              </Card>
            </a>
          ))}
        </div>
      </section>

      {/* ── Form + Sidebar ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-5 gap-8 items-start">

        {/* Form */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary-soft)]/60 to-transparent flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Send us a message</h2>
                <p className="text-sm text-[var(--muted)] mt-1">We read every single message. Share as much detail as you can.</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <Icon.Send size={18} />
              </div>
            </div>

            <CardBody className="p-6 lg:p-8">
              {submitted ? (
                /* Success state */
                <div className="py-10 text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--primary-soft)] to-[var(--surface-2)] text-[var(--primary)] flex items-center justify-center mx-auto border border-[var(--border)]">
                      <Icon.CheckCircle size={30} />
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-[var(--primary)]/10 blur-xl scale-150 -z-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Message sent!</h3>
                    <p className="text-[var(--muted)] mt-1.5 text-sm max-w-xs mx-auto">
                      Thanks for reaching out. We&apos;ll reply to <span className="font-medium text-[var(--foreground)]">{submittedEmail || "your email"}</span> within 24 hours.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Your name</Label>
                      <Input
                        id="name"
                        placeholder="Jane Doe"
                        icon={<Icon.User size={15} />}
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        error={errors.name}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        icon={<Icon.Mail size={15} />}
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        error={errors.email}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reason">What&apos;s this about?</Label>
                    <Select
                      id="reason"
                      value={form.reason}
                      onChange={(e) => update("reason", e.target.value)}
                    >
                      {reasons.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="message" className="mb-0">Message</Label>
                      <span className={cn(
                        "text-xs",
                        form.message.length > 1800 ? "text-[var(--danger)]" : "text-[var(--muted-2)]",
                      )}>
                        {form.message.length} / 2000
                      </span>
                    </div>
                    <Textarea
                      id="message"
                      placeholder="Tell us what's on your mind — the more detail, the better…"
                      rows={6}
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      error={errors.message}
                    />
                  </div>

                  {/* Footer row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                      <Icon.Lock size={11} className="text-[var(--primary)]" />
                      Your message is private and secure.
                    </p>
                    <Button type="submit" loading={submitting} className="shrink-0">
                      <Icon.Send size={15} />
                      {submitting ? "Sending…" : "Send message"}
                    </Button>
                  </div>
                </form>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Support hours */}
          <Card>
            <CardBody className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-400/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-[var(--border)]">
                  <Icon.Clock size={18} />
                </div>
                <p className="font-bold">Support hours</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { day: "Mon — Fri", hours: "9:00 — 18:00", active: true },
                  { day: "Saturday",  hours: "10:00 — 14:00", active: false },
                  { day: "Sunday",    hours: "Closed",         active: false },
                ].map((row) => (
                  <div key={row.day} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--muted)]">{row.day}</span>
                    <span className={cn(
                      "font-semibold",
                      row.hours === "Closed" ? "text-[var(--muted-2)]" : "text-[var(--foreground)]",
                    )}>
                      {row.active && <span className="status-dot online mr-1.5" style={{ display: "inline-block", verticalAlign: "middle" }} />}
                      {row.hours}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-1 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted)]">
                  Timezone: PKT (GMT+5:00). Outside hours? Use email — we&apos;ll reply next morning.
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Address */}
          <Card>
            <CardBody className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-400/10 text-[var(--primary)] flex items-center justify-center border border-[var(--border)]">
                  <Icon.Pin size={18} />
                </div>
                <p className="font-bold">Our office</p>
              </div>
              {/* Office image */}
              <div className="rounded-xl overflow-hidden h-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop&q=80"
                  alt="EduPortal office in Faisalabad"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-sm text-[var(--foreground)] leading-relaxed space-y-0.5">
                <p className="font-semibold">EduPortal HQ</p>
                <p className="text-[var(--muted)]">14 Innovation Lane</p>
                <p className="text-[var(--muted)]">Faisalabad, Punjab 38000, Pakistan</p>
              </div>
              <a
                href="https://www.openstreetmap.org/?mlat=31.4504&mlon=73.1350#map=16/31.4504/73.1350"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:underline"
              >
                <Icon.Compass size={14} /> Get directions
              </a>
            </CardBody>
          </Card>

          {/* Quick links */}
          <Card>
            <CardBody className="p-5 space-y-3">
              <p className="font-bold text-sm">Quick links</p>
              <div className="space-y-2">
                {[
                  { label: "Help Center", href: "/help", icon: <Icon.Help size={14} /> },
                  { label: "FAQs",        href: "/faq",  icon: <Icon.MessageSquare size={14} /> },
                  { label: "Careers",     href: "/careers", icon: <Icon.Users size={14} /> },
                  { label: "Press kit",   href: "/press",   icon: <Icon.Megaphone size={14} /> },
                ].map((l) => (
                  <a key={l.label} href={l.href}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    <span className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                      <span className="text-[var(--primary)]">{l.icon}</span>
                      {l.label}
                    </span>
                    <Icon.ChevronRight size={13} className="text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
                  </a>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-3">
                <span className="h-px w-6 bg-[var(--primary)] inline-block" /> Before you write
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Common questions</h2>
              <p className="mt-2 text-[var(--muted)] text-sm">You might find a faster answer here.</p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <Card key={i} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <span className="font-semibold text-sm text-[var(--foreground)]">{faq.q}</span>
                    <Icon.ChevronDown
                      size={16}
                      className={cn(
                        "shrink-0 text-[var(--muted)] transition-transform duration-200",
                        openFaq === i && "rotate-180",
                      )}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-3 accordion-down">
                      {faq.a}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <p className="text-center mt-6 text-sm text-[var(--muted)]">
              Still stuck?{" "}
              <a href="/help" className="text-[var(--primary)] font-semibold hover:underline underline-offset-2">
                Search the Help Center →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Map ──────────────────────────────────────────── */}
      <ContactMap />

    </div>
  );
}

function ContactMap() {
  const lat   = 31.4504;
  const lon   = 73.1350;
  const delta = 0.012;
  const bbox  = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const embedSrc      = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  const directionsHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold">Find us in Faisalabad</h2>
        <p className="mt-2 text-[var(--muted)] text-sm">Drop by, say hi, or schedule a coffee with the team.</p>
      </div>

      <Card className="overflow-hidden shadow-xl shadow-black/8">
        <div className="grid lg:grid-cols-3">
          {/* Info panel */}
          <CardBody className="lg:col-span-1 p-6 lg:p-8 space-y-5 lg:border-r border-[var(--border)] bg-gradient-to-b from-[var(--surface-2)]/40 to-transparent">
            <div className="h-12 w-12 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/15">
              <Icon.Pin size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Visit our HQ</h3>
              <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">
                Drop by for a coffee, a tour, or a quick chat with our team.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Icon.Pin size={15} className="text-[var(--primary)] mt-0.5 shrink-0" />
                <div className="text-[var(--foreground)] leading-relaxed">
                  14 Innovation Lane<br />
                  Faisalabad, Punjab 38000<br />
                  Pakistan
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Icon.Clock size={15} className="text-[var(--primary)] shrink-0" />
                <span className="text-[var(--foreground)]">Mon–Fri, 9:00 am – 6:00 pm PKT</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Icon.Mail size={15} className="text-[var(--primary)] shrink-0" />
                <a href="mailto:hello@eduportal.app" className="text-[var(--primary)] hover:underline underline-offset-2">
                  hello@eduportal.app
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <a href={directionsHref} target="_blank" rel="noopener noreferrer">
                <Button className="w-full">
                  <Icon.Compass size={15} /> Get directions
                </Button>
              </a>
              <a href={`https://www.openstreetmap.org/#map=14/${lat}/${lon}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <Icon.Globe size={15} /> Open larger map
                </Button>
              </a>
            </div>
          </CardBody>

          {/* Map */}
          <div className="relative lg:col-span-2 h-72 sm:h-96 lg:h-auto lg:min-h-[26rem] bg-[var(--surface-2)]">
            <iframe
              title="EduPortal HQ on the map"
              src={embedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full border-0 contact-map-frame"
            />
            {/* Address chip overlay */}
            <div className="absolute left-4 top-4 max-w-[min(85%,18rem)] glass rounded-xl px-3 py-2.5 border border-[var(--border)] shadow-md pointer-events-none">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon.Pin size={13} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight">EduPortal HQ</p>
                  <p className="text-[11px] text-[var(--muted)] leading-snug mt-0.5">14 Innovation Lane, Faisalabad</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
