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
  StatCard,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useTeacher } from "@/lib/store";
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

export default function TeacherCertificatesPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const students = teacher.myStudents();

  const [certs, setCerts] = React.useState<CertRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  const [issueOpen, setIssueOpen] = React.useState(false);
  const [pairKey, setPairKey] = React.useState(""); // "userId::courseId"
  const [score, setScore] = React.useState("80");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/teacher/certificates");
    const data = r.ok ? await r.json() : { certificates: [] };
    setCerts(data.certificates ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Student–course pairs that don't already have a certificate.
  const issuable = React.useMemo(() => {
    const has = new Set(certs.map((c) => `${c.userId}::${c.courseId}`));
    return students.filter((s) => !has.has(`${s.userId}::${s.courseId}`));
  }, [students, certs]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return certs;
    return certs.filter(
      (c) =>
        c.studentName.toLowerCase().includes(q) ||
        c.courseTitle.toLowerCase().includes(q) ||
        c.verifyCode.toLowerCase().includes(q),
    );
  }, [certs, query]);

  async function issue() {
    const [userId, courseId] = pairKey.split("::");
    const n = Number(score);
    if (!userId || !courseId) {
      toast.push({ title: "Select a student", tone: "danger" });
      return;
    }
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      toast.push({ title: "Score must be between 0 and 100", tone: "danger" });
      return;
    }
    setSaving(true);
    const r = await fetch("/api/teacher/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId, score: n }),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't issue certificate", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Certificate issued", tone: "success" });
    setIssueOpen(false);
    setPairKey("");
    setScore("80");
    load();
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Teaching
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Certificates</h1>
          <p className="mt-1 text-[var(--muted)]">
            Award certificates to students who have completed your courses.
          </p>
        </div>
        <Button onClick={() => setIssueOpen(true)} disabled={issuable.length === 0}>
          <Icon.Plus size={16} /> Issue certificate
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Issued" value={certs.length} icon={<Icon.Award size={20} />} />
        <StatCard
          label="Students"
          value={new Set(students.map((s) => s.userId)).size}
          icon={<Icon.Users size={20} />}
          tone="accent"
        />
        <StatCard
          label="Pending eligible"
          value={issuable.length}
          icon={<Icon.Clock size={20} />}
          tone="warning"
        />
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
                  ? "Issue a certificate to a student from one of your courses."
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--border)]">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} size="md" title="Issue certificate">
        <div className="p-5 space-y-4">
          <div>
            <Label>Student &amp; course</Label>
            <Select value={pairKey} onChange={(e) => setPairKey(e.target.value)}>
              <option value="">Select a student…</option>
              {issuable.map((s) => (
                <option key={`${s.userId}::${s.courseId}`} value={`${s.userId}::${s.courseId}`}>
                  {s.userName} — {s.courseTitle}
                  {s.completed ? " (completed)" : ` (${s.progress}%)`}
                </option>
              ))}
            </Select>
            {issuable.length === 0 && (
              <p className="mt-1 text-xs text-[var(--muted-2)]">
                Every enrolled student already has a certificate.
              </p>
            )}
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
            <Button onClick={issue} loading={saving} disabled={!pairKey}>
              <Icon.Award size={16} /> Issue
            </Button>
          </div>
        </div>
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
