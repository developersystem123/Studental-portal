"use client";

import * as React from "react";
import Icon from "@/components/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";
import { useAuth, useTeacher } from "@/lib/store";
import { formatDate, relativeTime } from "@/lib/utils";

type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  read: boolean;
  createdAt: string;
};

type ConvMeta = {
  conversationId: string;
  other: { id: string; name: string };
  lastMessage: string;
  lastAt: string;
  unread: number;
};

type SidebarContact = {
  id: string;
  name: string;
  email: string;
  courses: string[];
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
};

function dayLabel(iso: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const d = iso.slice(0, 10);
  if (d === today) return "Today";
  if (d === yesterday) return "Yesterday";
  return formatDate(iso);
}

export default function TeacherMessagesPage() {
  const { user } = useAuth();
  const teacher = useTeacher();
  const { push } = useToast();
  const students = teacher.myStudents();

  // Build contacts map — deduped by userId, collecting all courses per student
  const rawContacts = React.useMemo(() => {
    const map = new Map<string, { name: string; email: string; courses: string[] }>();
    for (const s of students) {
      if (map.has(s.userId)) {
        const info = map.get(s.userId)!;
        if (!info.courses.includes(s.courseTitle)) info.courses.push(s.courseTitle);
      } else {
        map.set(s.userId, { name: s.userName, email: s.userEmail, courses: [s.courseTitle] });
      }
    }
    return map;
  }, [students]);

  const [convMeta, setConvMeta] = React.useState<ConvMeta[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [filter, setFilter] = React.useState("");
  const [courseFilter, setCourseFilter] = React.useState("all");

  // Broadcast modal state
  const [broadcastOpen, setBroadcastOpen] = React.useState(false);
  const [broadcastCourse, setBroadcastCourse] = React.useState("");
  const [broadcastMsg, setBroadcastMsg] = React.useState("");
  const [broadcasting, setBroadcasting] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load conversation metadata (unread counts + last message previews)
  const loadConversations = React.useCallback(async () => {
    try {
      const r = await fetch("/api/messages");
      const data = r.ok ? await r.json() : { conversations: [] };
      setConvMeta(data.conversations ?? []);
    } catch {
      // silently ignore — UI still works from store data
    }
  }, []);

  React.useEffect(() => { loadConversations(); }, [loadConversations]);

  // Merge store contacts + conversation metadata, sorted by recency
  const contacts = React.useMemo((): SidebarContact[] => {
    const metaMap = new Map(convMeta.map((c) => [c.other.id, c]));
    const list: SidebarContact[] = [];
    for (const [id, info] of rawContacts) {
      const meta = metaMap.get(id);
      list.push({
        id,
        ...info,
        lastMessage: meta?.lastMessage ?? null,
        lastAt: meta?.lastAt ?? null,
        unread: meta?.unread ?? 0,
      });
    }
    return list.sort((a, b) => {
      if (a.lastAt && b.lastAt) return b.lastAt.localeCompare(a.lastAt);
      if (a.lastAt) return -1;
      if (b.lastAt) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [rawContacts, convMeta]);

  React.useEffect(() => {
    if (!activeId && contacts.length > 0) setActiveId(contacts[0].id);
  }, [contacts, activeId]);

  const conversationId = React.useMemo(
    () => (user && activeId ? [user.id, activeId].sort().join(":") : null),
    [user, activeId],
  );

  const loadThread = React.useCallback(async () => {
    if (!conversationId) return;
    setLoadingThread(true);
    try {
      const r = await fetch(`/api/messages/${conversationId}`);
      const data = r.ok ? await r.json() : { messages: [] };
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  }, [conversationId]);

  React.useEffect(() => { loadThread(); }, [loadThread]);

  // Scroll to newest message
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-refresh every 15s
  React.useEffect(() => {
    if (!conversationId) return;
    const id = setInterval(() => { loadThread(); loadConversations(); }, 15000);
    return () => clearInterval(id);
  }, [conversationId, loadThread, loadConversations]);

  async function send() {
    if (!draft.trim() || !activeId) return;
    setSending(true);
    try {
      const r = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: activeId, body: draft.trim() }),
      });
      if (r.ok) {
        setDraft("");
        await Promise.all([loadThread(), loadConversations()]);
      } else {
        push({ title: "Couldn't send message", tone: "danger" });
      }
    } catch {
      push({ title: "Network error", tone: "danger" });
    } finally {
      setSending(false);
    }
  }

  async function broadcast() {
    if (!broadcastMsg.trim() || !broadcastCourse) return;
    const targets = [...rawContacts.entries()].filter(([, v]) =>
      v.courses.includes(broadcastCourse),
    );
    if (targets.length === 0) return;
    setBroadcasting(true);
    let sent = 0;
    for (const [id] of targets) {
      try {
        const r = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toUserId: id, body: broadcastMsg.trim() }),
        });
        if (r.ok) sent++;
      } catch {
        // skip failed sends
      }
    }
    setBroadcasting(false);
    setBroadcastMsg("");
    setBroadcastOpen(false);
    await loadConversations();
    push({
      title: "Broadcast sent",
      description: `Message delivered to ${sent} of ${targets.length} students in "${broadcastCourse}".`,
      tone: "success",
    });
  }

  const activeContact = contacts.find((c) => c.id === activeId);
  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);

  const allCourses = React.useMemo(() => {
    const set = new Set<string>();
    for (const [, v] of rawContacts) for (const c of v.courses) set.add(c);
    return [...set].sort();
  }, [rawContacts]);

  const filteredContacts = React.useMemo(() => {
    let list = contacts;
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
      );
    }
    if (courseFilter !== "all") {
      list = list.filter((c) => c.courses.includes(courseFilter));
    }
    return list;
  }, [contacts, filter, courseFilter]);

  // Insert date separators
  type ThreadItem = Message | { _sep: true; label: string; key: string };
  const threadItems = React.useMemo((): ThreadItem[] => {
    const result: ThreadItem[] = [];
    let lastDay = "";
    for (const m of messages) {
      const d = m.createdAt.slice(0, 10);
      if (d !== lastDay) {
        result.push({ _sep: true, label: dayLabel(m.createdAt), key: `sep-${d}` });
        lastDay = d;
      }
      result.push(m);
    }
    return result;
  }, [messages]);

  const broadcastTargetCount = broadcastCourse
    ? [...rawContacts.entries()].filter(([, v]) => v.courses.includes(broadcastCourse)).length
    : 0;

  return (
    <div className="space-y-5 fade-in">
      {/* Page header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Engagement
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight flex items-center gap-2.5">
            Messages
            {totalUnread > 0 && (
              <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-red-500 text-white tabular-nums">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            Chat 1:1 with students enrolled in your courses.
          </p>
        </div>
        {allCourses.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setBroadcastCourse(allCourses[0]);
              setBroadcastOpen(true);
            }}
          >
            <Icon.Megaphone size={15} /> Broadcast to class
          </Button>
        )}
      </div>

      <Card>
        <CardBody className="!p-0">
          <div
            className="grid grid-cols-1 md:grid-cols-[300px,1fr] min-h-[540px] max-h-[720px]"
            style={{ height: "calc(100vh - 250px)" }}
          >
            {/* ---- Sidebar ---- */}
            <aside className="border-r border-[var(--border)] flex flex-col overflow-hidden">
              {/* Search + course filter */}
              <div className="p-3 space-y-2 border-b border-[var(--border)] shrink-0">
                <Input
                  icon={<Icon.Search size={15} />}
                  placeholder="Search students…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="!h-9"
                />
                {allCourses.length > 1 && (
                  <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="w-full text-xs border border-[var(--border)] rounded-lg px-2.5 py-1.5 bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40"
                  >
                    <option value="all">All courses ({contacts.length})</option>
                    {allCourses.map((c) => (
                      <option key={c} value={c}>
                        {c.length > 36 ? c.slice(0, 36) + "…" : c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Contact list */}
              <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 ? (
                  <p className="p-6 text-sm text-[var(--muted)] text-center">
                    No students enrolled yet.
                  </p>
                ) : filteredContacts.length === 0 ? (
                  <p className="p-6 text-sm text-[var(--muted)] text-center">No students match.</p>
                ) : (
                  <ul>
                    {filteredContacts.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => setActiveId(c.id)}
                          className={`w-full text-left flex items-center gap-3 px-3 py-3 border-b border-[var(--border)] hover:bg-[var(--surface-2)]/60 transition-colors ${
                            activeId === c.id ? "bg-[var(--surface-2)]" : ""
                          }`}
                          style={
                            activeId === c.id
                              ? { borderLeft: "3px solid var(--primary)" }
                              : { borderLeft: "3px solid transparent" }
                          }
                        >
                          <div className="relative shrink-0">
                            <Avatar name={c.name} size={38} />
                            {c.unread > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
                                {c.unread > 9 ? "9+" : c.unread}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-1">
                              <p
                                className={`text-sm truncate ${c.unread > 0 ? "font-semibold" : "font-medium"}`}
                              >
                                {c.name}
                              </p>
                              {c.lastAt && (
                                <span className="text-[10px] text-[var(--muted)] shrink-0">
                                  {relativeTime(c.lastAt)}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs truncate ${
                                c.unread > 0
                                  ? "text-[var(--foreground)] font-medium"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              {c.lastMessage ?? c.courses[0]}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Sidebar footer */}
              <div className="px-3 py-2 border-t border-[var(--border)] shrink-0">
                <p className="text-[11px] text-[var(--muted)] text-center">
                  {filteredContacts.length} of {contacts.length} students
                  {totalUnread > 0 && (
                    <span className="ml-1 text-red-500 font-semibold">· {totalUnread} unread</span>
                  )}
                </p>
              </div>
            </aside>

            {/* ---- Chat pane ---- */}
            <section className="flex flex-col overflow-hidden">
              {activeContact ? (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] shrink-0">
                    <Avatar name={activeContact.name} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{activeContact.name}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{activeContact.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 shrink-0 max-w-[220px]">
                      {activeContact.courses.slice(0, 2).map((c) => (
                        <Badge key={c} variant="default" className="text-[10px] truncate max-w-[140px]">
                          {c}
                        </Badge>
                      ))}
                      {activeContact.courses.length > 2 && (
                        <Badge variant="default" className="text-[10px]">
                          +{activeContact.courses.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    {loadingThread ? (
                      <div className="space-y-3 py-2">
                        {[true, false, true, false, true].map((mine, i) => (
                          <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <Skeleton
                              className={`h-10 rounded-2xl ${mine ? "w-48" : "w-36"}`}
                            />
                          </div>
                        ))}
                      </div>
                    ) : threadItems.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <EmptyState
                          icon={<Icon.MessageSquare size={24} />}
                          title="Start the conversation"
                          description={`Say hello to ${activeContact.name}.`}
                        />
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {threadItems.map((item) => {
                          if ("_sep" in item) {
                            return (
                              <div key={item.key} className="flex items-center gap-3 py-3">
                                <div className="flex-1 h-px bg-[var(--border)]" />
                                <span className="text-[11px] text-[var(--muted)] font-medium px-2 shrink-0">
                                  {item.label}
                                </span>
                                <div className="flex-1 h-px bg-[var(--border)]" />
                              </div>
                            );
                          }
                          const m = item as Message;
                          const mine = m.fromUserId === user?.id;
                          return (
                            <div
                              key={m.id}
                              className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}
                            >
                              <div
                                className={`flex flex-col max-w-[72%] ${mine ? "items-end" : "items-start"}`}
                              >
                                <div
                                  className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
                                    mine
                                      ? "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white rounded-br-sm"
                                      : "bg-[var(--surface-2)] text-[var(--foreground)] rounded-bl-sm"
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                                    {m.body}
                                  </p>
                                </div>
                                <p className="text-[10px] mt-0.5 px-1 text-[var(--muted)] flex items-center gap-1">
                                  {relativeTime(m.createdAt)}
                                  {mine && (
                                    <span
                                      className={
                                        m.read
                                          ? "text-[var(--primary)] font-semibold"
                                          : "text-[var(--muted)]"
                                      }
                                    >
                                      {m.read ? "✓✓" : "✓"}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Compose area */}
                  <div className="p-3 border-t border-[var(--border)] shrink-0 bg-[var(--surface)]">
                    <div className="flex items-end gap-2">
                      <Textarea
                        rows={2}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                          }
                        }}
                        placeholder={`Message ${activeContact.name}…`}
                        className="flex-1 !min-h-[44px] !resize-none"
                      />
                      <Button
                        onClick={send}
                        disabled={!draft.trim()}
                        loading={sending}
                        size="sm"
                        className="shrink-0"
                      >
                        <Icon.Send size={14} />
                      </Button>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] mt-1.5 select-none">
                      Enter to send · Shift+Enter for new line
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyState
                    icon={<Icon.MessageSquare size={28} />}
                    title="No conversations yet"
                    description="When students enroll in your courses, they'll appear in the sidebar."
                  />
                </div>
              )}
            </section>
          </div>
        </CardBody>
      </Card>

      {/* Broadcast modal */}
      <Modal
        open={broadcastOpen}
        onClose={() => {
          setBroadcastOpen(false);
          setBroadcastMsg("");
        }}
        title="Broadcast to class"
        description="Send the same message to all students in a course at once."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Course</label>
            <select
              value={broadcastCourse}
              onChange={(e) => setBroadcastCourse(e.target.value)}
              className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40"
            >
              {allCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Message</label>
            <Textarea
              rows={4}
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Type your announcement to the entire class…"
            />
            {broadcastCourse && (
              <p className="text-xs text-[var(--muted)] mt-1.5">
                Will be sent to{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {broadcastTargetCount}
                </span>{" "}
                student{broadcastTargetCount !== 1 ? "s" : ""} in this course.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={() => {
                setBroadcastOpen(false);
                setBroadcastMsg("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={broadcast} loading={broadcasting} disabled={!broadcastMsg.trim()}>
              <Icon.Send size={14} /> Send to all
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
