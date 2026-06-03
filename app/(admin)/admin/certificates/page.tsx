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
  StatCard,
  Tabs,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useAdmin, useData } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";

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

type ScoreFilter = "all" | "distinction" | "pass" | "fail";
type SortKey     = "student" | "course" | "score" | "issued";
type SortDir     = "asc" | "desc";

const PAGE_SIZE = 10;

function scoreBadge(s: number) {
  if (s >= 90) return { variant: "primary" as const, label: "Distinction" };
  if (s >= 60) return { variant: "success" as const, label: "Pass" };
  return { variant: "danger" as const, label: "Fail" };
}

function scoreBarColor(s: number) {
  if (s >= 90) return "from-[var(--primary)] to-[var(--accent)]";
  if (s >= 60) return "from-emerald-500 to-green-400";
  return "from-red-500 to-orange-400";
}

function exportCSV(rows: CertRow[]) {
  const header = ["Student", "Email", "Course", "Score %", "Issued Date", "Verify Code"];
  const data = rows.map((r) => [
    `"${r.studentName}"`, `"${r.studentEmail}"`,
    `"${r.courseTitle}"`, r.score,
    formatDate(r.issuedAt), `"${r.verifyCode}"`,
  ]);
  const csv = [header, ...data].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "certificates.csv"; a.click();
  URL.revokeObjectURL(url);
}

function downloadCertificate(cert: CertRow) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Certificate — ${cert.studentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f0fdf4; display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:'Inter',sans-serif; padding:40px; }
    .cert { background:#fff; border:2px solid #16a34a; border-radius:24px; max-width:760px; width:100%; padding:64px 72px; text-align:center; box-shadow:0 24px 64px rgba(22,163,74,.12); position:relative; overflow:hidden; }
    .cert::before { content:""; position:absolute; inset:8px; border:1px solid #bbf7d0; border-radius:18px; pointer-events:none; }
    .logo { font-size:28px; font-weight:800; color:#16a34a; letter-spacing:-0.5px; margin-bottom:4px; }
    .logo span { color:#4ade80; }
    .tagline { font-size:11px; color:#6b7280; letter-spacing:4px; text-transform:uppercase; margin-bottom:40px; }
    .badge { display:inline-flex; align-items:center; gap:6px; background:#dcfce7; color:#16a34a; font-size:11px; font-weight:600; padding:6px 16px; border-radius:999px; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:32px; }
    h1 { font-family:'Playfair Display',serif; font-size:42px; font-weight:700; color:#111827; line-height:1.1; margin-bottom:8px; }
    .subtitle { font-size:15px; color:#6b7280; margin-bottom:36px; }
    .name { font-family:'Playfair Display',serif; font-size:36px; color:#16a34a; font-weight:700; margin-bottom:8px; }
    .for { font-size:14px; color:#6b7280; margin-bottom:8px; }
    .course { font-size:22px; font-weight:700; color:#111827; margin-bottom:32px; }
    .score-wrap { display:flex; align-items:center; justify-content:center; gap:24px; margin-bottom:40px; }
    .score-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:16px; padding:16px 28px; }
    .score-val { font-size:36px; font-weight:800; color:#16a34a; line-height:1; }
    .score-lbl { font-size:11px; color:#6b7280; margin-top:4px; text-transform:uppercase; letter-spacing:1px; }
    .meta { display:flex; justify-content:space-between; border-top:1px solid #dcfce7; padding-top:24px; margin-top:8px; font-size:12px; color:#6b7280; }
    .meta strong { display:block; color:#111827; font-size:13px; font-weight:600; margin-bottom:2px; }
    .verify { margin-top:20px; font-size:11px; color:#9ca3af; }
    .verify code { font-family:monospace; background:#f3f4f6; padding:2px 8px; border-radius:6px; color:#374151; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="logo">Edu<span>Portal</span></div>
    <div class="tagline">Learn · Build · Grow</div>
    <div class="badge">⭐ Certificate of Completion</div>
    <h1>This certifies that</h1>
    <p class="subtitle">the following individual has successfully completed</p>
    <div class="name">${cert.studentName}</div>
    <p class="for">has successfully completed</p>
    <div class="course">${cert.courseTitle}</div>
    <div class="score-wrap">
      <div class="score-box">
        <div class="score-val">${cert.score}%</div>
        <div class="score-lbl">Final Score</div>
      </div>
    </div>
    <div class="meta">
      <div><strong>${formatDate(cert.issuedAt)}</strong>Date issued</div>
      <div><strong>${cert.verifyCode}</strong>Certificate ID</div>
      <div><strong>EduPortal</strong>Issued by</div>
    </div>
    <div class="verify">Verify at eduportal.app/verify · Code: <code>${cert.verifyCode}</code></div>
  </div>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `certificate-${cert.verifyCode}.html`; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminCertificatesPage() {
  const admin    = useAdmin();
  const { courses } = useData();
  const toast    = useToast();
  const students = admin.listStudents();

  const [certs,        setCerts]        = React.useState<CertRow[]>([]);
  const [loading,      setLoading]      = React.useState(true);
  const [query,        setQuery]        = React.useState("");
  const [scoreFilter,  setScoreFilter]  = React.useState<ScoreFilter>("all");
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [sortKey,      setSortKey]      = React.useState<SortKey>("issued");
  const [sortDir,      setSortDir]      = React.useState<SortDir>("desc");
  const [page,         setPage]         = React.useState(1);
  const [preview,      setPreview]      = React.useState<CertRow | null>(null);
  const [issueOpen,    setIssueOpen]    = React.useState(false);
  const [studentId,    setStudentId]    = React.useState("");
  const [courseId,     setCourseId]     = React.useState("");
  const [score,        setScore]        = React.useState("80");
  const [saving,       setSaving]       = React.useState(false);
  const [revoking,     setRevoking]     = React.useState<CertRow | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/certificates");
      const data = r.ok ? await r.json() : { certificates: [] };
      setCerts(data.certificates ?? []);
    } catch {
      toast.push({ title: "Couldn't load certificates", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  const courseOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    certs.forEach((c) => map.set(c.courseId, c.courseTitle));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [certs]);

  const stats = React.useMemo(() => {
    const avg         = certs.length ? Math.round(certs.reduce((s, c) => s + c.score, 0) / certs.length) : 0;
    const distinction = certs.filter((c) => c.score >= 90).length;
    const pass        = certs.filter((c) => c.score >= 60 && c.score < 90).length;
    const now         = new Date(); const thisMonth = certs.filter((c) => { const d = new Date(c.issuedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
    return { total: certs.length, avg, distinction, pass, thisMonth };
  }, [certs]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return certs
      .filter((c) => {
        if (scoreFilter === "distinction" && c.score < 90) return false;
        if (scoreFilter === "pass"        && (c.score < 60 || c.score >= 90)) return false;
        if (scoreFilter === "fail"        && c.score >= 60) return false;
        if (courseFilter !== "all"        && c.courseId !== courseFilter) return false;
        if (!q) return true;
        return (
          c.studentName.toLowerCase().includes(q)  ||
          c.studentEmail.toLowerCase().includes(q) ||
          c.courseTitle.toLowerCase().includes(q)  ||
          c.verifyCode.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "student") cmp = a.studentName.localeCompare(b.studentName);
        if (sortKey === "course")  cmp = a.courseTitle.localeCompare(b.courseTitle);
        if (sortKey === "score")   cmp = a.score - b.score;
        if (sortKey === "issued")  cmp = new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [certs, query, scoreFilter, courseFilter, sortKey, sortDir]);

  React.useEffect(() => { setPage(1); }, [query, scoreFilter, courseFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }
  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <Icon.ChevronDown size={11} className="opacity-30" />;
    return <Icon.ChevronDown size={11} className={cn("text-[var(--primary)]", sortDir === "asc" && "rotate-180")} />;
  }

  async function issue() {
    const n = Number(score);
    if (!studentId || !courseId) { toast.push({ title: "Select a student and course", tone: "danger" }); return; }
    if (!Number.isFinite(n) || n < 0 || n > 100) { toast.push({ title: "Score must be 0–100", tone: "danger" }); return; }
    setSaving(true);
    const r = await fetch("/api/admin/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: studentId, courseId, score: n }),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({})) as { error?: string };
      toast.push({ title: "Couldn't issue certificate", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Certificate issued", tone: "success" });
    setIssueOpen(false); setStudentId(""); setCourseId(""); setScore("80");
    load();
  }

  async function confirmRevoke() {
    if (!revoking) return;
    const r = await fetch(`/api/admin/certificates/${revoking.id}`, { method: "DELETE" });
    if (!r.ok) {
      const e = await r.json().catch(() => ({})) as { error?: string };
      toast.push({ title: "Couldn't revoke", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Certificate revoked", tone: "info" });
    setRevoking(null); load();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => toast.push({ title: "Code copied", tone: "success" })).catch(() => {});
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Certificates</h1>
          <p className="mt-1 text-[var(--muted)]">Every certificate issued across the platform — issue, preview, download or revoke.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { exportCSV(filtered); toast.push({ title: "CSV exported", tone: "success" }); }}>
            <Icon.Download size={15} /> Export CSV
          </Button>
          <Button onClick={() => setIssueOpen(true)}>
            <Icon.Plus size={16} /> Issue certificate
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total issued"  value={stats.total}       icon={<Icon.Award size={16} />}       tone="primary" delta="All time" />
        <StatCard label="This month"    value={stats.thisMonth}   icon={<Icon.Calendar size={16} />}    tone="accent"  delta="New certificates" />
        <StatCard label="Avg score"     value={stats.total ? `${stats.avg}%` : "—"} icon={<Icon.TrendingUp size={16} />} tone="success" delta="Across all certs" />
        <StatCard label="Distinction"   value={stats.distinction} icon={<Icon.Star size={16} />}        tone="warning" delta="Score ≥ 90%" />
        <StatCard label="Pass"          value={stats.pass}        icon={<Icon.CheckCircle size={16} />} tone="primary" delta="Score 60–89%" />
      </div>

      <Card>
        <CardBody className="space-y-4">
          {/* Filters — one row */}
          <div className="flex items-center gap-2">
            <Tabs
              value={scoreFilter}
              onChange={(v) => setScoreFilter(v as ScoreFilter)}
              options={[
                { value: "all",         label: "All",         count: certs.length },
                { value: "distinction", label: "Distinction", count: stats.distinction },
                { value: "pass",        label: "Pass",        count: stats.pass },
                { value: "fail",        label: "Fail",        count: certs.filter((c) => c.score < 60).length },
              ]}
            />
            <div className="flex gap-2 ml-auto shrink-0">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search student, course, code…"
                icon={<Icon.Search size={15} />}
                className="!h-9 !w-52"
              />
              <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="!h-9 !w-40 shrink-0">
                <option value="all">All courses</option>
                {courseOptions.map(([id, title]) => (
                  <option key={id} value={id}>{title.length > 28 ? title.slice(0, 26) + "…" : title}</option>
                ))}
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon.Loader size={22} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Award size={28} />}
              title={certs.length === 0 ? "No certificates issued yet" : "No matches"}
              description={certs.length === 0 ? "Issue a certificate to a student who has completed a course." : "Try a different search or filter."}
              action={certs.length === 0 && <Button onClick={() => setIssueOpen(true)}><Icon.Plus size={15} /> Issue certificate</Button>}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("student")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Student <SortIcon col="student" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("course")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Course <SortIcon col="course" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("score")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Score <SortIcon col="score" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                        <button onClick={() => toggleSort("issued")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Issued <SortIcon col="issued" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Verify code</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginated.map((c) => {
                      const sb = scoreBadge(c.score);
                      return (
                        <tr key={c.id} className="hover:bg-[var(--surface-2)]/60 transition-colors group">
                          {/* Student */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {c.studentName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{c.studentName}</p>
                                <p className="text-xs text-[var(--muted)] truncate">{c.studentEmail}</p>
                              </div>
                            </div>
                          </td>
                          {/* Course */}
                          <td className="px-4 py-3">
                            <p className="truncate max-w-[200px] font-medium" title={c.courseTitle}>{c.courseTitle}</p>
                          </td>
                          {/* Score */}
                          <td className="px-4 py-3">
                            <div className="space-y-1.5 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                  <div className={cn("h-full rounded-full bg-gradient-to-r", scoreBarColor(c.score))} style={{ width: `${c.score}%` }} />
                                </div>
                                <span className="text-xs font-bold tabular-nums w-9 text-right">{c.score}%</span>
                              </div>
                              <Badge variant={sb.variant} className="text-[10px]">{sb.label}</Badge>
                            </div>
                          </td>
                          {/* Issued */}
                          <td className="px-4 py-3 text-xs text-[var(--muted)] whitespace-nowrap hidden md:table-cell">
                            {formatDate(c.issuedAt)}
                          </td>
                          {/* Verify code */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs font-mono bg-[var(--surface-2)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                                {c.verifyCode}
                              </code>
                              <button
                                onClick={() => copyCode(c.verifyCode)}
                                className="p-1 rounded text-[var(--muted)] hover:text-[var(--primary)] transition opacity-0 group-hover:opacity-100"
                                title="Copy code"
                              >
                                <Icon.Copy size={13} />
                              </button>
                            </div>
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setPreview(c)}
                                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] transition opacity-0 group-hover:opacity-100"
                                title="Preview certificate"
                              >
                                <Icon.Eye size={14} />
                              </button>
                              <button
                                onClick={() => downloadCertificate(c)}
                                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] transition opacity-0 group-hover:opacity-100"
                                title="Download certificate"
                              >
                                <Icon.Download size={14} />
                              </button>
                              <button
                                onClick={() => setRevoking(c)}
                                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                                title="Revoke"
                              >
                                <Icon.Trash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                <p className="text-xs text-[var(--muted)]">
                  Showing <span className="font-semibold text-[var(--foreground)]">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                  <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> certificates
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(1)} title="First">
                    <Icon.ChevronLeft size={13} /><Icon.ChevronLeft size={13} className="-ml-2" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <Icon.ChevronLeft size={13} /> Prev
                  </Button>
                  <div className="flex items-center gap-1 mx-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, i, arr) => {
                        if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span key={`e-${i}`} className="px-1 text-[var(--muted)] text-sm">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            className={cn(
                              "h-8 w-8 rounded-lg text-xs font-semibold transition",
                              page === p ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                            )}
                          >{p}</button>
                        )
                      )}
                  </div>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <Icon.ChevronRight size={13} />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(totalPages)} title="Last">
                    <Icon.ChevronRight size={13} /><Icon.ChevronRight size={13} className="-ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Certificate preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} size="lg" title="Certificate preview">
        {preview && (
          <div className="p-5 space-y-4">
            {/* Mini certificate design */}
            <div className="rounded-2xl border-2 border-[var(--primary)]/40 bg-gradient-to-br from-[var(--primary-soft)] to-white dark:to-[var(--surface)] p-8 text-center relative overflow-hidden">
              <div className="absolute inset-[10px] border border-[var(--primary)]/20 rounded-xl pointer-events-none" />
              <div className="relative space-y-3">
                <p className="text-lg font-extrabold gradient-text">EduPortal</p>
                <p className="text-[10px] text-[var(--muted)] tracking-[4px] uppercase">Certificate of Completion</p>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mx-auto">
                  <Icon.Award size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">This certifies that</p>
                  <p className="text-2xl font-bold text-[var(--primary)] mt-1">{preview.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">has successfully completed</p>
                  <p className="text-base font-semibold mt-0.5">{preview.courseTitle}</p>
                </div>
                <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-[var(--surface)]/70 backdrop-blur rounded-xl px-5 py-3 border border-[var(--border)]">
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-[var(--primary)]">{preview.score}%</p>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Score</p>
                  </div>
                  <div className="w-px h-10 bg-[var(--border)]" />
                  <div className="text-center">
                    <p className="text-sm font-semibold">{formatDate(preview.issuedAt)}</p>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Issued</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted)]">
                  <code className="font-mono bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)]">{preview.verifyCode}</code>
                  <button onClick={() => copyCode(preview.verifyCode)} className="p-1 hover:text-[var(--primary)] transition" title="Copy">
                    <Icon.Copy size={12} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => copyCode(preview.verifyCode)}>
                <Icon.Copy size={14} /> Copy code
              </Button>
              <Button onClick={() => { downloadCertificate(preview); toast.push({ title: "Certificate downloaded", tone: "success" }); }}>
                <Icon.Download size={14} /> Download HTML
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Issue modal */}
      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} size="md" title="Issue certificate">
        <div className="p-5 space-y-4">
          <div>
            <Label>Student</Label>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Select a student…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.email}</option>)}
            </Select>
          </div>
          <div>
            <Label>Course</Label>
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Select a course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </div>
          <div>
            <Label>Score (0–100)</Label>
            <div className="space-y-2">
              <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} />
              {score && Number(score) >= 0 && Number(score) <= 100 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", scoreBarColor(Number(score)))} style={{ width: `${score}%` }} />
                  </div>
                  <Badge variant={scoreBadge(Number(score)).variant} className="text-[10px] shrink-0">
                    {scoreBadge(Number(score)).label}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" onClick={() => setIssueOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={issue} loading={saving} disabled={!studentId || !courseId}>
              <Icon.Award size={15} /> Issue certificate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke confirm */}
      <Modal open={!!revoking} onClose={() => setRevoking(null)} size="sm" title="Revoke certificate?">
        {revoking && (
          <div className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-sm space-y-1">
              <p><span className="text-[var(--muted)]">Student:</span> <span className="font-semibold">{revoking.studentName}</span></p>
              <p><span className="text-[var(--muted)]">Course:</span> <span className="font-semibold">{revoking.courseTitle}</span></p>
              <p><span className="text-[var(--muted)]">Code:</span> <code className="font-mono text-xs">{revoking.verifyCode}</code></p>
            </div>
            <p className="text-sm text-[var(--muted)]">The verification code will stop working immediately. This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRevoking(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmRevoke}><Icon.Trash size={14} /> Revoke</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
