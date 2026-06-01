"use client";

import * as React from "react";
import Link from "next/link";
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
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useAdmin, type ApplicationRow } from "@/lib/store";
import { relativeTime } from "@/lib/utils";
import type { ApplicationStatus, PhysicalClass } from "@/lib/mockData";

type Filter = "all" | ApplicationStatus;

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_BADGE: Record<ApplicationStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export default function AdminApplicationsPage() {
  const admin = useAdmin();
  const toast = useToast();
  const [tick, setTick] = React.useState(0);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [detail, setDetail] = React.useState<ApplicationRow | null>(null);
  const [reviewing, setReviewing] = React.useState<{
    row: ApplicationRow;
    nextStatus: ApplicationStatus;
  } | null>(null);
  const [reviewNote, setReviewNote] = React.useState("");
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // In-person batches — needed so an approval can place the student into one.
  const [physicalClasses, setPhysicalClasses] = React.useState<PhysicalClass[]>([]);
  React.useEffect(() => {
    fetch("/api/admin/physical-classes")
      .then((r) => (r.ok ? r.json() : { classes: [] }))
      .then((data) => setPhysicalClasses(data.classes ?? []))
      .catch(() => setPhysicalClasses([]));
  }, [tick]);

  const refresh = () => setTick((t) => t + 1);
  const rows = React.useMemo(() => admin.listApplications(), [admin, tick]);

  const counts = React.useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    }),
    [rows],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.studentEmail.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q) ||
        r.cnic.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  // Batches that belong to the application's course.
  const batchesForReview = React.useMemo(() => {
    if (!reviewing) return [];
    return physicalClasses.filter((pc) => pc.courseId === reviewing.row.courseId);
  }, [reviewing, physicalClasses]);

  function openReview(row: ApplicationRow, status: ApplicationStatus) {
    setReviewing({ row, nextStatus: status });
    setReviewNote(row.reviewNote ?? "");
    if (status === "approved") {
      const courseBatches = physicalClasses.filter((pc) => pc.courseId === row.courseId);
      // Pre-select the existing placement, or the only batch if there's just one.
      setSelectedClassId(
        row.physicalClassId ?? (courseBatches.length === 1 ? courseBatches[0].id : ""),
      );
    } else {
      setSelectedClassId("");
    }
  }

  async function confirmReview() {
    if (!reviewing) return;
    if (reviewing.nextStatus === "approved" && !selectedClassId) {
      toast.push({
        title: "Select a batch",
        description: "Choose which in-person batch to place this student in.",
        tone: "danger",
      });
      return;
    }
    setSubmitting(true);
    const res = await admin.setApplicationStatus(
      reviewing.row.id,
      reviewing.nextStatus,
      reviewNote.trim() || undefined,
      reviewing.nextStatus === "approved" ? selectedClassId : undefined,
    );
    setSubmitting(false);
    if (!res.ok) {
      toast.push({
        title: "Couldn't update application",
        description: res.error,
        tone: "danger",
      });
      return;
    }
    toast.push({
      title:
        reviewing.nextStatus === "approved"
          ? "Application approved & student placed"
          : reviewing.nextStatus === "rejected"
            ? "Application rejected"
            : "Application updated",
      tone: reviewing.nextStatus === "approved" ? "success" : "info",
    });
    setReviewing(null);
    setReviewNote("");
    setSelectedClassId("");
    refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">In-person applications</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Review applications and place approved students into a physical class batch.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Tabs
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "pending", label: "Pending", count: counts.pending },
            { value: "approved", label: "Approved", count: counts.approved },
            { value: "rejected", label: "Rejected", count: counts.rejected },
          ]}
        />
        <div className="md:w-80">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, course, CNIC…"
            icon={<Icon.Search size={16} />}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Calendar size={28} />}
              title="No applications"
              description={
                rows.length === 0
                  ? "Students haven't submitted any in-person applications yet."
                  : "No applications match the current filter."
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
                  <Th>Campus / Batch</Th>
                  <Th>Placement</Th>
                  <Th>Submitted</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/50"
                  >
                    <Td>
                      <div className="font-medium">{row.studentName}</div>
                      <div className="text-xs text-[var(--muted)]">{row.studentEmail}</div>
                    </Td>
                    <Td>
                      <div className="font-medium truncate max-w-[18ch]">{row.courseTitle}</div>
                      <div className="text-xs text-[var(--muted)]">{row.instructor}</div>
                    </Td>
                    <Td>
                      <div className="text-xs">{row.campus}</div>
                      <div className="text-xs text-[var(--muted)]">{row.batch}</div>
                    </Td>
                    <Td>
                      {row.physicalClassTitle ? (
                        <span className="text-xs inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Icon.CheckCircle size={12} /> {row.physicalClassTitle}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted-2)]">—</span>
                      )}
                    </Td>
                    <Td className="text-xs text-[var(--muted)]">{relativeTime(row.submittedAt)}</Td>
                    <Td>
                      <Badge variant={STATUS_BADGE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDetail(row)}
                          title="View details"
                        >
                          <Icon.Eye size={14} />
                        </Button>
                        {row.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="soft"
                            onClick={() => openReview(row, "approved")}
                            title="Approve"
                          >
                            <Icon.Check size={14} /> Approve
                          </Button>
                        )}
                        {row.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openReview(row, "rejected")}
                            title="Reject"
                          >
                            <Icon.X size={14} /> Reject
                          </Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        size="lg"
        title={detail ? `Application — ${detail.studentName}` : ""}
      >
        {detail && (
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_BADGE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
              <span className="text-xs text-[var(--muted)]">
                Submitted {relativeTime(detail.submittedAt)}
              </span>
              {detail.reviewedAt && (
                <span className="text-xs text-[var(--muted)]">
                  · Reviewed {relativeTime(detail.reviewedAt)}
                </span>
              )}
            </div>

            <DetailGroup title="Course">
              <DetailRow label="Title" value={detail.courseTitle} />
              <DetailRow label="Category" value={detail.courseCategory} />
              <DetailRow label="Instructor" value={detail.instructor} />
            </DetailGroup>

            <DetailGroup title="Personal">
              <DetailRow label="Full name" value={detail.fullName} />
              <DetailRow label="Father / Guardian" value={detail.fatherName} />
              <DetailRow label="Email" value={detail.email} />
              <DetailRow label="Phone" value={detail.phone} />
              <DetailRow label="CNIC / ID" value={detail.cnic} />
              <DetailRow label="Date of birth" value={detail.dateOfBirth} />
              <DetailRow label="Address" value={`${detail.address}, ${detail.city}`} />
            </DetailGroup>

            <DetailGroup title="Education">
              <DetailRow label="Qualification" value={detail.education} />
              <DetailRow label="Institute" value={detail.institute} />
              <DetailRow label="Passing year" value={detail.passingYear} />
              <DetailRow label="Marks" value={`${detail.obtainedMarks} / ${detail.totalMarks}`} />
            </DetailGroup>

            <DetailGroup title="Class preferences">
              <DetailRow label="Campus" value={detail.campus} />
              <DetailRow label="Batch" value={detail.batch} />
              {detail.motivation && <DetailRow label="Motivation" value={detail.motivation} />}
            </DetailGroup>

            {detail.physicalClassTitle && (
              <DetailGroup title="Placement">
                <DetailRow label="Placed in batch" value={detail.physicalClassTitle} />
              </DetailGroup>
            )}

            {detail.reviewNote && (
              <DetailGroup title="Reviewer note">
                <p className="text-sm text-[var(--muted)]">{detail.reviewNote}</p>
              </DetailGroup>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              {detail.status !== "rejected" && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    openReview(detail, "rejected");
                    setDetail(null);
                  }}
                >
                  <Icon.X size={16} /> Reject
                </Button>
              )}
              {detail.status !== "approved" && (
                <Button
                  onClick={() => {
                    openReview(detail, "approved");
                    setDetail(null);
                  }}
                >
                  <Icon.Check size={16} /> Approve
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Review modal */}
      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        size="md"
        title={reviewing?.nextStatus === "approved" ? "Approve application" : "Reject application"}
      >
        {reviewing && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              {reviewing.nextStatus === "approved" ? "Approve" : "Reject"} the application from{" "}
              <strong className="text-[var(--foreground)]">{reviewing.row.studentName}</strong> for{" "}
              <strong className="text-[var(--foreground)]">{reviewing.row.courseTitle}</strong>?
            </p>

            {reviewing.nextStatus === "approved" && (
              <div>
                <Label>Place into batch</Label>
                {batchesForReview.length === 0 ? (
                  <div className="text-sm rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2.5">
                    No in-person batches exist for this course yet.{" "}
                    <Link href="/admin/physical-classes" className="underline font-semibold">
                      Create a batch
                    </Link>{" "}
                    first, then approve.
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                      <option value="">Select a batch…</option>
                      {batchesForReview.map((pc) => {
                        const full = pc.enrolledCount >= pc.capacity;
                        return (
                          <option key={pc.id} value={pc.id} disabled={full}>
                            {pc.title} — {pc.campus} · {pc.batch} ({pc.enrolledCount}/{pc.capacity})
                            {full ? " — FULL" : ""}
                          </option>
                        );
                      })}
                    </Select>
                    <p className="mt-1 text-xs text-[var(--muted-2)]">
                      The student is enrolled into this batch as soon as you approve.
                    </p>
                  </>
                )}
              </div>
            )}

            <div>
              <Label>Note for the student (optional)</Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={
                  reviewing.nextStatus === "approved"
                    ? "e.g. Welcome! Classes begin on Monday — please arrive 15 minutes early."
                    : "e.g. Unfortunately the batch is full — please consider the next intake."
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setReviewing(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant={reviewing.nextStatus === "approved" ? "primary" : "danger"}
                onClick={confirmReview}
                loading={submitting}
                disabled={
                  reviewing.nextStatus === "approved" &&
                  (batchesForReview.length === 0 || !selectedClassId)
                }
              >
                {reviewing.nextStatus === "approved" ? (
                  <>
                    <Icon.Check size={16} /> Confirm approval
                  </>
                ) : (
                  <>
                    <Icon.X size={16} /> Confirm rejection
                  </>
                )}
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

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-2">
        {title}
      </p>
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">
        {label}
      </span>
      <span className="text-[var(--foreground)] break-words">{value}</span>
    </div>
  );
}
