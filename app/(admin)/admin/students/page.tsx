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
  useToast,
} from "@/components/ui";
import { useAdmin, type StudentSummary } from "@/lib/store";
import {
  cleanPhoneInput,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "@/lib/validation";

type FormMode = "create" | "edit" | "reset" | null;

type SortKey = "name" | "enrolled" | "completed";

const PAGE_SIZE = 10;

export default function AdminStudentsPage() {
  const admin = useAdmin();
  const toast = useToast();
  const [tick, setTick] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [page, setPage] = React.useState(1);
  const [mode, setMode] = React.useState<FormMode>(null);
  const [editing, setEditing] = React.useState<StudentSummary | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const allStudents = React.useMemo(
    () => admin.listStudents(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admin, tick],
  );

  const students = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? allStudents.filter(
          (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
        )
      : allStudents;
    return [...filtered].sort((a, b) => {
      if (sortKey === "enrolled") return b.enrolledCount - a.enrolledCount;
      if (sortKey === "completed") return b.completedCount - a.completedCount;
      return a.name.localeCompare(b.name);
    });
  }, [allStudents, query, sortKey]);

  // Reset to page 1 whenever filter/sort changes
  React.useEffect(() => { setPage(1); }, [query, sortKey]);

  const totalPages = Math.ceil(students.length / PAGE_SIZE);
  const paginated = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = React.useMemo(() => {
    const complete = allStudents.filter(
      (s) => !!(s.phone?.trim()) && !!(s.education) && s.education !== "None",
    ).length;
    const totalEnrolled = allStudents.reduce((s, x) => s + x.enrolledCount, 0);
    const totalCerts = allStudents.reduce((s, x) => s + x.certificateCount, 0);
    return { total: allStudents.length, complete, totalEnrolled, totalCerts };
  }, [allStudents]);

  function refresh() {
    setTick((t) => t + 1);
  }

  function exportCsv() {
    const header = "Name,Email,Phone,Enrolled,Completed,Certificates\n";
    const rows = allStudents
      .map((s) => `"${s.name}","${s.email}","${s.phone ?? ""}",${s.enrolledCount},${s.completedCount},${s.certificateCount}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push({ title: "Exported", tone: "success" });
  }

  function startCreate() {
    setEditing(null);
    setMode("create");
  }
  function startEdit(s: StudentSummary) {
    setEditing(s);
    setMode("edit");
  }
  function startReset(s: StudentSummary) {
    setEditing(s);
    setMode("reset");
  }

  function handleDelete(id: string) {
    admin.deleteStudent(id);
    setConfirmDeleteId(null);
    toast.push({ title: "Student deleted", tone: "success" });
    refresh();
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Students</h1>
          <p className="mt-1 text-[var(--muted)]">
            Onboard learners from the office, edit details, reset passwords.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={allStudents.length === 0}>
            <Icon.Download size={16} /> Export CSV
          </Button>
          <Button onClick={startCreate}>
            <Icon.Plus size={16} /> Add student
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total students", value: stats.total, icon: <Icon.User size={16} />, tint: "bg-[var(--primary-soft)] text-[var(--primary)]" },
          { label: "Complete profiles", value: stats.complete, icon: <Icon.CheckCircle size={16} />, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { label: "Total enrollments", value: stats.totalEnrolled, icon: <Icon.ListChecks size={16} />, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
          { label: "Certificates earned", value: stats.totalCerts, icon: <Icon.Award size={16} />, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
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
              <span className="text-xs text-[var(--muted)] shrink-0">Sort by:</span>
              {(["name", "enrolled", "completed"] as SortKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSortKey(k)}
                  className={`px-3 h-8 rounded-lg text-xs font-medium capitalize transition border ${sortKey === k ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-transparent text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {students.length === 0 ? (
            <EmptyState
              icon={<Icon.User size={20} />}
              title={query ? "No students match your search." : "No students yet."}
              description={query ? "Try a different name or email." : "Add your first student to get started."}
              action={!query && <Button onClick={startCreate}><Icon.Plus size={16} /> Add student</Button>}
            />
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="font-medium py-2.5 px-3">Student</th>
                    <th className="font-medium py-2.5 px-3 hidden md:table-cell">Phone</th>
                    <th className="font-medium py-2.5 px-3 text-center hidden lg:table-cell">Profile</th>
                    <th className="font-medium py-2.5 px-3 text-center">Enrolled</th>
                    <th className="font-medium py-2.5 px-3 text-center hidden sm:table-cell">Completed</th>
                    <th className="font-medium py-2.5 px-3 text-center hidden sm:table-cell">Certificates</th>
                    <th className="font-medium py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold inline-flex items-center justify-center text-sm shrink-0">
                            {s.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.name}</p>
                            <p className="text-xs text-[var(--muted)] truncate">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell text-[var(--muted)]">{s.phone || "—"}</td>
                      <td className="py-3 px-3 text-center hidden lg:table-cell">
                        {(!s.phone?.trim() || !s.education || s.education === "None") ? (
                          <Badge variant="warning">Incomplete</Badge>
                        ) : (
                          <Badge variant="success">Complete</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center"><Badge variant="default">{s.enrolledCount}</Badge></td>
                      <td className="py-3 px-3 text-center hidden sm:table-cell"><Badge variant="success">{s.completedCount}</Badge></td>
                      <td className="py-3 px-3 text-center hidden sm:table-cell"><Badge variant="primary">{s.certificateCount}</Badge></td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => startEdit(s)}
                            title="Edit"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                          >
                            <Icon.FilePen size={14} />
                          </button>
                          <button
                            onClick={() => startReset(s)}
                            title="Reset password"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                          >
                            <Icon.Lock size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(s.id)}
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
            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted)]">
                Showing{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {students.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, students.length)}
                </span>{" "}
                of <span className="font-medium text-[var(--foreground)]">{students.length}</span> students
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <Icon.ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isActive = p === page;
                    const nearActive = Math.abs(p - page) <= 1;
                    const isEdge = p === 1 || p === totalPages;
                    if (!nearActive && !isEdge) {
                      if (p === 2 && page > 3) return <span key={p} className="w-6 text-center text-xs text-[var(--muted-2)]">…</span>;
                      if (p === totalPages - 1 && page < totalPages - 2) return <span key={p} className="w-6 text-center text-xs text-[var(--muted-2)]">…</span>;
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`h-8 min-w-[2rem] px-2 rounded-lg text-xs font-medium transition ${isActive ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"}`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <Icon.ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
            </>
          )}
        </CardBody>
      </Card>

      <CreateStudentModal
        open={mode === "create"}
        onClose={() => setMode(null)}
        onCreated={() => {
          setMode(null);
          refresh();
        }}
      />
      <EditStudentModal
        open={mode === "edit"}
        student={editing}
        onClose={() => setMode(null)}
        onSaved={() => {
          setMode(null);
          refresh();
        }}
      />
      <ResetPasswordModal
        open={mode === "reset"}
        student={editing}
        onClose={() => setMode(null)}
        onDone={() => setMode(null)}
      />

      <Modal open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} title="Delete student?">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This permanently removes the student account and clears their enrollments and certificates. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CreateStudentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const admin = useAdmin();
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setErr(null);
    }
  }, [open]);

  const phoneError = validatePhone(phone, false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const fieldErr =
      validateName(name, "Full name") ??
      validateEmail(email) ??
      validatePassword(password) ??
      phoneError;
    if (fieldErr) return setErr(fieldErr);
    const res = await admin.createStudent({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
    });
    if (!res.ok) {
      setErr(res.error || "Couldn't create student.");
      return;
    }
    toast.push({
      title: "Student account created",
      description: `${email} can now sign in with the password you set.`,
      tone: "success",
    });
    onCreated();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add student" size="md">
      <form onSubmit={submit} className="p-5 space-y-4">
        <div>
          <Label htmlFor="s-name">Full name</Label>
          <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" maxLength={60} />
        </div>
        <div>
          <Label htmlFor="s-email">Email</Label>
          <Input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" icon={<Icon.Mail size={16} />} />
        </div>
        <div>
          <Label htmlFor="s-password">Temporary password</Label>
          <Input id="s-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" icon={<Icon.Lock size={16} />} maxLength={64} />
        </div>
        <div>
          <Label htmlFor="s-phone">Phone (optional)</Label>
          <Input
            id="s-phone"
            value={phone}
            onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
            placeholder="+92 300 1234567"
            inputMode="tel"
            error={phone ? phoneError : undefined}
          />
        </div>
        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{err}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit"><Icon.Plus size={16} /> Create account</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditStudentModal({
  open,
  student,
  onClose,
  onSaved,
}: {
  open: boolean;
  student: StudentSummary | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const admin = useAdmin();
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && student) {
      setName(student.name);
      setEmail(student.email);
      setPhone(student.phone ?? "");
      setErr(null);
    }
  }, [open, student]);

  const phoneError = validatePhone(phone, false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    setErr(null);
    const fieldErr =
      validateName(name, "Full name") ?? validateEmail(email) ?? phoneError;
    if (fieldErr) return setErr(fieldErr);
    const res = await admin.updateStudent(student.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    if (!res.ok) return setErr(res.error || "Couldn't save changes.");
    toast.push({ title: "Saved", tone: "success" });
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit student" size="md">
      <form onSubmit={submit} className="p-5 space-y-4">
        <div>
          <Label htmlFor="e-name">Full name</Label>
          <Input id="e-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </div>
        <div>
          <Label htmlFor="e-email">Email</Label>
          <Input id="e-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Icon.Mail size={16} />} />
        </div>
        <div>
          <Label htmlFor="e-phone">Phone</Label>
          <Input
            id="e-phone"
            value={phone}
            onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
            placeholder="+92 300 1234567"
            inputMode="tel"
            error={phone ? phoneError : undefined}
          />
        </div>
        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{err}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({
  open,
  student,
  onClose,
  onDone,
}: {
  open: boolean;
  student: StudentSummary | null;
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
    if (!student) return;
    setErr(null);
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    if (password.length > 64) return setErr("Password is too long (max 64 characters).");
    const res = await admin.resetStudentPassword(student.id, password);
    if (!res.ok) return setErr(res.error || "Couldn't reset password.");
    toast.push({
      title: "Password reset",
      description: `Share the new password with ${student.email} securely.`,
      tone: "success",
    });
    onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Reset password${student ? ` — ${student.name}` : ""}`} size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <div>
          <Label htmlFor="rp">New password</Label>
          <Input id="rp" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" icon={<Icon.Lock size={16} />} />
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
