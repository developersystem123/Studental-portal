"use client";

import * as React from "react";
import Icon from "@/components/icons";
import { Badge, Card, CardBody, EmptyState } from "@/components/ui";
import { BarChart, Donut, LineChart, ProgressBar, RadialBars, Sparkline } from "@/components/charts";
import { useTeacher } from "@/lib/store";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RANGES = [3, 6, 12] as const;
type SortCol = "total" | "avg" | "rate" | "certs";

function monthBuckets(dates: string[], months = 6) {
  const now = new Date();
  const buckets: { day: string; hours: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ day: MONTHS[d.getMonth()], hours: 0 });
  }
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).getTime();
  for (const iso of dates) {
    const t = Date.parse(iso);
    if (Number.isNaN(t) || t < start) continue;
    const d = new Date(t);
    const idx = months - 1 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
    if (idx >= 0 && idx < months) buckets[idx].hours += 1;
  }
  return buckets;
}

export default function TeacherAnalyticsPage() {
  const teacher = useTeacher();
  const courses = teacher.myCourses();
  const students = teacher.myStudents();
  const [range, setRange] = React.useState<number>(6);
  const [sortCol, setSortCol] = React.useState<SortCol>("total");
  const [sortAsc, setSortAsc] = React.useState(false);

  const isEmpty = students.length === 0 && courses.length === 0;

  const enrolled = students.length;
  const completed = students.filter((s) => s.completed).length;
  const certified = students.filter((s) => s.certificateId).length;
  const inProgress = students.filter((s) => !s.completed && s.progress > 0).length;
  const neverStarted = students.filter((s) => s.progress === 0).length;
  const avgProgress = enrolled === 0 ? 0 : Math.round(students.reduce((sum, s) => sum + s.progress, 0) / enrolled);
  const completionRate = enrolled === 0 ? 0 : Math.round((completed / enrolled) * 100);

  const enrollTrend = monthBuckets(students.map((s) => s.enrolledAt), range);
  const completionTrend = monthBuckets(
    students.filter((s) => s.completed).map((s) => s.enrolledAt),
    range,
  );

  const perCourse = courses.map((c) => {
    const list = students.filter((s) => s.courseId === c.id);
    const total = list.length;
    const done = list.filter((s) => s.completed).length;
    const certs = list.filter((s) => s.certificateId).length;
    const avg = total === 0 ? 0 : Math.round(list.reduce((s, x) => s + x.progress, 0) / total);
    return {
      course: c,
      total,
      done,
      certs,
      avg,
      completionRate: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  });

  const courseBars = perCourse.map((p) => ({
    label: p.course.title.length > 12 ? p.course.title.slice(0, 11) + "…" : p.course.title,
    value: p.total,
  }));

  const buckets = [
    { label: "0–24%", value: 0 },
    { label: "25–49%", value: 0 },
    { label: "50–74%", value: 0 },
    { label: "75–99%", value: 0 },
    { label: "100%", value: 0 },
  ];
  for (const s of students) {
    if (s.progress >= 100) buckets[4].value++;
    else if (s.progress >= 75) buckets[3].value++;
    else if (s.progress >= 50) buckets[2].value++;
    else if (s.progress >= 25) buckets[1].value++;
    else buckets[0].value++;
  }

  const sortedCourses = [...perCourse].sort((a, b) => {
    const diff =
      sortCol === "total"
        ? b.total - a.total
        : sortCol === "avg"
          ? b.avg - a.avg
          : sortCol === "rate"
            ? b.completionRate - a.completionRate
            : b.certs - a.certs;
    return sortAsc ? -diff : diff;
  });

  const topCourse = [...perCourse].filter((p) => p.total > 0).sort((a, b) => b.completionRate - a.completionRate)[0];
  const mostPopular = [...perCourse].sort((a, b) => b.total - a.total)[0];
  const atRiskCount = perCourse.filter((p) => p.total >= 3 && p.completionRate < 30).length;
  const retentionRate = enrolled === 0 ? 0 : Math.round(((enrolled - neverStarted) / enrolled) * 100);

  const radialData = [...perCourse]
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4)
    .map((p, i) => ({
      label: p.course.title,
      value: p.completionRate,
      color: (["var(--primary)", "var(--accent)", "#34d399", "#60a5fa"] as const)[i] ?? "var(--primary)",
    }));

  const stats: { label: string; value: number; suffix: string; icon: React.ReactNode; series: number[] }[] = [
    {
      label: "Total students",
      value: enrolled,
      suffix: "",
      icon: <Icon.Users size={18} />,
      series: enrollTrend.map((b) => b.hours),
    },
    {
      label: "Active learners",
      value: inProgress,
      suffix: "",
      icon: <Icon.PlayCircle size={18} />,
      series: enrollTrend.map((b) => Math.max(0, b.hours - 1)),
    },
    {
      label: "Completions",
      value: completed,
      suffix: "",
      icon: <Icon.CheckCircle size={18} />,
      series: completionTrend.map((b) => b.hours),
    },
    {
      label: "Certificates",
      value: certified,
      suffix: "",
      icon: <Icon.Award size={18} />,
      series: completionTrend.map((b) => b.hours),
    },
    {
      label: "Avg progress",
      value: avgProgress,
      suffix: "%",
      icon: <Icon.BarChart3 size={18} />,
      series: enrollTrend.map((b) => b.hours),
    },
    {
      label: "Never started",
      value: neverStarted,
      suffix: "",
      icon: <Icon.Clock size={18} />,
      series: enrollTrend.map((b) => b.hours),
    },
  ];

  function handleSort(col: SortCol) {
    if (col === sortCol) setSortAsc((v) => !v);
    else {
      setSortCol(col);
      setSortAsc(false);
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Insights</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-[var(--muted)]">Track how your courses and students are doing over time.</p>
      </div>

      {isEmpty ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.BarChart3 size={20} />}
              title="No data yet"
              description="Once you have courses and students, you'll see trends and breakdowns here."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* 6 stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardBody className="space-y-2 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                      {s.icon}
                    </div>
                    <Sparkline data={s.series.length >= 2 ? s.series : [0, 0, 0, 0, 0]} width={44} height={20} />
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">
                    {s.value}
                    {s.suffix}
                  </p>
                  <p className="text-[10px] sm:text-xs text-[var(--muted)] leading-tight">{s.label}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Quick insights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topCourse && (
              <InsightCard
                icon={<Icon.Star size={15} />}
                label="Best completion rate"
                title={topCourse.course.title}
                value={`${topCourse.completionRate}% complete`}
                color="var(--primary)"
              />
            )}
            {mostPopular && mostPopular.total > 0 && (
              <InsightCard
                icon={<Icon.Users size={15} />}
                label="Most enrolled course"
                title={mostPopular.course.title}
                value={`${mostPopular.total} student${mostPopular.total !== 1 ? "s" : ""}`}
                color="var(--accent)"
              />
            )}
            <InsightCard
              icon={<Icon.TrendingUp size={15} />}
              label="Retention rate"
              title={`${retentionRate}% of students started`}
              value={
                atRiskCount > 0
                  ? `${atRiskCount} course${atRiskCount > 1 ? "s" : ""} at risk`
                  : "All courses on track"
              }
              color={atRiskCount > 0 ? "#f59e0b" : "#10b981"}
            />
          </div>

          {/* Enrollment trend with range selector + completion donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
            <Card className="col-span-1 lg:col-span-2">
              <CardBody>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h2 className="font-semibold">Enrollment trend</h2>
                    <p className="text-xs text-[var(--muted)]">Sign-ups over the last {range} months</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {RANGES.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={[
                          "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors",
                          range === r
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
                        ].join(" ")}
                      >
                        {r}M
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[220px] mt-3">
                  <LineChart data={enrollTrend} yFormatter={(v) => Math.round(v).toString()} />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <h2 className="font-semibold mb-1">Completion rate</h2>
                <p className="text-xs text-[var(--muted)]">Across your students</p>
                <div className="flex items-center justify-center py-4">
                  <Donut value={completionRate} size={160} label="finished" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Mini label="Done" value={completed} />
                  <Mini label="Active" value={inProgress} />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Bar charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
            <Card>
              <CardBody>
                <h2 className="font-semibold">Enrollments per course</h2>
                <p className="text-xs text-[var(--muted)]">Where students cluster</p>
                {courseBars.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] py-10 text-center">No data yet.</p>
                ) : (
                  <div className="h-[240px] mt-3">
                    <BarChart data={courseBars} height={240} />
                  </div>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <h2 className="font-semibold">Progress distribution</h2>
                <p className="text-xs text-[var(--muted)]">How far along everyone is</p>
                {students.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] py-10 text-center">No students yet.</p>
                ) : (
                  <div className="h-[240px] mt-3">
                    <BarChart data={buckets} height={240} />
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Course breakdown table + radial */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
            <Card className="col-span-1 lg:col-span-2">
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold">Course breakdown</h2>
                    <p className="text-xs text-[var(--muted)]">Click column headers to sort</p>
                  </div>
                </div>
                {sortedCourses.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] py-8 text-center">No courses yet.</p>
                ) : (
                  <>
                    {/* Mobile card list */}
                    <div className="sm:hidden space-y-2">
                      {sortedCourses.map((p) => (
                        <div key={p.course.id} className="p-3 rounded-xl bg-[var(--surface-2)] space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug flex-1 min-w-0">{p.course.title}</p>
                            <StatusBadge rate={p.completionRate} total={p.total} />
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                            <span><b className="text-[var(--foreground)]">{p.total}</b> students</span>
                            <span><b className="text-[var(--foreground)]">{p.avg}%</b> avg</span>
                            <span><b className="text-[var(--foreground)]">{p.completionRate}%</b> done</span>
                            <span><b className="text-[var(--foreground)]">{p.certs}</b> certs</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)]">
                            <th className="pb-2 text-left font-semibold text-[var(--muted)] text-xs tracking-wide">Course</th>
                            {([
                              { key: "total" as SortCol, label: "Students" },
                              { key: "avg" as SortCol, label: "Avg %" },
                              { key: "rate" as SortCol, label: "Completion" },
                              { key: "certs" as SortCol, label: "Certs" },
                            ] as const).map((col) => (
                              <th
                                key={col.key}
                                onClick={() => handleSort(col.key)}
                                className="pb-2 text-right font-semibold text-[var(--muted)] text-xs tracking-wide cursor-pointer hover:text-[var(--foreground)] select-none transition-colors"
                              >
                                {col.label}
                                {sortCol === col.key && (
                                  <span className="ml-1 text-[var(--primary)]">{sortAsc ? "↑" : "↓"}</span>
                                )}
                              </th>
                            ))}
                            <th className="pb-2 text-center font-semibold text-[var(--muted)] text-xs tracking-wide">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {sortedCourses.map((p) => (
                            <tr key={p.course.id} className="hover:bg-[var(--surface-2)] transition-colors">
                              <td className="py-3 pr-4 font-medium text-xs max-w-[180px] truncate">{p.course.title}</td>
                              <td className="py-3 text-right tabular-nums text-xs text-[var(--muted)]">{p.total}</td>
                              <td className="py-3 text-right tabular-nums text-xs text-[var(--muted)]">{p.avg}%</td>
                              <td className="py-3 text-right tabular-nums text-xs text-[var(--muted)]">{p.completionRate}%</td>
                              <td className="py-3 text-right tabular-nums text-xs text-[var(--muted)]">{p.certs}</td>
                              <td className="py-3 text-center"><StatusBadge rate={p.completionRate} total={p.total} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>

            {radialData.length > 0 && (
              <Card className="overflow-hidden">
                <CardBody>
                  <h2 className="font-semibold mb-1">Completion by course</h2>
                  <p className="text-xs text-[var(--muted)] mb-4">Top courses, completion %</p>
                  <div className="flex justify-center mb-5 px-4">
                    <RadialBars data={radialData} size={176} trackWidth={10} gap={5} />
                  </div>
                  <ul className="space-y-2">
                    {radialData.map((d) => (
                      <li key={d.label} className="flex items-center gap-2 text-xs min-w-0">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="truncate flex-1 text-[var(--muted)]">{d.label}</span>
                        <span className="shrink-0 font-semibold tabular-nums">{d.value}%</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Top performing courses */}
          {perCourse.filter((p) => p.total > 0).length > 0 && (
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Top performing courses</h2>
                  <span className="text-xs text-[var(--muted)]">By completion rate</span>
                </div>
                <ul className="space-y-3">
                  {[...perCourse]
                    .filter((p) => p.total > 0)
                    .sort((a, b) => b.completionRate - a.completionRate)
                    .slice(0, 5)
                    .map((p) => (
                      <li key={p.course.id}>
                        <ProgressBar
                          label={p.course.title}
                          value={p.completionRate}
                          hint={`${p.completionRate}% completion · ${p.done}/${p.total} learners`}
                        />
                      </li>
                    ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}

function InsightCard({
  icon,
  label,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
          >
            {icon}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">{label}</span>
        </div>
        <p className="font-semibold text-sm truncate">{title}</p>
        <p className="text-xs text-[var(--muted)] mt-0.5">{value}</p>
      </CardBody>
    </Card>
  );
}

function StatusBadge({ rate, total }: { rate: number; total: number }) {
  if (total === 0) return <span className="text-xs text-[var(--muted)]">—</span>;
  const [bg, fg, text] =
    rate >= 75
      ? ["rgba(16,185,129,0.15)", "#10b981", "Excellent"]
      : rate >= 50
        ? ["rgba(59,130,246,0.15)", "#3b82f6", "Good"]
        : rate >= 25
          ? ["rgba(245,158,11,0.15)", "#f59e0b", "Fair"]
          : ["rgba(239,68,68,0.15)", "#ef4444", "At risk"];
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: bg, color: fg }}
    >
      {text}
    </span>
  );
}
