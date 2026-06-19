"use client";

import * as React from "react";
import Icon from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  Select,
  StatCard,
  useToast,
} from "@/components/ui";
import { useAdmin, type EnrollmentRow } from "@/lib/store";
import { relativeTime, cn } from "@/lib/utils";

type Filter   = "all" | "in-progress" | "completed" | "certified";
type SortKey  = "student" | "course" | "enrolled" | "progress";
type SortDir  = "asc" | "desc";

const PAGE_SIZE = 10;

function exportCSV(rows: EnrollmentRow[]) {
  const header = ["Student", "Email", "Course", "Instructor", "Enrolled At", "Progress %", "Completed", "Certified"];
  const data = rows.map((r) => [
    `"${r.userName}"`, `"${r.userEmail}"`,
    `"${r.courseTitle}"`, `"${r.instructor}"`,
    new Date(r.enrolledAt).toLocaleDateString(),
    r.progress,
    r.completed ? "Yes" : "No",
    r.certificateId ? "Yes" : "No",
  ]);
  const csv = [header, ...data].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "enrollments.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminEnrollmentsPage() {
  const admin = useAdmin();
  const toast = useToast();

  const [tick,      setTick]      = React.useState(0);
  const [query,     setQuery]     = React.useState("");
  const [filter,    setFilter]    = React.useState<Filter>("all");
  const [courseQ,   setCourseQ]   = React.useState("all");
  const [sortKey,   setSortKey]   = React.useState<SortKey>("enrolled");
  const [sortDir,   setSortDir]   = React.useState<SortDir>("desc");
  const [page,      setPage]      = React.useState(1);
  const [awardRow,  setAwardRow]  = React.useState<EnrollmentRow | null>(null);
  const [revokeRow, setRevokeRow] = React.useState<EnrollmentRow | null>(null);
  const [score,     setScore]     = React.useState("90");

  const rows = React.useMemo(() => admin.listEnrollments(), [admin, tick]);
  function refresh() { setTick((t) => t + 1); }

  // Unique course list for filter
  const courseOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.courseId, r.courseTitle));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const counts = React.useMemo(() => ({
    all:          rows.length,
    "in-progress":rows.filter((r) => !r.completed && r.progress > 0).length,
    completed:    rows.filter((r) => r.completed).length,
    certified:    rows.filter((r) => !!r.certificateId).length,
    avgProgress:  rows.length ? Math.round(rows.reduce((s, r) => s + r.progress, 0) / rows.length) : 0,
  }), [rows]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === "in-progress" && (r.completed || r.progress === 0)) return false;
        if (filter === "completed"   && !r.completed)                       return false;
        if (filter === "certified"   && !r.certificateId)                   return false;
        if (courseQ !== "all"        && r.courseId !== courseQ)             return false;
        if (!q) return true;
        return (
          r.userName.toLowerCase().includes(q)    ||
          r.userEmail.toLowerCase().includes(q)   ||
          r.courseTitle.toLowerCase().includes(q) ||
          r.instructor.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "student")  cmp = a.userName.localeCompare(b.userName);
        if (sortKey === "course")   cmp = a.courseTitle.localeCompare(b.courseTitle);
        if (sortKey === "progress") cmp = a.progress - b.progress;
        if (sortKey === "enrolled") cmp = new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime();
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [rows, query, filter, courseQ, sortKey, sortDir]);

  // Reset page when filter/search changes
  React.useEffect(() => { setPage(1); }, [query, filter, courseQ, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <Icon.ChevronDown size={12} className="opacity-30" />;
    return sortDir === "asc"
      ? <Icon.ChevronDown size={12} className="text-[var(--primary)] rotate-180" />
      : <Icon.ChevronDown size={12} className="text-[var(--primary)]" />;
  }

  function handleAward() {
    if (!awardRow) return;
    const s = Number(score);
    if (!Number.isFinite(s) || s < 0 || s > 100) {
      toast.push({ title: "Invalid score", description: "Score must be 0–100.", tone: "danger" });
      return;
    }
    admin.awardCertificateFor(awardRow.userId, awardRow.courseId, s);
    toast.push({ title: "Certificate awarded", tone: "success" });
    setAwardRow(null);
    refresh();
  }

  function handleRevoke() {
    if (!revokeRow || !revokeRow.certificateId) return;
    admin.revokeCertificate(revokeRow.userId, revokeRow.certificateId);
    toast.push({ title: "Certificate revoked", tone: "success" });
    setRevokeRow(null);
    refresh();
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Enrollments</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">See who&apos;s taking what, award certificates, revoke when needed.</p>
        </div>
        <Button variant="outline" onClick={() => { exportCSV(filtered); toast.push({ title: "CSV exported", tone: "success" }); }}>
          <Icon.Download size={15} /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total"        value={counts.all}          icon={<Icon.ListChecks size={16} />} tone="primary" delta="All enrollments" />
        <StatCard label="In progress"  value={counts["in-progress"]} icon={<Icon.PlayCircle size={16} />} tone="accent"  delta="Currently active" />
        <StatCard label="Completed"    value={counts.completed}    icon={<Icon.CheckCircle size={16} />} tone="success" delta="Finished course" />
        <StatCard label="Certified"    value={counts.certified}    icon={<Icon.Award size={16} />}      tone="warning" delta="Certificate issued" />
        <StatCard label="Avg progress" value={`${counts.avgProgress}%`} icon={<Icon.TrendingUp size={16} />} tone="primary" delta="Across all enrollments" />
      </div>

      <Card>
        <CardBody className="space-y-4">
          {/* Filters row */}
          <div className="flex flex-col gap-3">
            {/* Scrollable tab bar */}
            <div className="overflow-x-auto pb-1">
              <div className="flex p-1 rounded-xl bg-[var(--surface-2)] gap-1 w-max min-w-full">
                {([
                  { value: "all",         label: "All",         count: counts.all },
                  { value: "in-progress", label: "In progress", count: counts["in-progress"] },
                  { value: "completed",   label: "Completed",   count: counts.completed },
                  { value: "certified",   label: "Certified",   count: counts.certified },
                ] as { value: Filter; label: string; count: number }[]).map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setFilter(o.value)}
                    className={`px-3 h-9 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                      filter === o.value
                        ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {o.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      filter === o.value
                        ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "bg-[var(--surface-2)]"
                    }`}>
                      {o.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search + course filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                icon={<Icon.Search size={15} />}
                placeholder="Search student or course…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="!h-9 flex-1"
              />
              <Select
                value={courseQ}
                onChange={(e) => setCourseQ(e.target.value)}
                className="!h-9 w-full sm:!w-40"
              >
                <option value="all">All courses</option>
                {courseOptions.map(([id, title]) => (
                  <option key={id} value={id}>{title.length > 28 ? title.slice(0, 26) + "…" : title}</option>
                ))}
              </Select>
            </div>

            {/* Active filter chips */}
            {(query.trim() || courseQ !== "all") && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[var(--muted)]">Filters:</span>
                {query.trim() && (
                  <button onClick={() => setQuery("")} className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-semibold hover:brightness-95">
                    &ldquo;{query.trim()}&rdquo; <Icon.X size={10} />
                  </button>
                )}
                {courseQ !== "all" && (
                  <button onClick={() => setCourseQ("all")} className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-semibold hover:brightness-95">
                    {courseOptions.find(([id]) => id === courseQ)?.[1]?.slice(0, 20) ?? "Course"} <Icon.X size={10} />
                  </button>
                )}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.ListChecks size={20} />}
              title="No matching enrollments."
              description="Try a different filter or clear your search."
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-[var(--border)] bg-[var(--surface-2)]">
                      <th className="py-3 px-4 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider">
                        <button onClick={() => toggleSort("student")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Student <SortIcon col="student" />
                        </button>
                      </th>
                      <th className="py-3 px-4 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider">
                        <button onClick={() => toggleSort("course")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Course <SortIcon col="course" />
                        </button>
                      </th>
                      <th className="py-3 px-4 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider hidden lg:table-cell">Instructor</th>
                      <th className="py-3 px-4 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider hidden md:table-cell">
                        <button onClick={() => toggleSort("enrolled")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Enrolled <SortIcon col="enrolled" />
                        </button>
                      </th>
                      <th className="py-3 px-4 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider">
                        <button onClick={() => toggleSort("progress")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Progress <SortIcon col="progress" />
                        </button>
                      </th>
                      <th className="py-3 px-4 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginated.map((r) => (
                      <tr key={`${r.userId}-${r.courseId}`} className="hover:bg-[var(--surface-2)]/60 transition-colors group">
                        {/* Student */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {r.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{r.userName}</p>
                              <p className="text-xs text-[var(--muted)] truncate">{r.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        {/* Course */}
                        <td className="py-3 px-4 max-w-[200px]">
                          <p className="font-medium truncate" title={r.courseTitle}>{r.courseTitle}</p>
                        </td>
                        {/* Instructor */}
                        <td className="py-3 px-4 text-[var(--muted)] text-xs hidden lg:table-cell">{r.instructor}</td>
                        {/* Enrolled */}
                        <td className="py-3 px-4 text-[var(--muted)] text-xs hidden md:table-cell whitespace-nowrap">
                          {relativeTime(r.enrolledAt)}
                        </td>
                        {/* Progress */}
                        <td className="py-3 px-4 w-44">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    r.progress === 100 ? "bg-emerald-500" :
                                    r.progress >= 50  ? "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" :
                                    r.progress > 0    ? "bg-gradient-to-r from-sky-500 to-[var(--primary)]" :
                                    "bg-[var(--border)]"
                                  )}
                                  style={{ width: `${Math.max(r.progress, 2)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium tabular-nums w-9 text-right">{r.progress}%</span>
                            </div>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="py-3 px-4">
                          {r.certificateId ? (
                            <Badge variant="primary"><Icon.Award size={11} /> Certified</Badge>
                          ) : r.completed ? (
                            <Badge variant="success"><Icon.CheckCircle size={11} /> Completed</Badge>
                          ) : r.progress > 0 ? (
                            <Badge variant="info"><Icon.PlayCircle size={11} /> In progress</Badge>
                          ) : (
                            <Badge variant="default">Not started</Badge>
                          )}
                        </td>
                        {/* Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {r.certificateId ? (
                            <Button size="sm" variant="ghost" onClick={() => setRevokeRow(r)}
                              className="text-[var(--danger)] hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition">
                              <Icon.Trash size={13} /> Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant={r.completed ? "outline" : "ghost"}
                              disabled={!r.completed}
                              onClick={() => { setScore("90"); setAwardRow(r); }}
                              title={r.completed ? "Award certificate" : "Available once student completes the course"}
                              className={cn(!r.completed && "opacity-30", r.completed && "opacity-0 group-hover:opacity-100 transition")}
                            >
                              <Icon.Award size={13} /> Award
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <p className="text-xs text-[var(--muted)]">
                  Showing <span className="font-semibold text-[var(--foreground)]">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                  <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> enrollments
                </p>
                <div className="flex items-center justify-center sm:justify-end gap-1 flex-wrap">
                  <span className="hidden sm:contents">
                    <Button
                      size="sm" variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(1)}
                      title="First page"
                    >
                      <Icon.ChevronLeft size={14} /><Icon.ChevronLeft size={14} className="-ml-2" />
                    </Button>
                  </span>
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <Icon.ChevronLeft size={14} /> Prev
                  </Button>

                  {/* Page number chips */}
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
                          <span key={`ellipsis-${i}`} className="px-1 text-[var(--muted)] text-sm">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            className={cn(
                              "h-8 w-8 rounded-lg text-xs font-semibold transition",
                              page === p
                                ? "bg-[var(--primary)] text-white"
                                : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                            )}
                          >
                            {p}
                          </button>
                        )
                      )}
                  </div>

                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <Icon.ChevronRight size={14} />
                  </Button>
                  <span className="hidden sm:contents">
                    <Button
                      size="sm" variant="outline"
                      disabled={page === totalPages}
                      onClick={() => setPage(totalPages)}
                      title="Last page"
                    >
                      <Icon.ChevronRight size={14} /><Icon.ChevronRight size={14} className="-ml-2" />
                    </Button>
                  </span>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Award modal */}
      <Modal open={awardRow !== null} onClose={() => setAwardRow(null)} title="Award certificate" size="sm">
        {awardRow && (
          <div className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-[var(--surface-2)] space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Student</span>
                <span className="font-semibold">{awardRow.userName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Course</span>
                <span className="font-semibold truncate ml-4 max-w-[200px] text-right">{awardRow.courseTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Progress</span>
                <span className="font-semibold text-[var(--primary)]">{awardRow.progress}%</span>
              </div>
            </div>
            <div>
              <label htmlFor="score" className="text-sm font-medium mb-1.5 block">
                Score <span className="text-[var(--muted)] font-normal">(0–100)</span>
              </label>
              <Input id="score" type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setAwardRow(null)}>Cancel</Button>
              <Button onClick={handleAward}><Icon.Award size={15} /> Award certificate</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revoke modal */}
      <Modal open={revokeRow !== null} onClose={() => setRevokeRow(null)} title="Revoke certificate?">
        <div className="p-5 space-y-4">
          {revokeRow && (
            <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-sm space-y-1">
              <p><span className="text-[var(--muted)]">Student:</span> <span className="font-semibold">{revokeRow.userName}</span></p>
              <p><span className="text-[var(--muted)]">Course:</span> <span className="font-semibold">{revokeRow.courseTitle}</span></p>
            </div>
          )}
          <p className="text-sm text-[var(--muted)]">
            This permanently deletes the certificate from the student&apos;s record. They can be re-awarded later.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRevokeRow(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRevoke}><Icon.Trash size={14} /> Revoke</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
