"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { cn } from "@/lib/utils";

type Quiz = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  courseTitle: string;
  questions: { id: string; question: string; options: string[]; points: number }[];
};

type Result = {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
};

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const { push } = useToast();

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (data.quiz) {
          setQuiz(data.quiz);
          setSecondsLeft(data.quiz.durationMinutes * 60);
        }
      })
      .catch(() => push({ title: "Couldn't load quiz", tone: "danger" }))
      .finally(() => setLoading(false));
  }, [id, push]);

  useEffect(() => {
    if (result || secondsLeft === null || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft, result]);

  useEffect(() => {
    if (secondsLeft === 0 && quiz && !result) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  async function submit() {
    if (!quiz) return;
    setSubmitting(true);
    const r = await fetch(`/api/quizzes/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    setSubmitting(false);
    const data = await r.json();
    if (!r.ok) {
      push({ title: "Submit failed", description: data.error ?? "", tone: "danger" });
      return;
    }
    setResult(data.attempt);
    push({
      title: data.attempt.passed ? "Passed!" : "Try again",
      description: `${data.attempt.percentage}%`,
      tone: data.attempt.passed ? "success" : "warning",
    });
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (!quiz) return (
    <Card><CardBody>
      <p className="text-sm">Quiz not found.</p>
      <Link href="/quizzes" className="text-sm text-[var(--primary)] mt-2 inline-block">← Back</Link>
    </CardBody></Card>
  );

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardBody className="text-center py-10">
            <div className={cn(
              "h-20 w-20 rounded-full mx-auto flex items-center justify-center mb-4",
              result.passed ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
            )}>
              {result.passed ? <Icon.CheckCircle size={40} /> : <Icon.AlertCircle size={40} />}
            </div>
            <h2 className="text-2xl font-bold">{result.passed ? "You passed!" : "Not quite"}</h2>
            <p className="text-5xl font-bold mt-4 gradient-text">{result.percentage}%</p>
            <p className="text-sm text-[var(--muted)] mt-2">
              {result.score} / {result.totalPoints} points · Passing: {quiz.passingScore}%
            </p>
            <div className="flex justify-center gap-2 mt-6">
              <Link href="/quizzes"><Button variant="outline">Back to quizzes</Button></Link>
              <Button onClick={() => router.refresh()}>Retake</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const answered = Object.keys(answers).length;
  const minutes = secondsLeft === null ? 0 : Math.floor(secondsLeft / 60);
  const seconds = secondsLeft === null ? 0 : secondsLeft % 60;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/quizzes" className="text-xs text-[var(--muted)] hover:text-[var(--primary)]">
            ← All quizzes
          </Link>
          <h1 className="text-2xl font-bold mt-1">{quiz.title}</h1>
          <p className="text-xs text-[var(--muted)]">{quiz.courseTitle}</p>
        </div>
        <Badge variant={secondsLeft !== null && secondsLeft < 60 ? "danger" : "info"}>
          <Icon.Clock size={12} /> {minutes}:{String(seconds).padStart(2, "0")}
        </Badge>
      </div>

      {quiz.questions.map((q, idx) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle>Question {idx + 1}: {q.question}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === oi;
              return (
                <button
                  key={oi}
                  onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition flex items-center gap-3",
                    selected
                      ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                      : "border-[var(--border)] hover:bg-[var(--surface-2)]"
                  )}
                >
                  <span className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold",
                    selected ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border-strong)]"
                  )}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </CardBody>
        </Card>
      ))}

      <div className="flex items-center justify-between sticky bottom-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl card-shadow">
        <p className="text-sm text-[var(--muted)]">
          {answered}/{quiz.questions.length} answered
        </p>
        <Button onClick={submit} loading={submitting} disabled={answered === 0}>
          Submit quiz <Icon.Send size={14} />
        </Button>
      </div>
    </div>
  );
}
