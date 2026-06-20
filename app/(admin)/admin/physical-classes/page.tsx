"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Checkbox,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useAdmin, useData } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";
import {
  BATCH_OPTIONS,
  CAMPUSES,
  DAYS_OF_WEEK,
  PHYSICAL_CLASS_STATUSES,
  type PhysicalClass,
  type PhysicalClassStatus,
} from "@/lib/mockData";

const STATUS_BADGE: Record<PhysicalClassStatus, "info" | "success" | "default" | "danger"> = {
  upcoming: "info",
  ongoing: "success",
  completed: "default",
  cancelled: "danger",
};

type Filter = "all" | PhysicalClassStatus;

type FormState = {
  courseId: string;
  instructorId: string;
  title: string;
  campus: string;
  room: string;
  batch: string;
  capacity: string;
  startDate: string;
  endDate: string;
  daysOfWeek: string[];
  status: PhysicalClassStatus;
  notes: string;
};

const emptyForm: FormState = {
  courseId: "",
  instructorId: "",
  title: "",
  campus: CAMPUSES[0],
  room: "",
  batch: BATCH_OPTIONS[0],
  capacity: "30",
  startDate: "",
  endDate: "",
  daysOfWeek: ["Mon", "Wed", "Fri"],
  status: "upcoming",
  notes: "",
};

export default function AdminPhysicalClassesPage() {
  const { courses } = useData();
  const admin = useAdmin();
  const toast = useToast();
  const teachers = admin.listTeachers();

  const [classes, setClasses] = React.useState<PhysicalClass[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PhysicalClass | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<PhysicalClass | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/physical-classes");
      const data = r.ok ? await r.json() : { classes: [] };
      setClasses(data.classes ?? []);
    } catch {
      toast.push({ title: "Couldn't load classes", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const counts = React.useMemo(
    () => ({
      all: classes.length,
      upcoming: classes.filter((c) => c.status === "upcoming").length,
      ongoing: classes.filter((c) => c.status === "ongoing").length,
      completed: classes.filter((c) => c.status === "completed").length,
      cancelled: classes.filter((c) => c.status === "cancelled").length,
    }),
    [classes],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return classes.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.courseTitle.toLowerCase().includes(q) ||
        c.instructorName.toLowerCase().includes(q) ||
        c.campus.toLowerCase().includes(q)
      );
    });
  }, [classes, filter, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(c: PhysicalClass) {
    setEditing(c);
    setForm({
      courseId: c.courseId,
      instructorId: c.instructorId,
      title: c.title,
      campus: c.campus,
      room: c.room,
      batch: c.batch,
      capacity: String(c.capacity),
      startDate: c.startDate.slice(0, 10),
      endDate: c.endDate.slice(0, 10),
      daysOfWeek: c.daysOfWeek,
      status: c.status,
      notes: c.notes ?? "",
    });
    setFormOpen(true);
  }

  function toggleDay(day: string) {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day],
    }));
  }

  async function submit() {
    setSaving(true);
    const payload = {
      courseId: form.courseId,
      instructorId: form.instructorId,
      title: form.title,
      campus: form.campus,
      room: form.room,
      batch: form.batch,
      capacity: Number(form.capacity),
      startDate: form.startDate,
      endDate: form.endDate,
      daysOfWeek: form.daysOfWeek,
      status: form.status,
      notes: form.notes,
    };
    const url = editing
      ? `/api/admin/physical-classes/${editing.id}`
      : "/api/admin/physical-classes";
    const r = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't save batch", description: e.error, tone: "danger" });
      return;
    }
    toast.push({
      title: editing ? "Batch updated" : "Batch created",
      tone: "success",
    });
    setFormOpen(false);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const r = await fetch(`/api/admin/physical-classes/${deleting.id}`, { method: "DELETE" });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't delete batch", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Batch deleted", tone: "info" });
    setDeleting(null);
    load();
  }

  const formValid =
    form.courseId &&
    form.instructorId &&
    form.title.trim().length >= 3 &&
    form.room.trim() &&
    form.startDate &&
    form.endDate &&
    form.daysOfWeek.length > 0 &&
    Number(form.capacity) >= 1;

  const classStats = React.useMemo(() => ({
    total: classes.length,
    ongoing: classes.filter((c) => c.status === "ongoing").length,
    upcoming: classes.filter((c) => c.status === "upcoming").length,
    totalEnrolled: classes.reduce((s, c) => s + c.enrolledCount, 0),
  }), [classes]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Physical Classes</h1>
          <p className="mt-1 text-[var(--muted)]">
            Create and manage in-person class batches, then place approved students into them.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icon.Plus size={16} /> New batch
        </Button>
      </div>

      {classes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total batches", value: classStats.total, icon: <Icon.Calendar size={16} />, tint: "bg-[var(--primary-soft)] text-[var(--primary)]" },
            { label: "Ongoing", value: classStats.ongoing, icon: <Icon.PlayCircle size={16} />, tint: classStats.ongoing > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-[var(--surface-2)] text-[var(--muted)]" },
            { label: "Upcoming", value: classStats.upcoming, icon: <Icon.Clock size={16} />, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
            { label: "Total enrolled", value: classStats.totalEnrolled, icon: <Icon.Users size={16} />, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="-mx-1 px-1 overflow-x-auto min-w-0">
          <Tabs
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "upcoming", label: "Upcoming", count: counts.upcoming },
              { value: "ongoing", label: "Ongoing", count: counts.ongoing },
              { value: "completed", label: "Completed", count: counts.completed },
              { value: "cancelled", label: "Cancelled", count: counts.cancelled },
            ]}
          />
        </div>
        <div className="md:w-80">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by batch, course, instructor, campus…"
            icon={<Icon.Search size={16} />}
          />
        </div>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          </CardBody>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Calendar size={28} />}
              title={classes.length === 0 ? "No physical classes yet" : "No matching batches"}
              description={
                classes.length === 0
                  ? "Create your first in-person batch to start placing approved students."
                  : "Try a different filter or search term."
              }
              action={
                classes.length === 0 ? (
                  <Button onClick={openCreate}>
                    <Icon.Plus size={16} /> New batch
                  </Button>
                ) : undefined
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                <tr>
                  <Th>Batch</Th>
                  <Th className="hidden md:table-cell">Instructor</Th>
                  <Th className="hidden lg:table-cell">Campus / Room</Th>
                  <Th className="hidden lg:table-cell">Schedule</Th>
                  <Th className="hidden sm:table-cell">Seats</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const full = c.enrolledCount >= c.capacity;
                  return (
                    <tr
                      key={c.id}
                      className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/50"
                    >
                      <Td>
                        <div className="font-medium truncate max-w-[24ch]">{c.title}</div>
                        <div className="text-xs text-[var(--muted)] truncate max-w-[22ch]">
                          {c.courseTitle}
                        </div>
                        <div className="text-xs text-[var(--muted)] md:hidden truncate max-w-[24ch]">
                          {c.instructorName}
                        </div>
                      </Td>
                      <Td className="hidden md:table-cell">{c.instructorName}</Td>
                      <Td className="hidden lg:table-cell">
                        <div>{c.campus}</div>
                        <div className="text-xs text-[var(--muted)]">Room {c.room}</div>
                      </Td>
                      <Td className="hidden lg:table-cell">
                        <div className="text-xs">{c.batch}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {c.daysOfWeek.join(", ")}
                        </div>
                        <div className="text-xs text-[var(--muted-2)]">
                          {formatDate(c.startDate)} – {formatDate(c.endDate)}
                        </div>
                      </Td>
                      <Td className="hidden sm:table-cell">
                        <span className={full ? "text-amber-500 font-medium" : ""}>
                          {c.enrolledCount} / {c.capacity}
                        </span>
                      </Td>
                      <Td>
                        <Badge variant={STATUS_BADGE[c.status]} className="capitalize">
                          {c.status}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link href={`/admin/physical-classes/${c.id}`}>
                            <Button size="sm" variant="ghost" title="View roster">
                              <Icon.Eye size={14} />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(c)}
                            title="Edit"
                          >
                            <Icon.Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleting(c)}
                            title="Delete"
                          >
                            <Icon.Trash size={14} />
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--muted)] px-4 py-2.5 border-t border-[var(--border)]">
            Showing {filtered.length} of {classes.length} batch{classes.length !== 1 ? "es" : ""}
          </p>
        </Card>
      )}

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="xl"
        title={editing ? "Edit batch" : "New physical class batch"}
      >
        {/* ── Live preview header ── */}
        <div className="px-5 sm:px-6 py-4 flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface-2)]/50">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
            <Icon.Calendar size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold truncate", form.title ? "text-[var(--foreground)]" : "text-[var(--muted)] text-sm italic")}>
              {form.title || "Batch title…"}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {form.courseId ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center gap-1">
                  <Icon.Book size={9} /> {courses.find((c) => c.id === form.courseId)?.title ?? "Course"}
                </span>
              ) : (
                <span className="text-[10px] text-[var(--muted)]">Select course &amp; instructor below</span>
              )}
              {form.room && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] flex items-center gap-1">
                  <Icon.Pin size={9} /> {form.campus} · Room {form.room}
                </span>
              )}
              {form.daysOfWeek.length > 0 && (
                <span className="text-[10px] text-[var(--primary)] flex items-center gap-1">
                  <Icon.Clock size={9} /> {form.daysOfWeek.join(", ")}{form.batch ? ` · ${form.batch}` : ""}
                </span>
              )}
            </div>
          </div>
          {form.status && (
            <Badge
              variant={STATUS_BADGE[form.status]}
              className="shrink-0 capitalize hidden sm:inline-flex"
            >
              {form.status}
            </Badge>
          )}
        </div>

        {/* ── Section 1: Course & Instructor ── */}
        <div className="px-5 pt-5 pb-5 space-y-4">
          <BatchSectionLabel icon={<Icon.Book size={13} />} label="Course & instructor" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Course</Label>
              <Select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                <option value="">Select a course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Instructor</Label>
              <Select
                value={form.instructorId}
                onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
              >
                <option value="">Select an instructor…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
              {teachers.length === 0 && (
                <p className="mt-1.5 text-[11px] text-amber-500 flex items-center gap-1">
                  <Icon.AlertCircle size={12} /> No instructors yet — add a teacher first.
                </p>
              )}
            </div>
          </div>
          <div>
            <Label>Batch title</Label>
            <Input
              icon={<Icon.Tag size={14} />}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Calculus I — Spring Morning Batch"
              maxLength={100}
            />
          </div>
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* ── Section 2: Location ── */}
        <div className="px-5 py-5 space-y-4">
          <BatchSectionLabel icon={<Icon.Pin size={13} />} label="Location" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Campus</Label>
              <Select
                value={form.campus}
                onChange={(e) => setForm({ ...form, campus: e.target.value })}
              >
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Room</Label>
              <Input
                icon={<Icon.Compass size={14} />}
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="e.g. B-204"
                maxLength={40}
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* ── Section 3: Schedule ── */}
        <div className="px-5 py-5 space-y-4">
          <BatchSectionLabel icon={<Icon.Calendar size={13} />} label="Schedule" />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Timing</Label>
              <Select
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
              >
                {BATCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                min={1}
                max={500}
                icon={<Icon.Users size={14} />}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
            <div>
              <Label>Start date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>End date</Label>
              <Input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Day-of-week pill picker */}
          <div>
            <Label>Class days</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const active = form.daysOfWeek.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`h-9 w-12 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                      active
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                        : "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
              {form.daysOfWeek.length === 0 && (
                <p className="text-xs text-[var(--danger)] flex items-center gap-1 self-center">
                  <Icon.AlertCircle size={12} /> Select at least one day.
                </p>
              )}
            </div>
          </div>

          {/* Schedule summary card */}
          {(form.daysOfWeek.length > 0 || form.startDate || form.batch) && (
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  icon: <Icon.Calendar size={14} />,
                  label: "Days",
                  value: form.daysOfWeek.length > 0 ? form.daysOfWeek.join(" · ") : "—",
                  show: true,
                },
                {
                  icon: <Icon.Clock size={14} />,
                  label: "Timing",
                  value: form.batch || "—",
                  show: true,
                },
                {
                  icon: <Icon.Users size={14} />,
                  label: "Dates",
                  value: form.startDate && form.endDate
                    ? `${formatDate(form.startDate)} – ${formatDate(form.endDate)}`
                    : form.startDate ? `From ${formatDate(form.startDate)}` : "—",
                  show: true,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2.5">
                  <span className="text-[var(--primary)] mt-0.5 shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">{item.label}</p>
                    <p className="text-xs font-semibold truncate mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* ── Section 4: Status & Notes ── */}
        <div className="px-5 py-5 space-y-4">
          <BatchSectionLabel icon={<Icon.Settings size={13} />} label="Status & notes" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PhysicalClassStatus })}
              >
                {PHYSICAL_CLASS_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>
              Notes <span className="text-[var(--muted-2)] font-normal">(optional)</span>
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything students should know — orientation date, what to bring, etc."
              rows={2}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 sm:px-6 pb-5 pt-4 border-t border-[var(--border)] flex flex-col-reverse sm:flex-row gap-2">
          <p className="text-xs text-[var(--muted)] self-center hidden sm:block sm:mr-auto">
            {editing ? "Changes apply immediately to enrolled students." : "Add students to this batch after creating it."}
          </p>
          <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={!formValid} className="w-full sm:w-auto">
            {editing ? <><Icon.Check size={14} /> Save changes</> : <><Icon.CheckCircle size={14} /> Create batch</>}
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        size="sm"
        title="Delete batch?"
      >
        {deleting && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Deleting <strong className="text-[var(--foreground)]">{deleting.title}</strong> will
              also remove its {deleting.enrolledCount} enrollment(s) and all attendance records.
              This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                <Icon.Trash size={16} /> Delete batch
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function BatchSectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-semibold px-4 py-3 ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}
