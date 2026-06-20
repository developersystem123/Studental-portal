"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/icons";
import { Button, Card, CardBody } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all",          label: "All",            icon: <Icon.Compass size={14} /> },
  { id: "general",      label: "Getting started", icon: <Icon.Sparkles size={14} /> },
  { id: "courses",      label: "Courses",         icon: <Icon.Book size={14} /> },
  { id: "payments",     label: "Payments",        icon: <Icon.CreditCard size={14} /> },
  { id: "certificates", label: "Certificates",    icon: <Icon.Award size={14} /> },
  { id: "account",      label: "Account",         icon: <Icon.User size={14} /> },
];

type FAQ = { category: string; q: string; a: string };

const FAQS: FAQ[] = [
  { category: "general", q: "What is EduPortal?", a: "EduPortal is an AI-powered learning platform with expert-led courses, interactive quizzes, live classes, and 24/7 AI tutoring across web dev, data science, design, business, and more." },
  { category: "general", q: "Is EduPortal free to use?", a: "Yes — sign-up is free and you'll find many free courses. We also offer paid courses and a Pro plan ($9.99/month) for unlimited AI usage and exclusive content." },
  { category: "general", q: "Who is EduPortal for?", a: "Students, working professionals, and lifelong learners. Whether you're starting from scratch or upskilling, our courses adapt to your level." },
  { category: "courses", q: "How long do I have access to a course?", a: "Once enrolled, you keep lifetime access — including any future updates the instructor publishes." },
  { category: "courses", q: "Are courses self-paced?", a: "Yes. You can pause, rewind, and learn at your own pace. Some live classes happen at scheduled times but recordings are always available." },
  { category: "courses", q: "Can I download videos for offline viewing?", a: "Offline downloads are available for Pro members through our mobile app." },
  { category: "payments", q: "What payment methods do you accept?", a: "Credit/debit cards via Stripe, bank transfers (manual), and scholarship codes. We're adding regional payment methods soon." },
  { category: "payments", q: "Can I get a refund?", a: "Yes — within 14 days of purchase if you've completed less than 25% of the course. See our refund policy for details." },
  { category: "payments", q: "Do you offer discounts?", a: "Yes! Students get 30% off with a valid ID, and we run seasonal promotions. Bundle discounts also apply when buying multiple courses." },
  { category: "certificates", q: "Are certificates recognized?", a: "Certificates are signed and verifiable. Many employers and universities recognize them. We also partner with industry organizations for select tracks." },
  { category: "certificates", q: "How do I earn a certificate?", a: "Complete all chapters, pass the final quiz with the minimum passing score, and submit any required assignments. The certificate is issued automatically." },
  { category: "certificates", q: "Can I share my certificate on LinkedIn?", a: "Absolutely — every certificate comes with a verifiable link and one-click LinkedIn share." },
  { category: "account", q: "How do I reset my password?", a: "Click 'Forgot password' on the login page. We'll email you a reset link valid for 30 minutes." },
  { category: "account", q: "Can I change my email address?", a: "Yes, from Settings → Account. You'll need to verify the new address." },
  { category: "account", q: "How do I delete my account?", a: "Go to Settings → Account → Delete account. This is permanent — your enrollments, certificates, and data will be removed." },
];

export const dynamic = "force-static";

const CATEGORY_COLORS: Record<string, string> = {
  general:      "from-violet-500/15 to-purple-400/10 text-violet-600 dark:text-violet-400",
  courses:      "from-emerald-500/15 to-teal-400/10 text-emerald-600 dark:text-emerald-400",
  payments:     "from-amber-500/15 to-orange-400/10 text-amber-600 dark:text-amber-400",
  certificates: "from-sky-500/15 to-blue-400/10 text-sky-600 dark:text-sky-400",
  account:      "from-rose-500/15 to-pink-400/10 text-rose-600 dark:text-rose-400",
};

export default function FAQPage() {
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch]       = useState("");
  const [openIdx, setOpenIdx]     = useState<number | null>(null);

  const filtered = FAQS.filter((f) => {
    if (activeCat !== "all" && f.category !== activeCat) return false;
    if (search.trim() && !`${f.q} ${f.a}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const countFor = (id: string) =>
    id === "all" ? FAQS.length : FAQS.filter((f) => f.category === id).length;

  return (
    <div className="overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[40rem] rounded-full bg-[var(--primary)]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 lg:pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-5">
            <Icon.Help size={12} /> Frequently Asked Questions
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Got questions?<br />
            <span className="gradient-text">We&apos;ve got answers.</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
            Can&apos;t find what you&apos;re looking for? Reach out — we usually reply within 24 hours.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Icon.Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            <input
              type="search"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpenIdx(null); }}
              className={cn(
                "w-full h-14 pl-12 pr-12 rounded-2xl text-base",
                "bg-[var(--surface)] border border-[var(--border)] shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/35 focus:border-[var(--border-strong)]",
                "placeholder:text-[var(--muted-2)] transition-all",
              )}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition"
              >
                <Icon.X size={16} />
              </button>
            )}
          </div>

          {/* Result count when searching */}
          {search.trim() && (
            <p className="mt-3 text-sm text-[var(--muted)]">
              <strong className="text-[var(--foreground)]">{filtered.length}</strong> question{filtered.length !== 1 ? "s" : ""} match &ldquo;{search}&rdquo;
            </p>
          )}
        </div>
      </section>

      {/* ── Category tabs ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((c) => {
            const active = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setActiveCat(c.id); setOpenIdx(null); }}
                className={cn(
                  "inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-full text-xs sm:text-sm font-semibold transition-all",
                  active
                    ? "bg-[var(--primary)] text-white shadow-sm shadow-green-500/20"
                    : "bg-surface border border-border text-muted hover:text-foreground hover:border-border-strong",
                )}
              >
                <span className={active ? "text-white" : "text-[var(--primary)]"}>{c.icon}</span>
                {c.label}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5",
                  active ? "bg-white/20 text-white" : "bg-surface-2 text-muted",
                )}>
                  {countFor(c.id)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── FAQ list ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {filtered.length === 0 ? (
          <Card>
            <CardBody className="text-center py-14">
              <div className="h-14 w-14 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                <Icon.Search size={24} />
              </div>
              <p className="font-bold text-lg">No matches found</p>
              <p className="text-sm text-[var(--muted)] mt-1.5">
                Try different keywords, or{" "}
                <Link href="/contact" className="text-[var(--primary)] hover:underline font-semibold">
                  contact support
                </Link>.
              </p>
              <Button variant="outline" className="mt-5" onClick={() => { setSearch(""); setActiveCat("all"); }}>
                Clear filters
              </Button>
            </CardBody>
          </Card>
        ) : (
          <ul className="space-y-2">
            {filtered.map((f, idx) => {
              const isOpen = openIdx === idx;
              const color = CATEGORY_COLORS[f.category] ?? "from-green-500/15 to-emerald-400/10 text-[var(--primary)]";
              return (
                <li key={`${f.category}-${idx}`}>
                  <Card className={cn("overflow-hidden transition-all", isOpen && "ring-1 ring-[var(--primary)]/20 shadow-md")}>
                    <button
                      onClick={() => setOpenIdx(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-[var(--surface-2)] transition-colors"
                    >
                      {/* Category icon */}
                      <span className={cn(
                        "h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 border border-[var(--border)]",
                        color,
                      )}>
                        {CATEGORIES.find((c) => c.id === f.category)?.icon ?? <Icon.Help size={15} />}
                      </span>
                      <span className="flex-1 text-sm font-semibold text-[var(--foreground)]">{f.q}</span>
                      <Icon.ChevronDown
                        size={16}
                        className={cn(
                          "shrink-0 text-[var(--muted)] transition-transform duration-200",
                          isOpen && "rotate-180 text-[var(--primary)]",
                        )}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 accordion-down border-t border-[var(--border)]">
                        <p className="text-sm text-[var(--muted)] leading-relaxed pt-4 pl-[52px]">{f.a}</p>
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        {/* Still need help CTA */}
        <div className="mt-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-8 text-white">
          <div className="absolute inset-0 bg-dots opacity-15 mix-blend-overlay pointer-events-none" />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <h3 className="text-xl font-bold">Still have questions?</h3>
              <p className="text-white/80 text-sm mt-1">Our support team replies within 24 hours, often much sooner.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/help">
                <Button className="bg-white/15 text-white border border-white/25 hover:bg-white/25">
                  <Icon.Book size={15} /> Help Center
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="bg-white text-[var(--primary)] hover:bg-white/90 shadow-lg shadow-black/15 font-semibold">
                  <Icon.Mail size={15} /> Contact us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
