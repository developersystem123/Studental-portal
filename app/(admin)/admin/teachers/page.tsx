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
  StatCard,
  Textarea,
  useToast,
} from "@/components/ui";
import { useAdmin, type TeacherSummary } from "@/lib/store";
import {
  cleanPhoneInput,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "@/lib/validation";
import { formatDate } from "@/lib/utils";

type FormMode = "create" | "edit" | "reset" | "view" | null;
type SortKey = "name" | "courses" | "students" | "joined";

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-400",
  "from-blue-500 to-sky-400",
  "from-[var(--primary)] to-emerald-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
  "from-teal-500 to-cyan-400",
  "from-indigo-500 to-blue-400",
  "from-fuchsia-500 to-pink-400",
];

function avatarGradient(name: string) {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function exportCSV(teachers: TeacherSummary[]) {
  const header = ["Name", "Email", "Phone", "Bio", "Courses", "Students", "Joined"];
  const rows = teachers.map((t) => [
    `"${t.name.replace(/"/g, '""')}"`,
    t.email,
    t.phone ?? "",
    `"${(t.bio ?? "").replace(/"/g, '""')}"`,
    t.courseCount,
    t.studentCount,
    t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "",
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "teachers.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminTeachersPage() {
  const admin = useAdmin();
  const toast = useToast();
  const [tick, setTick] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [mode, setMode] = React.useState<FormMode>(null);
  const [editing, setEditing] = React.useState<TeacherSummary | null>(null);
  const [viewing, setViewing] = React.useState<TeacherSummary | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const allTeachers = React.useMemo(
    () => admin.listTeachers(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admin, tick],
  );

  const topTeacherId = React.useMemo(() => {
    if (allTeachers.length === 0) return null;
    const sorted = [...allTeachers].sort((a, b) => b.studentCount - a.studentCount);
    return sorted[0].studentCount > 0 ? sorted[0].id : null;
  }, [allTeachers]);

  const teachers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? allTeachers.filter(
          (t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q),
        )
      : allTeachers;
    return [...filtered].sort((a, b) => {
      if (sortKey === "courses") return b.courseCount - a.courseCount;
      if (sortKey === "students") return b.studentCount - a.studentCount;
      if (sortKey === "joined") return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      return a.name.localeCompare(b.name);
    });
  }, [allTeachers, query, sortKey]);

  const stats = React.useMemo(() => ({
    total: allTeachers.length,
    totalCourses: allTeachers.reduce((s, t) => s + t.courseCount, 0),
    totalStudents: allTeachers.reduce((s, t) => s + t.studentCount, 0),
    avgStudents: allTeachers.length
      ? Math.round(allTeachers.reduce((s, t) => s + t.studentCount, 0) / allTeachers.length)
      : 0,
  }), [allTeachers]);

  function refresh() { setTick((t) => t + 1); }

  function startCreate() { setEditing(null); setMode("create"); }
  function startEdit(t: TeacherSummary) { setEditing(t); setMode("edit"); }
  function startReset(t: TeacherSummary) { setEditing(t); setMode("reset"); }
  function openProfile(t: TeacherSummary) { setViewing(t); setMode("view"); }

  function handleDelete(id: string) {
    admin.deleteTeacher(id);
    setConfirmDeleteId(null);
    toast.push({ title: "Teacher removed", tone: "success" });
    refresh();
  }

  const SORTS: { key: SortKey; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "courses", label: "Courses" },
    { key: "students", label: "Students" },
    { key: "joined", label: "Joined" },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="mt-1 text-[var(--muted)]">
            Onboard instructors, edit details, reset passwords.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => exportCSV(teachers)}>
            <Icon.Download size={15} /> Export CSV
          </Button>
          <Button onClick={startCreate}>
            <Icon.Plus size={16} /> Add teacher
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total teachers"
          value={stats.total}
          icon={<Icon.Sparkles size={18} />}
          tone="primary"
        />
        <StatCard
          label="Courses taught"
          value={stats.totalCourses}
          icon={<Icon.Book size={18} />}
          tone="accent"
        />
        <StatCard
          label="Students reached"
          value={stats.totalStudents}
          icon={<Icon.Users size={18} />}
          tone="success"
        />
        <StatCard
          label="Avg students / teacher"
          value={stats.avgStudents}
          icon={<Icon.TrendingUp size={18} />}
          tone="warning"
        />
      </div>

      {/* ── Table card ── */}
      <Card>
        <CardBody className="space-y-4">
          {/* Search + sort */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              icon={<Icon.Search size={16} />}
              placeholder="Search by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:flex-1 sm:max-w-xs"
            />
            <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto sm:shrink-0">
              <span className="text-xs text-[var(--muted)] shrink-0 mr-0.5">Sort:</span>
              {SORTS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={`px-2.5 h-8 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    sortKey === key
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {teachers.length === 0 ? (
            <EmptyState
              icon={<Icon.Sparkles size={20} />}
              title={query ? "No teachers match your search." : "No teachers yet."}
              description={
                query
                  ? "Try a different name or email."
                  : "Add your first instructor to get started."
              }
              action={
                !query && (
                  <Button onClick={startCreate}>
                    <Icon.Plus size={16} /> Add teacher
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="font-medium py-2.5 px-3">Teacher</th>
                      <th className="font-medium py-2.5 px-3 hidden md:table-cell">Phone</th>
                      <th className="font-medium py-2.5 px-3 text-center">Courses</th>
                      <th className="font-medium py-2.5 px-3 text-center hidden sm:table-cell">Students</th>
                      <th className="font-medium py-2.5 px-3 hidden lg:table-cell">Joined</th>
                      <th className="font-medium py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => openProfile(t)}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/60 transition cursor-pointer group"
                      >
                        {/* Teacher info */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div
                                className={`h-10 w-10 rounded-xl bg-gradient-to-br ${avatarGradient(t.name)} text-white font-bold inline-flex items-center justify-center text-sm shadow-sm`}
                              >
                                {t.name.slice(0, 1).toUpperCase()}
                              </div>
                              {t.id === topTeacherId && (
                                <span
                                  className="absolute -top-1.5 -right-1.5 h-[18px] w-[18px] rounded-full bg-amber-400 flex items-center justify-center shadow-sm"
                                  title="Top instructor"
                                >
                                  <Icon.Crown size={9} className="text-amber-900" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate leading-snug">{t.name}</p>
                              <p className="text-xs text-[var(--muted)] truncate">{t.email}</p>
                              {t.bio && (
                                <p className="text-[11px] text-[var(--muted)] italic truncate max-w-[200px] hidden md:block">
                                  {t.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-3 hidden md:table-cell text-[var(--muted)] text-xs">
                          {t.phone || "—"}
                        </td>

                        {/* Courses */}
                        <td className="py-3 px-3 text-center">
                          <Badge variant="primary">{t.courseCount}</Badge>
                        </td>

                        {/* Students */}
                        <td className="py-3 px-3 text-center hidden sm:table-cell">
                          <Badge variant={t.studentCount > 0 ? "success" : "default"}>
                            {t.studentCount}
                          </Badge>
                        </td>

                        {/* Joined */}
                        <td className="py-3 px-3 hidden lg:table-cell text-xs text-[var(--muted)]">
                          {t.createdAt ? formatDate(t.createdAt) : "—"}
                        </td>

                        {/* Actions — stop propagation so row click doesn't fire */}
                        <td
                          className="py-3 px-3 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openProfile(t)}
                              title="View profile"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                            >
                              <Icon.User size={14} />
                            </button>
                            <button
                              onClick={() => startEdit(t)}
                              title="Edit"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                            >
                              <Icon.FilePen size={14} />
                            </button>
                            <button
                              onClick={() => startReset(t)}
                              title="Reset password"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                            >
                              <Icon.Lock size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(t.id)}
                              title="Remove"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-[var(--danger)] transition"
                            >
                              <Icon.Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--muted)] pt-1">
                Showing {teachers.length} of {allTeachers.length} teacher
                {allTeachers.length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </CardBody>
      </Card>

      {/* ── Modals ── */}
      <TeacherProfileModal
        open={mode === "view"}
        teacher={viewing}
        topTeacherId={topTeacherId}
        onClose={() => setMode(null)}
        onEdit={(t) => {
          setMode(null);
          setTimeout(() => startEdit(t), 60);
        }}
        onReset={(t) => {
          setMode(null);
          setTimeout(() => startReset(t), 60);
        }}
      />

      <TeacherFormModal
        open={mode === "create" || mode === "edit"}
        mode={mode === "edit" ? "edit" : "create"}
        teacher={mode === "edit" ? editing : null}
        onClose={() => setMode(null)}
        onSaved={() => {
          setMode(null);
          refresh();
        }}
      />

      <ResetPasswordModal
        open={mode === "reset"}
        teacher={editing}
        onClose={() => setMode(null)}
        onDone={() => setMode(null)}
      />

      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Remove teacher?"
      >
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This deletes the teacher account. Their courses stay in the catalog, but the instructor
            field is set to &quot;Unassigned&quot;. You can reassign them later by editing each
            course.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Teacher Profile Modal                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function TeacherProfileModal({
  open,
  teacher,
  topTeacherId,
  onClose,
  onEdit,
  onReset,
}: {
  open: boolean;
  teacher: TeacherSummary | null;
  topTeacherId: string | null;
  onClose: () => void;
  onEdit: (t: TeacherSummary) => void;
  onReset: (t: TeacherSummary) => void;
}) {
  if (!teacher) return null;

  const isTop = teacher.id === topTeacherId;
  const avgPerCourse =
    teacher.courseCount > 0 ? Math.round(teacher.studentCount / teacher.courseCount) : 0;

  return (
    <Modal open={open} onClose={onClose} title="Teacher profile" size="md">
      <div className="p-5 space-y-5">
        {/* Avatar + identity */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${avatarGradient(teacher.name)} text-white font-bold inline-flex items-center justify-center text-2xl shadow-md`}
            >
              {teacher.name.slice(0, 1).toUpperCase()}
            </div>
            {isTop && (
              <span
                className="absolute -top-2 -right-2 h-[22px] w-[22px] rounded-full bg-amber-400 flex items-center justify-center shadow"
                title="Top instructor"
              >
                <Icon.Crown size={11} className="text-amber-900" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold leading-snug">{teacher.name}</h2>
              {isTop && (
                <span className="text-[11px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                  Top instructor
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--muted)] mt-0.5">{teacher.email}</p>
            {teacher.phone && (
              <p className="text-xs text-[var(--muted)] mt-0.5 flex items-center gap-1">
                <Icon.User size={11} /> {teacher.phone}
              </p>
            )}
            {teacher.createdAt && (
              <p className="text-xs text-[var(--muted)] mt-0.5 flex items-center gap-1">
                <Icon.Calendar size={11} /> Joined {formatDate(teacher.createdAt)}
              </p>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Courses",
              value: teacher.courseCount,
              icon: <Icon.Book size={13} />,
              cls: "text-sky-500 bg-sky-500/10",
            },
            {
              label: "Students",
              value: teacher.studentCount,
              icon: <Icon.Users size={13} />,
              cls: "text-emerald-500 bg-emerald-500/10",
            },
            {
              label: "Avg / course",
              value: avgPerCourse,
              icon: <Icon.TrendingUp size={13} />,
              cls: "text-violet-500 bg-violet-500/10",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-center"
            >
              <div className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 mb-1.5 ${s.cls}`}>
                {s.icon}
                {s.label}
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Bio */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5">
            About
          </p>
          {teacher.bio ? (
            <p className="text-sm text-[var(--foreground)] leading-relaxed">{teacher.bio}</p>
          ) : (
            <p className="text-sm text-[var(--muted)] italic">No bio added yet.</p>
          )}
        </div>

        {/* Action footer */}
        <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button variant="outline" onClick={() => onReset(teacher)}>
            <Icon.Lock size={14} /> Reset password
          </Button>
          <Button onClick={() => onEdit(teacher)}>
            <Icon.FilePen size={14} /> Edit
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Create / Edit form                                                       */
/* ──────────────────────────────────────────────────────────────────────── */

function TeacherFormModal({
  open,
  mode,
  teacher,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  teacher: TeacherSummary | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const admin = useAdmin();
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && teacher) {
      setName(teacher.name);
      setEmail(teacher.email);
      setPhone(teacher.phone ?? "");
      setBio(teacher.bio ?? "");
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setBio("");
    }
    setErr(null);
  }, [open, mode, teacher]);

  const phoneError = validatePhone(phone, false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const fieldErr =
      validateName(name, "Full name") ??
      validateEmail(email) ??
      (mode === "create" ? validatePassword(password) : undefined) ??
      phoneError;
    if (fieldErr) return setErr(fieldErr);
    const trimmedBio = bio.trim();
    if (trimmedBio.length > 500) return setErr("Bio is too long (max 500 characters).");

    if (mode === "edit" && teacher) {
      const res = await admin.updateTeacher(teacher.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        bio: trimmedBio,
      });
      if (!res.ok) return setErr(res.error || "Couldn't save changes.");
      toast.push({ title: "Teacher updated", tone: "success" });
    } else {
      const res = await admin.createTeacher({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        bio: trimmedBio,
      });
      if (!res.ok) return setErr(res.error || "Couldn't create teacher.");
      toast.push({
        title: "Teacher account created",
        description: `${email.trim()} can now sign in to the teacher portal.`,
        tone: "success",
      });
    }
    onSaved();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit teacher" : "Add teacher"}
      size="md"
    >
      <form onSubmit={submit} className="p-5 space-y-4">
        <div>
          <Label htmlFor="t-name">Full name</Label>
          <Input
            id="t-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ananya Sharma"
            maxLength={60}
          />
        </div>
        <div>
          <Label htmlFor="t-email">Email</Label>
          <Input
            id="t-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@example.com"
            icon={<Icon.Mail size={16} />}
          />
        </div>
        {mode === "create" && (
          <div>
            <Label htmlFor="t-password">Temporary password</Label>
            <Input
              id="t-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              icon={<Icon.Lock size={16} />}
              maxLength={64}
            />
          </div>
        )}
        <div>
          <Label htmlFor="t-phone">Phone (optional)</Label>
          <Input
            id="t-phone"
            value={phone}
            onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
            placeholder="+92 300 1234567"
            inputMode="tel"
            error={phone ? phoneError : undefined}
          />
        </div>
        <div>
          <Label htmlFor="t-bio">Short bio (optional)</Label>
          <Textarea
            id="t-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What they teach, expertise, etc."
            rows={3}
          />
          <p className="text-[11px] text-[var(--muted)] mt-1 text-right">
            {bio.length} / 500
          </p>
        </div>
        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {err}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {mode === "edit" ? (
              "Save changes"
            ) : (
              <>
                <Icon.Plus size={16} /> Create teacher
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Reset password                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

function ResetPasswordModal({
  open,
  teacher,
  onClose,
  onDone,
}: {
  open: boolean;
  teacher: TeacherSummary | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const admin = useAdmin();
  const toast = useToast();
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setPassword("");
      setErr(null);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!teacher) return;
    setErr(null);
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    if (password.length > 64) return setErr("Password is too long (max 64 characters).");
    const res = await admin.resetTeacherPassword(teacher.id, password);
    if (!res.ok) return setErr(res.error || "Couldn't reset password.");
    toast.push({
      title: "Password reset",
      description: `Share the new password with ${teacher.email} securely.`,
      tone: "success",
    });
    onDone();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reset password${teacher ? ` — ${teacher.name}` : ""}`}
      size="sm"
    >
      <form onSubmit={submit} className="p-5 space-y-4">
        <div>
          <Label htmlFor="trp">New password</Label>
          <Input
            id="trp"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            icon={<Icon.Lock size={16} />}
          />
        </div>
        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {err}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Icon.Lock size={16} /> Set password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
