"use client";

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
  Select,
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
      <Modal open={open} onClose={() => setOpen(false)} title="New support ticket" size="md">
        <div className="p-5 space-y-4">
          <div>
            <Label>Subject</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Briefly, what's wrong?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as Ticket["category"] })
                }
              >
                <option value="technical">Technical issue</option>
                <option value="billing">Billing / Payments</option>
                <option value="course">Course content</option>
                <option value="account">Account</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as Ticket["priority"] })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={5}
              placeholder="Describe the issue in detail…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} loading={saving}>
              Submit
            </Button>
          </div>
        </div>
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
