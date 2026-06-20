"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  StatCard,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, formatDate, relativeTime } from "@/lib/utils";

type Audience = "all" | "students" | "teachers" | "pro";
type Channel = "in_app" | "email" | "both";
type AnnStatus = "sent" | "scheduled" | "draft";

type Ann = {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  channel: Channel;
  status: AnnStatus;
  sentAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  reach: number;
};

const AUDIENCE_LABELS: Record<Audience, string> = {
  all: "All users", students: "Students only", teachers: "Teachers only", pro: "Pro subscribers",
};
const AUDIENCE_REACH: Record<Audience, number> = {
  all: 12400, students: 8600, teachers: 340, pro: 1240,
};
const AUDIENCE_CLS: Record<Audience, string> = {
  all: "bg-[var(--primary)]/10 text-[var(--primary)]",
  students: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  teachers: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  pro: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const CHANNEL_LABELS: Record<Channel, string> = {
  in_app: "In-app only", email: "Email only", both: "In-app + Email",
};
const CHANNEL_ICON: Record<Channel, React.ReactNode> = {
  in_app: <Icon.Bell size={11} />,
  email: <Icon.Mail size={11} />,
  both: <Icon.Send size={11} />,
};

const STATUS_META: Record<AnnStatus, { label: string; variant: "success" | "info" | "default" }> = {
  sent: { label: "Sent", variant: "success" },
  scheduled: { label: "Scheduled", variant: "info" },
  draft: { label: "Draft", variant: "default" },
};

const STATUS_BORDER: Record<AnnStatus, string> = {
  sent: "border-l-emerald-400",
  scheduled: "border-l-sky-400",
  draft: "border-l-[var(--border)]",
};

type FormState = {
  title: string; body: string; audience: Audience;
  channel: Channel; scheduleMode: boolean; scheduledAt: string;
};

const emptyForm: FormState = {
  title: "", body: "", audience: "all",
  channel: "in_app", scheduleMode: false, scheduledAt: "",
};

function exportCSV(anns: Ann[]) {
  const header = ["Title", "Audience", "Channel", "Status", "Reach", "Sent At", "Scheduled At", "Created"];
  const rows = anns.map((a) => [
    `"${a.title.replace(/"/g, '""')}"`,
    a.audience, a.channel, a.status, a.reach,
    a.sentAt ? new Date(a.sentAt).toLocaleString() : "",
    a.scheduledAt ? new Date(a.scheduledAt).toLocaleString() : "",
    new Date(a.createdAt).toLocaleDateString(),
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "announcements.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAnnouncementsPage() {
  const toast = useToast();
  const [anns, setAnns] = React.useState<Ann[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<AnnStatus | "all">("all");
  const [audienceFilter, setAudienceFilter] = React.useState<Audience | "all">("all");
  const [query, setQuery] = React.useState("");

  // Compose modal
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [sending, setSending] = React.useState(false);

  // Detail view modal
  const [viewing, setViewing] = React.useState<Ann | null>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Fetch on mount
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/announcements");
        const data = await res.json();
        if (res.ok) setAnns(data.announcements ?? []);
      } catch {
        // fail silently — empty list
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openCompose(ann?: Ann) {
    if (ann) {
      setEditingId(ann.id);
      setForm({
        title: ann.title, body: ann.body, audience: ann.audience,
        channel: ann.channel,
        scheduleMode: !!ann.scheduledAt,
        scheduledAt: ann.scheduledAt ? ann.scheduledAt.slice(0, 16) : "",
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setComposeOpen(true);
  }

  async function duplicateAnn(ann: Ann) {
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Copy of ${ann.title}`,
        body: ann.body,
        audience: ann.audience,
        channel: ann.channel,
        status: "draft",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAnns((p) => [data.announcement, ...p]);
      toast.push({ title: "Announcement duplicated as draft", tone: "success" });
    }
  }

  async function handleSend(asDraft = false) {
    if (!form.title.trim() || !form.body.trim()) {
      toast.push({ title: "Title and message are required.", tone: "danger" }); return;
    }
    if (form.scheduleMode && !form.scheduledAt && !asDraft) {
      toast.push({ title: "Pick a schedule date/time.", tone: "danger" }); return;
    }
    setSending(true);
    const status: AnnStatus = asDraft ? "draft" : form.scheduleMode ? "scheduled" : "sent";
    const payload = {
      title: form.title.trim(), body: form.body.trim(),
      audience: form.audience, channel: form.channel, status,
      scheduledAt: status === "scheduled" ? new Date(form.scheduledAt).toISOString() : undefined,
    };
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/announcements/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setAnns((p) => p.map((a) => a.id === editingId ? data.announcement : a));
          toast.push({ title: "Announcement updated", tone: "success" });
        }
      } else {
        const res = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setAnns((p) => [data.announcement, ...p]);
          toast.push({
            title: asDraft ? "Saved as draft" : form.scheduleMode ? "Announcement scheduled!" : "Announcement sent!",
            tone: "success",
          });
        }
      }
    } catch {
      toast.push({ title: "Network error, please try again.", tone: "danger" });
    } finally {
      setSending(false);
      setComposeOpen(false);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    const res = await fetch(`/api/admin/announcements/${deletingId}`, { method: "DELETE" });
    if (res.ok) {
      setAnns((p) => p.filter((a) => a.id !== deletingId));
      if (viewing?.id === deletingId) setViewing(null);
      toast.push({ title: "Announcement deleted", tone: "info" });
    }
    setDeletingId(null);
  }

  const stats = React.useMemo(() => ({
    totalSent: anns.filter((a) => a.status === "sent").length,
    totalReached: anns.filter((a) => a.status === "sent").reduce((s, a) => s + a.reach, 0),
    scheduled: anns.filter((a) => a.status === "scheduled").length,
    drafts: anns.filter((a) => a.status === "draft").length,
  }), [anns]);

  const counts = React.useMemo(() => ({
    all: anns.length,
    sent: anns.filter((a) => a.status === "sent").length,
    scheduled: anns.filter((a) => a.status === "scheduled").length,
    draft: anns.filter((a) => a.status === "draft").length,
  }), [anns]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return anns.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (audienceFilter !== "all" && a.audience !== audienceFilter) return false;
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q);
    });
  }, [anns, filter, audienceFilter, query]);

  return (
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Broadcast messages to all users or specific groups via in-app notifications or email.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => exportCSV(filtered)} className="flex-1 sm:flex-none justify-center">
            <Icon.Download size={15} /> Export CSV
          </Button>
          <Button onClick={() => openCompose()} className="flex-1 sm:flex-none justify-center">
            <Icon.Megaphone size={16} /> New announcement
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total sent" value={stats.totalSent} icon={<Icon.Send size={18} />} tone="success" />
        <StatCard
          label="Total reached"
          value={stats.totalReached.toLocaleString()}
          icon={<Icon.Users size={18} />}
          tone="primary"
        />
        <StatCard label="Scheduled" value={stats.scheduled} icon={<Icon.Calendar size={18} />} tone="accent" />
        <StatCard label="Drafts" value={stats.drafts} icon={<Icon.Save size={18} />} tone="warning" />
      </div>

      {/* ── Controls ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Tabs
            value={filter}
            onChange={(v) => setFilter(v as AnnStatus | "all")}
            className="overflow-x-auto sm:overflow-visible"
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "sent", label: "Sent", count: counts.sent },
              { value: "scheduled", label: "Scheduled", count: counts.scheduled },
              { value: "draft", label: "Drafts", count: counts.draft },
            ]}
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements…"
            icon={<Icon.Search size={16} />}
            className="w-full sm:w-64 sm:shrink-0"
          />
        </div>

        {/* Audience filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[var(--muted)] shrink-0">Audience:</span>
          {(["all", "students", "teachers", "pro"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAudienceFilter(a)}
              className={`h-7 px-3 rounded-full text-xs font-medium transition capitalize ${
                audienceFilter === a
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {a === "all" ? "All audiences" : AUDIENCE_LABELS[a as Audience]}
            </button>
          ))}
        </div>
      </div>

      {/* ── History ── */}
      {loading ? (
        <Card><CardBody><div className="flex items-center justify-center py-12 text-[var(--muted)]"><Icon.Loader size={22} className="animate-spin mr-2" /> Loading announcements…</div></CardBody></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Megaphone size={28} />}
              title={anns.length === 0 ? "No announcements yet" : "No announcements match."}
              description={anns.length === 0 ? "Send your first broadcast to get started." : "Try a different filter or search."}
              action={
                anns.length === 0 && (
                  <Button onClick={() => openCompose()}>
                    <Icon.Megaphone size={16} /> New announcement
                  </Button>
                )
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ann) => {
            const sm = STATUS_META[ann.status];
            return (
              <Card
                key={ann.id}
                className={`border-l-2 ${STATUS_BORDER[ann.status]} hover:shadow-sm transition-shadow group`}
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      ann.status === "sent" ? "bg-emerald-500/10 text-emerald-500"
                      : ann.status === "scheduled" ? "bg-sky-500/10 text-sky-500"
                      : "bg-[var(--surface-2)] text-[var(--muted)]"
                    }`}>
                      <Icon.Megaphone size={18} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="font-semibold text-sm cursor-pointer hover:text-[var(--primary)] transition"
                          onClick={() => setViewing(ann)}
                        >
                          {ann.title}
                        </p>
                        <Badge variant={sm.variant}>{sm.label}</Badge>
                      </div>

                      <p className="text-sm text-[var(--muted)] line-clamp-2 leading-relaxed">{ann.body}</p>

                      {/* Meta chips */}
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${AUDIENCE_CLS[ann.audience]}`}>
                          <Icon.Users size={10} /> {AUDIENCE_LABELS[ann.audience]}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] flex items-center gap-1">
                          {CHANNEL_ICON[ann.channel]} {CHANNEL_LABELS[ann.channel]}
                        </span>
                        {ann.status === "sent" && ann.reach > 0 && (
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Icon.CheckCircle size={11} /> {ann.reach.toLocaleString()} reached
                          </span>
                        )}
                        {ann.status === "scheduled" && ann.scheduledAt && (
                          <span className="text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1">
                            <Icon.Calendar size={11} /> {formatDate(ann.scheduledAt)}
                          </span>
                        )}
                        {ann.sentAt && (
                          <span className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                            <Icon.Clock size={11} /> {relativeTime(ann.sentAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setViewing(ann)}
                        title="Preview"
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                      >
                        <Icon.Eye size={14} />
                      </button>
                      <button
                        onClick={() => openCompose(ann)}
                        title="Edit"
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                      >
                        <Icon.Edit size={14} />
                      </button>
                      <button
                        onClick={() => duplicateAnn(ann)}
                        title="Duplicate"
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                      >
                        <Icon.Copy size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingId(ann.id)}
                        title="Delete"
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-[var(--danger)] transition"
                      >
                        <Icon.Trash size={14} />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
          <p className="text-xs text-[var(--muted)] px-1">Showing {filtered.length} of {anns.length} announcements</p>
        </div>
      )}

      {/* ── Compose / Edit Modal ── */}
      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        size="lg"
        title={editingId ? "Edit announcement" : "New announcement"}
      >
        <div>
          {/* Live preview header */}
          <div className="px-5 sm:px-6 py-4 flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface-2)]/50">
            <div className={cn(
              "h-14 w-14 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md bg-gradient-to-br transition-all duration-300",
              form.audience === "students" ? "from-violet-500 to-purple-400 shadow-violet-500/20"
                : form.audience === "teachers" ? "from-sky-500 to-blue-400 shadow-sky-500/20"
                : form.audience === "pro" ? "from-amber-500 to-orange-400 shadow-amber-500/20"
                : "from-[var(--primary)] to-emerald-400 shadow-green-500/20"
            )}>
              <Icon.Megaphone size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("font-semibold truncate", form.title ? "text-[var(--foreground)]" : "text-[var(--muted)] text-sm italic")}>
                {form.title || "Announcement title…"}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1", AUDIENCE_CLS[form.audience])}>
                  <Icon.Users size={9} /> {AUDIENCE_LABELS[form.audience]} (~{AUDIENCE_REACH[form.audience].toLocaleString()})
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] flex items-center gap-1">
                  {CHANNEL_ICON[form.channel]} {CHANNEL_LABELS[form.channel]}
                </span>
                {form.scheduleMode && form.scheduledAt && (
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 flex items-center gap-1">
                    <Icon.Calendar size={9} /> {form.scheduledAt.replace("T", " ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="ann-title">Title</Label>
                <span className={cn("text-[11px]", form.title.length > 70 ? "text-amber-500" : "text-[var(--muted)]")}>
                  {form.title.length}/80
                </span>
              </div>
              <Input
                id="ann-title"
                placeholder="e.g. Platform maintenance notice"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 80) }))}
                maxLength={80}
                icon={<Icon.Megaphone size={16} />}
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="ann-body">Message</Label>
                <span className={cn("text-[11px]", form.body.length > 540 ? "text-amber-500" : "text-[var(--muted)]")}>
                  {form.body.length}/600
                </span>
              </div>
              <Textarea
                id="ann-body"
                placeholder="Write your announcement here…"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value.slice(0, 600) }))}
                rows={4}
              />
            </div>

            {/* Audience + Channel */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ann-audience">Audience</Label>
                <Select
                  id="ann-audience"
                  value={form.audience}
                  onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as Audience }))}
                >
                  <option value="all">All users (~12,400)</option>
                  <option value="students">Students only (~8,600)</option>
                  <option value="teachers">Teachers only (~340)</option>
                  <option value="pro">Pro subscribers (~1,240)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="ann-channel">Channel</Label>
                <Select
                  id="ann-channel"
                  value={form.channel}
                  onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as Channel }))}
                >
                  <option value="in_app">In-app notification only</option>
                  <option value="email">Email only</option>
                  <option value="both">In-app + Email</option>
                </Select>
              </div>
            </div>

            {/* Schedule toggle card */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  form.scheduleMode ? "bg-sky-500/15 text-sky-600 dark:text-sky-400" : "bg-[var(--surface)] text-[var(--muted)]"
                )}>
                  <Icon.Calendar size={15} />
                </div>
                <div>
                  <p className="text-sm font-medium">Schedule for later</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {form.scheduleMode ? "Pick a date and time below" : "Send immediately on click"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, scheduleMode: !f.scheduleMode }))}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
                  form.scheduleMode ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]",
                )}
              >
                <span className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform scale-90",
                  form.scheduleMode ? "translate-x-4" : "translate-x-0",
                )} />
              </button>
            </div>

            {/* Schedule datetime */}
            {form.scheduleMode && (
              <div className="fade-in">
                <Label htmlFor="ann-schedule">Schedule date &amp; time</Label>
                <Input
                  id="ann-schedule"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  icon={<Icon.Calendar size={16} />}
                />
              </div>
            )}

            {/* Reach summary */}
            <div className={cn(
              "flex items-start gap-3 p-3.5 rounded-xl border transition-colors",
              form.channel === "both"
                ? "bg-amber-500/8 border-amber-500/20"
                : "bg-[var(--primary-soft)] border-[var(--primary)]/15"
            )}>
              <div className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                form.channel === "both" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-[var(--primary)]/15 text-[var(--primary)]"
              )}>
                <Icon.Users size={14} />
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                This will reach approximately{" "}
                <span className="font-bold text-[var(--foreground)]">
                  {AUDIENCE_REACH[form.audience].toLocaleString()} users
                </span>{" "}
                via{" "}
                <span className="font-bold text-[var(--foreground)]">
                  {CHANNEL_LABELS[form.channel].toLowerCase()}
                </span>.
                {form.channel === "both" && (
                  <span className="text-amber-600 dark:text-amber-400"> Email delivery may take a few minutes.</span>
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 sm:px-6 pb-5 pt-4 flex flex-col-reverse sm:flex-row gap-2 border-t border-[var(--border)]">
            <Button variant="ghost" onClick={() => setComposeOpen(false)} disabled={sending} className="sm:mr-auto">
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleSend(true)} loading={sending} className="w-full sm:w-auto">
              <Icon.Save size={14} /> Save as draft
            </Button>
            <Button loading={sending} onClick={() => handleSend(false)} className="w-full sm:w-auto">
              {form.scheduleMode
                ? <><Icon.Calendar size={14} /> Schedule</>
                : <><Icon.Send size={14} /> Send now</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Detail / Preview Modal ── */}
      {viewing && (
        <Modal open onClose={() => setViewing(null)} size="md" title="Announcement preview">
          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3 justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-snug">{viewing.title}</h2>
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  <Badge variant={STATUS_META[viewing.status].variant}>{STATUS_META[viewing.status].label}</Badge>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${AUDIENCE_CLS[viewing.audience]}`}>
                    <Icon.Users size={10} /> {AUDIENCE_LABELS[viewing.audience]}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] flex items-center gap-1">
                    {CHANNEL_ICON[viewing.channel]} {CHANNEL_LABELS[viewing.channel]}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Reach", value: viewing.reach > 0 ? viewing.reach.toLocaleString() : "—", icon: <Icon.Users size={13} />, cls: "text-emerald-500 bg-emerald-500/10" },
                {
                  label: viewing.status === "scheduled" ? "Scheduled for" : "Sent",
                  value: viewing.sentAt ? formatDate(viewing.sentAt) : viewing.scheduledAt ? formatDate(viewing.scheduledAt) : "—",
                  icon: <Icon.Calendar size={13} />, cls: "text-sky-500 bg-sky-500/10",
                },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <div className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 mb-1.5 ${s.cls}`}>
                    {s.icon} {s.label}
                  </div>
                  <p className="text-sm font-semibold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Body */}
            <div>
              <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Message</p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{viewing.body}</p>
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setViewing(null)} className="flex-1">
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => duplicateAnn(viewing)}
                title="Duplicate"
              >
                <Icon.Copy size={14} /> Duplicate
              </Button>
              <Button
                variant="outline"
                onClick={() => { setViewing(null); setTimeout(() => openCompose(viewing), 60); }}
              >
                <Icon.Edit size={14} /> Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeletingId(viewing.id)}
                className="!text-[var(--danger)] !border-[var(--danger)]/30 hover:!bg-red-500/5"
              >
                <Icon.Trash size={14} />
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      <Modal open={!!deletingId} onClose={() => setDeletingId(null)} size="sm" title="Delete announcement?">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This announcement will be permanently removed. This action can&apos;t be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>
              <Icon.Trash size={16} /> Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
