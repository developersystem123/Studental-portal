"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  Textarea,
  useToast,
} from "@/components/ui";
import { useTeacher } from "@/lib/store";
import { formatDuration, formatHours } from "@/lib/utils";
import type { Chapter } from "@/lib/mockData";

type ChapterForm = {
  title: string;
  videoUrl: string;
  durationMinutes: string;
  durationSeconds: string;
};

function blank(): ChapterForm {
  return { title: "", videoUrl: "", durationMinutes: "", durationSeconds: "" };
}

export default function CourseBuilderPage() {
  const params = useParams<{ id: string }>();
  const teacher = useTeacher();
  const toast = useToast();

  const course = teacher.myCourses().find((c) => c.id === params.id);

  const [chapters, setChapters] = React.useState<Chapter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Chapter | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [movingId, setMovingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<ChapterForm>(blank());

  const load = React.useCallback(async () => {
    try {
      const r = await fetch(`/api/teacher/courses/${params.id}/chapters`);
      const data = r.ok ? await r.json() : { chapters: [] };
      setChapters(data.chapters ?? []);
    } catch {
      toast.push({ title: "Couldn't load chapters", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(blank());
    setFormOpen(true);
  }

  function openEdit(ch: Chapter) {
    setEditing(ch);
    const totalSecs = ch.duration || 0;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    setForm({
      title: ch.title,
      videoUrl: ch.videoUrl,
      durationMinutes: mins > 0 ? String(mins) : "",
      durationSeconds: secs > 0 ? String(secs) : "",
    });
    setFormOpen(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast.push({ title: "Title is required", tone: "danger" });
      return;
    }
    setSaving(true);
    const durationSecs =
      (Number(form.durationMinutes) || 0) * 60 + (Number(form.durationSeconds) || 0);
    const payload = {
      title: form.title.trim(),
      videoUrl: form.videoUrl.trim(),
      duration: durationSecs,
    };
    const url = editing
      ? `/api/teacher/courses/${params.id}/chapters/${editing.id}`
      : `/api/teacher/courses/${params.id}/chapters`;
    const r = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't save chapter", description: (e as { error?: string }).error, tone: "danger" });
      return;
    }
    toast.push({ title: editing ? "Chapter updated" : "Lesson added", tone: "success" });
    setFormOpen(false);
    load();
  }

  async function deleteChapter(id: string) {
    setDeletingId(id);
    const r = await fetch(`/api/teacher/courses/${params.id}/chapters/${id}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    if (r.ok) {
      toast.push({ title: "Lesson removed", tone: "info" });
      load();
    } else {
      toast.push({ title: "Couldn't delete lesson", tone: "danger" });
    }
  }

  async function move(ch: Chapter, dir: "up" | "down") {
    const idx = chapters.findIndex((c) => c.id === ch.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= chapters.length) return;
    const swap = chapters[swapIdx];
    setMovingId(ch.id);
    await Promise.all([
      fetch(`/api/teacher/courses/${params.id}/chapters/${ch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swapIdx }),
      }),
      fetch(`/api/teacher/courses/${params.id}/chapters/${swap.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: idx }),
      }),
    ]);
    setMovingId(null);
    load();
  }

  const totalSeconds = chapters.reduce((s, c) => s + (c.duration || 0), 0);
  const withVideo = chapters.filter((c) => c.videoUrl).length;

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 fade-in">
        <EmptyState
          icon={<Icon.Book size={24} />}
          title="Course not found"
          description="This course doesn't exist or you don't have access to it."
          action={
            <Link href="/teacher/courses">
              <Button variant="outline"><Icon.ArrowLeft size={14} /> Back to Courses</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/teacher/courses"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition mb-2"
          >
            <Icon.ArrowLeft size={13} /> My Courses
          </Link>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="mt-1 text-[var(--muted)] text-sm">
            Manage lessons, video content, and course structure.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icon.Plus size={16} /> Add Lesson
        </Button>
      </div>

      {/* Course info card */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total lessons",
            value: chapters.length,
            icon: <Icon.Book size={16} />,
            tint: "bg-[var(--primary-soft)] text-[var(--primary)]",
          },
          {
            label: "Total duration",
            value: totalSeconds > 0 ? formatHours(Math.round(totalSeconds / 60)) : "—",
            icon: <Icon.Clock size={16} />,
            tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
          },
          {
            label: "With video",
            value: `${withVideo} / ${chapters.length}`,
            icon: <Icon.Video size={16} />,
            tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          },
          {
            label: "Course level",
            value: course.level,
            icon: <Icon.TrendingUp size={16} />,
            tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-center gap-3 !py-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Chapter list */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Lessons</h2>
            {chapters.length > 0 && (
              <p className="text-xs text-[var(--muted)]">
                Drag or use arrows to reorder
              </p>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)] py-6 text-center">Loading…</p>
          ) : chapters.length === 0 ? (
            <EmptyState
              icon={<Icon.Book size={20} />}
              title="No lessons yet"
              description="Add your first lesson to start building the course content."
              action={
                <Button onClick={openCreate}>
                  <Icon.Plus size={14} /> Add Lesson
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {chapters.map((ch, idx) => (
                <li
                  key={ch.id}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--surface-2)]/40 transition"
                >
                  {/* Order badge */}
                  <div className="h-8 w-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0 text-sm font-bold text-[var(--muted)]">
                    {idx + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{ch.title}</p>
                      {ch.videoUrl ? (
                        <Badge variant="success">
                          <Icon.Video size={11} /> Video
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          <Icon.AlertCircle size={11} /> No video
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {ch.duration > 0 ? formatDuration(ch.duration) : "Duration not set"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => move(ch, "up")}
                      disabled={idx === 0 || movingId === ch.id}
                      title="Move up"
                    >
                      <Icon.ArrowUp size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => move(ch, "down")}
                      disabled={idx === chapters.length - 1 || movingId === ch.id}
                      title="Move down"
                    >
                      <Icon.ArrowUp size={14} className="rotate-180" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(ch)}>
                      <Icon.Edit size={14} /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteChapter(ch.id)}
                      loading={deletingId === ch.id}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Icon.Trash size={14} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Lesson" : "Add Lesson"}
        size="md"
      >
        <div className="p-5 space-y-4">
          <div>
            <Label>Lesson Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Introduction to React Hooks"
              maxLength={150}
              autoFocus
            />
          </div>

          <div>
            <Label>Video URL</Label>
            <Input
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://… (YouTube, Vimeo, or direct)"
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Paste a YouTube, Vimeo, or direct video link.
            </p>
          </div>

          <div>
            <Label>Duration</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={999}
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-[var(--muted)] mt-1 text-center">minutes</p>
              </div>
              <span className="text-[var(--muted)] pb-5">:</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={form.durationSeconds}
                  onChange={(e) => setForm({ ...form, durationSeconds: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-[var(--muted)] mt-1 text-center">seconds</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-2 border-t border-[var(--border)]">
            {editing ? (
              <Button
                variant="danger"
                onClick={() => {
                  setFormOpen(false);
                  deleteChapter(editing.id);
                }}
              >
                <Icon.Trash size={14} /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} loading={saving}>
                <Icon.Save size={14} /> {editing ? "Update" : "Add Lesson"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
