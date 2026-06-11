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

const PAGE_SIZE = 20;

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
        <StatCard label="Total"     value={stats.total}     icon={<Icon.Bell size={18} />}        tone="primary" />
        <StatCard label="Broadcast" value={stats.broadcast} icon={<Icon.Megaphone size={18} />}   tone="accent"  delta="Sent to all users" />
        <StatCard label="Targeted"  value={stats.targeted}  icon={<Icon.User size={18} />}         tone="success" delta="User-specific" />
        <StatCard label="Unread"    value={stats.unread}    icon={<Icon.BellRing size={18} />}     tone="warning" delta="Not yet seen" />
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
                "rounded-2xl border p-3 sm:p-4 text-left transition-all hover:-translate-y-0.5",
                active
                  ? `${info.bg} border-current shadow-md`
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]",
              )}
            >
              <div className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center", info.bg, info.color)}>
                {info.icon}
              </div>
              <p className="mt-2 sm:mt-3 text-xs font-medium text-[var(--muted)]">{info.label}</p>
              <p className="mt-0.5 text-xl sm:text-2xl font-bold tabular-nums">{typeCounts[t] ?? 0}</p>
              {active && <p className={cn("mt-1.5 text-xs font-medium flex items-center gap-1", info.color)}><Icon.Check size={11} /> Filtering</p>}
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
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
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
      <Modal open={compose} onClose={() => { if (!sending) { setCompose(false); setFormErr(""); } }} title="Send broadcast notification" size="md">
        <form onSubmit={sendBroadcast} className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            A broadcast notification is sent to <strong>all users</strong> on the platform and will appear in their notification inbox.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Type</label>
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as NotifType }))}
            >
              <option value="announcement">Announcement</option>
              <option value="reminder">Reminder</option>
              <option value="achievement">Achievement</option>
              <option value="assignment">Assignment</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Platform maintenance on Sunday"
              maxLength={120}
            />
            <p className="text-[11px] text-[var(--muted-2)] text-right">{form.title.length}/120</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Message</label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Write a clear, concise message for your users…"
              rows={4}
              maxLength={500}
            />
            <p className="text-[11px] text-[var(--muted-2)] text-right">{form.message.length}/500</p>
          </div>

          {formErr && (
            <p className="text-xs text-[var(--danger)] flex items-center gap-1.5">
              <Icon.AlertCircle size={13} /> {formErr}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-3">
            <Button variant="outline" type="button" onClick={() => setCompose(false)} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" loading={sending} disabled={!form.title.trim() || !form.message.trim()}>
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
