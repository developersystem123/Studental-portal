"use client";

import * as React from "react";
import Link from "next/link";
import Icon from "@/components/icons";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

type Article = { title: string; description: string; minutes: number; tag: string };

const categories = [
  {
    id: "getting-started",
    icon: <Icon.Sparkles size={22} />,
    title: "Getting started",
    description: "New to EduPortal? Start here.",
    articles: [
      { title: "Create your account in 60 seconds", description: "Sign up, verify your email, and set your goals.", minutes: 2, tag: "Basics" },
      { title: "Choose your first course", description: "How recommendations work and how to pick a path.", minutes: 4, tag: "Basics" },
      { title: "Set up your learning goals", description: "Daily streaks, study time, and progress reminders.", minutes: 3, tag: "Basics" },
      { title: "Install the mobile app", description: "iOS and Android downloads, plus offline tips.", minutes: 2, tag: "Apps" },
    ],
  },
  {
    id: "courses",
    icon: <Icon.Book size={22} />,
    title: "Courses & learning",
    description: "Enroll, learn, and complete with confidence.",
    articles: [
      { title: "How to enroll in a course", description: "Free vs. paid courses and what enrollment unlocks.", minutes: 3, tag: "Enroll" },
      { title: "Downloading videos for offline use", description: "Available on mobile for Pro members.", minutes: 4, tag: "Offline" },
      { title: "Taking quizzes & assignments", description: "What gets graded, retakes, and partial credit.", minutes: 5, tag: "Quizzes" },
      { title: "Joining a live class", description: "Calendar invites, links, and recording access.", minutes: 3, tag: "Live" },
      { title: "Earning a certificate", description: "Completion criteria and verification.", minutes: 4, tag: "Certs" },
    ],
  },
  {
    id: "ai",
    icon: <Icon.MessageSquare size={22} />,
    title: "AI tools",
    description: "Chat tutor, quiz generator, assignment helper.",
    articles: [
      { title: "How the AI tutor works", description: "Context, limits, and tips for better answers.", minutes: 5, tag: "Chat" },
      { title: "Generating practice quizzes", description: "From any topic — text, PDF, or link.", minutes: 3, tag: "Quizzes" },
      { title: "Assignment helper guidelines", description: "What it will and won't do (academic integrity).", minutes: 4, tag: "Assist" },
      { title: "Daily AI usage limits", description: "Free vs. Pro and how to monitor your usage.", minutes: 2, tag: "Limits" },
    ],
  },
  {
    id: "billing",
    icon: <Icon.CreditCard size={22} />,
    title: "Billing & payments",
    description: "Plans, invoices, and refunds.",
    articles: [
      { title: "Upgrading to Pro", description: "Monthly or annual — what changes immediately.", minutes: 3, tag: "Plans" },
      { title: "Update your payment method", description: "Cards, regional methods, and SCA in Europe.", minutes: 2, tag: "Payment" },
      { title: "Download an invoice", description: "Past invoices, VAT, and business billing details.", minutes: 2, tag: "Invoice" },
      { title: "Request a refund", description: "Our 14-day refund policy and how to apply.", minutes: 3, tag: "Refunds" },
    ],
  },
  {
    id: "account",
    icon: <Icon.User size={22} />,
    title: "Account & security",
    description: "Login, passwords, and account safety.",
    articles: [
      { title: "Reset your password", description: "Link expiry and what to do if it doesn't arrive.", minutes: 2, tag: "Login" },
      { title: "Enable two-factor authentication", description: "Recommended for everyone — takes 60 seconds.", minutes: 3, tag: "Security" },
      { title: "Change your email address", description: "Verification, side effects, and downtime.", minutes: 2, tag: "Account" },
      { title: "Delete your account", description: "What gets removed and what's retained for legal reasons.", minutes: 4, tag: "Account" },
    ],
  },
  {
    id: "teach",
    icon: <Icon.Award size={22} />,
    title: "For instructors",
    description: "Teaching, payouts, and the authoring studio.",
    articles: [
      { title: "Apply to teach on EduPortal", description: "What we look for and how the review works.", minutes: 4, tag: "Apply" },
      { title: "Authoring studio basics", description: "Chapters, captions, quizzes, and assignments.", minutes: 6, tag: "Tools" },
      { title: "Getting paid", description: "Payout schedule, methods, and tax forms.", minutes: 4, tag: "Payouts" },
      { title: "Promote your course launch", description: "Co-marketing, banners, and discount codes.", minutes: 5, tag: "Growth" },
    ],
  },
];

const popular = [
  { href: "#getting-started", label: "How do I get started?" },
  { href: "#billing", label: "Cancel my subscription" },
  { href: "#ai", label: "AI usage limits" },
  { href: "#courses", label: "Download a certificate" },
  { href: "#account", label: "Reset password" },
  { href: "/refund", label: "Refund policy" },
];

export default function HelpCenterPage() {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        articles: c.articles.filter((a) => `${a.title} ${a.description}`.toLowerCase().includes(q)),
      }))
      .filter((c) => c.articles.length > 0);
  }, [query]);

  const totalArticles = categories.reduce((sum, c) => sum + c.articles.length, 0);
  const matched = filtered.reduce((sum, c) => sum + c.articles.length, 0);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[40rem] rounded-full bg-[var(--primary)]/10 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 lg:pt-20 lg:pb-12 text-center">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Help Center</p>
          <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            How can we <span className="gradient-text">help you</span>?
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Search {totalArticles} articles, or browse by topic. Most answers are 3 minutes away.
          </p>
          <div className="mt-7 max-w-2xl mx-auto">
            <Input
              icon={<Icon.Search size={18} />}
              placeholder="Search for an article…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 text-base"
            />
            {query.trim() && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                {matched} {matched === 1 ? "article" : "articles"} match &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
          {!query.trim() && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold">Popular:</span>
              {popular.map((p) => (
                <Link
                  key={p.label}
                  href={p.href}
                  className="text-xs px-3 h-8 rounded-full bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--primary-soft)] inline-flex items-center transition"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">
        {filtered.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-3">
                <Icon.Search size={24} />
              </div>
              <p className="font-semibold">No articles match &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Try different keywords, or{" "}
                <Link href="/contact" className="text-[var(--primary)] hover:underline">
                  contact support
                </Link>
                .
              </p>
            </CardBody>
          </Card>
        ) : (
          filtered.map((c) => (
            <section key={c.id} id={c.id}>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-400/15 text-[var(--primary)] flex items-center justify-center">
                  {c.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{c.title}</h2>
                  <p className="text-sm text-[var(--muted)]">{c.description}</p>
                </div>
              </div>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {c.articles.map((a) => (
                  <ArticleCard key={a.title} a={a} />
                ))}
              </ul>
            </section>
          ))
        )}
      </section>

      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-2 gap-5">
          <Card>
            <CardBody className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                <Icon.Help size={20} />
              </div>
              <p className="font-semibold">Browse the FAQ</p>
              <p className="text-sm text-[var(--muted)]">
                Common questions, grouped by topic. Great if you&apos;d rather read than search.
              </p>
              <Link href="/faq">
                <Button variant="outline">
                  Go to FAQ <Icon.ChevronRight size={16} />
                </Button>
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                <Icon.Mail size={20} />
              </div>
              <p className="font-semibold">Talk to support</p>
              <p className="text-sm text-[var(--muted)]">
                Can&apos;t find what you need? We reply within 24 hours, usually a lot sooner.
              </p>
              <Link href="/contact">
                <Button>
                  Contact us <Icon.ChevronRight size={16} />
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}

function ArticleCard({ a }: { a: Article }) {
  return (
    <li>
      <Link
        href="/contact"
        className="block group rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30 hover:shadow-md transition p-4 h-full"
      >
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="primary">{a.tag}</Badge>
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold inline-flex items-center gap-1">
            <Icon.Clock size={10} /> {a.minutes} min
          </span>
        </div>
        <p className={cn("font-semibold text-sm group-hover:text-[var(--primary)] transition")}>{a.title}</p>
        <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">{a.description}</p>
      </Link>
    </li>
  );
}
