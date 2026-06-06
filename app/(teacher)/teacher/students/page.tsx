"use client";

import * as React from "react";
import Link from "next/link";
import Icon from "@/components/icons";
import { Badge, Button, Card, CardBody, EmptyState, Input, Select, Tabs, useToast } from "@/components/ui";
import { useTeacher } from "@/lib/store";
import { formatDate, relativeTime } from "@/lib/utils";

type Filter = "all" | "in-progress" | "completed" | "certified";
type SortKey = "name" | "progress" | "enrolled";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

// ─── Pagination component ─────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
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

// ─── Progress bar with colour coding ─────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  const color =
    value === 100
      ? "bg-emerald-500"
      : value >= 60
      ? "bg-[var(--primary)]"
      : value >= 25
      ? "bg-amber-500"
      : value > 0
      ? "bg-rose-500"
      : "bg-[var(--muted-2)]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-[var(--muted)] w-8 text-right tabular-nums">{value}%</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
}) {
  if (sortKey !== col) return <Icon.ArrowUp size={12} className="text-[var(--muted-2)] ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <Icon.ArrowUp size={12} className="text-[var(--primary)] ml-1" />
    : <Icon.ArrowUp size={12} className="text-[var(--primary)] ml-1 rotate-180" />;
}

export default function TeacherStudentsPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [courseFilter, setCourseFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("enrolled");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const rows = teacher.myStudents();

  const courseOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; title: string }[] = [];
    for (const s of rows) {
      if (!seen.has(s.courseId)) {
        seen.add(s.courseId);
        list.push({ id: s.courseId, title: s.courseTitle });
      }
    }
    return list;
  }, [rows]);

  function toggleSort(key: SortKey) {
    setPage(1);
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "progress" ? "desc" : "asc"); }
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = rows.filter((r) => {
      if (courseFilter !== "all" && r.courseId !== courseFilter) return false;
      if (filter === "in-progress" && (r.completed || r.progress === 0)) return false;
      if (filter === "completed" && !r.completed) return false;
      if (filter === "certified" && !r.certificateId) return false;
      if (!q) return true;
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q)
      );
    });
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.userName.localeCompare(b.userName);
      else if (sortKey === "progress") cmp = a.progress - b.progress;
      else cmp = new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [rows, query, filter, courseFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const counts = React.useMemo(
    () => ({
      all: rows.length,
      "in-progress": rows.filter((r) => !r.completed && r.progress > 0).length,
      completed: rows.filter((r) => r.completed).length,
      certified: rows.filter((r) => !!r.certificateId).length,
    }),
    [rows],
  );

  const uniqueStudents = React.useMemo(() => new Set(rows.map((r) => r.userId)).size, [rows]);
  const avgProgress = rows.length ? Math.round(rows.reduce((a, r) => a + r.progress, 0) / rows.length) : 0;

  function csvValue(value: string | number | boolean | null | undefined) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function triggerCsvDownload(filename: string, csvRows: string[][]) {
    const csv = `\uFEFF${csvRows.map((row) => row.map(csvValue).join(",")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function exportCsv() {
    const status = (r: (typeof filtered)[number]) =>
      r.certificateId ? "Certified" : r.completed ? "Completed" : r.progress > 0 ? "In progress" : "Not started";

    triggerCsvDownload(
      "my-students.csv",
      [
        ["Student", "Email", "Course", "Enrolled", "Progress", "Status"],
        ...filtered.map((r) => [
          r.userName,
          r.userEmail,
          r.courseTitle,
          formatDate(r.enrolledAt),
          `${r.progress}%`,
          status(r),
        ]),
      ],
    );

    toast.push({ title: "Exported CSV", tone: "success" });
  }

  const fromEntry = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toEntry = Math.min(safePage * pageSize, filtered.length);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Teaching</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">My Students</h1>
          <p className="mt-1 text-[var(--muted)]">Everyone enrolled in the courses you teach.</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Icon.Download size={16} /> Export CSV
        </Button>
      </div>

      {/* Stats summary */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Unique Students",
              value: uniqueStudents,
              sub: `${counts.all} enrollments`,
              icon: <Icon.Users size={16} />,
              tint: "bg-[var(--primary-soft)] text-[var(--primary)]",
            },
            {
              label: "In Progress",
              value: counts["in-progress"],
              sub: `${counts.all - counts["in-progress"] - counts.completed} not started`,
              icon: <Icon.PlayCircle size={16} />,
              tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
            },
            {
              label: "Completed",
              value: counts.completed,
              sub: `${counts.certified} certified`,
              icon: <Icon.CheckCircle size={16} />,
              tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Avg Progress",
              value: `${avgProgress}%`,
              sub: "across all enrollments",
              icon: <Icon.TrendingUp size={16} />,
              tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
            },
          ].map((s) => (
            <Card key={s.label} className="hover-lift">
              <CardBody className="flex items-center gap-3 !py-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[var(--muted)] font-medium">{s.label}</p>
                  <p className="text-xl font-bold tracking-tight leading-tight">{s.value}</p>
                  {s.sub && <p className="text-[10px] text-[var(--muted-2)]">{s.sub}</p>}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <Tabs
                value={filter}
                onChange={(v) => { setFilter(v as Filter); setPage(1); }}
                options={[
                  { value: "all", label: "All", count: counts.all },
                  { value: "in-progress", label: "In progress", count: counts["in-progress"] },
                  { value: "completed", label: "Completed", count: counts.completed },
                  { value: "certified", label: "Certified", count: counts.certified },
                ]}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                icon={<Icon.Search size={16} />}
                placeholder="Search student or course…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                className="flex-1"
              />
              {courseOptions.length > 1 && (
                <Select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }} className="!h-10 sm:!w-52">
                  <option value="all">All courses</option>
                  {courseOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </Select>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.User size={20} />}
              title={rows.length === 0 ? "No students yet." : "No matching students."}
              description={
                rows.length === 0
                  ? "When learners enroll in your courses, they'll appear here."
                  : "Try a different filter or clear your search."
              }
              action={
                (query || filter !== "all" || courseFilter !== "all") ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setQuery(""); setFilter("all"); setCourseFilter("all"); setPage(1); }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="font-medium py-2.5 px-3">
                        <button onClick={() => toggleSort("name")} className="inline-flex items-center hover:text-[var(--foreground)] transition">
                          Student <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                        </button>
                      </th>
                      <th className="font-medium py-2.5 px-3">Course</th>
                      <th className="font-medium py-2.5 px-3 hidden md:table-cell">
                        <button onClick={() => toggleSort("enrolled")} className="inline-flex items-center hover:text-[var(--foreground)] transition">
                          Enrolled <SortIcon col="enrolled" sortKey={sortKey} sortDir={sortDir} />
                        </button>
                      </th>
                      <th className="font-medium py-2.5 px-3">
                        <button onClick={() => toggleSort("progress")} className="inline-flex items-center hover:text-[var(--foreground)] transition">
                          Progress <SortIcon col="progress" sortKey={sortKey} sortDir={sortDir} />
                        </button>
                      </th>
                      <th className="font-medium py-2.5 px-3">Status</th>
                      <th className="font-medium py-2.5 px-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((r) => (
                      <tr
                        key={`${r.userId}-${r.courseId}`}
                        className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50 transition"
                      >
                        <td className="py-3 px-3">
                          <Link href={`/teacher/students/${r.userId}`} className="flex items-center gap-3 group/student">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold inline-flex items-center justify-center text-sm shrink-0">
                              {r.userName.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate group-hover/student:text-[var(--primary)] transition">{r.userName}</p>
                              <p className="text-xs text-[var(--muted)] truncate">{r.userEmail}</p>
                            </div>
                            <Icon.ChevronRight size={12} className="shrink-0 text-[var(--muted-2)] opacity-0 group-hover/student:opacity-100 transition" />
                          </Link>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <p className="font-medium truncate">{r.courseTitle}</p>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell text-[var(--muted)] whitespace-nowrap">
                          {relativeTime(r.enrolledAt)}
                        </td>
                        <td className="py-3 px-3 w-44">
                          <ProgressBar value={r.progress} />
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {r.certificateId ? (
                            <Badge variant="primary"><Icon.Award size={12} /> Certified</Badge>
                          ) : r.completed ? (
                            <Badge variant="success">Completed</Badge>
                          ) : r.progress > 0 ? (
                            <Badge variant="info">In progress</Badge>
                          ) : (
                            <Badge variant="default">Not started</Badge>
                          )}
                        </td>
                        {/* Quick action — visible on row hover */}
                        <td className="py-3 px-2">
                          <Link href={`/teacher/messages?student=${r.userId}`}>
                            <button
                              title="Message student"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-2)] hover:text-[var(--primary)] transition"
                            >
                              <Icon.MessageSquare size={14} />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span>
                    Showing <span className="font-semibold text-[var(--foreground)]">{fromEntry}–{toEntry}</span> of{" "}
                    <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> entries
                    {filtered.length !== rows.length && (
                      <span className="ml-1">(filtered from {rows.length})</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>Rows:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                      className="h-7 rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
