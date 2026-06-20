"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  Select,
  StatCard,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, relativeTime } from "@/lib/utils";

type NotifType = "assignment" | "announcement" | "reminder" | "achievement";

type Notif = {
  id: string;
  userId: string | null;
  type: NotifType;
  title: string;
  message: string;
  read: boolean;
  broadcast: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null } | null;
};

type Stats = { total: number; broadcast: number; targeted: number; unread: number };

const TYPE_INFO: Record<NotifType, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  assignment:   { label: "Assignment",   bg: "bg-[var(--primary-soft)]",  color: "text-[var(--primary)]", icon: <Icon.FilePen size={15} /> },
  announcement: { label: "Announcement", bg: "bg-sky-500/10",             color: "text-sky-500",           icon: <Icon.Megaphone size={15} /> },
  reminder:     { label: "Reminder",     bg: "bg-amber-500/10",           color: "text-amber-500",         icon: <Icon.Clock size={15} /> },
  achievement:  { label: "Achievement",  bg: "bg-emerald-500/10",         color: "text-emerald-500",       icon: <Icon.Award size={15} /> },
};

const PAGE_SIZE = 10;

function exportCSV(items: Notif[]) {
  const header = ["ID", "Type", "Title", "Broadcast", "Recipient", "Read", "Created"];
  const rows = items.map((n) => [
    n.id, n.type,
    `"${n.title.replace(/"/g, '""')}"`,
    n.broadcast ? "Yes" : "No",
    n.user ? `"${n.user.name}"` : "All users",
    n.read ? "Yes" : "No",
    new Date(n.createdAt).toLocaleString(),
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "notifications.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminNotificationsPage() {
  const toast = useToast();

  const [notifs,        setNotifs]        = React.useState<Notif[]>([]);
  const [stats,         setStats]         = React.useState<Stats>({ total: 0, broadcast: 0, targeted: 0, unread: 0 });
  const [loading,       setLoading]       = React.useState(true);
  const [tab,           setTab]           = React.useState<"all" | NotifType>("all");
  const [broadcastOnly, setBroadcastOnly] = React.useState(false);
  const [search,        setSearch]        = React.useState("");
  const [page,          setPage]          = React.useState(1);
  const [deleting,      setDeleting]      = React.useState<string | null>(null);

  // Compose modal
  const [compose,      setCompose]      = React.useState(false);
  const [form,         setForm]         = React.useState({ type: "announcement" as NotifType, title: "", message: "" });
  const [formErr,      setFormErr]      = React.useState("");
  const [sending,      setSending]      = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", { credentials: "same-origin" });
      const data = await res.json();
      if (res.ok) {
        setNotifs(data.notifications ?? []);
        setStats(data.stats ?? { total: 0, broadcast: 0, targeted: 0, unread: 0 });
      } else {
        toast.push({ title: data.error ?? "Failed to load notifications.", tone: "danger" });
      }
    } catch {
      toast.push({ title: "Failed to load notifications.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { setPage(1); }, [tab, broadcastOnly, search]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifs.filter((n) => {
      if (tab !== "all" && n.type !== tab) return false;
      if (broadcastOnly && !n.broadcast) return false;
      if (q && !n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q) && !n.user?.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [notifs, tab, broadcastOnly, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function deleteNotif(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const d = await res.json();
        toast.push({ title: d.error ?? "Delete failed.", tone: "danger" });
        return;
      }
      setNotifs((prev) => prev.filter((n) => n.id !== id));
      setStats((s) => ({ ...s, total: s.total - 1 }));
      toast.push({ title: "Notification deleted", tone: "success" });
    } catch {
      toast.push({ title: "Delete failed.", tone: "danger" });
    } finally {
      setDeleting(null);
    }
  }

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    setFormErr("");
    if (!form.title.trim()) { setFormErr("Title is required."); return; }
    if (!form.message.trim()) { setFormErr("Message is required."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ type: form.type, title: form.title.trim(), message: form.message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFormErr(data.error ?? "Failed to send."); return; }
      setNotifs((prev) => [data.notification, ...prev]);
      setStats((s) => ({ ...s, total: s.total + 1, broadcast: s.broadcast + 1 }));
      setCompose(false);
      setForm({ type: "announcement", title: "", message: "" });
      toast.push({ title: "Broadcast notification sent", tone: "success" });
    } catch {
      setFormErr("Failed to send notification.");
    } finally {
      setSending(false);
    }
  }

  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = { assignment: 0, announcement: 0, reminder: 0, achievement: 0 };
    notifs.forEach((n) => { counts[n.type] = (counts[n.type] ?? 0) + 1; });
    return counts;
  }, [notifs]);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            View all platform notifications. Send broadcasts to all users or specific students.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { exportCSV(filtered); toast.push({ title: "Exported", tone: "success" }); }}>
            <Icon.Download size={15} />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button onClick={() => setCompose(true)}>
            <Icon.Send size={15} />
            <span className="hidden sm:inline">Send broadcast</span>
            <span className="sm:hidden">Broadcast</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard dense label="Total"     value={stats.total}     icon={<Icon.Bell size={16} />}        tone="primary" />
        <StatCard dense label="Broadcast" value={stats.broadcast} icon={<Icon.Megaphone size={16} />}   tone="accent"  delta="Sent to all users" />
        <StatCard dense label="Targeted"  value={stats.targeted}  icon={<Icon.User size={16} />}         tone="success" delta="User-specific" />
        <StatCard dense label="Unread"    value={stats.unread}    icon={<Icon.BellRing size={16} />}     tone="warning" delta="Not yet seen" />
      </div>

      {/* Type filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(TYPE_INFO) as NotifType[]).map((t) => {
          const info   = TYPE_INFO[t];
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(active ? "all" : t)}
              className={cn(
                "rounded-2xl border p-2.5 sm:p-3 text-left transition-all hover:-translate-y-0.5",
                active
                  ? `${info.bg} border-current shadow-md`
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]",
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0", info.bg, info.color)}>
                  {info.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-[var(--muted)] truncate">{info.label}</p>
                  <p className="text-lg sm:text-xl font-bold tabular-nums leading-tight">{typeCounts[t] ?? 0}</p>
                </div>
              </div>
              {active && <p className={cn("mt-1.5 text-[10px] font-medium flex items-center gap-1", info.color)}><Icon.Check size={11} /> Filtering</p>}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="overflow-x-auto pb-1">
          <div className="flex p-1 rounded-xl bg-[var(--surface-2)] gap-1 w-max min-w-full">
            {([
              { value: "all",          label: "All",           count: notifs.length },
              { value: "announcement", label: "Announcements", count: typeCounts.announcement ?? 0 },
              { value: "assignment",   label: "Assignments",   count: typeCounts.assignment ?? 0 },
              { value: "reminder",     label: "Reminders",     count: typeCounts.reminder ?? 0 },
              { value: "achievement",  label: "Achievements",  count: typeCounts.achievement ?? 0 },
            ] as { value: typeof tab; label: string; count: number }[]).map((o) => (
              <button
                key={o.value}
                onClick={() => setTab(o.value)}
                className={cn(
                  "px-3 h-9 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                  tab === o.value
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {o.label}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  tab === o.value ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "bg-[var(--surface-2)]",
                )}>
                  {o.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setBroadcastOnly((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-medium transition shrink-0",
              broadcastOnly
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]",
            )}
          >
            <Icon.Megaphone size={13} /> Broadcast only
          </button>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            icon={<Icon.Search size={15} />}
            className="flex-1 !min-w-[160px] sm:!w-52 sm:flex-none sm:ml-auto"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
              <Icon.Loader size={18} className="animate-spin" /> Loading notifications…
            </div>
          </CardBody>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Bell size={28} />}
              title="No notifications"
              description={notifs.length === 0 ? "No notifications have been sent yet." : "No notifications match the current filter."}
              action={
                <Button onClick={() => setCompose(true)}>
                  <Icon.Send size={14} /> Send first broadcast
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                  <tr>
                    <Th>Type</Th>
                    <Th>Title / Message</Th>
                    <Th className="hidden md:table-cell">Recipient</Th>
                    <Th className="hidden lg:table-cell">Sent</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Delete</Th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((n) => {
                    const info = TYPE_INFO[n.type];
                    return (
                      <tr key={n.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/50 transition group">
                        <Td>
                          <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", info.bg, info.color)}>
                            {info.icon}
                          </div>
                        </Td>
                        <Td>
                          <p className="font-semibold truncate max-w-[16ch] sm:max-w-[28ch]">{n.title}</p>
                          <p className="text-xs text-[var(--muted)] truncate max-w-[20ch] sm:max-w-[34ch] mt-0.5">{n.message}</p>
                        </Td>
                        <Td className="hidden md:table-cell">
                          {n.broadcast ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-[var(--primary)]">
                              <Icon.Megaphone size={12} /> All users
                            </span>
                          ) : n.user ? (
                            <div>
                              <p className="text-xs font-medium">{n.user.name}</p>
                              <p className="text-[11px] text-[var(--muted)]">{n.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">Unknown</span>
                          )}
                        </Td>
                        <Td className="hidden lg:table-cell text-xs text-[var(--muted)]">
                          {relativeTime(n.createdAt)}
                        </Td>
                        <Td>
                          {n.broadcast ? (
                            <Badge variant="primary">Broadcast</Badge>
                          ) : n.read ? (
                            <Badge variant="success">Read</Badge>
                          ) : (
                            <Badge variant="warning">Unread</Badge>
                          )}
                        </Td>
                        <Td className="text-right">
                          <button
                            onClick={() => deleteNotif(n.id)}
                            disabled={deleting === n.id}
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
                          >
                            {deleting === n.id ? <Icon.Loader size={14} className="animate-spin" /> : <Icon.Trash size={14} />}
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--muted)] shrink-0">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-2)] disabled:opacity-40 transition"
                  >
                    <Icon.ChevronLeft size={15} />
                  </button>
                  <span className="text-xs text-[var(--muted)] px-2">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-2)] disabled:opacity-40 transition"
                  >
                    <Icon.ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Compose / Send broadcast modal */}
      <Modal
        open={compose}
        onClose={() => { if (!sending) { setCompose(false); setFormErr(""); } }}
        title="Send broadcast notification"
        size="md"
      >
        <form onSubmit={sendBroadcast}>
          {/* Live preview header */}
          <div className="px-5 sm:px-6 py-4 flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface-2)]/50">
            <div className={cn(
              "h-14 w-14 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md transition-all duration-300 bg-gradient-to-br",
              form.type === "announcement" ? "from-sky-500 to-blue-400 shadow-sky-500/20"
                : form.type === "reminder" ? "from-amber-500 to-orange-400 shadow-amber-500/20"
                : form.type === "achievement" ? "from-emerald-500 to-green-400 shadow-emerald-500/20"
                : "from-[var(--primary)] to-emerald-400 shadow-green-500/20"
            )}>
              {form.type === "announcement" ? <Icon.Megaphone size={26} />
                : form.type === "reminder" ? <Icon.Clock size={26} />
                : form.type === "achievement" ? <Icon.Award size={26} />
                : <Icon.FilePen size={26} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("font-semibold truncate", form.title ? "text-[var(--foreground)]" : "text-[var(--muted)] text-sm italic")}>
                {form.title || "Notification title…"}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", TYPE_INFO[form.type].bg, TYPE_INFO[form.type].color)}>
                  {TYPE_INFO[form.type].label}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center gap-1">
                  <Icon.Users size={9} /> All users
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Type picker */}
            <div>
              <label className="text-sm font-medium block mb-2">Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(TYPE_INFO) as NotifType[]).map((t) => {
                  const info = TYPE_INFO[t];
                  const active = form.type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={cn(
                        "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-semibold transition-all",
                        active
                          ? `${info.bg} ${info.color} border-current shadow-sm`
                          : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]"
                      )}
                    >
                      <span className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
                        active ? info.bg : "bg-[var(--surface)]",
                        active ? info.color : "text-[var(--muted)]"
                      )}>
                        {info.icon}
                      </span>
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Title</label>
                <span className={cn("text-[11px]", form.title.length > 100 ? "text-amber-500" : "text-[var(--muted)]")}>
                  {form.title.length}/120
                </span>
              </div>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Platform maintenance on Sunday"
                maxLength={120}
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Message</label>
                <span className={cn("text-[11px]", form.message.length > 450 ? "text-amber-500" : "text-[var(--muted)]")}>
                  {form.message.length}/500
                </span>
              </div>
              <Textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Write a clear, concise message for your users…"
                rows={4}
                maxLength={500}
              />
            </div>

            {/* Reach info */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/15">
              <div className="h-7 w-7 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                <Icon.Users size={14} />
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                This notification will be delivered to{" "}
                <span className="font-bold text-[var(--foreground)]">all users</span>{" "}
                and will appear in their notification inbox immediately.
              </p>
            </div>

            {/* Error */}
            {formErr && (
              <div className="flex items-start gap-2.5 text-sm text-[var(--danger)] bg-red-500/8 border border-red-500/20 px-3.5 py-3 rounded-xl">
                <Icon.AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{formErr}</span>
              </div>
            )}
          </div>

          <div className="px-5 sm:px-6 pb-5 pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-[var(--border)]">
            <Button variant="outline" type="button" onClick={() => setCompose(false)} disabled={sending} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" loading={sending} disabled={!form.title.trim() || !form.message.trim()} className="w-full sm:w-auto">
              <Icon.Send size={14} /> Send to all users
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-semibold px-4 py-3 ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className ?? ""}`}>{children}</td>;
}
