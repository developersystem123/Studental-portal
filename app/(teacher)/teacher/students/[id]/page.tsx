"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/icons";
import { Avatar, Badge, Button, Card, CardBody, EmptyState } from "@/components/ui";
import { formatDate, relativeTime } from "@/lib/utils";

type QuizAttempt = {
  quizTitle: string;
  score: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
};

type Submission = {
  assignmentTitle: string;
  points: number;
  status: string;
  grade: number | null;
  feedback: string;
  submittedAt: string;
};

type EnrollmentDetail = {
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  progress: number;
  completed: boolean;
  certificateId: string | null;
  quizAttempts: QuizAttempt[];
  submissions: Submission[];
};

type StudentDetail = {
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    createdAt: string;
  };
  enrollments: EnrollmentDetail[];
};

function submissionVariant(status: string): "success" | "warning" | "info" | "danger" | "default" {
  if (status === "graded") return "success";
  if (status === "submitted") return "info";
  if (status === "late") return "warning";
  if (status === "pending") return "default";
  return "default";
}

export default function TeacherStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = React.useState<StudentDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetch(`/api/teacher/students/${params.id}`)
      .then((r) => r.json())
      .then((d: StudentDetail & { error?: string }) => {
        if (d.error) setError(d.error);
        else {
          setData(d);
          // Auto-expand the first enrollment
          if (d.enrollments?.[0]) setExpanded(new Set([d.enrollments[0].courseId]));
        }
      })
      .catch(() => setError("Failed to load student data."))
      .finally(() => setLoading(false));
  }, [params.id]);

  function toggleExpand(courseId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  const student = data?.student;
  const enrollments = data?.enrollments ?? [];

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
    : 0;

  const completedCount = enrollments.filter((e) => e.completed).length;

  const allAttempts = enrollments.flatMap((e) => e.quizAttempts);
  const avgQuizScore = allAttempts.length
    ? Math.round(allAttempts.reduce((s, a) => s + a.percentage, 0) / allAttempts.length)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-[var(--muted)] text-sm">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 fade-in">
        <EmptyState
          icon={<Icon.User size={24} />}
          title="Student not found"
          description={error}
          action={
            <Link href="/teacher/students">
              <Button variant="outline"><Icon.ArrowLeft size={14} /> Back to Students</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Back link */}
      <Link
        href="/teacher/students"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition"
      >
        <Icon.ArrowLeft size={13} /> My Students
      </Link>

      {/* Student header */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar name={student?.name ?? ""} size={64} />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{student?.name}</h1>
              <p className="text-[var(--muted)] text-sm mt-0.5">{student?.email}</p>
              <p className="text-xs text-[var(--muted-2)] mt-1">
                Joined {student?.createdAt ? formatDate(student.createdAt) : "—"}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/teacher/messages?student=${params.id}`}>
                <Button variant="outline" size="sm">
                  <Icon.MessageSquare size={14} /> Message
                </Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Enrolled courses",
            value: enrollments.length,
            icon: <Icon.Book size={16} />,
            tint: "bg-[var(--primary-soft)] text-[var(--primary)]",
          },
          {
            label: "Completed",
            value: completedCount,
            icon: <Icon.CheckCircle size={16} />,
            tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Avg progress",
            value: `${avgProgress}%`,
            icon: <Icon.TrendingUp size={16} />,
            tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
          },
          {
            label: "Quiz avg score",
            value: avgQuizScore !== null ? `${avgQuizScore}%` : "—",
            icon: <Icon.ListChecks size={16} />,
            tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-center gap-3 !py-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                <p className="text-xl font-bold tracking-tight">{s.value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Per-course detail */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Course Details</h2>

        {enrollments.length === 0 ? (
          <EmptyState
            icon={<Icon.Book size={20} />}
            title="No enrollments"
            description="This student has no enrollments in your courses."
          />
        ) : (
          enrollments.map((e) => {
            const open = expanded.has(e.courseId);
            return (
              <Card key={e.courseId}>
                {/* Course header row — click to expand */}
                <button
                  className="w-full text-left"
                  onClick={() => toggleExpand(e.courseId)}
                >
                  <CardBody className="!py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate">{e.courseTitle}</p>
                          {e.certificateId ? (
                            <Badge variant="primary"><Icon.Award size={11} /> Certified</Badge>
                          ) : e.completed ? (
                            <Badge variant="success">Completed</Badge>
                          ) : e.progress > 0 ? (
                            <Badge variant="info">In progress</Badge>
                          ) : (
                            <Badge variant="default">Not started</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden max-w-xs">
                            <div
                              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                              style={{ width: `${e.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--muted)] shrink-0">{e.progress}%</span>
                          <span className="text-xs text-[var(--muted-2)] hidden sm:block">
                            Enrolled {relativeTime(e.enrolledAt)}
                          </span>
                        </div>
                      </div>
                      <Icon.ChevronDown
                        size={16}
                        className={`shrink-0 text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CardBody>
                </button>

                {/* Expanded detail */}
                {open && (
                  <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 space-y-4">
                    {/* Quiz Attempts */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Icon.ListChecks size={14} className="text-[var(--primary)]" />
                        Quiz Attempts
                        <span className="text-xs font-normal text-[var(--muted)]">
                          ({e.quizAttempts.length})
                        </span>
                      </h3>
                      {e.quizAttempts.length === 0 ? (
                        <p className="text-sm text-[var(--muted)] pl-1">No quiz attempts yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                                <th className="py-2 px-2 font-medium">Quiz</th>
                                <th className="py-2 px-2 font-medium">Score</th>
                                <th className="py-2 px-2 font-medium">Result</th>
                                <th className="py-2 px-2 font-medium hidden sm:table-cell">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {e.quizAttempts.map((a, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-[var(--border)] last:border-0"
                                >
                                  <td className="py-2.5 px-2 font-medium max-w-[180px] truncate">
                                    {a.quizTitle}
                                  </td>
                                  <td className="py-2.5 px-2">
                                    <span className={`font-semibold ${a.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                      {a.percentage}%
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-2">
                                    <Badge variant={a.passed ? "success" : "danger"}>
                                      {a.passed ? "Passed" : "Failed"}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-2 text-[var(--muted)] hidden sm:table-cell">
                                    {relativeTime(a.completedAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Assignment Submissions */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Icon.FilePen size={14} className="text-[var(--primary)]" />
                        Assignments
                        <span className="text-xs font-normal text-[var(--muted)]">
                          ({e.submissions.length})
                        </span>
                      </h3>
                      {e.submissions.length === 0 ? (
                        <p className="text-sm text-[var(--muted)] pl-1">No submissions yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                                <th className="py-2 px-2 font-medium">Assignment</th>
                                <th className="py-2 px-2 font-medium">Status</th>
                                <th className="py-2 px-2 font-medium">Grade</th>
                                <th className="py-2 px-2 font-medium hidden sm:table-cell">Submitted</th>
                              </tr>
                            </thead>
                            <tbody>
                              {e.submissions.map((s, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-[var(--border)] last:border-0"
                                >
                                  <td className="py-2.5 px-2 font-medium max-w-[180px] truncate">
                                    {s.assignmentTitle}
                                  </td>
                                  <td className="py-2.5 px-2">
                                    <Badge variant={submissionVariant(s.status)}>
                                      {s.status}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-2">
                                    {s.grade !== null ? (
                                      <span className="font-semibold">
                                        {s.grade}/{s.points}
                                      </span>
                                    ) : (
                                      <span className="text-[var(--muted)]">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-2 text-[var(--muted)] hidden sm:table-cell">
                                    {relativeTime(s.submittedAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
