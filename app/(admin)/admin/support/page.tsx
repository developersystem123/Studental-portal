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
import { relativeTime } from "@/lib/utils";

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

export default function AdminSupportPage() {
  const toast = useToast();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");

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

  React.useEffect(() => {
    load();
  }, [load]);

  // Load the full thread whenever a ticket is opened.
  React.useEffect(() => {
    if (!openId) {
      setDetail(null);
      setReplyText("");
      return;
    }
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
    return () => {
      cancelled = true;
    };
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
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!q) return true;
      return (
        t.subject.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q)
      );
    });
  }, [tickets, filter, query]);

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
      if (!res.ok) {
        toast.push({ title: data.error ?? "Reply failed.", tone: "danger" });
        return;
      }
      const reply: Reply = {
        id: data.reply.id,
        body: data.reply.body,
        createdAt: data.reply.createdAt,
        isStaff: data.reply.isStaff,
        author: { id: "", name: "You", avatar: null, role: "Admin" },
      };
      setDetail((d) => (d ? { ...d, replies: [...d.replies, reply] } : d));
      setReplyText("");
      setTickets((prev) =>
        prev.map((t) =>
          t.id === detail.id
            ? { ...t, replyCount: t.replyCount + 1, updatedAt: reply.createdAt }
            : t,
        ),
      );
      toast.push({ title: "Reply sent", tone: "success" });
    } catch {
      toast.push({ title: "Reply failed.", tone: "danger" });
    } finally {
      setReplying(false);
    }
  }

  async function saveMeta() {
    if (!detail) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/admin/support/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: statusDraft, priority: priorityDraft }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push({ title: data.error ?? "Update failed.", tone: "danger" });
        return;
      }
      setDetail((d) => (d ? { ...d, status: statusDraft, priority: priorityDraft } : d));
      setTickets((prev) =>
        prev.map((t) =>
          t.id === detail.id ? { ...t, status: statusDraft, priority: priorityDraft } : t,
        ),
      );
      toast.push({ title: "Ticket updated", tone: "success" });
    } catch {
      toast.push({ title: "Update failed.", tone: "danger" });
    } finally {
      setSavingMeta(false);
    }
  }

  const metaChanged =
    !!detail && (statusDraft !== detail.status || priorityDraft !== detail.priority);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Support tickets</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Respond to student support requests, set priorities, and track each ticket to resolution.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open" value={counts.open} icon={<Icon.Inbox size={18} />} tone="primary" />
        <StatCard
          label="In progress"
          value={counts.in_progress}
          icon={<Icon.Clock size={18} />}
          tone="warning"
        />
        <StatCard
          label="Resolved"
          value={counts.resolved}
          icon={<Icon.CheckCircle size={18} />}
          tone="success"
        />
        <StatCard
          label="Urgent"
          value={counts.urgent}
          icon={<Icon.AlertCircle size={18} />}
          tone="warning"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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
        <div className="md:w-80">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by subject, requester, or text…"
            icon={<Icon.Search size={16} />}
          />
        </div>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
              <Icon.Loader size={18} /> Loading tickets…
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
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                <tr>
                  <Th>Requester</Th>
                  <Th>Subject</Th>
                  <Th>Category</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Updated</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/50 cursor-pointer"
                    onClick={() => setOpenId(t.id)}
                  >
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar src={t.userAvatar} name={t.userName} size={32} />
                        <div>
                          <div className="font-medium">{t.userName}</div>
                          <div className="text-xs text-[var(--muted)]">{t.userEmail}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="font-medium truncate max-w-[28ch]">{t.subject}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
                      </div>
                    </Td>
                    <Td className="capitalize text-xs">{t.category}</Td>
                    <Td>
                      <Badge variant={PRIORITY_BADGE[t.priority]} className="capitalize">
                        {t.priority}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={STATUS_BADGE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                    </Td>
                    <Td className="text-xs text-[var(--muted)]">{relativeTime(t.updatedAt)}</Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenId(t.id);
                        }}
                      >
                        <Icon.Eye size={14} /> Open
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Ticket detail modal */}
      <Modal
        open={!!openId}
        onClose={() => setOpenId(null)}
        size="lg"
        title={detail ? detail.subject : "Ticket"}
      >
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto scrollbar-thin">
          {detailLoading || !detail ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
              <Icon.Loader size={18} /> Loading ticket…
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={STATUS_BADGE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
                <Badge variant={PRIORITY_BADGE[detail.priority]} className="capitalize">
                  {detail.priority} priority
                </Badge>
                <span className="text-xs text-[var(--muted)] capitalize">{detail.category}</span>
                <span className="text-xs text-[var(--muted)]">
                  · opened {relativeTime(detail.createdAt)}
                </span>
              </div>

              {/* Original message */}
              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-1.5">
                  Original message
                </p>
                <p className="text-sm whitespace-pre-wrap break-words">{detail.body}</p>
              </div>

              {/* Conversation */}
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold">
                  Conversation ({detail.replies.length})
                </p>
                {detail.replies.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No replies yet.</p>
                ) : (
                  detail.replies.map((r) => (
                    <div
                      key={r.id}
                      className={`rounded-xl p-3 text-sm ${
                        r.isStaff
                          ? "bg-[var(--primary-soft)] ml-6"
                          : "bg-[var(--surface-2)] mr-6"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs">{r.author.name}</span>
                        {r.isStaff && <Badge variant="primary">Staff</Badge>}
                        <span className="text-[10px] text-[var(--muted)]">
                          {relativeTime(r.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words">{r.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply box */}
              <div>
                <p className="text-sm font-medium mb-1.5">Reply as staff</p>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to the student…"
                />
                <div className="flex justify-end mt-2">
                  <Button onClick={sendReply} loading={replying} disabled={!replyText.trim()}>
                    <Icon.Send size={16} /> Send reply
                  </Button>
                </div>
              </div>

              {/* Status & priority controls */}
              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-3">
                  Manage ticket
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
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
                <div className="flex justify-end mt-3">
                  <Button
                    variant="outline"
                    onClick={saveMeta}
                    loading={savingMeta}
                    disabled={!metaChanged}
                  >
                    <Icon.Save size={16} /> Save changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-semibold px-4 py-3 ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}
