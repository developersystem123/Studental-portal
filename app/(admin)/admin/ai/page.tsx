"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, StatCard, Tabs, useToast } from "@/components/ui";
import { BarChart, LineChart } from "@/components/charts";
import Icon from "@/components/icons";
import { cn, relativeTime } from "@/lib/utils";

/* ── Mock data ────────────────────────────────────────────────────────────── */
const MOCK_DAILY = [
  { day: "May 20", hours: 210 }, { day: "May 21", hours: 340 }, { day: "May 22", hours: 280 },
  { day: "May 23", hours: 450 }, { day: "May 24", hours: 390 }, { day: "May 25", hours: 520 },
  { day: "May 26", hours: 610 },
];

const MOCK_BY_FEATURE = [
  { label: "AI Chat",    value: 4820 },
  { label: "Quiz Gen",   value: 3210 },
  { label: "Assignment", value: 2140 },
  { label: "Moderation", value: 870  },
];

const MOCK_BY_ROLE = [
  { label: "Students",  value: 8640 },
  { label: "Teachers",  value: 3600 },
];

type FlaggedItem = {
  id: string; type: string; content: string; user: string;
  severity: "high" | "medium" | "low"; createdAt: string;
};

const MOCK_FLAGGED: FlaggedItem[] = [
  { id: "f1", type: "Forum Post",  content: "Inappropriate language detected in forum thread #482",          user: "Ali Khan",    severity: "medium", createdAt: "2026-05-26T08:14:00Z" },
  { id: "f2", type: "Assignment",  content: "Possible plagiarism detected in assignment submission",           user: "Sara Ahmed",  severity: "high",   createdAt: "2026-05-26T07:55:00Z" },
  { id: "f3", type: "Review",      content: "Spam-like content detected in course review",                    user: "Usman Tariq", severity: "low",    createdAt: "2026-05-25T22:10:00Z" },
  { id: "f4", type: "Forum Post",  content: "Off-topic promotional content in study group",                   user: "Zara Malik",  severity: "low",    createdAt: "2026-05-25T18:45:00Z" },
  { id: "f5", type: "Assignment",  content: "Potential AI-generated submission without disclosure",            user: "Ahmed Raza",  severity: "medium", createdAt: "2026-05-25T14:30:00Z" },
];

const SEVERITY_TONE: Record<string, string> = {
  high:   "text-red-600 bg-red-500/10 border-red-400/30",
  medium: "text-amber-600 bg-amber-500/10 border-amber-400/30",
  low:    "text-blue-600 bg-blue-500/10 border-blue-400/30",
};

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const AI_MODELS = [
  { name: "Claude Sonnet 4.6", usage: "Chat & assignments", status: "active", queries: 8170, latency: "1.2s", uptime: 99.9, cost: "$0.0030/query" },
  { name: "Claude Haiku 4.5",  usage: "Quiz generation",   status: "active", queries: 3210, latency: "0.6s", uptime: 99.8, cost: "$0.0008/query" },
  { name: "Claude Opus 4.7",   usage: "Content moderation",status: "active", queries: 870,  latency: "2.1s", uptime: 99.7, cost: "$0.0150/query" },
];

const DEFAULT_FEATURES = [
  { label: "AI Chat (students)",  desc: "Allow students to use the AI study assistant",             key: "chat_student", on: true  },
  { label: "AI Chat (teachers)",  desc: "Allow teachers to use AI chat for lesson planning",        key: "chat_teacher", on: true  },
  { label: "Quiz generator",      desc: "AI-powered quiz generation for teachers and students",     key: "quiz_gen",     on: true  },
  { label: "Assignment helper",   desc: "AI assistance for assignment writing",                     key: "assignment",   on: true  },
  { label: "Content moderation",  desc: "Auto-flag potentially harmful content using AI",           key: "moderation",   on: true  },
];

const DEFAULT_LIMITS = [
  { key: "free_daily",    label: "Free plan — daily AI queries",    value: "10"       },
  { key: "pro_daily",     label: "Pro plan — daily AI queries",     value: "Unlimited"},
  { key: "teacher_daily", label: "Teacher — daily AI queries",      value: "Unlimited"},
  { key: "max_tokens",    label: "Max tokens per response",         value: "4096"     },
];

// Moderation decisions (dismiss/remove) are persisted through
// /api/admin/ai-moderation, which stores them as a JSON log keyed by
// flagged-item id on the same generic PlatformSetting store that already
// backs ai-settings (no dedicated Flag/Report model exists yet, so this
// reuses the established pattern instead of inventing a new one).
type ModerationAction = "dismiss" | "remove";

type ModerationLogEntry = {
  action: ModerationAction;
  at: string;
  byId: string;
  byName: string;
  type?: string;
  snippet?: string;
};

type ModerationLog = Record<string, ModerationLogEntry>;

async function postModerationAction(
  item: FlaggedItem,
  action: ModerationAction,
): Promise<{ ok: boolean; entry?: ModerationLogEntry; error?: string }> {
  try {
    const res = await fetch("/api/admin/ai-moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id: item.id, action, type: item.type, snippet: item.content }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Couldn't save moderation action." };
    return { ok: true, entry: data.entry as ModerationLogEntry };
  } catch {
    return { ok: false, error: "Couldn't save moderation action." };
  }
}

function exportLogsCSV(flagged: FlaggedItem[], toast: ReturnType<typeof useToast>) {
  const header = ["ID", "Type", "User", "Content", "Severity", "Date"];
  const data   = flagged.map((f) => [
    f.id, f.type, `"${f.user}"`,
    `"${f.content}"`, f.severity,
    new Date(f.createdAt).toLocaleString(),
  ]);
  const csv  = [header, ...data].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "ai-moderation-logs.csv"; a.click();
  URL.revokeObjectURL(url);
  toast.push({ title: "Logs exported", tone: "success" });
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function AdminAiPage() {
  const toast = useToast();
  const [tab,          setTab]          = React.useState("overview");
  const [flagged,      setFlagged]      = React.useState<FlaggedItem[]>(MOCK_FLAGGED);
  const [resolving,    setResolving]    = React.useState<string | null>(null);
  const [dismissingAll, setDismissingAll] = React.useState(false);
  const [moderationLog, setModerationLog] = React.useState<ModerationLog>({});
  const [sevFilter,    setSevFilter]    = React.useState<"all" | "high" | "medium" | "low">("all");
  const [savingLimits, setSavingLimits] = React.useState(false);
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);

  const [features, setFeatures] = React.useState(DEFAULT_FEATURES);
  const [limits,   setLimits]   = React.useState(DEFAULT_LIMITS);

  // Load settings from backend on mount
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/ai-settings", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = await res.json() as { features: Record<string, boolean>; limits: Record<string, string> };
        setFeatures((prev) => prev.map((f) => ({ ...f, on: data.features[f.key] ?? f.on })));
        setLimits((prev) => prev.map((l) => ({ ...l, value: data.limits[l.key] ?? l.value })));
      } catch { /* keep defaults */ }
      finally { setSettingsLoaded(true); }
    })();
  }, []);

  // Load the persisted moderation log so previously dismissed/removed flags
  // stay resolved across refreshes instead of reappearing from the fixture list.
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/ai-moderation", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = await res.json() as { log: ModerationLog };
        const log = data.log ?? {};
        setModerationLog(log);
        setFlagged((prev) => prev.filter((f) => !log[f.id]));
      } catch { /* keep full mock queue */ }
    })();
  }, []);

  async function toggleFeature(key: string) {
    setFeatures((prev) => {
      const next = prev.map((f) => f.key === key ? { ...f, on: !f.on } : f);
      const map = Object.fromEntries(next.map((f) => [f.key, f.on]));
      fetch("/api/admin/ai-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ features: map }),
      }).catch(() => {});
      return next;
    });
    toast.push({ title: "Setting saved", tone: "success" });
  }

  async function handleSaveLimits() {
    setSavingLimits(true);
    try {
      const map = Object.fromEntries(limits.map((l) => [l.key, l.value]));
      const res = await fetch("/api/admin/ai-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ limits: map }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.push({ title: d.error ?? "Couldn't save limits", tone: "danger" });
        return;
      }
      toast.push({ title: "Rate limits saved", tone: "success" });
    } catch { toast.push({ title: "Couldn't save limits", tone: "danger" }); }
    finally { setSavingLimits(false); }
  }

  void settingsLoaded; // used only for future loading state if needed

  async function resolveFlag(id: string, action: ModerationAction) {
    const item = flagged.find((f) => f.id === id);
    if (!item) return;
    setResolving(id);
    const result = await postModerationAction(item, action);
    if (result.ok && result.entry) {
      setModerationLog((prev) => ({ ...prev, [id]: result.entry! }));
      setFlagged((p) => p.filter((f) => f.id !== id));
      toast.push({ title: action === "dismiss" ? "Flag dismissed" : "Content removed", tone: action === "dismiss" ? "info" : "success" });
    } else {
      toast.push({ title: result.error ?? "Couldn't save moderation action", tone: "danger" });
    }
    setResolving(null);
  }

  async function dismissAllFlags() {
    if (flagged.length === 0) return;
    setDismissingAll(true);
    const items = flagged;
    const results = await Promise.all(items.map((item) => postModerationAction(item, "dismiss")));
    const newEntries: ModerationLog = {};
    results.forEach((r, i) => { if (r.ok && r.entry) newEntries[items[i].id] = r.entry; });
    setModerationLog((prev) => ({ ...prev, ...newEntries }));
    setFlagged((prev) => prev.filter((f) => !newEntries[f.id]));
    setDismissingAll(false);
    const failed = results.length - Object.keys(newEntries).length;
    toast.push(failed > 0
      ? { title: `Dismissed ${Object.keys(newEntries).length} of ${items.length} — ${failed} failed`, tone: "danger" }
      : { title: "All flags dismissed", tone: "info" });
  }

  const recentActions = React.useMemo(() => Object.entries(moderationLog)
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6), [moderationLog]);

  const flaggedFiltered = flagged
    .filter((f) => sevFilter === "all" || f.severity === sevFilter)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const flagCounts = React.useMemo(() => ({
    all: flagged.length,
    high:   flagged.filter((f) => f.severity === "high").length,
    medium: flagged.filter((f) => f.severity === "medium").length,
    low:    flagged.filter((f) => f.severity === "low").length,
  }), [flagged]);

  const estCostToday = MOCK_DAILY[MOCK_DAILY.length - 1]?.hours ?? 0;
  const totalQueries = MOCK_DAILY.reduce((s, d) => s + d.hours, 0);
  const weekGrowth   = MOCK_DAILY.length >= 2
    ? Math.round(((MOCK_DAILY[MOCK_DAILY.length - 1].hours - MOCK_DAILY[0].hours) / MOCK_DAILY[0].hours) * 100)
    : 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/10 via-[var(--surface)] to-[var(--surface)] px-5 sm:px-7 py-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[var(--primary)]/10 blur-2xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-40 w-40 rounded-full bg-[var(--accent)]/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
              <Icon.Sparkles size={12} /> Manage
            </div>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">AI Management</h1>
            <p className="mt-1 text-sm text-[var(--muted)] max-w-md">Monitor AI usage, moderate flagged content, and configure platform settings.</p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2">
            {tab === "moderation" && flagged.length > 0 && (
              <Button variant="outline" size="sm" className="justify-center bg-[var(--surface)]/80 backdrop-blur" onClick={() => exportLogsCSV(flagged, toast)}>
                <Icon.Download size={14} /> Export logs
              </Button>
            )}
            <div className="overflow-x-auto max-w-full">
              <Tabs value={tab} onChange={setTab} options={[
                { value: "overview",    label: "Overview"    },
                { value: "moderation",  label: "Moderation", count: flagCounts.high > 0 ? flagCounts.high : undefined },
                { value: "models",      label: "Models"      },
                { value: "config",      label: "Config"      },
              ]} />
            </div>
          </div>
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total AI queries" value={totalQueries.toLocaleString()} icon={<Icon.Sparkles size={18} />} tone="primary"  delta={`↑ ${weekGrowth}% this week`} />
            <StatCard label="Active AI users"  value="3,840"                          icon={<Icon.Users size={18} />}    tone="success" delta="Students + Teachers" />
            <StatCard label="Flagged items"    value={flagged.length}                 icon={<Icon.AlertCircle size={18} />} tone="warning" delta={flagCounts.high > 0 ? `${flagCounts.high} high severity` : "Needs review"} />
            <StatCard label="Today's queries"  value={estCostToday}                   icon={<Icon.Clock size={18} />}    tone="accent"  delta="Real-time" />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Avg latency",     value: "1.1s",  tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",          icon: Icon.Clock },
              { label: "Est. daily cost", value: `$${(estCostToday * 0.003).toFixed(2)}`, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: Icon.DollarSign },
              { label: "Active models",   value: AI_MODELS.length, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400", icon: Icon.Sparkles },
              { label: "Features on",     value: features.filter((f) => f.on).length, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Icon.CheckCircle },
            ].map((s) => (
              <Card key={s.label} className="hover:-translate-y-0.5 hover:shadow-md transition">
                <CardBody className="flex items-center gap-3 !py-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${s.tone}`}><s.icon size={16} /></div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--muted)] truncate">{s.label}</p>
                    <p className="text-lg font-bold truncate">{s.value}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardBody>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="font-semibold">Daily AI queries</h2>
                    <p className="text-xs text-[var(--muted)]">Total queries across all AI features</p>
                  </div>
                  <Badge variant={weekGrowth >= 0 ? "success" : "danger"}>
                    {weekGrowth >= 0 ? "↑" : "↓"} {Math.abs(weekGrowth)}% this week
                  </Badge>
                </div>
                <div className="h-[200px]">
                  <LineChart data={MOCK_DAILY} height={200} yFormatter={(v) => `${Math.round(v)}`} />
                </div>
              </CardBody>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardBody>
                  <h2 className="font-semibold text-sm mb-3">Usage by feature</h2>
                  <div className="h-[100px]">
                    <BarChart data={MOCK_BY_FEATURE} height={100} />
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <h2 className="font-semibold text-sm mb-3">Usage by role</h2>
                  <div className="h-[80px]">
                    <BarChart data={MOCK_BY_ROLE} height={80} />
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Feature status strip */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">AI feature status</h2>
                <button onClick={() => setTab("config")} className="text-xs text-[var(--primary)] hover:underline">Configure →</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {features.map((f) => (
                  <div key={f.key} className={cn("rounded-xl p-3 border text-center transition-all hover:shadow-md", f.on ? "bg-emerald-500/8 border-emerald-500/20" : "bg-[var(--surface-2)] border-[var(--border)] opacity-60")}>
                    <div className={cn("h-2 w-2 rounded-full mx-auto mb-2", f.on ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" : "bg-[var(--muted-2)]")} />
                    <p className="text-xs font-semibold">{f.label.replace(" (students)", "").replace(" (teachers)", " (T)")}</p>
                    <p className={cn("text-[10px] mt-0.5 font-medium", f.on ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--muted-2)]")}>{f.on ? "Active" : "Off"}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── MODERATION ── */}
      {tab === "moderation" && (
        <div className="space-y-4">
          {/* Moderation stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total flagged", value: flagged.length,       cls: "bg-[var(--primary-soft)] text-[var(--primary)]" },
              { label: "High severity", value: flagCounts.high,      cls: "bg-red-500/10 text-red-600 dark:text-red-400" },
              { label: "Medium",        value: flagCounts.medium,    cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
              { label: "Low severity",  value: flagCounts.low,       cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
            ].map((s) => (
              <Card key={s.label} className="hover:-translate-y-0.5 hover:shadow-md transition">
                <CardBody className="!py-3 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{s.label}</p>
                  <p className={cn("text-xl font-bold mt-0.5", s.cls.split(" ").find((c) => c.startsWith("text-")))}>
                    {s.value}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Filter + actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="overflow-x-auto max-w-full">
              <Tabs value={sevFilter} onChange={(v) => setSevFilter(v as typeof sevFilter)} options={[
                { value: "all",    label: "All",    count: flagCounts.all    },
                { value: "high",   label: "High",   count: flagCounts.high   },
                { value: "medium", label: "Medium", count: flagCounts.medium },
                { value: "low",    label: "Low",    count: flagCounts.low    },
              ]} />
            </div>
            {flagged.length > 0 && (
              <Button variant="outline" size="sm" className="sm:ml-auto shrink-0" loading={dismissingAll} onClick={dismissAllFlags}>
                Dismiss all
              </Button>
            )}
          </div>

          {flaggedFiltered.length === 0 ? (
            <Card>
              <CardBody>
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Icon.CheckCircle size={22} />
                  </div>
                  <p className="font-semibold">No flagged content</p>
                  <p className="text-sm text-[var(--muted)]">The AI moderation queue is clear.</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--border)] shadow-sm divide-y divide-[var(--border)]">
              {flaggedFiltered.map((item, i) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-4 flex-wrap p-4 transition-colors hover:bg-[var(--primary-soft)]/40",
                    i % 2 === 1 && "bg-[var(--surface-2)]/25",
                    item.severity === "high" && "border-l-2 border-l-red-400/60",
                  )}
                >
                  {/* Severity indicator */}
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    item.severity === "high"   ? "bg-red-500/10 text-red-500" :
                    item.severity === "medium" ? "bg-amber-500/10 text-amber-500" :
                    "bg-blue-500/10 text-blue-500"
                  )}>
                    <Icon.AlertCircle size={18} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] px-2 py-0.5 rounded-full">
                        {item.type}
                      </span>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", SEVERITY_TONE[item.severity])}>
                        {item.severity} severity
                      </span>
                    </div>
                    <p className="text-sm font-medium">{item.content}</p>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white text-[9px] font-bold">
                          {item.user.charAt(0)}
                        </div>
                        <span className="font-medium text-[var(--foreground)]">{item.user}</span>
                      </span>
                      <span>·</span>
                      <span>{relativeTime(item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" loading={resolving === item.id} onClick={() => resolveFlag(item.id, "dismiss")}>
                      Dismiss
                    </Button>
                    <Button size="sm" loading={resolving === item.id} onClick={() => resolveFlag(item.id, "remove")}
                      className="bg-red-500 hover:bg-red-600 text-white">
                      <Icon.Trash size={13} /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recently actioned — persisted moderation decisions, so this
              history survives refreshes instead of resetting with the queue. */}
          {recentActions.length > 0 && (
            <Card>
              <CardBody>
                <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Icon.Clock size={14} className="text-[var(--muted)]" /> Recent moderation activity
                </h2>
                <div className="space-y-1">
                  {recentActions.map((a, i) => (
                    <div key={a.id} className={cn("flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-lg", i % 2 === 1 && "bg-[var(--surface-2)]/40")}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", a.action === "remove" ? "bg-red-500" : "bg-[var(--muted-2)]")} />
                        <span className="truncate">{a.snippet ?? a.type ?? "Flagged item"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[var(--muted)]">
                        <span className={cn("font-semibold", a.action === "remove" ? "text-red-600 dark:text-red-400" : "text-[var(--foreground)]")}>
                          {a.action === "remove" ? "Removed" : "Dismissed"}
                        </span>
                        <span>·</span>
                        <span>{a.byName}</span>
                        <span>·</span>
                        <span>{relativeTime(a.at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ── MODELS ── */}
      {tab === "models" && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {AI_MODELS.map((m) => {
              const totalQ = AI_MODELS.reduce((s, x) => s + x.queries, 0);
              const pct    = Math.round((m.queries / totalQ) * 100);
              return (
                <Card key={m.name}>
                  <CardBody>
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                        <Icon.Sparkles size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold">{m.name}</p>
                          <Badge variant="success">Active</Badge>
                          <span className="text-xs text-[var(--muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">{m.usage}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                          {[
                            { label: "Queries", value: m.queries.toLocaleString() },
                            { label: "Avg latency", value: m.latency },
                            { label: "Uptime", value: `${m.uptime}%` },
                            { label: "Est. cost", value: m.cost },
                          ].map((s) => (
                            <div key={s.label} className="rounded-xl bg-[var(--surface-2)] p-2.5">
                              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{s.label}</p>
                              <p className="text-sm font-semibold mt-0.5">{s.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs text-[var(--muted)]">
                            <span>Query share</span><span className="font-semibold text-[var(--foreground)]">{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* Cost summary */}
          <Card>
            <CardBody>
              <h2 className="font-semibold mb-4">Estimated cost breakdown</h2>
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-semibold">Model</th>
                      <th className="px-4 py-3 text-right font-semibold">Queries</th>
                      <th className="px-4 py-3 text-right font-semibold">Per query</th>
                      <th className="px-4 py-3 text-right font-semibold">Est. total</th>
                      <th className="px-4 py-3 text-left font-semibold">Latency</th>
                      <th className="px-4 py-3 text-left font-semibold">Uptime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {AI_MODELS.map((m) => {
                      const rate  = parseFloat(m.cost.replace("$", "").replace("/query", ""));
                      const total = (rate * m.queries).toFixed(2);
                      return (
                        <tr key={m.name} className="hover:bg-[var(--surface-2)]/60 transition-colors">
                          <td className="px-4 py-3 font-semibold">{m.name}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{m.queries.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-[var(--muted)]">{m.cost}</td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">${total}</td>
                          <td className="px-4 py-3 text-[var(--muted)]">{m.latency}</td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs font-semibold", m.uptime >= 99.9 ? "text-emerald-500" : "text-amber-500")}>
                              {m.uptime}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── CONFIG ── */}
      {tab === "config" && (
        <div className="space-y-4">
          {/* Feature toggles */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">AI feature toggles</h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{features.filter((f) => f.on).length} of {features.length} features active</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  setFeatures((prev) => {
                    const allOn = prev.every((f) => f.on);
                    const next  = prev.map((f) => ({ ...f, on: !allOn }));
                    const map = Object.fromEntries(next.map((f) => [f.key, f.on]));
                    fetch("/api/admin/ai-settings", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "same-origin",
                      body: JSON.stringify({ features: map }),
                    }).catch(() => {});
                    return next;
                  });
                  toast.push({ title: "All features toggled", tone: "success" });
                }}>
                  {features.every((f) => f.on) ? "Disable all" : "Enable all"}
                </Button>
              </div>
              {features.map((f) => (
                <div key={f.key} className={cn("flex items-center justify-between gap-4 p-3 rounded-xl border transition-all", f.on ? "border-emerald-500/20 bg-emerald-500/5" : "border-[var(--border)] bg-[var(--surface-2)]/50")}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", f.on ? "bg-emerald-500" : "bg-[var(--muted-2)]")} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{f.desc}</p>
                    </div>
                  </div>
                  <button
                    aria-pressed={f.on}
                    aria-label={`${f.on ? "Disable" : "Enable"} ${f.label}`}
                    className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors", f.on ? "bg-[var(--primary)]" : "bg-[var(--surface-2)]")}
                    onClick={() => toggleFeature(f.key)}
                  >
                    <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform", f.on ? "translate-x-5" : "translate-x-0")} />
                  </button>
                </div>
              ))}
            </CardBody>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4 items-start">
          {/* Rate limits */}
          <Card>
            <CardBody className="space-y-4">
              <div>
                <h2 className="font-semibold">Rate limits</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Control AI query limits per plan. Changes are persisted to the database.</p>
              </div>
              {limits.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <span className="text-sm text-[var(--muted)] flex-1">{r.label}</span>
                  <input
                    value={r.value}
                    onChange={(e) => setLimits((prev) => prev.map((l) => l.key === r.key ? { ...l, value: e.target.value } : l))}
                    className="w-28 text-right font-semibold bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
                  />
                </div>
              ))}
              <Button variant="outline" className="w-full" loading={savingLimits} onClick={handleSaveLimits}>
                <Icon.Save size={14} /> Save rate limits
              </Button>
            </CardBody>
          </Card>

          {/* AI safety */}
          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-semibold">Safety &amp; compliance</h2>
              {[
                { label: "Auto-moderate forum posts",    desc: "Flag inappropriate language automatically",       on: true  },
                { label: "Plagiarism detection",         desc: "Detect AI-generated submissions in assignments",   on: true  },
                { label: "Spam filter",                  desc: "Detect and remove promotional spam content",      on: true  },
                { label: "Adult content filter",         desc: "Block adult content in all AI responses",         on: true  },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-[var(--muted)]">{s.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Always on</span>
                </div>
              ))}
            </CardBody>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}
