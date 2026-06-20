"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  Modal,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, relativeTime } from "@/lib/utils";

type Ticket = {
  id: string;
  subject: string;
  body: string;
  category: "technical" | "billing" | "course" | "account" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  replyCount: number;
  createdAt: string;
  updatedAt: string;
};

const STATUS_TONE: Record<Ticket["status"], "primary" | "warning" | "success" | "default"> = {
  open: "warning",
  in_progress: "primary",
  resolved: "success",
  closed: "default",
};

const PRIORITY_TONE: Record<Ticket["priority"], "default" | "info" | "warning" | "danger"> = {
  low: "default",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

/* ─── FAQ Data ────────────────────────────────────────────────── */
type FaqItem = { q: string; a: string };
type FaqCategory = {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  items: FaqItem[];
};

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    key: "getting-started",
    label: "Getting Started",
    icon: <Icon.Compass size={15} />,
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary-soft)]",
    items: [
      {
        q: "How do I enroll in a course?",
        a: "Go to the Explore page, find a course you like, and click \"Enroll\". For free courses enrollment is instant. For paid courses you'll be taken to the checkout flow first.",
      },
      {
        q: "What are the system requirements?",
        a: "EduPortal works on any modern browser (Chrome, Firefox, Edge, Safari). For video playback we recommend a stable internet connection of at least 5 Mbps. No special software is required.",
      },
      {
        q: "How do I track my learning progress?",
        a: "Your progress is tracked automatically. Visit the Progress page from the sidebar to see completion percentages, quiz scores, streaks, and certificates earned.",
      },
    ],
  },
  {
    key: "technical",
    label: "Technical Issues",
    icon: <Icon.Settings size={15} />,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    items: [
      {
        q: "Why can't I access course videos?",
        a: "Try refreshing the page and clearing your browser cache. If the problem persists, disable any browser extensions (ad-blockers can sometimes interfere) and try again. If it's still not working, open a support ticket with your browser and OS details.",
      },
      {
        q: "The website is loading very slowly — what should I do?",
        a: "Check your internet connection first. If other sites load fine, try switching to a wired connection or moving closer to your router. You can also try a different browser. If slowness persists only on EduPortal, please open a technical ticket.",
      },
      {
        q: "How do I report a bug?",
        a: "Click \"+ New ticket\", choose category \"Technical issue\", and describe the bug in detail — include what you were doing, what you expected to happen, and what actually happened. Screenshots or screen recordings are very helpful.",
      },
    ],
  },
  {
    key: "billing",
    label: "Billing & Payments",
    icon: <Icon.CreditCard size={15} />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    items: [
      {
        q: "How do I upgrade my subscription?",
        a: "Go to Account → Subscription and click \"Upgrade to Pro\". You can pay by card or bank transfer. Your upgrade takes effect immediately.",
      },
      {
        q: "Can I get a refund?",
        a: "We offer a 7-day money-back guarantee on all Pro subscriptions. For individual course purchases, refunds are available within 30 days if you've completed less than 20% of the course. Open a Billing ticket to request one.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit/debit cards (Visa, Mastercard, Amex), bank transfers, and JazzCash / Easypaisa for Pakistani users.",
      },
    ],
  },
  {
    key: "account",
    label: "Account & Profile",
    icon: <Icon.User size={15} />,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    items: [
      {
        q: "How do I change my password?",
        a: "Go to Account → Settings → Security and click \"Change password\". You'll need to enter your current password and then your new one twice to confirm.",
      },
      {
        q: "How do I update my profile picture?",
        a: "Visit your Profile page, hover over the avatar, and click the camera icon that appears. Upload a JPG or PNG (max 5 MB). Changes are saved instantly.",
      },
      {
        q: "Can I change my email address?",
        a: "Yes. Go to Account → Settings → General and update your email. A verification link will be sent to the new address — the change takes effect once you click it.",
      },
    ],
  },
  {
    key: "courses",
    label: "Courses & Content",
    icon: <Icon.Book size={15} />,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    items: [
      {
        q: "Can I download course materials for offline use?",
        a: "PDF resources, notes, and attachments can be downloaded from the course page. Video downloads are available to Pro subscribers via the Download button on each lesson.",
      },
      {
        q: "How long do I have access to a course after enrolling?",
        a: "Lifetime access — once enrolled you can re-watch lessons and download materials at any time, even after completing the course.",
      },
      {
        q: "How do I get a certificate?",
        a: "Complete all lessons and pass the final quiz (if any) with a score of 70% or above. Your certificate will appear automatically on the Certificates page and can be downloaded as a PDF.",
      },
    ],
  },
];

/* ─── Modal config ───────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<Ticket["category"], { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  technical: { label: "Technical",  icon: <Icon.Settings size={16} />,   bg: "bg-sky-50 dark:bg-sky-900/20",      text: "text-sky-600 dark:text-sky-400",      border: "border-sky-200 dark:border-sky-700" },
  billing:   { label: "Billing",    icon: <Icon.CreditCard size={16} />, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-700" },
  course:    { label: "Course",     icon: <Icon.Book size={16} />,       bg: "bg-amber-50 dark:bg-amber-900/20",  text: "text-amber-600 dark:text-amber-400",   border: "border-amber-200 dark:border-amber-700" },
  account:   { label: "Account",    icon: <Icon.User size={16} />,       bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-700" },
  other:     { label: "Other",      icon: <Icon.Help size={16} />,       bg: "bg-[var(--surface-2)]",             text: "text-[var(--muted)]",                 border: "border-[var(--border)]" },
};

const PRIORITY_CONFIG: Record<Ticket["priority"], { label: string; icon: React.ReactNode; bg: string; text: string; border: string; hint: string }> = {
  low:    { label: "Low",    icon: <Icon.ChevronDown size={16} />, bg: "bg-[var(--surface-2)]",          text: "text-[var(--muted)]",               border: "border-[var(--border)]",            hint: "Not urgent" },
  medium: { label: "Medium", icon: <Icon.Circle size={16} />,      bg: "bg-sky-50 dark:bg-sky-900/20",   text: "text-sky-600 dark:text-sky-400",    border: "border-sky-200 dark:border-sky-700", hint: "Normal" },
  high:   { label: "High",   icon: <Icon.ArrowUp size={16} />,     bg: "bg-amber-50 dark:bg-amber-900/20",text: "text-amber-600 dark:text-amber-400",border: "border-amber-200 dark:border-amber-700",hint: "Needs attention" },
  urgent: { label: "Urgent", icon: <Icon.AlertCircle size={16} />, bg: "bg-red-50 dark:bg-red-900/20",   text: "text-red-600 dark:text-red-400",    border: "border-red-200 dark:border-red-700",hint: "Critical" },
};

function SupportSectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">{icon}</span>
      <span className="text-[10px] font-bold tracking-widest text-[var(--primary)]">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    body: "",
    category: "other" as Ticket["category"],
    priority: "medium" as Ticket["priority"],
  });
  const [saving, setSaving] = useState(false);
  const { push } = useToast();

  /* FAQ state */
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqCategory, setFaqCategory] = useState<string>("getting-started");
  const [faqExpanded, setFaqExpanded] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const faqRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const r = await fetch("/api/support");
      const data = r.ok ? await r.json() : { tickets: [] };
      setTickets(data.tickets ?? []);
    } catch {
      push({ title: "Couldn't load tickets", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/support");
        const data = r.ok ? await r.json() : { tickets: [] };
        if (!cancelled) setTickets(data.tickets ?? []);
      } catch {
        if (!cancelled) push({ title: "Couldn't load tickets", tone: "danger" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    if (!form.subject.trim() || !form.body.trim()) {
      push({ title: "Subject & message required", tone: "warning" });
      return;
    }
    setSaving(true);
    const r = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!r.ok) {
      push({ title: "Couldn't create ticket", tone: "danger" });
      return;
    }
    push({ title: "Ticket created", description: "We'll get back to you soon.", tone: "success" });
    setOpen(false);
    setForm({ subject: "", body: "", category: "other", priority: "medium" });
    load();
  }

  function openFaq() {
    setFaqOpen(true);
    setTimeout(() => faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  /* FAQ search — flatten all items */
  const searchResults: { cat: FaqCategory; item: FaqItem }[] = faqSearch.trim()
    ? FAQ_CATEGORIES.flatMap((cat) =>
        cat.items
          .filter(
            (item) =>
              item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
              item.a.toLowerCase().includes(faqSearch.toLowerCase()),
          )
          .map((item) => ({ cat, item })),
      )
    : [];

  const activeCat = FAQ_CATEGORIES.find((c) => c.key === faqCategory) ?? FAQ_CATEGORIES[0];

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Help & Support</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Open a ticket — we usually reply within 24 hours.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Icon.Plus size={14} /> New ticket
        </Button>
      </div>

      {/* ── Quick-access cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={openFaq}
          className="text-left rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-start gap-3 hover:border-violet-400/50 hover:shadow-md transition-all group"
        >
          <div className="h-10 w-10 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Icon.Help size={18} />
          </div>
          <div>
            <p className="font-semibold text-sm">FAQ</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">Browse common questions.</p>
          </div>
        </button>
        <Card>
          <CardBody className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
              <Icon.Mail size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Email us</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">support@eduportal.example</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Icon.MessageSquare size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Live chat</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Mon–Fri · 9am–6pm</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── FAQ / Knowledge Base ─────────────────────────────── */}
      <div ref={faqRef}>
      <Card className={cn("transition-all", faqOpen && "ring-2 ring-[var(--primary)]/15")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                <Icon.Help size={14} />
              </span>
              Frequently Asked Questions
            </CardTitle>
            <button
              onClick={() => setFaqOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
            >
              <Icon.ChevronDown
                size={16}
                className={cn("transition-transform duration-200", faqOpen && "rotate-180")}
              />
            </button>
          </div>
        </CardHeader>

        {faqOpen && (
          <CardBody className="space-y-4 pt-0">
            {/* Search */}
            <div className="relative">
              <Icon.Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                value={faqSearch}
                onChange={(e) => {
                  setFaqSearch(e.target.value);
                  setFaqExpanded(null);
                }}
                placeholder="Search questions…"
                className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-8 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)]/40 transition"
              />
              {faqSearch && (
                <button
                  onClick={() => setFaqSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-[var(--muted)] hover:text-[var(--foreground)] transition"
                >
                  <Icon.X size={12} />
                </button>
              )}
            </div>

            {faqSearch.trim() ? (
              /* ── Search results ── */
              <div className="space-y-2">
                {searchResults.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[var(--muted)]">
                    No results for &ldquo;{faqSearch}&rdquo;
                  </p>
                ) : (
                  searchResults.map(({ cat, item }) => {
                    const key = `search-${item.q}`;
                    const isOpen = faqExpanded === key;
                    return (
                      <FaqRow
                        key={key}
                        item={item}
                        isOpen={isOpen}
                        onToggle={() => setFaqExpanded(isOpen ? null : key)}
                        badge={
                          <span
                            className={cn(
                              "hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              cat.bg,
                              cat.color,
                            )}
                          >
                            {cat.icon} {cat.label}
                          </span>
                        }
                      />
                    );
                  })
                )}
              </div>
            ) : (
              /* ── Category view ── */
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Category sidebar */}
                <div className="flex sm:flex-col gap-2 sm:w-44 shrink-0 overflow-x-auto sm:overflow-x-visible pb-1 sm:pb-0">
                  {FAQ_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setFaqCategory(cat.key);
                        setFaqExpanded(null);
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-left transition-all whitespace-nowrap sm:whitespace-normal shrink-0 sm:shrink",
                        faqCategory === cat.key
                          ? `${cat.bg} ${cat.color} font-semibold`
                          : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                      )}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Questions */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className={cn("mb-3 flex items-center gap-2 text-sm font-semibold", activeCat.color)}>
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg", activeCat.bg)}>
                      {activeCat.icon}
                    </span>
                    {activeCat.label}
                  </div>
                  {activeCat.items.map((item) => {
                    const key = `${faqCategory}-${item.q}`;
                    const isOpen = faqExpanded === key;
                    return (
                      <FaqRow
                        key={key}
                        item={item}
                        isOpen={isOpen}
                        onToggle={() => setFaqExpanded(isOpen ? null : key)}
                      />
                    );
                  })}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--muted)]">
                      Didn&apos;t find what you need?{" "}
                      <button
                        onClick={() => setOpen(true)}
                        className="font-medium text-[var(--primary)] hover:underline"
                      >
                        Open a support ticket
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        )}
      </Card>
      </div>

      {/* ── Your tickets ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Your tickets</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <p className="text-sm text-[var(--muted)] p-5">Loading…</p>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={<Icon.Help size={28} />}
              title="No tickets yet"
              description="If you need help, open one."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Icon.Plus size={14} /> New ticket
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {tickets.map((t) => (
                <li key={t.id} className="hover:bg-[var(--surface-2)]">
                  <Link href={`/support/${t.id}`} className="flex items-start gap-3 p-4">
                    <div className="h-9 w-9 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                      <Icon.Help size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold line-clamp-1">{t.subject}</p>
                        <Badge variant={STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Badge>
                        <Badge variant={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                        <Badge variant="default">{t.category}</Badge>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">{t.body}</p>
                      <p className="text-xs text-[var(--muted-2)] mt-1 flex items-center gap-2">
                        <span>{relativeTime(t.updatedAt)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Icon.MessageSquare size={11} /> {t.replyCount}
                        </span>
                      </p>
                    </div>
                    <Icon.ChevronRight size={16} className="text-[var(--muted-2)] mt-2" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ── New ticket modal ──────────────────────────────────── */}
      <Modal open={open} onClose={() => setOpen(false)} title="New support ticket" size="lg">
        {(() => {
          const cc = CATEGORY_CONFIG[form.category];
          const pc = PRIORITY_CONFIG[form.priority];
          const bodyLen = form.body.length;
          const bodyOver = bodyLen > 2000;
          return (
            <div className="space-y-0">
              {/* ── Live preview banner ── */}
              <div className={`mx-5 mt-1 mb-4 rounded-xl p-4 border ${cc.bg} ${cc.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-white/70 dark:bg-black/20 ${cc.text}`}>
                    {cc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm leading-snug ${cc.text}`}>
                      {form.subject.trim() || <span className="opacity-40 italic font-normal">Your ticket subject…</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cc.bg} ${cc.text} ${cc.border}`}>
                        {cc.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>
                        {pc.label} priority
                      </span>
                      {form.body.trim() && (
                        <span className="text-[10px] text-[var(--muted)] line-clamp-1 max-w-[200px]">
                          {form.body.slice(0, 60)}{form.body.length > 60 ? "…" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 space-y-5 pb-2">
                {/* ── Ticket details ── */}
                <SupportSectionLabel icon={<Icon.FilePen size={12} />} label="TICKET DETAILS" />

                <div>
                  <Label>Subject</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Briefly, what's wrong?"
                    maxLength={200}
                    autoFocus
                  />
                  <p className="text-[10px] text-[var(--muted)] mt-1 text-right">{form.subject.length}/200</p>
                </div>

                {/* Category cards */}
                <div>
                  <Label>Category</Label>
                  <div className="grid grid-cols-5 gap-1.5 mt-1">
                    {(["technical", "billing", "course", "account", "other"] as Ticket["category"][]).map((cat) => {
                      const cs = CATEGORY_CONFIG[cat];
                      const active = form.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setForm({ ...form, category: cat })}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-center ${
                            active
                              ? `${cs.bg} ${cs.text} border-current shadow-sm scale-[1.04]`
                              : "bg-[var(--surface-2)] text-[var(--muted)] border-transparent hover:border-[var(--border)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${active ? "bg-white/60 dark:bg-black/20" : "bg-[var(--surface)]"}`}>
                            {cs.icon}
                          </span>
                          <p className="text-[10px] font-semibold leading-none">{cs.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority cards */}
                <div>
                  <Label>Priority</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {(["low", "medium", "high", "urgent"] as Ticket["priority"][]).map((pri) => {
                      const ps = PRIORITY_CONFIG[pri];
                      const active = form.priority === pri;
                      return (
                        <button
                          key={pri}
                          type="button"
                          onClick={() => setForm({ ...form, priority: pri })}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                            active
                              ? `${ps.bg} ${ps.text} border-current shadow-sm scale-[1.03]`
                              : "bg-[var(--surface-2)] text-[var(--muted)] border-transparent hover:border-[var(--border)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${active ? "bg-white/60 dark:bg-black/20" : "bg-[var(--surface)]"}`}>
                            {ps.icon}
                          </span>
                          <p className="text-[10px] font-semibold leading-none">{ps.label}</p>
                          <p className="text-[9px] opacity-60 leading-tight">{ps.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Message ── */}
                <SupportSectionLabel icon={<Icon.Edit size={12} />} label="DESCRIBE THE ISSUE" />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="mb-0">Message</Label>
                    <span className={`text-xs tabular-nums ${bodyOver ? "text-red-500 font-semibold" : "text-[var(--muted)]"}`}>
                      {bodyLen}/2000
                    </span>
                  </div>
                  <Textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    rows={5}
                    placeholder={
                      form.category === "technical"
                        ? "Describe the technical issue — what happened, what you expected, your browser/OS…"
                        : form.category === "billing"
                        ? "Describe your billing issue — include the transaction date and amount if applicable…"
                        : "Describe your issue in as much detail as possible…"
                    }
                    className={bodyOver ? "border-red-400 focus:ring-red-400" : ""}
                  />
                  {bodyOver && <p className="text-xs text-red-500 mt-1">Message exceeds 2000 characters.</p>}
                  <div className="mt-2 h-1 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${bodyOver ? "bg-red-500" : bodyLen > 1600 ? "bg-amber-500" : "bg-[var(--primary)]"}`}
                      style={{ width: `${Math.min(100, (bodyLen / 2000) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex justify-end gap-2 pt-1 pb-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={create} loading={saving} disabled={bodyOver}>
                    <Icon.Send size={14} /> Submit ticket
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

/* ─── FAQ Row (accordion item) ───────────────────────────────── */
function FaqRow({
  item,
  isOpen,
  onToggle,
  badge,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        isOpen
          ? "border-[var(--primary)]/30 bg-[var(--primary-soft)]/10"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]",
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {badge}
          <span className="text-sm font-medium leading-snug">{item.q}</span>
        </div>
        <span
          className={cn(
            "mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full border text-[var(--muted)] transition-colors",
            isOpen
              ? "border-[var(--primary)]/40 bg-[var(--primary-soft)] text-[var(--primary)]"
              : "border-[var(--border)]",
          )}
        >
          <Icon.ChevronDown
            size={11}
            className={cn("transition-transform duration-200", isOpen && "rotate-180")}
          />
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-sm text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-3">
            {item.a}
          </p>
        </div>
      )}
    </div>
  );
}
