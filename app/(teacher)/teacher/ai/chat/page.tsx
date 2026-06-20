"use client";

import * as React from "react";
import { Avatar, Badge, Button, Card, Select, Textarea, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { Markdown } from "@/components/ai/Markdown";
import { useAuth } from "@/lib/store";
import { cn, relativeTime, uid } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Session = { id: string; title: string; context: string; messages: Msg[]; createdAt: string };

const LS = "eduportal:teacher-chat-sessions";

const TEACHER_CONTEXTS = [
  { value: "", label: "No specific context" },
  { value: "lesson_plan", label: "Lesson planning" },
  { value: "quiz_creation", label: "Quiz creation" },
  { value: "assignment", label: "Assignment design" },
  { value: "student_feedback", label: "Student feedback" },
  { value: "curriculum", label: "Curriculum design" },
];

function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS) ?? "[]"); } catch { return []; }
}
function saveSessions(s: Session[]) {
  if (typeof window !== "undefined") localStorage.setItem(LS, JSON.stringify(s));
}
function freshSession(): Session {
  return { id: uid(), title: "New chat", context: "", messages: [], createdAt: new Date().toISOString() };
}

export default function TeacherAiChatPage() {
  const { user } = useAuth();
  const { push: pushToast } = useToast();

  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [activeId, setActiveId] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [context, setContext] = React.useState("");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [atBottom, setAtBottom] = React.useState(true);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const renameInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const loaded = loadSessions();
    if (loaded.length === 0) {
      const s = freshSession();
      setSessions([s]); setActiveId(s.id); saveSessions([s]);
    } else {
      setSessions(loaded); setActiveId(loaded[0].id);
    }
  }, []);

  React.useEffect(() => { saveSessions(sessions); }, [sessions]);

  const active = sessions.find((s) => s.id === activeId);

  // Sync context dropdown when switching sessions
  React.useEffect(() => {
    if (active) setContext(active.context ?? "");
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (atBottom) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, streaming, atBottom]);

  React.useEffect(() => {
    if (renamingId) setTimeout(() => renameInputRef.current?.focus(), 50);
  }, [renamingId]);

  React.useEffect(() => {
    if (!sidebarOpen) return;
    function handler(e: MouseEvent) {
      const el = document.getElementById("teacher-chat-sidebar");
      if (el && !el.contains(e.target as Node)) setSidebarOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  function newChat() {
    // If the active session is already empty, reuse it instead of stacking another blank.
    const activeSess = sessions.find((s) => s.id === activeId);
    if (activeSess && activeSess.messages.length === 0) {
      setSessions((p) =>
        p.map((s) => s.id === activeId ? { ...s, title: "New chat", context: "" } : s),
      );
      setContext("");
      setSidebarOpen(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
      return;
    }
    const s = freshSession();
    setSessions((p) => [s, ...p]);
    setActiveId(s.id);
    setContext("");
    setSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function deleteSession(id: string) {
    setSessions((p) => {
      const next = p.filter((s) => s.id !== id);
      if (next.length === 0) {
        const s = freshSession(); setActiveId(s.id); return [s];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  function commitRename() {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) setSessions((p) => p.map((s) => s.id === renamingId ? { ...s, title: trimmed } : s));
    setRenamingId(null);
  }

  async function copyMessage(content: string, msgId: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      pushToast({ title: "Couldn't copy", tone: "danger" });
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function clearChat() {
    if (!active) return;
    setSessions((p) => p.map((s) => s.id === activeId ? { ...s, messages: [], title: "New chat" } : s));
  }

  async function send() {
    if (!active || !draft.trim() || streaming) return;
    const userMsg: Msg = { id: uid(), role: "user", content: draft.trim() };
    const assistantId = uid();
    const isFirst = active.messages.length === 0;
    const newTitle = isFirst ? draft.trim().slice(0, 48) : active.title;
    const contextLabel = TEACHER_CONTEXTS.find((c) => c.value === context)?.label ?? "";

    setSessions((prev) =>
      prev.map((s) =>
        s.id === active.id
          ? { ...s, title: newTitle, context, messages: [...s.messages, userMsg, { id: assistantId, role: "assistant" as const, content: "" }] }
          : s,
      ),
    );
    setDraft("");
    setStreaming(true);
    setAtBottom(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseTitle: contextLabel ? `[Teacher context: ${contextLabel}]` : undefined,
          messages: [...active.messages, userMsg].map(({ role, content }) => ({ role, content })),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error("Chat failed");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setSessions((prev) =>
          prev.map((s) =>
            s.id === active.id
              ? { ...s, messages: s.messages.map((m) => m.id === assistantId ? { ...m, content: acc } : m) }
              : s,
          ),
        );
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === active.id
              ? { ...s, messages: s.messages.map((m) => m.id === assistantId ? { ...m, content: "Sorry — something went wrong. Please try again." } : m) }
              : s,
          ),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="h-[calc(100svh-5.5rem)] sm:h-[calc(100vh-7rem)] grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 relative">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <Card
        id="teacher-chat-sidebar"
        className={cn(
          "flex-col overflow-hidden transition-all md:flex",
          sidebarOpen ? "fixed left-0 top-0 bottom-0 w-72 z-40 rounded-none flex shadow-2xl" : "hidden md:flex",
        )}
      >
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <Button className="flex-1" onClick={newChat}>
            <Icon.Plus size={16} /> New chat
          </Button>
          <button className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)]" onClick={() => setSidebarOpen(false)}>
            <Icon.X size={16} />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {sessions.map((s) => (
            <li key={s.id}>
              {renamingId === s.id ? (
                <div className="px-4 py-2.5">
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="w-full text-sm bg-[var(--surface)] border border-[var(--primary)] rounded-lg px-2 py-1 outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={() => { setActiveId(s.id); setSidebarOpen(false); setTimeout(() => textareaRef.current?.focus(), 50); }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-[var(--surface-2)] flex items-start gap-2 group transition-colors",
                    s.id === activeId && "bg-[var(--primary-soft)]",
                  )}
                >
                  <Icon.MessageSquare size={15} className="mt-0.5 text-[var(--muted)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-[11px] text-[var(--muted)]">{relativeTime(s.createdAt)}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setRenamingId(s.id); setRenameValue(s.title); }} className="h-6 w-6 flex items-center justify-center rounded text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]">
                      <Icon.Edit size={11} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="h-6 w-6 flex items-center justify-center rounded text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10">
                      <Icon.Trash size={11} />
                    </button>
                  </div>
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">{sessions.length} chat{sessions.length !== 1 ? "s" : ""}</span>
          {sessions.length > 1 && (
            <button onClick={() => { const s = freshSession(); setSessions([s]); setActiveId(s.id); }} className="text-xs text-[var(--muted)] hover:text-[var(--danger)] transition">
              Clear all
            </button>
          )}
        </div>
      </Card>

      {/* Main chat area */}
      <Card className="flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[var(--border)] flex items-center gap-2 sm:gap-3">
          <button
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon.Menu size={17} />
          </button>
          <div className="h-8 w-8 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <Icon.Sparkles size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{active?.title ?? "Teacher AI Assistant"}</p>
            <p className="text-[11px] text-[var(--muted)] hidden sm:block">Powered by Claude · lesson plans, quizzes, feedback & more</p>
          </div>
          {/* Context select — desktop only in header */}
          <div className="hidden sm:block w-48 shrink-0">
            <Select value={context} onChange={(e) => setContext(e.target.value)}>
              {TEACHER_CONTEXTS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {streaming && (
              <Button variant="outline" size="sm" onClick={stopStreaming}>
                <Icon.X size={13} /> Stop
              </Button>
            )}
            {active && active.messages.length > 0 && (
              <button onClick={clearChat} title="Clear chat" className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition">
                <Icon.Trash size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {(!active || active.messages.length === 0) && <TeacherWelcome onPick={(s) => setDraft(s)} />}

          {active?.messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3 group", m.role === "user" ? "justify-end" : "")}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center mt-1">
                  <Icon.Sparkles size={14} />
                </div>
              )}
              <div className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start", "max-w-[78%]")}>
                <div className={cn("rounded-2xl px-4 py-3 text-sm fade-in", m.role === "user" ? "btn-primary" : "bg-[var(--surface-2)] text-[var(--foreground)]")}>
                  {m.role === "assistant" ? (
                    m.content ? <Markdown text={m.content} /> : (
                      <span className="flex gap-1 items-center text-[var(--muted)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)] typing-dot" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)] typing-dot" style={{ animationDelay: "200ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)] typing-dot" style={{ animationDelay: "400ms" }} />
                      </span>
                    )
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
                {m.content && (
                  <button onClick={() => copyMessage(m.content, m.id)} className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100">
                    {copiedId === m.id ? <><Icon.Check size={11} className="text-emerald-500" /> Copied</> : <><Icon.Copy size={11} /> Copy</>}
                  </button>
                )}
              </div>
              {m.role === "user" && (
                <Avatar name={user?.name ?? "?"} src={user?.avatar ?? null} size={32} className="shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>

        {!atBottom && (
          <button onClick={() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); setAtBottom(true); }} className="absolute bottom-[5.5rem] right-4 z-10 h-9 w-9 bg-[var(--surface)] border border-[var(--border)] rounded-full shadow-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--surface-2)] transition">
            <Icon.ChevronDown size={18} />
          </button>
        )}

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 sm:p-4 border-t border-[var(--border)] space-y-2">
          {/* Context select — mobile only (desktop is in header) */}
          <div className="sm:hidden">
            <Select value={context} onChange={(e) => setContext(e.target.value)}>
              {TEACHER_CONTEXTS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask anything… lesson plans, quiz ideas, feedback templates"
              className="flex-1 !min-h-[40px] max-h-[100px] py-2 resize-none text-sm"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={streaming}
            />
            <Button type="submit" loading={streaming} className="h-10 w-10 sm:w-auto shrink-0" disabled={!draft.trim()}>
              <Icon.Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function TeacherWelcome({ onPick }: { onPick: (s: string) => void }) {
  const categories = [
    {
      icon: <Icon.FilePen size={13} />,
      label: "Lesson plans",
      items: [
        "Create a 45-minute lesson plan for teaching Python loops to beginners.",
        "Design an engaging lesson on photosynthesis for grade 8 students.",
      ],
    },
    {
      icon: <Icon.ListChecks size={13} />,
      label: "Quiz & assessment",
      items: [
        "Generate 10 multiple-choice questions on World War II for grade 10.",
        "Write a quiz with 5 short-answer questions on Newton's laws of motion.",
      ],
    },
    {
      icon: <Icon.FilePen size={13} />,
      label: "Assignment design",
      items: [
        "Design a project-based assignment on climate change for university students.",
        "Create a rubric for grading a 1,000-word essay on leadership.",
      ],
    },
    {
      icon: <Icon.MessageSquare size={13} />,
      label: "Student feedback",
      items: [
        "Write constructive feedback for a student who is struggling with algebra.",
        "Draft a positive progress report comment for a high-performing student.",
      ],
    },
  ];

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white mb-4">
          <Icon.Sparkles size={26} />
        </div>
        <h2 className="text-xl font-bold">Your Teaching AI Assistant</h2>
        <p className="text-sm text-[var(--muted)] mt-1">Ask me to help with lesson plans, quizzes, assignments, or student feedback.</p>
      </div>
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[var(--muted)]">{cat.icon}</span>
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{cat.label}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cat.items.map((s) => (
                <button key={s} onClick={() => onPick(s)} className="text-left text-sm p-3.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/40 transition leading-snug">
                  <Badge variant="primary" className="mb-1.5 text-[10px]">Suggested</Badge>
                  <p>{s}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
