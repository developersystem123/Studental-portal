"use client";

import * as React from "react";
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
import Icon from "@/components/icons";
import { useAdmin, useData } from "@/lib/store";
import { formatDate } from "@/lib/utils";

type CertRow = {
  id: string;
  userId: string;
  courseId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  score: number;
  verifyCode: string;
  issuedAt: string;
};

export default function AdminCertificatesPage() {
  const admin = useAdmin();
  const { courses } = useData();
  const toast = useToast();
  const students = admin.listStudents();

  const [certs, setCerts] = React.useState<CertRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  const [issueOpen, setIssueOpen] = React.useState(false);
  const [studentId, setStudentId] = React.useState("");
  const [courseId, setCourseId] = React.useState("");
  const [score, setScore] = React.useState("80");
  const [saving, setSaving] = React.useState(false);
  const [revoking, setRevoking] = React.useState<CertRow | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/certificates");
      const data = r.ok ? await r.json() : { certificates: [] };
      setCerts(data.certificates ?? []);
    } catch {
      toast.push({ title: "Couldn't load certificates", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return certs;
    return certs.filter(
      (c) =>
        c.studentName.toLowerCase().includes(q) ||
        c.studentEmail.toLowerCase().includes(q) ||
        c.courseTitle.toLowerCase().includes(q) ||
        c.verifyCode.toLowerCase().includes(q),
    );
  }, [certs, query]);

  async function issue() {
    const n = Number(score);
    if (!studentId || !courseId) {
      toast.push({ title: "Select a student and a course", tone: "danger" });
      return;
    }
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      toast.push({ title: "Score must be between 0 and 100", tone: "danger" });
      return;
    }
    setSaving(true);
    const r = await fetch("/api/admin/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: studentId, courseId, score: n }),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't issue certificate", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Certificate issued", tone: "success" });
    setIssueOpen(false);
    setStudentId("");
    setCourseId("");
    setScore("80");
    load();
  }

  async function confirmRevoke() {
    if (!revoking) return;
    const r = await fetch(`/api/admin/certificates/${revoking.id}`, { method: "DELETE" });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't revoke", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Certificate revoked", tone: "info" });
    setRevoking(null);
    load();
  }

  const certStats = React.useMemo(() => {
    const avgScore = certs.length ? Math.round(certs.reduce((s, c) => s + c.score, 0) / certs.length) : 0;
    const highScore = certs.filter((c) => c.score >= 90).length;
    return { total: certs.length, avgScore, highScore };
  }, [certs]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Certificates</h1>
          <p className="mt-1 text-[var(--muted)]">
            Every certificate issued across the platform — issue new ones or revoke.
          </p>
        </div>
        <Button onClick={() => setIssueOpen(true)}>
          <Icon.Plus size={16} /> Issue certificate
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total issued", value: certStats.total, icon: <Icon.Award size={16} />, tint: "bg-[var(--primary-soft)] text-[var(--primary)]" },
          { label: "Average score", value: certStats.total ? `${certStats.avgScore}%` : "—", icon: <Icon.TrendingUp size={16} />, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
          { label: "Score ≥ 90%", value: certStats.highScore, icon: <Icon.Star size={16} />, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
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

      <div className="md:w-96">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by student, course or code…"
          icon={<Icon.Search size={16} />}
        />
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
              icon={<Icon.Award size={28} />}
              title={certs.length === 0 ? "No certificates issued yet" : "No matches"}
              description={
                certs.length === 0
                  ? "Issue a certificate to a student who has completed a course."
                  : "Try a different search term."
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
                  <Th>Student</Th>
                  <Th>Course</Th>
                  <Th>Score</Th>
                  <Th>Issued</Th>
                  <Th>Verify code</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/50"
                  >
                    <Td>
                      <div className="font-medium">{c.studentName}</div>
                      <div className="text-xs text-[var(--muted)]">{c.studentEmail}</div>
                    </Td>
                    <Td>
                      <div className="truncate max-w-[22ch]">{c.courseTitle}</div>
                    </Td>
                    <Td>
                      <Badge variant={c.score >= 60 ? "success" : "warning"}>{c.score}%</Badge>
                    </Td>
                    <Td className="text-xs text-[var(--muted)]">{formatDate(c.issuedAt)}</Td>
                    <Td>
                      <span className="font-mono text-xs">{c.verifyCode}</span>
                    </Td>
                    <Td className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setRevoking(c)} title="Revoke">
                        <Icon.Trash size={14} /> Revoke
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Issue modal */}
      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} size="md" title="Issue certificate">
        <div className="p-5 space-y-4">
          <div>
            <Label>Student</Label>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Select a student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.email}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Course</Label>
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Select a course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Score (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" onClick={() => setIssueOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={issue} loading={saving} disabled={!studentId || !courseId}>
              <Icon.Award size={16} /> Issue
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke confirm */}
      <Modal open={!!revoking} onClose={() => setRevoking(null)} size="sm" title="Revoke certificate?">
        {revoking && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Revoke the certificate for{" "}
              <strong className="text-[var(--foreground)]">{revoking.studentName}</strong> in{" "}
              <strong className="text-[var(--foreground)]">{revoking.courseTitle}</strong>? The
              verification code will stop working.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRevoking(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmRevoke}>
                <Icon.Trash size={16} /> Revoke
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-semibold px-4 py-3 ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}
