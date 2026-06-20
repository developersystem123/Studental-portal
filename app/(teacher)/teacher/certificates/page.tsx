"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useTeacher } from "@/lib/store";
import { formatDate } from "@/lib/utils";

type CertRow = {
  id: string;
  userId: string;
  courseId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  score: number;
  verifyCode: string;
  issuedAt: string;
};

type SortKey = "date" | "score" | "name";

const PAGE_SIZE = 10;

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;

  function pages(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <Icon.ChevronLeft size={14} />
      </button>
      {pages().map((p, i) =>
        p === "…" ? (
          <span key={`ell-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-[var(--muted)]">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
              page === p
                ? "bg-[var(--primary)] text-white"
                : "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-2)]"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <Icon.ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-500/20 text-violet-600",
  "bg-sky-500/20 text-sky-600",
  "bg-emerald-500/20 text-emerald-600",
  "bg-amber-500/20 text-amber-600",
  "bg-rose-500/20 text-rose-600",
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function scoreColor(s: number) {
  if (s >= 85) return "bg-emerald-500";
  if (s >= 60) return "bg-[var(--primary)]";
  return "bg-amber-500";
}

function scoreBadgeVariant(s: number): "success" | "info" | "warning" {
  if (s >= 85) return "success";
  if (s >= 60) return "info";
  return "warning";
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({
  label, value, sub, icon, tint,
}: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; tint: string;
}) {
  return (
    <Card className="hover-lift">
      <CardBody className="flex items-center gap-3 !py-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-[10px] text-[var(--muted-2)]">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={scoreBadgeVariant(score)}>{score}%</Badge>
      <div className="w-16 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden hidden sm:block">
        <div
          className={`h-full rounded-full transition-all duration-500 ${scoreColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Certificate detail modal ─────────────────────────────────────────────────
function CertDetailModal({
  cert,
  onClose,
  onRevoke,
}: {
  cert: CertRow | null;
  onClose: () => void;
  onRevoke: (id: string) => Promise<void>;
}) {
  const toast = useToast();
  const [revoking, setRevoking] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (!cert) return null;

  function copyCode() {
    navigator.clipboard.writeText(cert!.verifyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.push({ title: "Copied to clipboard", tone: "success" });
  }

  async function handleRevoke() {
    if (!confirm(`Revoke certificate for ${cert!.studentName}? This cannot be undone.`)) return;
    setRevoking(true);
    await onRevoke(cert!.id);
    setRevoking(false);
    onClose();
  }

  return (
    <Modal open={cert !== null} onClose={onClose} title="Certificate Details" size="md">
      <div className="p-5 space-y-5">
        {/* Certificate card preview */}
        <div className="rounded-2xl border-2 border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/5 via-[var(--surface)] to-[var(--accent)]/5 p-5 text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="h-14 w-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <Icon.Award size={28} className="text-[var(--primary)]" />
            </div>
          </div>
          <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-semibold">Certificate of Completion</p>
          <p className="text-xl font-bold">{cert.studentName}</p>
          <p className="text-sm text-[var(--muted)]">has successfully completed</p>
          <p className="text-base font-semibold text-[var(--primary)]">{cert.courseTitle}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="text-xs text-[var(--muted)]">Score:</span>
            <Badge variant={scoreBadgeVariant(cert.score)} >{cert.score}%</Badge>
          </div>
          <div className="h-1.5 w-32 mx-auto rounded-full bg-[var(--surface-2)] overflow-hidden mt-1">
            <div className={`h-full rounded-full ${scoreColor(cert.score)}`} style={{ width: `${cert.score}%` }} />
          </div>
          <p className="text-xs text-[var(--muted-2)] pt-1">Issued {formatDate(cert.issuedAt)}</p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Student</p>
            <p className="font-semibold truncate">{cert.studentName}</p>
            <p className="text-xs text-[var(--muted)] truncate">{cert.studentEmail}</p>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Issued</p>
            <p className="font-semibold">{formatDate(cert.issuedAt)}</p>
          </div>
        </div>

        {/* Verify code */}
        <div className="rounded-xl bg-[var(--surface-2)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">Verify Code</p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-bold tracking-widest">{cert.verifyCode}</span>
            <Button size="sm" variant="outline" onClick={copyCode}>
              {copied ? <><Icon.Check size={13} /> Copied</> : <><Icon.Copy size={13} /> Copy</>}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
          <Button variant="danger" size="sm" onClick={handleRevoke} loading={revoking}>
            <Icon.Trash size={13} /> Revoke
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Issue modal ──────────────────────────────────────────────────────────────
const SCORE_PRESETS = [60, 70, 75, 80, 85, 90, 95, 100];

function IssueModal({
  open,
  issuable,
  onClose,
  onIssued,
}: {
  open: boolean;
  issuable: { userId: string; courseId: string; userName: string; courseTitle: string; completed: boolean; progress: number }[];
  onClose: () => void;
  onIssued: () => void;
}) {
  const toast = useToast();
  const [pairKey, setPairKey] = React.useState("");
  const [score, setScore] = React.useState("80");
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) { setPairKey(""); setScore("80"); setErr(null); }
  }, [open]);

  async function issue() {
    const [userId, courseId] = pairKey.split("::");
    const n = Number(score);
    setErr(null);
    if (!userId || !courseId) return setErr("Please select a student.");
    if (!Number.isFinite(n) || n < 0 || n > 100) return setErr("Score must be 0–100.");
    setSaving(true);
    const r = await fetch("/api/teacher/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId, score: n }),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      setErr(e.error ?? "Couldn't issue certificate.");
      return;
    }
    toast.push({ title: "Certificate issued", tone: "success" });
    onIssued();
  }

  const selected = issuable.find((s) => `${s.userId}::${s.courseId}` === pairKey);
  const scoreNum = Number(score);
  const validScore = Number.isFinite(scoreNum) && scoreNum >= 0 && scoreNum <= 100;
  const scoreBarColor = scoreNum >= 85 ? "bg-emerald-500" : scoreNum >= 60 ? "bg-[var(--primary)]" : "bg-amber-500";
  const scoreLabel = scoreNum >= 85 ? "Excellent" : scoreNum >= 70 ? "Good" : scoreNum >= 60 ? "Pass" : "Low";
  const scoreLabelColor = scoreNum >= 85 ? "text-emerald-600" : scoreNum >= 70 ? "text-[var(--primary)]" : scoreNum >= 60 ? "text-amber-600" : "text-red-500";

  return (
    <Modal open={open} onClose={onClose} size="md" title="Issue Certificate">
      {/* Accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[var(--primary)] via-amber-400 to-emerald-400" />

      <div className="p-4 sm:p-6 space-y-5">

        {/* ── Certificate mini-preview ── */}
        <div className="rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/5 via-[var(--surface-2)] to-amber-400/5 p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0 shadow-inner">
            <Icon.Award size={24} className="text-[var(--primary)]" />
          </div>
          <div className="min-w-0 flex-1">
            {selected ? (
              <>
                <p className="font-bold truncate">{selected.userName}</p>
                <p className="text-xs text-[var(--muted)] truncate">{selected.courseTitle}</p>
                <p className={`text-[11px] font-semibold mt-0.5 flex items-center gap-1 ${selected.completed ? "text-emerald-600" : "text-amber-600"}`}>
                  {selected.completed
                    ? <><Icon.CheckCircle size={11} /> Course completed</>
                    : <><Icon.Clock size={11} /> {selected.progress}% progress</>}
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-[var(--muted)]">Certificate of Completion</p>
                <p className="text-xs text-[var(--muted-2)]">Select a student to preview</p>
              </>
            )}
          </div>
          {selected && validScore && (
            <div className="text-center shrink-0">
              <p className={`text-2xl font-bold tabular-nums ${scoreLabelColor}`}>{scoreNum}%</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${scoreLabelColor}`}>{scoreLabel}</p>
            </div>
          )}
        </div>

        {/* ── Student & Course ── */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
            <Icon.Users size={14} className="text-[var(--muted)]" />
            Student &amp; Course
            <span className="text-[var(--danger)] ml-0.5">*</span>
          </label>
          <Select value={pairKey} onChange={(e) => { setPairKey(e.target.value); setErr(null); }}>
            <option value="">Select a student…</option>
            {issuable.map((s) => (
              <option key={`${s.userId}::${s.courseId}`} value={`${s.userId}::${s.courseId}`}>
                {s.userName} — {s.courseTitle} {s.completed ? "✓" : `(${s.progress}%)`}
              </option>
            ))}
          </Select>
          {issuable.length === 0 && (
            <p className="text-xs text-[var(--muted-2)] flex items-center gap-1">
              <Icon.CheckCircle size={12} className="text-emerald-500" />
              All eligible students already have certificates.
            </p>
          )}
        </div>

        {/* ── Score ── */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--foreground)] flex items-center justify-between gap-1.5">
            <span className="flex items-center gap-1.5">
              <Icon.Award size={14} className="text-[var(--muted)]" />
              Score
            </span>
            {validScore && (
              <span className={`text-sm font-bold tabular-nums ${scoreLabelColor}`}>
                {scoreNum}% · {scoreLabel}
              </span>
            )}
          </label>

          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {SCORE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setScore(String(p))}
                className={`px-2.5 h-7 rounded-lg text-xs font-semibold border transition-all ${
                  score === String(p)
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--border-strong)]"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="0–100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] pointer-events-none">%</span>
          </div>

          {/* Score bar */}
          {validScore && (
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${scoreBarColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, scoreNum))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--muted-2)]">
                <span>0%</span>
                <span>Pass (60%)</span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {err && (
          <div className="flex items-center gap-2.5 text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl">
            <Icon.AlertCircle size={15} className="shrink-0" />
            {err}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-border">
          <p className="text-xs text-muted">
            {selected
              ? selected.completed
                ? "Student has completed this course"
                : `Student is at ${selected.progress}% progress`
              : "Select a student to continue"}
          </p>
          <div className="flex gap-2 self-end sm:self-auto shrink-0">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={issue} loading={saving} disabled={!pairKey || !validScore}>
              <Icon.Award size={15} />
              <span className="hidden sm:inline">Issue Certificate</span>
              <span className="sm:hidden">Issue</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeacherCertificatesPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const students = teacher.myStudents();

  const [certs, setCerts] = React.useState<CertRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [issueOpen, setIssueOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<CertRow | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/teacher/certificates");
    const data = r.ok ? await r.json() : { certificates: [] };
    setCerts(data.certificates ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const issuable = React.useMemo(() => {
    const has = new Set(certs.map((c) => `${c.userId}::${c.courseId}`));
    return students.filter((s) => !has.has(`${s.userId}::${s.courseId}`));
  }, [students, certs]);

  const courseOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of certs) if (!seen.has(c.courseId)) seen.set(c.courseId, c.courseTitle);
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [certs]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = certs
      .filter((c) => courseFilter === "all" || c.courseId === courseFilter)
      .filter(
        (c) =>
          !q ||
          c.studentName.toLowerCase().includes(q) ||
          c.courseTitle.toLowerCase().includes(q) ||
          c.verifyCode.toLowerCase().includes(q),
      );
    result = [...result].sort((a, b) => {
      if (sortKey === "date") return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      if (sortKey === "score") return b.score - a.score;
      return a.studentName.localeCompare(b.studentName);
    });
    return result;
  }, [certs, query, courseFilter, sortKey]);

  React.useEffect(() => { setPage(1); }, [query, courseFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const avgScore = certs.length
    ? Math.round(certs.reduce((s, c) => s + c.score, 0) / certs.length)
    : 0;
  const uniqueStudents = new Set(certs.map((c) => c.userId)).size;
  const topScore = certs.length ? Math.max(...certs.map((c) => c.score)) : 0;

  async function revoke(id: string) {
    const r = await fetch(`/api/teacher/certificates/${id}`, { method: "DELETE" });
    if (r.ok) {
      toast.push({ title: "Certificate revoked", tone: "info" });
      load();
    } else {
      toast.push({ title: "Couldn't revoke", tone: "danger" });
    }
  }

  function copyCode(cert: CertRow, e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(cert.verifyCode);
    setCopiedId(cert.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.push({ title: "Verify code copied", tone: "success" });
  }

  async function issueAllEligible() {
    const eligible = issuable.filter((s) => s.completed);
    if (eligible.length === 0) {
      toast.push({ title: "No completed students without a certificate", tone: "info" });
      return;
    }
    if (!confirm(`Issue certificates to ${eligible.length} completed student${eligible.length !== 1 ? "s" : ""}? Default score 80% will be used.`)) return;
    let issued = 0;
    for (const s of eligible) {
      const r = await fetch("/api/teacher/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: s.userId, courseId: s.courseId, score: 80 }),
      });
      if (r.ok) issued++;
    }
    toast.push({ title: `Issued ${issued} certificate${issued !== 1 ? "s" : ""}`, tone: "success" });
    load();
  }

  function exportCsv() {
    const csv = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ["Student", "Email", "Course", "Score", "Issued", "Verify Code"].join(",");
    const lines = filtered.map((c) =>
      [csv(c.studentName), csv(c.studentEmail), csv(c.courseTitle), `${c.score}%`, csv(formatDate(c.issuedAt)), csv(c.verifyCode)].join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certificates.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.push({ title: "Exported CSV", tone: "success" });
  }

  const completedIssuable = issuable.filter((s) => s.completed).length;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Teaching</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Certificates</h1>
          <p className="mt-1 text-[var(--muted)]">
            Award certificates to students who have completed your courses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {completedIssuable > 0 && (
            <Button variant="outline" onClick={issueAllEligible}>
              <Icon.Sparkles size={15} /> Issue All Eligible ({completedIssuable})
            </Button>
          )}
          <Button onClick={() => setIssueOpen(true)} disabled={issuable.length === 0}>
            <Icon.Plus size={16} /> Issue Certificate
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatPill
          label="Issued"
          value={certs.length}
          sub={`${uniqueStudents} unique student${uniqueStudents !== 1 ? "s" : ""}`}
          icon={<Icon.Award size={18} />}
          tint="bg-[var(--primary-soft)] text-[var(--primary)]"
        />
        <StatPill
          label="Avg Score"
          value={certs.length ? `${avgScore}%` : "—"}
          sub={certs.length ? `top: ${topScore}%` : "no certs yet"}
          icon={<Icon.TrendingUp size={18} />}
          tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatPill
          label="Students"
          value={uniqueStudents}
          sub="with a certificate"
          icon={<Icon.Users size={18} />}
          tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <StatPill
          label="Pending Eligible"
          value={issuable.length}
          sub={completedIssuable > 0 ? `${completedIssuable} completed` : "none completed yet"}
          icon={<Icon.Clock size={18} />}
          tint={issuable.length > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-[var(--surface-2)] text-[var(--muted)]"}
        />
      </div>

      {/* Toolbar */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student, course or verify code…"
              icon={<Icon.Search size={16} />}
              className="flex-1"
            />
            {courseOptions.length > 1 && (
              <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="!h-10 sm:!w-52">
                <option value="all">All courses</option>
                {courseOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>
            )}
            <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="!h-10 sm:!w-44">
              <option value="date">Sort: Newest</option>
              <option value="score">Sort: Highest score</option>
              <option value="name">Sort: Name A–Z</option>
            </Select>
            {filtered.length > 0 && (
              <Button variant="outline" onClick={exportCsv} className="!h-10 shrink-0">
                <Icon.Download size={15} /> Export CSV
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-[var(--surface-2)] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Award size={28} />}
              title={certs.length === 0 ? "No certificates issued yet" : "No matches"}
              description={
                certs.length === 0
                  ? issuable.length > 0
                    ? `${issuable.length} student${issuable.length !== 1 ? "s" : ""} eligible — issue your first certificate.`
                    : "Issue a certificate to a student from one of your courses."
                  : "Try a different search or filter."
              }
              action={
                (query || courseFilter !== "all") ? (
                  <Button variant="outline" size="sm" onClick={() => { setQuery(""); setCourseFilter("all"); }}>
                    Clear filters
                  </Button>
                ) : certs.length === 0 && issuable.length > 0 ? (
                  <Button size="sm" onClick={() => setIssueOpen(true)}>
                    <Icon.Award size={14} /> Issue certificate
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-[var(--border)]">
                    <tr className="text-left text-[var(--muted)] text-xs uppercase tracking-wider">
                      <th className="font-semibold px-3 py-2.5">Student</th>
                      <th className="font-semibold px-3 py-2.5">Course</th>
                      <th className="font-semibold px-3 py-2.5">Score</th>
                      <th className="font-semibold px-3 py-2.5 hidden md:table-cell">Issued</th>
                      <th className="font-semibold px-3 py-2.5">Verify Code</th>
                      <th className="px-3 py-2.5 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginated.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setDetail(c)}
                        className="group hover:bg-[var(--surface-2)]/50 transition cursor-pointer"
                      >
                        {/* Student */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(c.studentName)}`}>
                              {initials(c.studentName)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium truncate group-hover:text-[var(--primary)] transition">{c.studentName}</p>
                              <p className="text-xs text-[var(--muted)] truncate">{c.studentEmail}</p>
                            </div>
                          </div>
                        </td>
                        {/* Course */}
                        <td className="px-3 py-3 max-w-[18rem]">
                          <p className="truncate">{c.courseTitle}</p>
                        </td>
                        {/* Score */}
                        <td className="px-3 py-3">
                          <ScoreBar score={c.score} />
                        </td>
                        {/* Issued */}
                        <td className="px-3 py-3 text-xs text-[var(--muted)] hidden md:table-cell whitespace-nowrap">
                          {formatDate(c.issuedAt)}
                        </td>
                        {/* Verify code */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="font-mono text-xs font-semibold tracking-wide">{c.verifyCode}</span>
                            <button
                              onClick={(e) => copyCode(c, e)}
                              title="Copy verify code"
                              className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--primary)] transition opacity-0 group-hover:opacity-100"
                            >
                              {copiedId === c.id ? <Icon.Check size={12} /> : <Icon.Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        {/* View arrow */}
                        <td className="px-3 py-3">
                          <Icon.ChevronRight size={14} className="text-[var(--muted-2)] opacity-0 group-hover:opacity-100 transition" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
                <p className="text-xs text-[var(--muted-2)]">
                  Showing{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span>{" "}
                  certificate{filtered.length !== 1 ? "s" : ""}
                  {filtered.length !== certs.length && (
                    <button
                      className="ml-2 text-[var(--primary)] hover:underline"
                      onClick={() => { setQuery(""); setCourseFilter("all"); }}
                    >
                      Clear filters
                    </button>
                  )}
                </p>
                <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <IssueModal
        open={issueOpen}
        issuable={issuable}
        onClose={() => setIssueOpen(false)}
        onIssued={() => { setIssueOpen(false); load(); }}
      />

      <CertDetailModal cert={detail} onClose={() => setDetail(null)} onRevoke={revoke} />
    </div>
  );
}
