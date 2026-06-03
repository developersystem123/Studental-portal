"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle,
  Input, Label, Select, useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, formatDate, uid } from "@/lib/utils";
import { useAuth } from "@/lib/store";

type Question = { q: string; options: string[]; answerIndex: number; explanation: string };
type Phase = "setup" | "quiz" | "result";
type Difficulty = "Easy" | "Medium" | "Hard";
type Count = 5 | 10 | 15;
type QuizRecord = { id: string; topic: string; difficulty: Difficulty; score: number; total: number; date: string };

const HISTORY_LS = "eduportal:quiz-history";
const MAX_HISTORY = 6;

const TOPIC_CHIPS = [
  "JavaScript", "Python", "React.js", "World War II",
  "Photosynthesis", "Linear Algebra", "Climate Change", "Machine Learning",
  "Human Anatomy", "French Revolution",
];

const GRADE: Record<string, { label: string; emoji: string; bg: string }> = {
  S: { label: "Perfect Score!", emoji: "🏆", bg: "from-yellow-400 to-amber-500" },
  A: { label: "Excellent!", emoji: "🎉", bg: "from-emerald-500 to-teal-500" },
  B: { label: "Great Job!", emoji: "👍", bg: "from-blue-500 to-cyan-500" },
  C: { label: "Good Effort", emoji: "📚", bg: "from-yellow-500 to-orange-400" },
  D: { label: "Keep Studying!", emoji: "💪", bg: "from-red-500 to-rose-400" },
};

function getGrade(pct: number) {
  if (pct === 100) return "S";
  if (pct >= 80) return "A";
  if (pct >= 65) return "B";
  if (pct >= 50) return "C";
  return "D";
}

function loadHistory(): QuizRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_LS) ?? "[]"); } catch { return []; }
}
function saveHistory(r: QuizRecord[]) {
  try { localStorage.setItem(HISTORY_LS, JSON.stringify(r.slice(0, MAX_HISTORY))); } catch {}
}

function TimerCircle({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? remaining / total : 1;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const urgent = remaining <= 5;
  return (
    <div className={cn("relative h-12 w-12 shrink-0", urgent && "animate-pulse")}>
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r={r} strokeWidth="3" className="stroke-[var(--border)] fill-none" />
        <circle
          cx="22" cy="22" r={r} strokeWidth="3" fill="none"
          strokeLinecap="round"
          className={cn("transition-all duration-500", urgent ? "stroke-red-500" : "stroke-[var(--primary)]")}
          strokeDasharray={circ}
          strokeDashoffset={circ - circ * pct}
        />
      </svg>
      <span className={cn(
        "absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums",
        urgent ? "text-red-500" : "text-[var(--foreground)]",
      )}>
        {remaining}
      </span>
    </div>
  );
}

export default function AiQuizPage() {
  const toast = useToast();
  const { user } = useAuth();
  const isPro = user?.plan === "pro" || user?.plan === "team";

  if (user && !isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--primary-soft)] to-[var(--surface-2)] text-[var(--primary)] flex items-center justify-center border border-[var(--border)]">
          <Icon.Crown size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Quiz Generator requires Pro</h1>
          <p className="text-[var(--muted)] mt-2 max-w-sm">Upgrade to a Pro plan to unlock unlimited AI quiz generation.</p>
        </div>
        <Link href="/subscription">
          <Button><Icon.Sparkles size={14} /> Upgrade to Pro</Button>
        </Link>
      </div>
    );
  }

  // Setup state
  const [topic, setTopic] = React.useState("");
  const [difficulty, setDifficulty] = React.useState<Difficulty>("Medium");
  const [count, setCount] = React.useState<Count>(5);
  const [timerSec, setTimerSec] = React.useState(0);

  // Quiz state
  const [phase, setPhase] = React.useState<Phase>("setup");
  const [generating, setGenerating] = React.useState(false);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [answers, setAnswers] = React.useState<number[]>([]);

  // Timer
  const [timeLeft, setTimeLeft] = React.useState(0);

  // History
  const [history, setHistory] = React.useState<QuizRecord[]>([]);
  React.useEffect(() => { setHistory(loadHistory()); }, []);

  // Keep a ref of latest state for use inside effects / timeout handlers
  const stateRef = React.useRef({ answers, idx, questions, topic, difficulty, history });
  stateRef.current = { answers, idx, questions, topic, difficulty, history };

  function finishQuiz(finalAnswers: number[]) {
    const { questions: qs, topic: t, difficulty: d, history: h } = stateRef.current;
    const correct = qs.reduce((s, q, i) => q.answerIndex === finalAnswers[i] ? s + 1 : s, 0);
    const score = Math.round((correct / qs.length) * 100);
    const rec: QuizRecord = { id: uid(), topic: t, difficulty: d, score, total: qs.length, date: new Date().toISOString() };
    const newHist = [rec, ...h].slice(0, MAX_HISTORY);
    setHistory(newHist);
    saveHistory(newHist);
    setPhase("result");
  }

  // Reset timer when question changes
  React.useEffect(() => {
    if (phase === "quiz" && timerSec > 0) setTimeLeft(timerSec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase]);

  // Count down
  React.useEffect(() => {
    if (phase !== "quiz" || timerSec === 0 || picked !== null || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timerSec, picked, timeLeft]);

  // Handle timeout — auto-skip question
  React.useEffect(() => {
    if (phase !== "quiz" || timerSec === 0 || picked !== null || timeLeft !== 0) return;
    const { answers: ans, idx: i, questions: qs } = stateRef.current;
    const updated = [...ans, -1];
    setAnswers(updated);
    if (i >= qs.length - 1) {
      finishQuiz(updated);
    } else {
      setIdx(i + 1);
      setPicked(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  async function generate() {
    if (!topic.trim()) { toast.push({ title: "Enter a topic first", tone: "danger" }); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), difficulty, count }),
      });
      const data = await res.json();
      if (!data.questions?.length) throw new Error("No questions returned");
      setQuestions(data.questions);
      setIdx(0); setPicked(null); setAnswers([]);
      if (timerSec > 0) setTimeLeft(timerSec);
      setPhase("quiz");
    } catch (e) {
      toast.push({ title: "Couldn't generate quiz", description: String(e), tone: "danger" });
    } finally {
      setGenerating(false);
    }
  }

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
  }

  function next() {
    if (picked === null) return;
    const updated = [...answers, picked];
    setAnswers(updated);
    setPicked(null);
    if (idx >= questions.length - 1) {
      finishQuiz(updated);
    } else {
      setIdx(idx + 1);
    }
  }

  function restart(keepSettings = false) {
    setQuestions([]); setIdx(0); setPicked(null); setAnswers([]);
    if (!keepSettings) { setTopic(""); setDifficulty("Medium"); setCount(5); setTimerSec(0); }
    setPhase("setup");
  }

  function exportPdf() {
    const correct = questions.reduce((s, q, i) => q.answerIndex === answers[i] ? s + 1 : s, 0);
    const scorePct = Math.round((correct / questions.length) * 100);
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${topic} Quiz</title>
<style>
  body{font-family:system-ui,sans-serif;padding:40px;max-width:760px;margin:auto}
  h1{color:#16a34a}.meta{color:#6b7280;margin-bottom:24px}
  .q{padding:16px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:14px}
  .opt{padding:6px 10px;border-radius:8px;margin:4px 0}
  .correct{background:#dcfce7}.wrong{background:#fee2e2;text-decoration:line-through}
  .picked{font-weight:600}.exp{background:#f9fafb;padding:10px;border-radius:8px;font-size:14px}
</style></head><body>
<h1>${topic} — Quiz Results</h1>
<p class="meta">Difficulty: ${difficulty} · Score: ${scorePct}% (${correct}/${questions.length})</p>
${questions.map((q, i) => `<div class="q"><b>Q${i + 1}. ${q.q}</b>
  ${q.options.map((o, j) => {
    const isAnswer = j === q.answerIndex, wasPicked = j === answers[i];
    return `<div class="opt ${isAnswer ? "correct" : wasPicked ? "wrong" : ""} ${wasPicked ? "picked" : ""}">${String.fromCharCode(65 + j)}. ${o}${wasPicked ? " (your answer)" : ""}</div>`;
  }).join("")}
  <div class="exp">${q.explanation}</div></div>`).join("")}
<script>window.onload=()=>setTimeout(()=>window.print(),200);</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return toast.push({ title: "Popup blocked", tone: "danger" });
    w.document.write(html); w.document.close();
  }

  const correctCount = questions.reduce((s, q, i) => q.answerIndex === answers[i] ? s + 1 : s, 0);
  const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const grade = getGrade(scorePct);
  const gradeInfo = GRADE[grade];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center shrink-0">
          <Icon.ListChecks size={22} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">AI Quiz Generator</h1>
          <p className="text-sm text-[var(--muted)]">Generate MCQs on any topic and test yourself.</p>
        </div>
      </div>

      {/* ── SETUP ────────────────────────────────────────────────────── */}
      {phase === "setup" && (
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Build your quiz</CardTitle></CardHeader>
            <CardBody className="space-y-5">

              {/* Quick topic chips */}
              <div>
                <p className="text-xs text-[var(--muted)] font-medium mb-2">Quick topics</p>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setTopic(chip)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full border transition-all",
                        topic === chip
                          ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
                      )}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic input */}
              <div>
                <Label htmlFor="quiz-topic">Topic</Label>
                <Input
                  id="quiz-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. JavaScript closures, photosynthesis, World War II…"
                  onKeyDown={(e) => e.key === "Enter" && generate()}
                />
              </div>

              {/* Settings row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </Select>
                </div>
                <div>
                  <Label>Question count</Label>
                  <Select value={count} onChange={(e) => setCount(Number(e.target.value) as Count)}>
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                    <option value={15}>15 questions</option>
                  </Select>
                </div>
                <div>
                  <Label>Timer per question</Label>
                  <Select value={timerSec} onChange={(e) => setTimerSec(Number(e.target.value))}>
                    <option value={0}>No timer</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>60 seconds</option>
                    <option value={90}>90 seconds</option>
                  </Select>
                </div>
              </div>

              <Button onClick={generate} loading={generating} className="w-full sm:w-auto">
                <Icon.Sparkles size={16} /> Generate quiz
              </Button>
            </CardBody>
          </Card>

          {/* Quiz history */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent quizzes</CardTitle>
                  <button
                    onClick={() => { setHistory([]); saveHistory([]); }}
                    className="text-xs text-[var(--muted)] hover:text-[var(--danger)] transition"
                  >
                    Clear history
                  </button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <ul className="divide-y divide-[var(--border)]">
                  {history.map((r) => {
                    const g = getGrade(r.score);
                    const gi = GRADE[g];
                    return (
                      <li key={r.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] transition">
                        <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center text-xs font-bold shrink-0", gi.bg)}>
                          {g}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.topic}</p>
                          <p className="text-xs text-[var(--muted)]">{r.difficulty} · {r.total} Qs · {formatDate(r.date)}</p>
                        </div>
                        <div className="text-right shrink-0 mr-2">
                          <p className="text-sm font-bold">{r.score}%</p>
                          <p className="text-xs text-[var(--muted)]">{Math.round(r.score / 100 * r.total)}/{r.total}</p>
                        </div>
                        <button
                          onClick={() => { setTopic(r.topic); setDifficulty(r.difficulty); setCount(r.total as Count); }}
                          className="text-xs text-[var(--primary)] hover:underline shrink-0"
                        >
                          Retry
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ── QUIZ ─────────────────────────────────────────────────────── */}
      {phase === "quiz" && questions.length > 0 && (
        <Card>
          <CardBody className="space-y-5">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Question {idx + 1} / {questions.length}</Badge>
                <Badge variant={difficulty === "Easy" ? "success" : difficulty === "Hard" ? "danger" : "warning"}>
                  {difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                {timerSec > 0 && picked === null && (
                  <TimerCircle remaining={timeLeft} total={timerSec} />
                )}
                {timerSec > 0 && picked !== null && (
                  <div className="h-12 w-12 flex items-center justify-center">
                    <Icon.CheckCircle size={24} className="text-emerald-500" />
                  </div>
                )}
                <button
                  onClick={() => restart()}
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition flex items-center gap-1"
                >
                  <Icon.X size={13} /> Quit
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-300"
                style={{ width: `${((idx + (picked !== null ? 1 : 0)) / questions.length) * 100}%` }}
              />
            </div>

            {/* Running score */}
            {answers.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-500 font-semibold">
                  ✓ {answers.filter((a, i) => a === questions[i]?.answerIndex).length} correct
                </span>
                <span className="text-[var(--border)]">·</span>
                <span className="text-red-500 font-semibold">
                  ✗ {answers.filter((a, i) => a !== questions[i]?.answerIndex && a !== -1).length} wrong
                </span>
                {answers.filter(a => a === -1).length > 0 && (
                  <>
                    <span className="text-[var(--border)]">·</span>
                    <span className="text-[var(--muted)]">
                      {answers.filter(a => a === -1).length} skipped
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Question */}
            <h2 className="text-lg font-semibold leading-snug">{questions[idx].q}</h2>

            {/* Options */}
            <div className="space-y-2">
              {questions[idx].options.map((opt, i) => {
                const isCorrect = picked !== null && i === questions[idx].answerIndex;
                const isWrongPick = picked === i && i !== questions[idx].answerIndex;
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={picked !== null}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-all",
                      picked === null
                        ? "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/40"
                        : isCorrect
                          ? "border-emerald-500 bg-emerald-500/10"
                          : isWrongPick
                            ? "border-red-500 bg-red-500/10"
                            : "border-[var(--border)] opacity-50",
                    )}
                  >
                    <span className={cn(
                      "h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0",
                      picked === null
                        ? "bg-[var(--surface-2)] text-[var(--muted)]"
                        : isCorrect ? "bg-emerald-500 text-white"
                        : isWrongPick ? "bg-red-500 text-white"
                        : "bg-[var(--surface-2)] text-[var(--muted)]",
                    )}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm flex-1 text-left">{opt}</span>
                    {picked !== null && isCorrect && <Icon.Check size={16} className="ml-auto text-emerald-500 shrink-0 mt-0.5" />}
                    {isWrongPick && <Icon.X size={16} className="ml-auto text-red-500 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {picked !== null && (
              <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-4">
                <p className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)] mb-1.5 flex items-center gap-1.5">
                  <Icon.AlertCircle size={13} /> Explanation
                </p>
                <p className="text-sm leading-relaxed">{questions[idx].explanation}</p>
              </div>
            )}

            {/* Next button */}
            <div className="flex justify-end">
              <Button onClick={next} disabled={picked === null}>
                {idx === questions.length - 1 ? "Finish quiz" : "Next question"}
                <Icon.ChevronRight size={14} />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── RESULT ───────────────────────────────────────────────────── */}
      {phase === "result" && (
        <div className="space-y-5">
          {/* Score hero card */}
          <Card className="overflow-hidden">
            <div className={cn("p-6 sm:p-10 bg-gradient-to-br text-white text-center", gradeInfo.bg)}>
              <p className="text-5xl mb-2">{gradeInfo.emoji}</p>
              <h2 className="text-5xl font-bold tabular-nums">{scorePct}%</h2>
              <p className="text-white/90 text-lg font-semibold mt-1">{gradeInfo.label}</p>
              <p className="text-white/75 text-sm mt-1">
                {correctCount} correct out of {questions.length} questions
              </p>
            </div>
            <CardBody>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{correctCount}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">Correct</p>
                </div>
                <div className="rounded-xl bg-red-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {answers.filter((a, i) => a !== questions[i]?.answerIndex && a !== -1).length}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">Wrong</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
                  <p className="text-2xl font-bold">{answers.filter(a => a === -1).length}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">Skipped</p>
                </div>
              </div>

              {/* Score bar */}
              <div className="rounded-xl bg-[var(--surface-2)] p-3 flex items-center gap-3 mb-5">
                <Icon.BarChart3 size={18} className="text-[var(--muted)] shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-[var(--muted)]">{difficulty} difficulty · {questions.length} questions</p>
                  <div className="h-1.5 bg-[var(--border)] rounded-full mt-1 overflow-hidden">
                    <div
                      className={cn("h-full bg-gradient-to-r", gradeInfo.bg)}
                      style={{ width: `${scorePct}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0">{scorePct}%</span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => restart()}>
                  <Icon.Sparkles size={14} /> New quiz
                </Button>
                <Button variant="soft" onClick={() => restart(true)}>
                  <Icon.ArrowLeft size={14} /> Same settings
                </Button>
                <Button onClick={exportPdf}>
                  <Icon.Download size={14} /> Export PDF
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Question review */}
          <Card>
            <CardHeader><CardTitle>Question review</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              {questions.map((q, i) => {
                const correct = answers[i] === q.answerIndex;
                const skipped = answers[i] === -1;
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border p-4",
                      correct
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : skipped
                          ? "border-[var(--border)]"
                          : "border-red-500/30 bg-red-500/5",
                    )}
                  >
                    <p className="font-semibold text-sm mb-2 flex items-start gap-2">
                      <Badge variant={correct ? "success" : skipped ? "default" : "danger"} className="shrink-0">
                        Q{i + 1}
                      </Badge>
                      {q.q}
                    </p>
                    <ul className="space-y-1 text-sm mb-2">
                      {q.options.map((opt, j) => (
                        <li
                          key={j}
                          className={cn(
                            "px-2.5 py-1 rounded",
                            j === q.answerIndex && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium",
                            j === answers[i] && j !== q.answerIndex && "bg-red-500/10 text-red-700 dark:text-red-400 line-through",
                          )}
                        >
                          {String.fromCharCode(65 + j)}. {opt}
                          {j === q.answerIndex && " ✓"}
                          {j === answers[i] && j !== q.answerIndex && " ✗"}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      <span className="font-semibold text-[var(--foreground)]">Why: </span>
                      {q.explanation}
                    </p>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
