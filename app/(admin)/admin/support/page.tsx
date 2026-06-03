"use client";

import * as React from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  Select,
  StatCard,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { formatDate, relativeTime } from "@/lib/utils";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

type Ticket = {
  id: string;
  subject: string;
  body: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
};

type Reply = {
  id: string;
  body: string;
  createdAt: string;
  isStaff: boolean;
  author: { id: string; name: string; avatar: string | null; role: string };
};

type TicketDetail = {
  id: string;
  subject: string;
  body: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
};

type Filter = "all" | TicketStatus;
type SortKey = "updated" | "oldest" | "priority" | "newest";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_BADGE: Record<TicketStatus, "info" | "warning" | "success" | "default"> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  closed: "default",
};

const PRIORITY_BADGE: Record<TicketPriority, "default" | "info" | "warning" | "danger"> = {
  low: "default",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

const PRIORITY_BORDER: Record<TicketPriority, string> = {
  urgent: "border-l-rose-500",
  high: "border-l-amber-500",
  medium: "border-l-sky-400",
  low: "border-l-[var(--border)]",
};

const PRIORITY_CLS: Record<TicketPriority, string> = {
  urgent: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  high: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  medium: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  low: "bg-[var(--surface-2)] text-[var(--muted)]",
};

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  urgent: 0, high: 1, medium: 2, low: 3,
};

const PAGE_SIZE = 10;

function exportCSV(tickets: Ticket[]) {
  const header = ["Requester", "Email", "Subject", "Category", "Priority", "Status", "Replies", "Created", "Updated"];
  const rows = tickets.map((t) => [
    `"${t.userName.replace(/"/g, '""')}"`,
    t.userEmail,
    `"${t.subject.replace(/"/g, '""')}"`,
    t.category,
    t.priority,
    t.status,
    t.replyCount,
    new Date(t.createdAt).toLocaleDateString(),
    new Date(t.updatedAt).toLocaleDateString(),
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "support-tickets.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminSupportPage() {
  const toast = useToast();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("updated");
  const [priorityFilter, setPriorityFilter] = React.useState<TicketPriority | "all">("all");
  const [page, setPage] = React.useState(1);

  const [openId, setOpenId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [replying, setReplying] = React.useState(false);
  const [statusDraft, setStatusDraft] = React.useState<TicketStatus>("open");
  const [priorityDraft, setPriorityDraft] = React.useState<TicketPriority>("medium");
  const [savingMeta, setSavingMeta] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support", { credentials: "same-origin" });
      const data = await res.json();
      if (res.ok) setTickets(data.tickets ?? []);
      else toast.push({ title: data.error ?? "Failed to load tickets.", tone: "danger" });
    } catch {
      toast.push({ title: "Failed to load tickets.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { setPage(1); }, [filter, query, sortKey, priorityFilter]);

  React.useEffect(() => {
    if (!openId) { setDetail(null); setReplyText(""); return; }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/support/${openId}`, { credentials: "same-origin" });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setDetail(data.ticket);
          setStatusDraft(data.ticket.status);
          setPriorityDraft(data.ticket.priority);
        } else {
          toast.push({ title: data.error ?? "Failed to load ticket.", tone: "danger" });
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [openId, toast]);

  const counts = React.useMemo(
    () => ({
      all: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      in_progress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
      urgent: tickets.filter((t) => t.priority === "urgent").length,
    }),
    [tickets],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets
      .filter((t) => {
        if (filter !== "all" && t.status !== filter) return false;
        if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
        if (!q) return true;
        return (
          t.subject.toLowerCase().includes(q) ||
          t.userName.toLowerCase().includes(q) ||
          t.userEmail.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortKey === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (sortKey === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortKey === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [tickets, filter, query, sortKey, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function sendReply() {
    if (!detail || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/${detail.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ body: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.push({ title: data.error ?? "Reply failed.", tone: "danger" }); return; }
      const reply: Reply = {
        id: data.reply.id, body: data.reply.body, createdAt: data.reply.createdAt,
        isStaff: data.reply.isStaff, author: { id: "", name: "You", avatar: null, role: "Admin" },
      };
      setDetail((d) => (d ? { ...d, replies: [...d.replies, reply] } : d));
      setReplyText("");
      setTickets((prev) =>
        prev.map((t) =>
          t.id === detail.id ? { ...t, replyCount: t.replyCount + 1, updatedAt: reply.createdAt } : t,
        ),
      );
      toast.push({ title: "Reply sent", tone: "success" });
    } catch {
      toast.push({ title: "Reply failed.", tone: "danger" });
    } finally {
      setReplying(false);
    }
  }

  async function saveMeta(overrideStatus?: TicketStatus) {
    if (!detail) return;
    const newStatus = overrideStatus ?? statusDraft;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/admin/support/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: newStatus, priority: priorityDraft }),
      });
      const data = await res.json();
      if (!res.ok) { toast.push({ title: data.error ?? "Update failed.", tone: "danger" }); return; }
      setStatusDraft(newStatus);
      setDetail((d) => (d ? { ...d, status: newStatus, priority: priorityDraft } : d));
      setTickets((prev) =>
        prev.map((t) => t.id === detail.id ? { ...t, status: newStatus, priority: priorityDraft } : t),
      );
      toast.push({ title: "Ticket updated", tone: "success" });
    } catch {
      toast.push({ title: "Update failed.", tone: "danger" });
    } finally {
      setSavingMeta(false);
    }
  }

  const metaChanged = !!detail && (statusDraft !== detail.status || priorityDraft !== detail.priority);

  return (
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Support tickets</h1>
          <p className="mt-1 text-[var(--muted)]">
            Respond to student requests, set priorities, and track each ticket to resolution.
          </p>
        </div>
        <Button variant="outline" onClick={() => exportCSV(filtered)}>
          <Icon.Download size={15} /> Export CSV
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Open" value={counts.open} icon={<Icon.Inbox size={18} />} tone="primary" />
        <StatCard label="In progress" value={counts.in_progress} icon={<Icon.Clock size={18} />} tone="accent" />
        <StatCard label="Resolved" value={counts.resolved} icon={<Icon.CheckCircle size={18} />} tone="success" />
        <StatCard
          label="Urgent"
          value={counts.urgent}
          icon={<Icon.AlertCircle size={18} />}
          tone="warning"
        />
      </div>

      {/* ── Controls ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Tabs
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "open", label: "Open", count: counts.open },
              { value: "in_progress", label: "In progress", count: counts.in_progress },
              { value: "resolved", label: "Resolved", count: counts.resolved },
              { value: "closed", label: "Closed", count: counts.closed },
            ]}
          />
          <div className="flex items-center gap-2 shrink-0">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tickets…"
              icon={<Icon.Search size={16} />}
              className="w-52"
            />
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 text-xs !py-0 w-[148px]"
            >
              <option value="updated">Last updated</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="priority">Priority (urgent first)</option>
            </Select>
          </div>
        </div>

        {/* Priority filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[var(--muted)] shrink-0">Priority:</span>
          {(["all", "urgent", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`h-7 px-3 rounded-full text-xs font-medium transition capitalize ${
                priorityFilter === p
                  ? p === "all"
                    ? "bg-[var(--primary)] text-white"
                    : p === "urgent"
                    ? "bg-rose-500 text-white"
                    : p === "high"
                    ? "bg-amber-500 text-white"
                    : p === "medium"
                    ? "bg-sky-500 text-white"
                    : "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {p === "all" ? "All priorities" : p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
              <Icon.Loader size={18} className="animate-spin" /> Loading tickets…
            </div>
          </CardBody>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.MessageSquare size={28} />}
              title="No tickets"
              description={
                tickets.length === 0
                  ? "No support tickets have been raised yet."
                  : "No tickets match the current filter."
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
                    <Th>Requester</Th>
                    <Th>Subject</Th>
                    <Th className="hidden md:table-cell">Category</Th>
                    <Th>Priority</Th>
                    <Th>Status</Th>
                    <Th className="hidden lg:table-cell">Updated</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setOpenId(t.id)}
                      className={`border-t border-[var(--border)] border-l-2 ${PRIORITY_BORDER[t.priority]} hover:bg-[var(--surface-2)]/50 transition cursor-pointer group`}
                    >
                      {/* Requester */}
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar src={t.userAvatar} name={t.userName} size={34} />
                          <div className="min-w-0">
                            <div className="font-semibold truncate max-w-[14ch]">{t.userName}</div>
                            <div className="text-xs text-[var(--muted)] truncate max-w-[16ch]">{t.userEmail}</div>
                          </div>
                        </div>
                      </Td>

                      {/* Subject */}
                      <Td>
                        <div className="font-semibold truncate max-w-[26ch]">{t.subject}</div>
                        <div className="text-xs text-[var(--muted)] flex items-center gap-1 mt-0.5">
                          <Icon.MessageSquare size={10} />
                          {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
                        </div>
                      </Td>

                      {/* Category */}
                      <Td className="hidden md:table-cell">
                        <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
                          {t.category}
                        </span>
                      </Td>

                      {/* Priority */}
                      <Td>
                        <span className={`text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full ${PRIORITY_CLS[t.priority]}`}>
                          {t.priority === "urgent" && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1 -mb-0.5" />
                          )}
                          {t.priority}
                        </span>
                      </Td>

                      {/* Status */}
                      <Td>
                        <Badge variant={STATUS_BADGE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                      </Td>

                      {/* Updated */}
                      <Td className="hidden lg:table-cell text-xs text-[var(--muted)]">
                        {relativeTime(t.updatedAt)}
                      </Td>

                      {/* Actions */}
                      <Td
                        className="text-right"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setOpenId(t.id)}
                          className="h-8 px-3 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition opacity-70 group-hover:opacity-100"
                        >
                          Open
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination inside card */}
            <div className="px-4 py-3 border-t border-[var(--border)]">
              <TicketPagination
                page={safePage}
                totalPages={totalPages}
                total={filtered.length}
                onChange={setPage}
              />
            </div>
          </Card>
        </>
      )}

      {/* ── Ticket detail modal ── */}
      <Modal
        open={!!openId}
        onClose={() => setOpenId(null)}
        size="lg"
        title={detail?.subject ?? "Ticket"}
      >
        <div className="flex flex-col max-h-[82vh]">
          {detailLoading || !detail ? (
            <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
              <Icon.Loader size={18} className="animate-spin" /> Loading ticket…
            </div>
          ) : (
            <>
              {/* Ticket meta bar */}
              <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2 flex-wrap bg-[var(--surface-2)]/50">
                <Badge variant={STATUS_BADGE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
                <span className={`text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full ${PRIORITY_CLS[detail.priority]}`}>
                  {detail.priority}
                </span>
                <span className="text-xs text-[var(--muted)] capitalize px-2 py-0.5 rounded-full bg-[var(--surface-2)]">
                  {detail.category}
                </span>
                <span className="text-xs text-[var(--muted)] ml-auto">
                  Opened {relativeTime(detail.createdAt)}
                </span>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
                {/* Original message */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-2 flex items-center gap-1.5">
                    <Icon.MessageSquare size={10} /> Original message
                  </p>
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{detail.body}</p>
                </div>

                {/* Conversation */}
                {detail.replies.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold">
                      Conversation ({detail.replies.length})
                    </p>
                    {detail.replies.map((r) => (
                      <div
                        key={r.id}
                        className={`flex gap-2.5 ${r.isStaff ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-emerald-400 flex items-center justify-center text-white text-xs font-bold">
                          {r.author.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                          r.isStaff
                            ? "bg-[var(--primary)]/10 text-[var(--foreground)] rounded-tr-sm"
                            : "bg-[var(--surface-2)] border border-[var(--border)] rounded-tl-sm"
                        }`}>
                          <div className={`flex items-center gap-2 mb-1.5 ${r.isStaff ? "justify-end" : ""}`}>
                            <span className="text-[11px] font-semibold">{r.author.name}</span>
                            {r.isStaff && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
                                Staff
                              </span>
                            )}
                            <span className="text-[10px] text-[var(--muted)]">{relativeTime(r.createdAt)}</span>
                          </div>
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{r.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply box */}
                <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <Icon.Send size={11} /> Reply as staff
                  </p>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to the student…"
                    rows={4}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--muted)]">{replyText.length} chars</span>
                    <Button onClick={sendReply} loading={replying} disabled={!replyText.trim()}>
                      <Icon.Send size={14} /> Send reply
                    </Button>
                  </div>
                </div>

                {/* Manage ticket */}
                <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                    Manage ticket
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium mb-1.5">Status</p>
                      <Select
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value as TicketStatus)}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5">Priority</p>
                      <Select
                        value={priorityDraft}
                        onChange={(e) => setPriorityDraft(e.target.value as TicketPriority)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveMeta()}
                      loading={savingMeta}
                      disabled={!metaChanged}
                    >
                      <Icon.Save size={14} /> Save changes
                    </Button>
                    {detail.status !== "resolved" && (
                      <Button
                        size="sm"
                        onClick={() => { setStatusDraft("resolved"); saveMeta("resolved"); }}
                        loading={savingMeta}
                        className="!bg-emerald-500 !border-emerald-500 text-white"
                      >
                        <Icon.CheckCircle size={14} /> Mark resolved
                      </Button>
                    )}
                    {detail.status !== "closed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setStatusDraft("closed"); saveMeta("closed"); }}
                        loading={savingMeta}
                      >
                        <Icon.X size={14} /> Close ticket
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between gap-2 bg-[var(--surface-2)]/50">
                <div className="text-xs text-[var(--muted)]">
                  {detail.replies.length} {detail.replies.length === 1 ? "reply" : "replies"} ·
                  last updated {relativeTime(detail.updatedAt)}
                </div>
                <Button variant="outline" size="sm" onClick={() => setOpenId(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Pagination                                                               */
/* ──────────────────────────────────────────────────────────────────────── */

function TicketPagination({
  page, totalPages, total, onChange,
}: {
  page: number; totalPages: number; total: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) {
    return <p className="text-xs text-[var(--muted)]">{total} ticket{total !== 1 ? "s" : ""}</p>;
  }

  function getPages(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-[var(--muted)]">{start}–{end} of {total} tickets</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)} disabled={page === 1}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <Icon.ChevronLeft size={15} />
        </button>
        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="h-7 w-7 flex items-center justify-center text-xs text-[var(--muted)]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-medium transition ${
                page === p
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <Icon.ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Table helpers                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-semibold px-4 py-3 ${className ?? ""}`}>{children}</th>;
}

function Td({
  children, className, onClick,
}: {
  children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void;
}) {
  return <td className={`px-4 py-3 align-middle ${className ?? ""}`} onClick={onClick}>{children}</td>;
}
