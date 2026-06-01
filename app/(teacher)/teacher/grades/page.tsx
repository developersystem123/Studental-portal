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
  Label,
  Modal,
  Select,
  useToast,
} from "@/components/ui";
import { useTeacher } from "@/lib/store";

type Column = { id: string; courseId: string; label: string; weight: number; order: number };
type Entry = { columnId: string; studentId: string; score: number };

function letterGrade(total: number): string {
  if (total >= 90) return "A";
  if (total >= 80) return "B";
  if (total >= 70) return "C";
  if (total >= 60) return "D";
  return "F";
}

function gradeCellColor(score: number | null): string {
  if (score === null) return "";
  if (score >= 85) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  if (score >= 70) return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
  return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
}

export default function TeacherGradesPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const courses = teacher.myCourses();
  const students = teacher.myStudents();

  const [columns, setColumns] = React.useState<Column[]>([]);
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeCourseId, setActiveCourseId] = React.useState("");
  const [columnEditor, setColumnEditor] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/teacher/grades");
      const data = r.ok ? await r.json() : { columns: [], entries: [] };
      setColumns(data.columns ?? []);
      setEntries(data.entries ?? []);
    } catch {
      toast.push({ title: "Couldn't load gradebook", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!activeCourseId && courses.length > 0) setActiveCourseId(courses[0].id);
  }, [courses, activeCourseId]);

  const activeCols = React.useMemo(
    () => columns.filter((c) => c.courseId === activeCourseId),
    [columns, activeCourseId],
  );
  const studentsInCourse = students.filter((s) => s.courseId === activeCourseId);
  const activeCourse = courses.find((c) => c.id === activeCourseId);

  const scoreOf = React.useCallback(
    (columnId: string, studentId: string) =>
      entries.find((e) => e.columnId === columnId && e.studentId === studentId)?.score ?? null,
    [entries],
  );

  function weightedTotal(studentId: string): number {
    if (activeCols.length === 0) return 0;
    const totalWeight = activeCols.reduce((s, c) => s + (c.weight || 0), 0) || 1;
    let acc = 0;
    for (const col of activeCols) {
      const v = scoreOf(col.id, studentId);
      if (typeof v === "number") acc += (v * (col.weight || 0)) / totalWeight;
    }
    return Math.round(acc);
  }

  async function saveScore(columnId: string, studentId: string, score: number | null) {
    await fetch("/api/teacher/grades", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId, studentId, score }),
    });
    load();
  }

  function exportCsv() {
    if (activeCols.length === 0 || studentsInCourse.length === 0) {
      toast.push({ title: "Nothing to export", tone: "warning" });
      return;
    }
    const csv = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ["Student", "Email", ...activeCols.map((c) => c.label), "Total", "Grade"].join(",");
    const rows = studentsInCourse.map((s) => {
      const total = weightedTotal(s.userId);
      return [
        csv(s.userName),
        csv(s.userEmail),
        ...activeCols.map((c) => scoreOf(c.id, s.userId) ?? ""),
        total,
        letterGrade(total),
      ].join(",");
    });
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gradebook-${activeCourseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push({ title: "Exported CSV", tone: "success" });
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
          Teaching
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Gradebook</h1>
        <p className="mt-1 text-[var(--muted)]">
          Track student performance per course with weighted columns.
        </p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Label htmlFor="course-pick" className="mb-0">
                Course:
              </Label>
              <Select
                id="course-pick"
                value={activeCourseId}
                onChange={(e) => setActiveCourseId(e.target.value)}
                className="!h-9 !w-64"
              >
                {courses.length === 0 && <option value="">No courses</option>}
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setColumnEditor(true)}
                disabled={!activeCourseId}
              >
                <Icon.Edit size={14} /> Manage columns
              </Button>
              <Button variant="outline" onClick={exportCsv} disabled={!activeCourseId}>
                <Icon.Download size={14} /> Export CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : !activeCourseId ? (
            <EmptyState
              icon={<Icon.Book size={20} />}
              title="No courses yet"
              description="An admin needs to assign you a course before you can grade."
            />
          ) : studentsInCourse.length === 0 ? (
            <EmptyState
              icon={<Icon.User size={20} />}
              title="No students enrolled"
              description={`No one has enrolled in ${activeCourse?.title ?? "this course"} yet.`}
            />
          ) : activeCols.length === 0 ? (
            <EmptyState
              icon={<Icon.ListChecks size={20} />}
              title="Add a grade column first"
              description="Columns are weighted (e.g., Midterm 30%, Final 50%, HW 20%)."
              action={
                <Button onClick={() => setColumnEditor(true)}>
                  <Icon.Plus size={14} /> Add column
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="font-medium py-2.5 px-3 sticky left-0 bg-[var(--surface)]">
                      Student
                    </th>
                    {activeCols.map((c) => (
                      <th key={c.id} className="font-medium py-2.5 px-3 min-w-[100px]">
                        <p className="truncate max-w-[140px]">{c.label}</p>
                        <p className="text-[10px] text-[var(--muted-2)] mt-0.5 font-normal">
                          {c.weight}%
                        </p>
                      </th>
                    ))}
                    <th className="font-medium py-2.5 px-3">Total</th>
                    <th className="font-medium py-2.5 px-3">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsInCourse.map((s) => {
                    const total = weightedTotal(s.userId);
                    return (
                      <tr key={s.userId} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2 px-3 sticky left-0 bg-[var(--surface)]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold flex items-center justify-center text-xs">
                              {s.userName.slice(0, 1).toUpperCase()}
                            </div>
                            <span className="font-medium truncate max-w-[180px]">
                              {s.userName}
                            </span>
                          </div>
                        </td>
                        {activeCols.map((c) => (
                          <td key={c.id} className="py-2 px-3">
                            <GradeCell
                              initial={scoreOf(c.id, s.userId)}
                              onSave={(score) => saveScore(c.id, s.userId, score)}
                            />
                          </td>
                        ))}
                        <td className="py-2 px-3 font-semibold">{total}%</td>
                        <td className="py-2 px-3">
                          <Badge variant={total >= 60 ? "success" : "danger"}>
                            {letterGrade(total)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Class average row */}
                  {studentsInCourse.length > 0 && (() => {
                    const classAvg = Math.round(
                      studentsInCourse.reduce((sum, s) => sum + weightedTotal(s.userId), 0) / studentsInCourse.length
                    );
                    return (
                      <tr className="bg-[var(--surface-2)]/60 border-t-2 border-[var(--border)]">
                        <td className="py-2.5 px-3 sticky left-0 bg-[var(--surface-2)]/60">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">Class avg</span>
                        </td>
                        {activeCols.map((c) => {
                          const scores = studentsInCourse.map((s) => scoreOf(c.id, s.userId)).filter((v): v is number => v !== null);
                          const colAvg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                          return (
                            <td key={c.id} className="py-2.5 px-3">
                              {colAvg !== null ? (
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${gradeCellColor(colAvg)}`}>
                                  {colAvg}
                                </span>
                              ) : (
                                <span className="text-xs text-[var(--muted-2)]">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3">
                          <span className={`text-sm font-bold ${classAvg >= 80 ? "text-emerald-600 dark:text-emerald-400" : classAvg >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-500"}`}>
                            {classAvg}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={classAvg >= 60 ? "info" : "warning"}>
                            Avg {letterGrade(classAvg)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <ColumnEditor
        open={columnEditor}
        onClose={() => setColumnEditor(false)}
        courseId={activeCourseId}
        courseTitle={activeCourse?.title ?? ""}
        columns={activeCols}
        onChanged={load}
      />
    </div>
  );
}

// One grade input — keeps a local draft, saves to the server on blur.
function GradeCell({
  initial,
  onSave,
}: {
  initial: number | null;
  onSave: (score: number | null) => void;
}) {
  const [val, setVal] = React.useState(initial === null ? "" : String(initial));
  React.useEffect(() => {
    setVal(initial === null ? "" : String(initial));
  }, [initial]);

  const colorClass = gradeCellColor(initial);

  return (
    <input
      type="number"
      min={0}
      max={100}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        const next = val === "" ? null : Math.max(0, Math.min(100, Number(val)));
        const cur = initial;
        if (next !== cur) onSave(next);
      }}
      className={`w-16 h-8 rounded-md border px-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors ${colorClass || "bg-[var(--surface-2)] border-[var(--border)]"}`}
      placeholder="—"
    />
  );
}

function ColumnEditor({
  open,
  onClose,
  courseId,
  courseTitle,
  columns,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  columns: Column[];
  onChanged: () => void;
}) {
  const toast = useToast();

  async function addColumn() {
    await fetch("/api/teacher/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, label: `Item ${columns.length + 1}`, weight: 10 }),
    });
    onChanged();
  }
  async function updateColumn(id: string, patch: { label?: string; weight?: number }) {
    await fetch(`/api/teacher/grades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    onChanged();
  }
  async function removeColumn(id: string) {
    await fetch(`/api/teacher/grades/${id}`, { method: "DELETE" });
    onChanged();
  }

  const totalWeight = columns.reduce((s, c) => s + (c.weight || 0), 0);

  return (
    <Modal open={open} onClose={onClose} title="Grade columns" size="lg">
      <div className="p-5 space-y-3">
        <p className="text-sm text-[var(--muted)]">
          For <b>{courseTitle}</b>. Total weight should add up to 100%.
        </p>
        {columns.length === 0 ? (
          <p className="text-sm text-[var(--muted-2)] py-4 text-center">No columns yet.</p>
        ) : (
          <ul className="space-y-2">
            {columns.map((c) => (
              <ColumnRow
                key={c.id}
                column={c}
                onUpdate={(patch) => updateColumn(c.id, patch)}
                onRemove={() => removeColumn(c.id)}
              />
            ))}
          </ul>
        )}
        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" onClick={addColumn}>
            <Icon.Plus size={14} /> Add column
          </Button>
          <p className="text-xs text-[var(--muted-2)]">
            Total weight: <b className={totalWeight === 100 ? "text-emerald-500" : ""}>{totalWeight}%</b>
          </p>
        </div>
        <div className="flex justify-end pt-1 border-t border-[var(--border)]">
          <Button
            onClick={() => {
              toast.push({ title: "Columns saved", tone: "success" });
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ColumnRow({
  column,
  onUpdate,
  onRemove,
}: {
  column: Column;
  onUpdate: (patch: { label?: string; weight?: number }) => void;
  onRemove: () => void;
}) {
  const [label, setLabel] = React.useState(column.label);
  const [weight, setWeight] = React.useState(String(column.weight));

  React.useEffect(() => {
    setLabel(column.label);
    setWeight(String(column.weight));
  }, [column.label, column.weight]);

  return (
    <li className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => label !== column.label && onUpdate({ label })}
        className="!h-9"
      />
      <Input
        type="number"
        min={0}
        max={100}
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => Number(weight) !== column.weight && onUpdate({ weight: Number(weight) })}
        className="!h-9 !w-20"
      />
      <span className="text-xs text-[var(--muted)]">%</span>
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Icon.Trash size={14} />
      </Button>
    </li>
  );
}
