"use client";

import * as React from "react";
import Icon from "@/components/icons";
import { Badge, Card, CardBody, EmptyState } from "@/components/ui";
import { BarChart, Donut, LineChart, ProgressBar, Sparkline } from "@/components/charts";
import { useTeacher } from "@/lib/store";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

  const isEmpty = students.length === 0 && courses.length === 0;

  const enrolled = students.length;
  const completed = students.filter((s) => s.completed).length;
  const certified = students.filter((s) => s.certificateId).length;
  const inProgress = students.filter((s) => !s.completed && s.progress > 0).length;
  const completionRate = enrolled === 0 ? 0 : Math.round((completed / enrolled) * 100);

  const enrollTrend = monthBuckets(students.map((s) => s.enrolledAt), 6);
  const completionTrend = monthBuckets(students.filter((s) => s.completed).map((s) => s.enrolledAt), 6);

  const perCourse = courses.map((c) => {
    const list = students.filter((s) => s.courseId === c.id);
    const total = list.length;
    const done = list.filter((s) => s.completed).length;
    const avg = total === 0 ? 0 : Math.round(list.reduce((s, x) => s + x.progress, 0) / total);
    return {
      course: c,
      total,
      done,
      avg,
      completionRate: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  });

  const courseBars = perCourse.map((p) => ({
    label: p.course.title.length > 12 ? p.course.title.slice(0, 11) + "…" : p.course.title,
    value: p.total,
  }));

  // Progress distribution
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

  // Top performing courses
  const topCourses = [...perCourse].filter((p) => p.total > 0).sort((a, b) => b.completionRate - a.completionRate).slice(0, 5);

  const stats = [
    { label: "Total students", value: enrolled, icon: <Icon.Users size={18} />, series: enrollTrend.map((b) => b.hours) },
    { label: "Active learners", value: inProgress, icon: <Icon.PlayCircle size={18} />, series: enrollTrend.map((b) => Math.max(0, b.hours - 1)) },
    { label: "Completions", value: completed, icon: <Icon.CheckCircle size={18} />, series: completionTrend.map((b) => b.hours) },
    { label: "Certificates", value: certified, icon: <Icon.Award size={18} />, series: completionTrend.map((b) => b.hours) },
  ];

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardBody className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                      {s.icon}
                    </div>
                    <Sparkline data={s.series.length >= 2 ? s.series : [0, 0, 0, 0, 0, 0]} width={70} height={26} />
                  </div>
                  <p className="text-3xl font-bold">{s.value}</p>
                  <p className="text-xs text-[var(--muted)]">{s.label}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardBody>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h2 className="font-semibold">Enrollment trend</h2>
                    <p className="text-xs text-[var(--muted)]">Sign-ups over the last 6 months</p>
                  </div>
                  <Badge variant="primary"><Icon.TrendingUp size={12} /> 6 months</Badge>
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

          <div className="grid lg:grid-cols-2 gap-4">
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

          {topCourses.length > 0 && (
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Top performing courses</h2>
                  <span className="text-xs text-[var(--muted)]">By completion rate</span>
                </div>
                <ul className="space-y-3">
                  {topCourses.map((p) => (
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
