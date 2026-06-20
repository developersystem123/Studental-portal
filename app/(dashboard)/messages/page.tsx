"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth } from "@/lib/store";
import { cn, relativeTime } from "@/lib/utils";

type Contact = { id: string; name: string; avatar: string | null; role: string };

function MsgSectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">{icon}</span>
      <span className="text-[10px] font-bold tracking-widest text-[var(--primary)]">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

type Conversation = {
  conversationId: string;
  other: Contact;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

type Msg = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  read: boolean;
  createdAt: string;
};

function msgDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function groupByDate(messages: Msg[]) {
  const out: { label: string; msgs: Msg[] }[] = [];
  for (const m of messages) {
    const lbl = msgDateLabel(m.createdAt);
    const last = out[out.length - 1];
    if (!last || last.label !== lbl) out.push({ label: lbl, msgs: [m] });
    else last.msgs.push(m);
  }
  return out;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [modalDraft, setModalDraft] = useState("");
  const [search, setSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  const filteredConvs = useMemo(
    () =>
      conversations.filter(
        (c) =>
          c.other.name.toLowerCase().includes(search.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(search.toLowerCase()),
      ),
    [conversations, search],
  );

  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
          c.role.toLowerCase().includes(contactSearch.toLowerCase()),
      ),
    [contacts, contactSearch],
  );

  const groups = useMemo(() => groupByDate(messages), [messages]);

  async function loadConvs() {
    try {
      const r = await fetch("/api/messages");
      if (!r.ok) return;
      const data = await r.json();
      setConversations(data.conversations ?? []);
    } catch { /* silent refresh failure */ }
  }

  async function openConv(conv: Conversation) {
    setActive(conv);
    setMobileView("chat");
    try {
      const r = await fetch(`/api/messages/${conv.conversationId}`);
      if (r.ok) {
        const data = await r.json();
        setMessages(data.messages ?? []);
      }
    } catch { /* ignore */ }
    loadConvs();
    setTimeout(
      () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
      80,
    );
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, kRes] = await Promise.all([
          fetch("/api/messages"),
          fetch("/api/messages/contacts"),
        ]);
        const [c, k] = await Promise.all([
          cRes.ok ? cRes.json() : Promise.resolve({ conversations: [] }),
          kRes.ok ? kRes.json() : Promise.resolve({ contacts: [] }),
        ]);
        if (!cancelled) {
          setConversations(c.conversations ?? []);
          setContacts(k.contacts ?? []);
        }
      } catch {
        if (!cancelled) push({ title: "Couldn't load messages", tone: "danger" });
      }
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeout(
      () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
      50,
    );
  }, [messages]);

  async function send(toUserId?: string) {
    const recipient = toUserId ?? active?.other.id;
    const body = toUserId ? modalDraft : draft;
    if (!recipient || !body.trim()) return;
    setSending(true);
    const r = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: recipient, body }),
    });
    setSending(false);
    if (!r.ok) {
      push({ title: "Couldn't send", tone: "danger" });
      return;
    }
    if (toUserId) {
      setModalDraft("");
      await loadConvs();
      const conv = conversations.find((c) => c.other.id === toUserId);
      if (conv) openConv(conv);
      setNewOpen(false);
      setSelectedContact(null);
      setContactSearch("");
    } else {
      setDraft("");
      await loadConvs();
      if (active) openConv(active);
    }
  }

  function openNew() {
    setNewOpen(true);
    setSelectedContact(null);
    setContactSearch("");
    setModalDraft("");
  }

  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100dvh - 7rem)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Messages</h1>
          <p className="text-sm text-[var(--muted)] mt-1 flex items-center gap-2">
            Chat with teachers and admins.
            {totalUnread > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold">
                {totalUnread} unread
              </span>
            )}
          </p>
        </div>
        <Button onClick={openNew}>
          <Icon.Plus size={14} /> New message
        </Button>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* — Conversation list — */}
        <Card className={cn("lg:col-span-1 flex flex-col overflow-hidden", mobileView === "chat" && "hidden lg:flex")}>
          <div className="p-3 border-b border-[var(--border)] shrink-0">
            <Input
              icon={<Icon.Search size={15} />}
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CardBody className="p-0 flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <EmptyState
                icon={<Icon.Inbox size={28} />}
                title={search ? "No results" : "No conversations"}
                description={search ? "Try a different search." : "Start a new message."}
                action={
                  !search ? (
                    <Button size="sm" variant="outline" onClick={openNew}>
                      <Icon.Plus size={14} /> New message
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul>
                {filteredConvs.map((c) => (
                  <li key={c.conversationId} className="border-b border-[var(--border)] last:border-0">
                    <button
                      onClick={() => openConv(c)}
                      className={cn(
                        "w-full text-left p-3 flex gap-3 items-start hover:bg-[var(--surface-2)] transition",
                        active?.conversationId === c.conversationId && "bg-[var(--primary-soft)]",
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar name={c.other.name} src={c.other.avatar} size={42} />
                        {c.other.role === "Instructor" && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[var(--surface)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <p className={cn("text-sm flex-1 truncate", c.unread > 0 ? "font-bold" : "font-semibold")}>
                            {c.other.name}
                          </p>
                          <p className="text-[10px] text-[var(--muted-2)] shrink-0">{relativeTime(c.lastAt)}</p>
                        </div>
                        <div className="flex items-start gap-1">
                          <p className={cn("text-xs line-clamp-1 flex-1", c.unread > 0 ? "text-[var(--foreground)] font-medium" : "text-[var(--muted)]")}>
                            {c.lastMessage}
                          </p>
                          {c.unread > 0 && (
                            <span className="shrink-0 h-5 min-w-5 px-1 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center">
                              {c.unread > 9 ? "9+" : c.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--muted-2)] mt-0.5">{c.other.role}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* — Chat panel — */}
        <Card className={cn("lg:col-span-2 flex flex-col overflow-hidden", mobileView === "list" && "hidden lg:flex")}>
          {!active ? (
            <CardBody className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<Icon.MessageSquare size={32} />}
                title="Select a conversation"
                description="Pick from the list or start a new message."
                action={
                  <Button variant="outline" onClick={openNew}>
                    <Icon.Plus size={14} /> New message
                  </Button>
                }
              />
            </CardBody>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-3 border-b border-[var(--border)] flex items-center gap-3 shrink-0">
                <button
                  className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-[var(--surface-2)] transition"
                  onClick={() => setMobileView("list")}
                >
                  <Icon.ArrowLeft size={18} />
                </button>
                <div className="relative">
                  <Avatar name={active.other.name} src={active.other.avatar} size={38} />
                  {active.other.role === "Instructor" && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[var(--surface)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{active.other.name}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {active.other.role === "Instructor" ? (
                      <span className="text-emerald-500 font-medium">● Online</span>
                    ) : (
                      active.other.role
                    )}
                  </p>
                </div>
                <Badge variant="primary">{active.other.role}</Badge>
                <span className="hidden sm:block text-xs text-[var(--muted-2)] shrink-0">
                  {messages.length} msg{messages.length !== 1 && "s"}
                </span>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-0.5">
                {groups.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-[var(--muted)]">No messages yet — say hello! 👋</p>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.label}>
                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[var(--border)]" />
                        <span className="text-[10px] text-[var(--muted-2)] font-medium uppercase tracking-wider">
                          {group.label}
                        </span>
                        <div className="flex-1 h-px bg-[var(--border)]" />
                      </div>
                      {group.msgs.map((m, i) => {
                        const mine = m.fromUserId === user?.id;
                        const prevSame = group.msgs[i - 1]?.fromUserId === m.fromUserId;
                        return (
                          <div
                            key={m.id}
                            className={cn("flex gap-2 items-end", mine ? "justify-end" : "justify-start", !prevSame ? "mt-3" : "mt-0.5")}
                          >
                            {!mine && (
                              <div className="w-7 shrink-0 self-end mb-4">
                                {!prevSame && (
                                  <Avatar name={active.other.name} src={active.other.avatar} size={26} />
                                )}
                              </div>
                            )}
                            <div className="max-w-[72%]">
                              <div
                                className={cn(
                                  "rounded-2xl px-3.5 py-2 text-sm",
                                  mine ? "btn-primary rounded-br-sm" : "bg-[var(--surface-2)] rounded-bl-sm",
                                )}
                              >
                                <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                              </div>
                              <div className={cn("flex items-center gap-1 px-1 mt-0.5", mine ? "justify-end" : "justify-start")}>
                                <span className="text-[10px] text-[var(--muted-2)]">{fmtTime(m.createdAt)}</span>
                                {mine && (
                                  <span className={cn("text-[10px]", m.read ? "text-[var(--primary)]" : "text-[var(--muted-2)]")}>
                                    {m.read ? "✓✓" : "✓"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[var(--border)] shrink-0">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      placeholder="Type a message… (Enter ↵ to send)"
                      className="!min-h-[44px] max-h-[120px] resize-none pr-14"
                      rows={1}
                    />
                    {draft.length > 0 && (
                      <span className={cn("absolute right-3 bottom-2.5 text-[10px] font-medium pointer-events-none", draft.length > 480 ? "text-red-500" : "text-[var(--muted-2)]")}>
                        {draft.length}/500
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => send()}
                    loading={sending}
                    disabled={!draft.trim() || draft.length > 500}
                    className="h-11 shrink-0"
                  >
                    <Icon.Send size={15} />
                  </Button>
                </div>
                <p className="text-[10px] text-[var(--muted-2)] mt-1.5 px-1">Shift + Enter for new line</p>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* New message modal */}
      <Modal
        open={newOpen}
        onClose={() => { setNewOpen(false); setSelectedContact(null); }}
        title="New message"
        size="lg"
      >
        {contacts.length === 0 ? (
          <div className="px-5 pb-5 pt-2">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="h-14 w-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted)]">
                <Icon.Users size={26} />
              </span>
              <div>
                <p className="font-semibold text-sm">No contacts yet</p>
                <p className="text-xs text-[var(--muted)] mt-1">Enroll in a course to message instructors.</p>
              </div>
            </div>
          </div>
        ) : !selectedContact ? (
          /* ── Step 1: pick a contact ── */
          <div className="space-y-0">
            {/* section label */}
            <div className="px-5 pb-3">
              <MsgSectionLabel icon={<Icon.Users size={12} />} label="CHOOSE RECIPIENT" />
            </div>
            {/* search */}
            <div className="px-5 pb-3">
              <Input
                icon={<Icon.Search size={15} />}
                placeholder="Search by name or role…"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                autoFocus
              />
            </div>
            {/* contact list */}
            <div className="px-5 pb-5 space-y-2 max-h-72 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Icon.Search size={20} className="text-[var(--muted)]" />
                  <p className="text-sm text-[var(--muted)]">No contacts match "{contactSearch}"</p>
                </div>
              ) : (
                (() => {
                  const instructors = filteredContacts.filter((c) => c.role === "Instructor");
                  const others = filteredContacts.filter((c) => c.role !== "Instructor");
                  const renderGroup = (label: string, items: Contact[]) =>
                    items.length === 0 ? null : (
                      <div key={label}>
                        <p className="text-[10px] font-bold tracking-widest text-[var(--muted)] uppercase mb-2 mt-1">{label}</p>
                        <div className="space-y-1.5">
                          {items.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setSelectedContact(c)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)] transition text-left group"
                            >
                              <div className="relative shrink-0">
                                <Avatar name={c.name} src={c.avatar} size={40} />
                                {c.role === "Instructor" && (
                                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[var(--surface)]" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-tight">{c.name}</p>
                                <p className="text-xs text-[var(--muted)] mt-0.5">{c.role}</p>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                c.role === "Instructor"
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                  : "bg-[var(--primary-soft)] text-[var(--primary)]"
                              }`}>
                                {c.role === "Instructor" ? "● Online" : "Admin"}
                              </span>
                              <Icon.ChevronRight size={15} className="text-[var(--muted-2)] group-hover:text-[var(--primary)] transition shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  return (
                    <>
                      {renderGroup("Instructors", instructors)}
                      {renderGroup("Staff", others)}
                    </>
                  );
                })()
              )}
            </div>
          </div>
        ) : (
          /* ── Step 2: compose message ── */
          <div className="space-y-0">
            {/* back + recipient */}
            <div className="px-5 pb-4 space-y-3">
              <button
                onClick={() => setSelectedContact(null)}
                className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--primary)] transition font-medium"
              >
                <Icon.ArrowLeft size={13} /> Back to contacts
              </button>

              {/* recipient card */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/20">
                <div className="relative shrink-0">
                  <Avatar name={selectedContact.name} src={selectedContact.avatar} size={44} />
                  {selectedContact.role === "Instructor" && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[var(--surface)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight text-[var(--primary)]">{selectedContact.name}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{selectedContact.role}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                  selectedContact.role === "Instructor"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-white/70 text-[var(--primary)] dark:bg-black/20"
                }`}>
                  {selectedContact.role === "Instructor" ? "● Online" : "Admin"}
                </span>
              </div>
            </div>

            {/* message label + live preview bubble */}
            <div className="px-5 pb-3 space-y-3">
              <MsgSectionLabel icon={<Icon.Edit size={12} />} label="YOUR MESSAGE" />

              {/* live preview chat bubble */}
              {modalDraft.trim() && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-[var(--primary)] text-white rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm shadow-sm">
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{modalDraft.slice(0, 120)}{modalDraft.length > 120 ? "…" : ""}</p>
                    <p className="text-[10px] text-white/60 text-right mt-1">Preview · Just now</p>
                  </div>
                </div>
              )}

              {/* textarea */}
              <div className="relative">
                <Textarea
                  value={modalDraft}
                  onChange={(e) => setModalDraft(e.target.value)}
                  rows={4}
                  placeholder={`Write your message to ${selectedContact.name}…`}
                  className={cn("!min-h-[100px] resize-none pr-16", modalDraft.length > 480 && "border-red-400 focus:ring-red-400")}
                  autoFocus
                />
                <span className={cn("absolute right-3 bottom-3 text-[10px] tabular-nums font-medium pointer-events-none", modalDraft.length > 480 ? "text-red-500" : "text-[var(--muted-2)]")}>
                  {modalDraft.length}/500
                </span>
              </div>
              {/* char progress bar */}
              <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden -mt-1">
                <div
                  className={`h-full rounded-full transition-all ${modalDraft.length > 480 ? "bg-red-500" : modalDraft.length > 350 ? "bg-amber-500" : "bg-[var(--primary)]"}`}
                  style={{ width: `${Math.min(100, (modalDraft.length / 500) * 100)}%` }}
                />
              </div>
            </div>

            {/* footer */}
            <div className="px-5 pb-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
              <Button
                onClick={() => send(selectedContact.id)}
                loading={sending}
                disabled={!modalDraft.trim() || modalDraft.length > 500}
              >
                <Icon.Send size={14} /> Send message
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
