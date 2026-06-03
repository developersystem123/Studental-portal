"use client";

import * as React from "react";
import Link from "next/link";
import Icon from "@/components/icons";
import { Badge, Button, Card, CardBody, EmptyState, Input, Select, Tabs, useToast } from "@/components/ui";
import { useTeacher } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

type Filter = "all" | "in-progress" | "completed" | "certified";
type SortKey = "name" | "progress" | "enrolled";

export default function TeacherStudentsPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [courseFilter, setCourseFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("enrolled");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const rows = teacher.myStudents();
  const courses = teacher.myCourses();

  // Distinct courses from enrolled students
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

  const counts = React.useMemo(
    () => ({
      all: rows.length,
      "in-progress": rows.filter((r) => !r.completed && r.progress > 0).length,
      completed: rows.filter((r) => r.completed).length,
      certified: rows.filter((r) => !!r.certificateId).length,
    }),
    [rows],
  );

  const avgProgress = rows.length
    ? Math.round(rows.reduce((a, r) => a + r.progress, 0) / rows.length)
    : 0;

  function exportCsv() {
    const csv = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ["Student", "Email", "Course", "Enrolled", "Progress", "Status"].join(",");
    const lines = filtered.map((r) =>
      [
        csv(r.userName),
        csv(r.userEmail),
        csv(r.courseTitle),
        csv(new Date(r.enrolledAt).toLocaleDateString()),
        `${r.progress}%`,
        r.certificateId ? "Certified" : r.completed ? "Completed" : r.progress > 0 ? "In progress" : "Not started",
      ].join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-students.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.push({ title: "Exported CSV", tone: "success" });
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <Icon.ArrowUp size={12} className="text-[var(--muted-2)] ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <Icon.ArrowUp size={12} className="text-[var(--primary)] ml-1" />
      : <Icon.ArrowUp size={12} className="text-[var(--primary)] ml-1 rotate-180" />;
  }

  return (
    <div className="space-y-6 fade-in">
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
            { label: "Total enrolled", value: counts.all, icon: <Icon.Users size={16} />, tint: "bg-[var(--primary-soft)] text-[var(--primary)]" },
            { label: "In progress", value: counts["in-progress"], icon: <Icon.PlayCircle size={16} />, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
            { label: "Completed", value: counts.completed, icon: <Icon.CheckCircle size={16} />, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
            { label: "Avg progress", value: `${avgProgress}%`, icon: <Icon.TrendingUp size={16} />, tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody className="flex items-center gap-3 !py-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                  <p className="text-xl font-bold tracking-tight">{s.value}</p>
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
                onChange={(v) => setFilter(v as Filter)}
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
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              {courseOptions.length > 1 && (
                <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="!h-10 sm:!w-52">
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
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="font-medium py-2.5 px-3">
                      <button onClick={() => toggleSort("name")} className="inline-flex items-center hover:text-[var(--foreground)] transition">
                        Student <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="font-medium py-2.5 px-3">Course</th>
                    <th className="font-medium py-2.5 px-3 hidden md:table-cell">
                      <button onClick={() => toggleSort("enrolled")} className="inline-flex items-center hover:text-[var(--foreground)] transition">
                        Enrolled <SortIcon col="enrolled" />
                      </button>
                    </th>
                    <th className="font-medium py-2.5 px-3">
                      <button onClick={() => toggleSort("progress")} className="inline-flex items-center hover:text-[var(--foreground)] transition">
                        Progress <SortIcon col="progress" />
                      </button>
                    </th>
                    <th className="font-medium py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={`${r.userId}-${r.courseId}`} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50 transition">
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
                      <td className="py-3 px-3 hidden md:table-cell text-[var(--muted)]">
                        {relativeTime(r.enrolledAt)}
                      </td>
                      <td className="py-3 px-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                              style={{ width: `${r.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--muted)] w-8 text-right">{r.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
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
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-[var(--muted-2)] px-3 py-2 border-t border-[var(--border)]">
                Showing {filtered.length} of {rows.length} students
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
