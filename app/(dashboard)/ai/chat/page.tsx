"use client";

import * as React from "react";
import { Avatar, Badge, Button, Card, Select, Textarea, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { Markdown } from "@/components/ai/Markdown";
import { useAuth, useData } from "@/lib/store";
import { COURSES } from "@/lib/mockData";
import { cn, relativeTime, uid } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Session = { id: string; title: string; courseId?: string; messages: Msg[]; createdAt: string };

const LS = "eduportal:chat-sessions";

const EMOJI_CATEGORIES = [
  {
    label: "😊 Faces & emotions",
    emojis: [
      "😊","😂","🤣","😍","🥰","😘","😜","😎",
      "🤔","🤯","😭","🥺","😅","😤","😬","🤗",
      "😏","😒","😳","🤭","🫡","😇","🥳","🤩",
      "😴","🤑","😡","😱","🫠","🤪","😋","😐",
      "🙄","😫","😩","🤧","🥵","🥶","😶","🫥",
    ],
  },
  {
    label: "👋 Hands & gestures",
    emojis: [
      "👍","👎","👏","🙏","🤝","✌️","🤞","🫶",
      "💪","🦾","👋","🤙","👌","🫰","🤏","☝️",
      "🖐️","✋","🤚","🤜","🤛","👊","✊","🫳",
    ],
  },
  {
    label: "❤️ Hearts & symbols",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍",
      "💯","✅","❌","❓","❗","⚡","🔥","💥",
      "⭐","🌟","✨","💫","🎯","🎉","🎊","🏆",
      "💘","💝","💖","💗","💓","💞","💕","♾️",
    ],
  },
  {
    label: "📚 Study & learning",
    emojis: [
      "📚","📖","✏️","📝","💡","🧠","🔬","🔭",
      "💻","📱","🖥️","⌨️","📊","📈","📉","📋",
      "🤓","👓","🎓","🏫","📐","📏","🔖","📌",
      "🗂️","📁","📂","📄","📃","🖊️","🖋️","📓",
    ],
  },
  {
    label: "🚀 Activities & misc",
    emojis: [
      "🚀","🌍","🌈","☀️","🌙","⏰","⏳","🕐",
      "🎵","🎶","🎮","🎲","🎭","🎨","🖌️","🗺️",
      "🍕","🍔","☕","🧋","🍎","🍓","🌮","🎂",
      "🏋️","⚽","🏀","🎾","🥊","🏊","🧘","🚴",
    ],
  },
];

function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS) ?? "[]"); } catch { return []; }
}
function saveSessions(s: Session[]) {
  if (typeof window !== "undefined") localStorage.setItem(LS, JSON.stringify(s));
}

function freshSession(): Session {
  return { id: uid(), title: "New chat", messages: [], createdAt: new Date().toISOString() };
}

export default function AiChatPage() {
  const { user } = useAuth();
  const { enrollments } = useData();
  const { push: pushToast } = useToast();
  const enrolledCourses = COURSES.filter((c) => enrollments.find((e) => e.courseId === c.id));

  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");
  const [draft, setDraft] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [courseId, setCourseId] = React.useState<string>("");

  // Sidebar (mobile slide-in)
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Rename session inline
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const renameInputRef = React.useRef<HTMLInputElement>(null);

  // Copy feedback per message
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Scroll-to-bottom detection
  const [atBottom, setAtBottom] = React.useState(true);

  // Emoji picker
  const [showEmoji, setShowEmoji] = React.useState(false);
  const emojiRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Load sessions once
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

  // Scroll when messages update
  React.useEffect(() => {
    if (atBottom) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, streaming, atBottom]);

  // Focus rename input
  React.useEffect(() => {
    if (renamingId) setTimeout(() => renameInputRef.current?.focus(), 50);
  }, [renamingId]);

  // Close mobile sidebar on outside click
  React.useEffect(() => {
    if (!sidebarOpen) return;
    function handler(e: MouseEvent) {
      const el = document.getElementById("ai-chat-sidebar");
      if (el && !el.contains(e.target as Node)) setSidebarOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  // Close emoji picker on outside click
  React.useEffect(() => {
    if (!showEmoji) return;
    function handler(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmoji]);

  function insertEmoji(emoji: string) {
    const ta = textareaRef.current;
    if (!ta) { setDraft((d) => d + emoji); return; }
    const start = ta.selectionStart ?? draft.length;
    const end = ta.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    // Restore cursor after emoji
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  function scrollToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setAtBottom(true);
  }

  function newChat() {
    const s = freshSession();
    setSessions((p) => [s, ...p]);
    setActiveId(s.id);
    setSidebarOpen(false);
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

  function startRename(s: Session) {
    setRenamingId(s.id);
    setRenameValue(s.title);
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
      pushToast({ title: "Couldn't copy to clipboard", tone: "danger" });
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function exportChat() {
    if (!active || active.messages.length === 0) return;
    const lines = [`# ${active.title}`, "", "*Exported from EduPortal AI Chat*", ""];
    for (const m of active.messages) {
      lines.push(`### ${m.role === "user" ? "You" : "AI Assistant"}`);
      lines.push(m.content, "");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${active.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clearChat() {
    if (!active) return;
    setSessions((p) => p.map((s) => s.id === activeId ? { ...s, messages: [], title: "New chat" } : s));
  }

  async function send() {
    if (!active || !draft.trim() || streaming) return;
    const userMsg: Msg = { id: uid(), role: "user", content: draft.trim() };
    const assistantId = uid();
    const courseTitle = COURSES.find((c) => c.id === courseId)?.title;
    const isFirst = active.messages.length === 0;
    const newTitle = isFirst ? draft.trim().slice(0, 48) : active.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === active.id
          ? {
              ...s,
              title: newTitle,
              courseId: courseId || s.courseId,
              messages: [...s.messages, userMsg, { id: assistantId, role: "assistant", content: "" }],
            }
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
          courseTitle,
          messages: [...active.messages, userMsg].map(({ role, content }) => ({ role, content })),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error("Chat request failed");
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
      if ((e as Error).name === "AbortError") {
        // User stopped generation — partial response stays
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === active.id
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantId ? { ...m, content: "Sorry — something went wrong. Please try again." } : m,
                  ),
                }
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
    <div className="h-[calc(100vh-7rem)] grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 relative">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <Card
        id="ai-chat-sidebar"
        className={cn(
          "flex-col overflow-hidden transition-all",
          "md:flex",
          sidebarOpen
            ? "fixed left-0 top-0 bottom-0 w-72 z-40 rounded-none flex shadow-2xl"
            : "hidden md:flex",
        )}
      >
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <Button className="flex-1" onClick={newChat}>
            <Icon.Plus size={16} /> New chat
          </Button>
          <button
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)]"
            onClick={() => setSidebarOpen(false)}
          >
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
                  onClick={() => { setActiveId(s.id); setSidebarOpen(false); }}
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
                  {/* Action buttons — visible on hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(s); }}
                      title="Rename"
                      className="h-6 w-6 flex items-center justify-center rounded text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]"
                    >
                      <Icon.Edit size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                      title="Delete"
                      className="h-6 w-6 flex items-center justify-center rounded text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10"
                    >
                      <Icon.Trash size={11} />
                    </button>
                  </div>
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Sidebar footer: session count */}
        <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">{sessions.length} chat{sessions.length !== 1 ? "s" : ""}</span>
          {sessions.length > 1 && (
            <button
              onClick={() => {
                const s = freshSession();
                setSessions([s]); setActiveId(s.id);
              }}
              className="text-xs text-[var(--muted)] hover:text-[var(--danger)] transition"
            >
              Clear all
            </button>
          )}
        </div>
      </Card>

      {/* ── Main Chat Area ────────────────────────────────────── */}
      <Card className="flex flex-col overflow-hidden relative">

        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-[var(--border)] flex items-center gap-3 flex-wrap">
          {/* Mobile sidebar toggle */}
          <button
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon.Menu size={18} />
          </button>

          <div className="h-9 w-9 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <Icon.Sparkles size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{active?.title ?? "AI Study Assistant"}</p>
            <p className="text-xs text-[var(--muted)]">Powered by Claude · streams responses in real time</p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {streaming && (
              <Button variant="outline" size="sm" onClick={stopStreaming}>
                <Icon.X size={13} /> Stop
              </Button>
            )}
            {active && active.messages.length > 0 && (
              <>
                <button
                  onClick={exportChat}
                  title="Export as Markdown"
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
                >
                  <Icon.Download size={15} />
                </button>
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition"
                >
                  <Icon.Trash size={15} />
                </button>
              </>
            )}
          </div>

          {/* Course context selector */}
          <div className="w-full sm:w-52">
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">No course context</option>
              {enrolledCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Messages scroll area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {(!active || active.messages.length === 0) && (
            <Welcome onPick={(s) => setDraft(s)} />
          )}

          {active?.messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3 group", m.role === "user" ? "justify-end" : "")}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center mt-1">
                  <Icon.Sparkles size={14} />
                </div>
              )}

              <div className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start", "max-w-[78%]")}>
                <div className={cn(
                  "rounded-2xl px-4 py-3 text-sm fade-in",
                  m.role === "user"
                    ? "btn-primary"
                    : "bg-[var(--surface-2)] text-[var(--foreground)]",
                )}>
                  {m.role === "assistant" ? (
                    m.content ? (
                      <Markdown text={m.content} />
                    ) : (
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

                {/* Copy button — appears on hover */}
                {m.content && (
                  <button
                    onClick={() => copyMessage(m.content, m.id)}
                    className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100"
                  >
                    {copiedId === m.id ? (
                      <><Icon.Check size={11} className="text-emerald-500" /> Copied</>
                    ) : (
                      <><Icon.Copy size={11} /> Copy</>
                    )}
                  </button>
                )}
              </div>

              {m.role === "user" && (
                <Avatar name={user?.name ?? "?"} src={user?.avatar ?? null} size={32} className="shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>

        {/* Scroll-to-bottom button */}
        {!atBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-[5.5rem] right-4 z-10 h-9 w-9 bg-[var(--surface)] border border-[var(--border)] rounded-full shadow-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
          >
            <Icon.ChevronDown size={18} />
          </button>
        )}

        {/* Input area */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="p-3 sm:p-4 border-t border-[var(--border)] flex gap-2 items-end"
        >
          <div className="flex-1 relative" ref={emojiRef}>
            {/* Emoji picker popover */}
            {showEmoji && (
              <div className="absolute bottom-full mb-2 left-0 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-3 w-[22rem] select-dropdown-in">
                <div className="max-h-72 overflow-y-auto space-y-3 scrollbar-thin pr-0.5">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <div key={cat.label}>
                      <p className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider mb-1.5 sticky top-0 bg-[var(--surface)] py-0.5">
                        {cat.label}
                      </p>
                      <div className="grid grid-cols-8 gap-0.5">
                        {cat.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmoji(emoji)}
                            className="text-lg h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[var(--primary-soft)] hover:scale-110 transition-all"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
              className="!min-h-[44px] max-h-[120px] pl-4 pr-16 py-2.5 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                if (e.key === "Escape") setShowEmoji(false);
              }}
              disabled={streaming}
            />

            {/* Emoji toggle button */}
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className={cn(
                "absolute right-2 bottom-2 h-8 w-8 flex items-center justify-center rounded-lg transition",
                showEmoji
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]",
              )}
              title="Emoji"
            >
              <Icon.Smile size={16} />
            </button>

            {/* Character count — shows only when > 0 */}
            {draft.length > 50 && (
              <span className="absolute bottom-2 right-11 text-[10px] text-[var(--muted-2)] tabular-nums pointer-events-none">
                {draft.length}
              </span>
            )}
          </div>
          <Button type="submit" loading={streaming} className="h-11" disabled={!draft.trim()}>
            <Icon.Send size={16} />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* ── Welcome screen ─────────────────────────────────────────────── */
function Welcome({ onPick }: { onPick: (s: string) => void }) {
  const categories = [
    {
      icon: <Icon.Book size={13} />,
      label: "Explain",
      items: [
        "Explain React Server Components like I'm 12.",
        "What is the difference between TCP and UDP?",
      ],
    },
    {
      icon: <Icon.ListChecks size={13} />,
      label: "Practice",
      items: [
        "Quiz me on Python list comprehensions.",
        "Give me 3 practice problems on recursion.",
      ],
    },
    {
      icon: <Icon.FilePen size={13} />,
      label: "Write",
      items: [
        "Outline an essay on climate change.",
        "Help me write an intro for a research paper on AI ethics.",
      ],
    },
    {
      icon: <Icon.Help size={13} />,
      label: "Clarify",
      items: [
        "What's the difference between let, const, and var?",
        "When should I use useEffect vs useLayoutEffect?",
      ],
    },
  ];

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white mb-4">
          <Icon.Sparkles size={26} />
        </div>
        <h2 className="text-xl font-bold">How can I help you learn today?</h2>
        <p className="text-sm text-[var(--muted)] mt-1">Pick a starter or type your own question below.</p>
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
                <button
                  key={s}
                  onClick={() => onPick(s)}
                  className="text-left text-sm p-3.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/40 transition leading-snug"
                >
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
