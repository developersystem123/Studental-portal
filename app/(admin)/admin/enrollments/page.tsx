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
  Modal,
  Tabs,
  useToast,
} from "@/components/ui";
import { useAdmin, type EnrollmentRow } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

type Filter = "all" | "in-progress" | "completed" | "certified";

export default function AdminEnrollmentsPage() {
  const admin = useAdmin();
  const toast = useToast();
  const [tick, setTick] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [awardRow, setAwardRow] = React.useState<EnrollmentRow | null>(null);
  const [revokeRow, setRevokeRow] = React.useState<EnrollmentRow | null>(null);
  const [score, setScore] = React.useState("90");

  const rows = React.useMemo(() => admin.listEnrollments(), [admin, tick]);
  function refresh() { setTick((t) => t + 1); }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "in-progress" && (r.completed || r.progress === 0)) return false;
      if (filter === "completed" && !r.completed) return false;
      if (filter === "certified" && !r.certificateId) return false;
      if (!q) return true;
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q)
      );
    });
  }, [rows, query, filter]);

  const counts = React.useMemo(
    () => ({
      all: rows.length,
      "in-progress": rows.filter((r) => !r.completed && r.progress > 0).length,
      completed: rows.filter((r) => r.completed).length,
      certified: rows.filter((r) => !!r.certificateId).length,
    }),
    [rows],
  );

  function handleAward() {
    if (!awardRow) return;
    const s = Number(score);
    if (!Number.isFinite(s) || s < 0 || s > 100) {
      toast.push({ title: "Invalid score", description: "Score must be 0–100.", tone: "danger" });
      return;
    }
    admin.awardCertificateFor(awardRow.userId, awardRow.courseId, s);
    toast.push({ title: "Certificate awarded", tone: "success" });
    setAwardRow(null);
    refresh();
  }

  function handleRevoke() {
    if (!revokeRow || !revokeRow.certificateId) return;
    admin.revokeCertificate(revokeRow.userId, revokeRow.certificateId);
    toast.push({ title: "Certificate revoked", tone: "success" });
    setRevokeRow(null);
    refresh();
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Enrollments</h1>
        <p className="mt-1 text-[var(--muted)]">See who's taking what, award certificates, revoke when needed.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.all, tint: "bg-[var(--primary-soft)] text-[var(--primary)]", icon: <Icon.ListChecks size={16} /> },
          { label: "In progress", value: counts["in-progress"], tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400", icon: <Icon.PlayCircle size={16} /> },
          { label: "Completed", value: counts.completed, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: <Icon.CheckCircle size={16} /> },
          { label: "Certified", value: counts.certified, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: <Icon.Award size={16} /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-center gap-3 !py-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}>{s.icon}</div>
              <div>
                <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                <p className="text-xl font-bold tracking-tight">{s.value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <Tabs
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              options={[
                { value: "all", label: "All", count: counts.all },
                { value: "in-progress", label: "In progress", count: counts["in-progress"] },
                { value: "completed", label: "Completed", count: counts.completed },
                { value: "certified", label: "Certified", count: counts.certified },
              ]}
            />
            <Input
              icon={<Icon.Search size={16} />}
              placeholder="Search student or course…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.ListChecks size={20} />}
              title="No matching enrollments."
              description="Try a different filter or clear your search."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="font-medium py-2.5 px-3">Student</th>
                    <th className="font-medium py-2.5 px-3">Course</th>
                    <th className="font-medium py-2.5 px-3 hidden md:table-cell">Enrolled</th>
                    <th className="font-medium py-2.5 px-3">Progress</th>
                    <th className="font-medium py-2.5 px-3">Status</th>
                    <th className="font-medium py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={`${r.userId}-${r.courseId}`} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50 transition">
                      <td className="py-3 px-3">
                        <p className="font-medium truncate">{r.userName}</p>
                        <p className="text-xs text-[var(--muted)] truncate">{r.userEmail}</p>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-medium truncate">{r.courseTitle}</p>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell text-[var(--muted)]">
                        {relativeTime(r.enrolledAt)}
                      </td>
                      <td className="py-3 px-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${r.progress}%` }} />
                          </div>
                          <span className="text-xs text-[var(--muted)] w-8 text-right">{r.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {r.certificateId ? (
                          <Badge variant="primary"><Icon.Award size={12} /> Certified</Badge>
                        ) : r.completed ? (
                          <Badge variant="success">Completed</Badge>
                        ) : r.progress > 0 ? (
                          <Badge variant="info">In progress</Badge>
                        ) : (
                          <Badge variant="default">Not started</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {r.certificateId ? (
                          <Button size="sm" variant="ghost" onClick={() => setRevokeRow(r)}>
                            <Icon.Trash size={14} /> Revoke
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!r.completed}
                            onClick={() => {
                              setScore("90");
                              setAwardRow(r);
                            }}
                            title={r.completed ? "Award certificate" : "Available once student completes the course"}
                          >
                            <Icon.Award size={14} /> Award
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal open={awardRow !== null} onClose={() => setAwardRow(null)} title="Award certificate" size="sm">
        {awardRow && (
          <div className="p-5 space-y-4">
            <div className="text-sm">
              <p>
                <span className="text-[var(--muted)]">Student:</span> <span className="font-medium">{awardRow.userName}</span>
              </p>
              <p>
                <span className="text-[var(--muted)]">Course:</span> <span className="font-medium">{awardRow.courseTitle}</span>
              </p>
            </div>
            <div>
              <label htmlFor="score" className="text-sm font-medium mb-1.5 block">Score (0–100)</label>
              <Input id="score" type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAwardRow(null)}>Cancel</Button>
              <Button onClick={handleAward}><Icon.Award size={16} /> Award</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={revokeRow !== null} onClose={() => setRevokeRow(null)} title="Revoke certificate?">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This deletes the certificate from {revokeRow?.userName}&apos;s record. They can be re-awarded later.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRevokeRow(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRevoke}>Revoke</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
