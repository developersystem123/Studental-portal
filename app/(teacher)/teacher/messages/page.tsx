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
  Textarea,
  useToast,
} from "@/components/ui";
import { useAuth, useTeacher } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: string;
};

export default function TeacherMessagesPage() {
  const { user } = useAuth();
  const teacher = useTeacher();
  const { push } = useToast();
  const students = teacher.myStudents();

  // Distinct students across all of the teacher's courses.
  const contacts = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string; email: string; course: string }[] = [];
    for (const s of students) {
      if (seen.has(s.userId)) continue;
      seen.add(s.userId);
      list.push({ id: s.userId, name: s.userName, email: s.userEmail, course: s.courseTitle });
    }
    return list;
  }, [students]);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [filter, setFilter] = React.useState("");

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

  React.useEffect(() => {
    loadThread();
  }, [loadThread]);

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
        await loadThread();
      } else {
        push({ title: "Couldn't send message", tone: "danger" });
      }
    } catch {
      push({ title: "Network error", tone: "danger" });
    } finally {
      setSending(false);
    }
  }

  const activeContact = contacts.find((c) => c.id === activeId);
  const filteredContacts = contacts.filter(
    (c) =>
      !filter.trim() ||
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.email.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
          Engagement
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Messages</h1>
        <p className="mt-1 text-[var(--muted)]">Chat 1:1 with students enrolled in your courses.</p>
      </div>

      <Card>
        <CardBody className="!p-0">
          <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] min-h-[560px]">
            <aside className="border-r border-[var(--border)] flex flex-col">
              <div className="p-3 border-b border-[var(--border)]">
                <Input
                  icon={<Icon.Search size={16} />}
                  placeholder="Search students…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {filteredContacts.length === 0 ? (
                  <p className="p-5 text-sm text-[var(--muted)]">No students.</p>
                ) : (
                  <ul>
                    {filteredContacts.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => setActiveId(c.id)}
                          className={`w-full text-left flex items-center gap-3 p-3 border-b border-[var(--border)] hover:bg-[var(--surface-2)]/60 transition ${
                            activeId === c.id ? "bg-[var(--primary-soft)]/40" : ""
                          }`}
                        >
                          <Avatar name={c.name} size={40} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{c.name}</p>
                            <p className="text-xs text-[var(--muted)] truncate">{c.course}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>

            <section className="flex flex-col">
              {activeContact ? (
                <>
                  <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
                    <Avatar name={activeContact.name} size={40} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{activeContact.name}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{activeContact.email}</p>
                    </div>
                    <Badge variant="default" className="ml-auto">
                      {activeContact.course}
                    </Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                    {loadingThread ? (
                      <p className="text-sm text-[var(--muted)]">Loading…</p>
                    ) : messages.length === 0 ? (
                      <EmptyState
                        icon={<Icon.MessageSquare size={20} />}
                        title="Start the conversation"
                        description="Say hello or share next steps."
                      />
                    ) : (
                      messages.map((m) => {
                        const mine = m.fromUserId === user?.id;
                        return (
                          <div
                            key={m.id}
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm ${
                                mine
                                  ? "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white rounded-br-md"
                                  : "bg-[var(--surface-2)] text-[var(--foreground)] rounded-bl-md"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{m.body}</p>
                              <p
                                className={`text-[10px] mt-1 ${
                                  mine ? "text-white/70" : "text-[var(--muted-2)]"
                                }`}
                              >
                                {relativeTime(m.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-3 border-t border-[var(--border)]">
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
                        placeholder="Write a message… (Enter to send)"
                        className="!min-h-[44px]"
                      />
                      <Button onClick={send} disabled={!draft.trim()} loading={sending}>
                        <Icon.Send size={14} />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<Icon.MessageSquare size={20} />}
                  title="No conversations yet"
                  description="When students enroll in your courses, they'll appear here."
                />
              )}
            </section>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
