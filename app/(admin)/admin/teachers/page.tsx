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

type FormMode = "create" | "edit" | "reset" | null;

type SortKey = "name" | "courses" | "students";

export default function AdminTeachersPage() {
  const admin = useAdmin();
  const toast = useToast();
  const [tick, setTick] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [mode, setMode] = React.useState<FormMode>(null);
  const [editing, setEditing] = React.useState<TeacherSummary | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const allTeachers = React.useMemo(
    () => admin.listTeachers(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admin, tick],
  );

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
      return a.name.localeCompare(b.name);
    });
  }, [allTeachers, query, sortKey]);

  const stats = React.useMemo(() => ({
    total: allTeachers.length,
    totalCourses: allTeachers.reduce((s, t) => s + t.courseCount, 0),
    totalStudents: allTeachers.reduce((s, t) => s + t.studentCount, 0),
  }), [allTeachers]);

  function refresh() { setTick((t) => t + 1); }

  function startCreate() {
    setEditing(null);
    setMode("create");
  }
  function startEdit(t: TeacherSummary) {
    setEditing(t);
    setMode("edit");
  }
  function startReset(t: TeacherSummary) {
    setEditing(t);
    setMode("reset");
  }

  function handleDelete(id: string) {
    admin.deleteTeacher(id);
    setConfirmDeleteId(null);
    toast.push({ title: "Teacher removed", tone: "success" });
    refresh();
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="mt-1 text-[var(--muted)]">
            Onboard instructors, edit details, reset passwords.
          </p>
        </div>
        <Button onClick={startCreate}>
          <Icon.Plus size={16} /> Add teacher
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total teachers", value: stats.total, icon: <Icon.Sparkles size={16} />, tint: "bg-[var(--primary-soft)] text-[var(--primary)]" },
          { label: "Courses taught", value: stats.totalCourses, icon: <Icon.Book size={16} />, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
          { label: "Students reached", value: stats.totalStudents, icon: <Icon.Users size={16} />, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
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

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Input
              icon={<Icon.Search size={16} />}
              placeholder="Search by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted)] shrink-0">Sort:</span>
              {(["name", "courses", "students"] as SortKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSortKey(k)}
                  className={`px-3 h-8 rounded-lg text-xs font-medium capitalize transition ${sortKey === k ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {teachers.length === 0 ? (
            <EmptyState
              icon={<Icon.Sparkles size={20} />}
              title={query ? "No teachers match your search." : "No teachers yet."}
              description={query ? "Try a different name or email." : "Add your first teacher to get started."}
              action={!query && <Button onClick={startCreate}><Icon.Plus size={16} /> Add teacher</Button>}
            />
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="font-medium py-2.5 px-3">Teacher</th>
                    <th className="font-medium py-2.5 px-3 hidden md:table-cell">Phone</th>
                    <th className="font-medium py-2.5 px-3 text-center">Courses</th>
                    <th className="font-medium py-2.5 px-3 text-center hidden sm:table-cell">Students</th>
                    <th className="font-medium py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold inline-flex items-center justify-center text-sm shrink-0">
                            {t.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{t.name}</p>
                            <p className="text-xs text-[var(--muted)] truncate">{t.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell text-[var(--muted)]">{t.phone || "—"}</td>
                      <td className="py-3 px-3 text-center"><Badge variant="primary">{t.courseCount}</Badge></td>
                      <td className="py-3 px-3 text-center hidden sm:table-cell"><Badge variant="default">{t.studentCount}</Badge></td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1">
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
                            title="Delete"
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
              Showing {teachers.length} of {allTeachers.length} teachers
            </p>
            </>
          )}
        </CardBody>
      </Card>

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

      <Modal open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} title="Remove teacher?">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This deletes the teacher account. Their courses stay in the catalog, but the instructor field is set to
            &quot;Unassigned&quot;. You can reassign them later by editing each course.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

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
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (mode === "edit" && teacher) {
      const res = await admin.updateTeacher(teacher.id, {
        name: trimmedName,
        email: email.trim(),
        phone: trimmedPhone,
        bio: trimmedBio,
      });
      if (!res.ok) return setErr(res.error || "Couldn't save changes.");
      toast.push({ title: "Teacher updated", tone: "success" });
    } else {
      const res = await admin.createTeacher({
        name: trimmedName,
        email: email.trim(),
        password,
        phone: trimmedPhone,
        bio: trimmedBio,
      });
      if (!res.ok) return setErr(res.error || "Couldn't create teacher.");
      toast.push({
        title: "Teacher account created",
        description: `${email} can now sign in to the teacher portal.`,
        tone: "success",
      });
    }
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === "edit" ? "Edit teacher" : "Add teacher"} size="md">
      <form onSubmit={submit} className="p-5 space-y-4">
        <div>
          <Label htmlFor="t-name">Full name</Label>
          <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ananya Sharma" maxLength={60} />
        </div>
        <div>
          <Label htmlFor="t-email">Email</Label>
          <Input id="t-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@example.com" icon={<Icon.Mail size={16} />} />
        </div>
        {mode === "create" && (
          <div>
            <Label htmlFor="t-password">Temporary password</Label>
            <Input id="t-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" icon={<Icon.Lock size={16} />} maxLength={64} />
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
          <Textarea id="t-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What they teach, expertise, etc." rows={3} />
        </div>
        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{err}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">
            {mode === "edit" ? "Save changes" : <><Icon.Plus size={16} /> Create teacher</>}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

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
    <Modal open={open} onClose={onClose} title={`Reset password${teacher ? ` — ${teacher.name}` : ""}`} size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <div>
          <Label htmlFor="trp">New password</Label>
          <Input id="trp" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" icon={<Icon.Lock size={16} />} />
        </div>
        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{err}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit"><Icon.Lock size={16} /> Set password</Button>
        </div>
      </form>
    </Modal>
  );
}
