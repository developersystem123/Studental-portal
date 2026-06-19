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
  StatCard,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useAdmin, type ApplicationRow } from "@/lib/store";
import { relativeTime, cn } from "@/lib/utils";
import type { ApplicationStatus, PhysicalClass } from "@/lib/mockData";

type Filter   = "all" | ApplicationStatus;
type SortKey  = "student" | "course" | "submitted" | "status";
type SortDir  = "asc" | "desc";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "Pending", approved: "Approved", rejected: "Rejected",
};
const STATUS_BADGE: Record<ApplicationStatus, "warning" | "success" | "danger"> = {
  pending: "warning", approved: "success", rejected: "danger",
};
const STATUS_ORDER: Record<ApplicationStatus, number> = {
  pending: 0, approved: 1, rejected: 2,
};

function exportCSV(rows: ApplicationRow[]) {
  const header = ["Student", "Email", "Course", "Instructor", "Campus", "Batch", "CNIC", "Status", "Submitted", "Placement"];
  const data = rows.map((r) => [
    `"${r.studentName}"`, `"${r.studentEmail}"`,
    `"${r.courseTitle}"`, `"${r.instructor}"`,
    `"${r.campus}"`, `"${r.batch}"`, `"${r.cnic}"`,
    r.status,
    new Date(r.submittedAt).toLocaleDateString(),
    `"${r.physicalClassTitle ?? ""}"`,
  ]);
  const csv = [header, ...data].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "applications.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminApplicationsPage() {
  const admin = useAdmin();
  const toast = useToast();

  const [filter,        setFilter]        = React.useState<Filter>("all");
  const [query,         setQuery]         = React.useState("");
  const [courseFilter,  setCourseFilter]  = React.useState("all");
  const [sortKey,       setSortKey]       = React.useState<SortKey>("submitted");
  const [sortDir,       setSortDir]       = React.useState<SortDir>("desc");
  const [page,          setPage]          = React.useState(1);
  const [selected,      setSelected]      = React.useState<Set<string>>(new Set());
  const [detail,        setDetail]        = React.useState<ApplicationRow | null>(null);
  const [reviewing,     setReviewing]     = React.useState<{ row: ApplicationRow; nextStatus: ApplicationStatus } | null>(null);
  const [bulkAction,    setBulkAction]    = React.useState<ApplicationStatus | null>(null);
  const [reviewNote,    setReviewNote]    = React.useState("");
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [submitting,    setSubmitting]    = React.useState(false);

  const [physicalClasses, setPhysicalClasses] = React.useState<PhysicalClass[]>([]);

  const fetchPhysicalClasses = React.useCallback(() => {
    fetch("/api/admin/physical-classes")
      .then((r) => (r.ok ? r.json() : { classes: [] }))
      .then((data) => setPhysicalClasses(data.classes ?? []))
      .catch(() => setPhysicalClasses([]));
  }, []);

  React.useEffect(() => { fetchPhysicalClasses(); }, [fetchPhysicalClasses]);

  const refresh = React.useCallback(async () => {
    await Promise.all([admin.refresh(), fetchPhysicalClasses()]);
    setSelected(new Set());
  }, [admin, fetchPhysicalClasses]);

  const rows = React.useMemo(() => admin.listApplications(), [admin]);

  const courseOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.courseId, r.courseTitle));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const counts = React.useMemo(() => ({
    all:      rows.length,
    pending:  rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  }), [rows]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter !== "all" && r.status !== filter) return false;
        if (courseFilter !== "all" && r.courseId !== courseFilter) return false;
        if (!q) return true;
        return (
          r.studentName.toLowerCase().includes(q)  ||
          r.studentEmail.toLowerCase().includes(q) ||
          r.courseTitle.toLowerCase().includes(q)  ||
          r.cnic.toLowerCase().includes(q)         ||
          r.campus.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "student")   cmp = a.studentName.localeCompare(b.studentName);
        if (sortKey === "course")    cmp = a.courseTitle.localeCompare(b.courseTitle);
        if (sortKey === "submitted") cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        if (sortKey === "status")    cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [rows, filter, query, courseFilter, sortKey, sortDir]);

  React.useEffect(() => { setPage(1); setSelected(new Set()); }, [query, filter, courseFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allPageSelected = paginated.length > 0 && paginated.every((r) => selected.has(r.id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paginated.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        paginated.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <Icon.ChevronDown size={11} className="opacity-30" />;
    return sortDir === "asc"
      ? <Icon.ChevronDown size={11} className="text-[var(--primary)] rotate-180" />
      : <Icon.ChevronDown size={11} className="text-[var(--primary)]" />;
  }

  const batchesForReview = React.useMemo(() => {
    if (!reviewing) return [];
    return physicalClasses.filter((pc) => pc.courseId === reviewing.row.courseId);
  }, [reviewing, physicalClasses]);

  function openReview(row: ApplicationRow, status: ApplicationStatus) {
    setReviewing({ row, nextStatus: status });
    setReviewNote(row.reviewNote ?? "");
    if (status === "approved") {
      const batches = physicalClasses.filter((pc) => pc.courseId === row.courseId);
      setSelectedClassId(row.physicalClassId ?? (batches.length === 1 ? batches[0].id : ""));
    } else {
      setSelectedClassId("");
    }
  }

  async function confirmReview() {
    if (!reviewing) return;
    if (reviewing.nextStatus === "approved" && !selectedClassId) {
      toast.push({ title: "Select a batch", description: "Choose which batch to place this student in.", tone: "danger" });
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
    if (!res.ok) { toast.push({ title: "Couldn't update", description: res.error, tone: "danger" }); return; }
    toast.push({
      title: reviewing.nextStatus === "approved" ? "Application approved" : "Application rejected",
      tone: reviewing.nextStatus === "approved" ? "success" : "info",
    });
    setReviewing(null); setReviewNote(""); setSelectedClassId("");
    refresh();
  }

  async function confirmBulk() {
    if (!bulkAction || selected.size === 0) return;
    setSubmitting(true);
    const ids = Array.from(selected);
    for (const id of ids) {
      await admin.setApplicationStatus(id, bulkAction);
    }
    setSubmitting(false);
    toast.push({ title: `${ids.length} application${ids.length > 1 ? "s" : ""} ${bulkAction}`, tone: bulkAction === "approved" ? "success" : "info" });
    setBulkAction(null);
    refresh();
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">In-Person Applications</h1>
          <p className="mt-1 text-[var(--muted)]">Review applications and place approved students into a physical class batch.</p>
        </div>
        <Button variant="outline" onClick={() => { exportCSV(filtered); toast.push({ title: "CSV exported", tone: "success" }); }}>
          <Icon.Download size={15} /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"    value={counts.all}      icon={<Icon.Tag size={16} />}         tone="primary" delta="All applications" />
        <StatCard label="Pending"  value={counts.pending}  icon={<Icon.Clock size={16} />}       tone="warning" delta="Awaiting review" />
        <StatCard label="Approved" value={counts.approved} icon={<Icon.CheckCircle size={16} />} tone="success" delta="Placed in batch" />
        <StatCard label="Rejected" value={counts.rejected} icon={<Icon.X size={16} />}           tone="accent"  delta="Not accepted" />
      </div>

      <Card>
        <CardBody className="space-y-4">
          {/* Filters — one row */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="-mx-1 px-1 overflow-x-auto">
              <Tabs
                value={filter}
                onChange={(v) => { setFilter(v as Filter); }}
                options={[
                  { value: "all",      label: "All",      count: counts.all },
                  { value: "pending",  label: "Pending",  count: counts.pending },
                  { value: "approved", label: "Approved", count: counts.approved },
                  { value: "rejected", label: "Rejected", count: counts.rejected },
                ]}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto lg:shrink-0">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, CNIC…"
                icon={<Icon.Search size={15} />}
                className="!h-9 w-full sm:!w-52"
              />
              <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="!h-9 w-full sm:!w-40 sm:shrink-0">
                <option value="all">All courses</option>
                {courseOptions.map(([id, title]) => (
                  <option key={id} value={id}>{title.length > 28 ? title.slice(0, 26) + "…" : title}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex-wrap">
              <span className="text-sm font-semibold text-[var(--primary)]">{selected.size} selected</span>
              <div className="flex gap-2 ml-auto flex-wrap">
                <Button size="sm" onClick={() => setBulkAction("approved")}>
                  <Icon.Check size={13} /> Approve all
                </Button>
                <Button size="sm" variant="ghost" className="text-[var(--danger)] hover:bg-red-500/10" onClick={() => setBulkAction("rejected")}>
                  <Icon.X size={13} /> Reject all
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Calendar size={28} />}
              title="No applications"
              description={rows.length === 0 ? "No in-person applications submitted yet." : "No applications match the current filter."}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAll}
                          className="rounded accent-[var(--primary)] cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("student")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Student <SortIcon col="student" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("course")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Course <SortIcon col="course" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Campus / Batch</th>
                      <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Placement</th>
                      <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                        <button onClick={() => toggleSort("submitted")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Submitted <SortIcon col="submitted" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Status <SortIcon col="status" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginated.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "hover:bg-[var(--surface-2)]/60 transition-colors group",
                          selected.has(row.id) && "bg-[var(--primary-soft)]/40",
                        )}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(row.id)}
                            onChange={() => toggleSelect(row.id)}
                            className="rounded accent-[var(--primary)] cursor-pointer"
                          />
                        </td>
                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {row.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{row.studentName}</p>
                              <p className="text-xs text-[var(--muted)] truncate">{row.studentEmail}</p>
                            </div>
                          </div>
                        </td>
                        {/* Course */}
                        <td className="px-4 py-3">
                          <p className="font-medium truncate max-w-[180px]" title={row.courseTitle}>{row.courseTitle}</p>
                          <p className="text-xs text-[var(--muted)] truncate">{row.instructor}</p>
                        </td>
                        {/* Campus/Batch */}
                        <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                          <p className="text-xs font-medium">{row.campus}</p>
                          <p className="text-xs text-[var(--muted)]">{row.batch}</p>
                        </td>
                        {/* Placement */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {row.physicalClassTitle ? (
                            <span className="text-xs inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <Icon.CheckCircle size={12} />
                              <span className="truncate max-w-[140px]">{row.physicalClassTitle}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--muted-2)]">—</span>
                          )}
                        </td>
                        {/* Submitted */}
                        <td className="px-4 py-3 text-xs text-[var(--muted)] hidden md:table-cell whitespace-nowrap">
                          {relativeTime(row.submittedAt)}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_BADGE[row.status]}>
                            {row.status === "pending" && <Icon.Clock size={11} />}
                            {row.status === "approved" && <Icon.CheckCircle size={11} />}
                            {row.status === "rejected" && <Icon.X size={11} />}
                            {STATUS_LABEL[row.status]}
                          </Badge>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setDetail(row)}
                              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] transition opacity-0 group-hover:opacity-100"
                              title="View details"
                            >
                              <Icon.Eye size={14} />
                            </button>
                            {row.status !== "approved" && (
                              <button
                                onClick={() => openReview(row, "approved")}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition opacity-0 group-hover:opacity-100"
                                title="Approve"
                              >
                                <Icon.Check size={12} /> Approve
                              </button>
                            )}
                            {row.status !== "rejected" && (
                              <button
                                onClick={() => openReview(row, "rejected")}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100"
                                title="Reject"
                              >
                                <Icon.X size={12} /> Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                <p className="text-xs text-[var(--muted)]">
                  Showing <span className="font-semibold text-[var(--foreground)]">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                  <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> applications
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(1)} title="First">
                    <Icon.ChevronLeft size={13} /><Icon.ChevronLeft size={13} className="-ml-2" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <Icon.ChevronLeft size={13} /> Prev
                  </Button>
                  <div className="flex items-center gap-1 mx-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, i, arr) => {
                        if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span key={`e-${i}`} className="px-1 text-[var(--muted)] text-sm">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            className={cn(
                              "h-8 w-8 rounded-lg text-xs font-semibold transition",
                              page === p
                                ? "bg-[var(--primary)] text-white"
                                : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                            )}
                          >{p}</button>
                        )
                      )}
                  </div>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <Icon.ChevronRight size={13} />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(totalPages)} title="Last">
                    <Icon.ChevronRight size={13} /><Icon.ChevronRight size={13} className="-ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} size="lg" title={detail ? `Application — ${detail.studentName}` : ""}>
        {detail && (
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl bg-[var(--surface-2)]">
              <Badge variant={STATUS_BADGE[detail.status]}>
                {STATUS_LABEL[detail.status]}
              </Badge>
              <span className="text-xs text-[var(--muted)]">Submitted {relativeTime(detail.submittedAt)}</span>
              {detail.reviewedAt && <span className="text-xs text-[var(--muted)]">· Reviewed {relativeTime(detail.reviewedAt)}</span>}
            </div>

            <DetailGroup title="Course">
              <DetailRow label="Title"      value={detail.courseTitle} />
              <DetailRow label="Category"   value={detail.courseCategory} />
              <DetailRow label="Instructor" value={detail.instructor} />
            </DetailGroup>

            <DetailGroup title="Personal">
              <DetailRow label="Full name"        value={detail.fullName} />
              <DetailRow label="Father / Guardian" value={detail.fatherName} />
              <DetailRow label="Email"             value={detail.email} />
              <DetailRow label="Phone"             value={detail.phone} />
              <DetailRow label="CNIC / ID"         value={detail.cnic} />
              <DetailRow label="Date of birth"     value={detail.dateOfBirth} />
              <DetailRow label="Address"           value={`${detail.address}, ${detail.city}`} />
            </DetailGroup>

            <DetailGroup title="Education">
              <DetailRow label="Qualification" value={detail.education} />
              <DetailRow label="Institute"     value={detail.institute} />
              <DetailRow label="Passing year"  value={detail.passingYear} />
              <DetailRow label="Marks"         value={`${detail.obtainedMarks} / ${detail.totalMarks}`} />
            </DetailGroup>

            <DetailGroup title="Class preferences">
              <DetailRow label="Campus" value={detail.campus} />
              <DetailRow label="Batch"  value={detail.batch} />
              {detail.motivation && <DetailRow label="Motivation" value={detail.motivation} />}
            </DetailGroup>

            {detail.physicalClassTitle && (
              <DetailGroup title="Placement">
                <DetailRow label="Placed in batch" value={detail.physicalClassTitle} />
              </DetailGroup>
            )}
            {detail.reviewNote && (
              <DetailGroup title="Reviewer note">
                <p className="text-sm text-[var(--muted)] col-span-2">{detail.reviewNote}</p>
              </DetailGroup>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              {detail.status !== "rejected" && (
                <Button variant="ghost" className="text-[var(--danger)]" onClick={() => { openReview(detail, "rejected"); setDetail(null); }}>
                  <Icon.X size={15} /> Reject
                </Button>
              )}
              {detail.status !== "approved" && (
                <Button onClick={() => { openReview(detail, "approved"); setDetail(null); }}>
                  <Icon.Check size={15} /> Approve
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
            <div className="p-3 rounded-xl bg-[var(--surface-2)] text-sm space-y-1">
              <p><span className="text-[var(--muted)]">Student:</span> <span className="font-semibold">{reviewing.row.studentName}</span></p>
              <p><span className="text-[var(--muted)]">Course:</span> <span className="font-semibold">{reviewing.row.courseTitle}</span></p>
            </div>

            {reviewing.nextStatus === "approved" && (
              <div>
                <Label>Place into batch</Label>
                {batchesForReview.length === 0 ? (
                  <div className="text-sm rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2.5">
                    No batches exist for this course yet.{" "}
                    <Link href="/admin/physical-classes" className="underline font-semibold">Create a batch</Link> first.
                  </div>
                ) : (
                  <>
                    <Select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                      <option value="">Select a batch…</option>
                      {batchesForReview.map((pc) => {
                        const full = pc.enrolledCount >= pc.capacity;
                        return (
                          <option key={pc.id} value={pc.id} disabled={full}>
                            {pc.title} — {pc.campus} · {pc.batch} ({pc.enrolledCount}/{pc.capacity}){full ? " — FULL" : ""}
                          </option>
                        );
                      })}
                    </Select>
                    <p className="mt-1 text-xs text-[var(--muted-2)]">Student is placed into this batch on approval.</p>
                  </>
                )}
              </div>
            )}

            <div>
              <Label>Note for the student <span className="text-[var(--muted)] font-normal">(optional)</span></Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={reviewing.nextStatus === "approved"
                  ? "e.g. Welcome! Classes begin on Monday — please arrive 15 minutes early."
                  : "e.g. Unfortunately the batch is full — please consider the next intake."}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setReviewing(null)} disabled={submitting}>Cancel</Button>
              <Button
                variant={reviewing.nextStatus === "approved" ? "primary" : "danger"}
                onClick={confirmReview}
                loading={submitting}
                disabled={reviewing.nextStatus === "approved" && (batchesForReview.length === 0 || !selectedClassId)}
              >
                {reviewing.nextStatus === "approved"
                  ? <><Icon.Check size={15} /> Confirm approval</>
                  : <><Icon.X size={15} /> Confirm rejection</>
                }
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk action confirmation */}
      <Modal open={!!bulkAction} onClose={() => setBulkAction(null)} size="sm"
        title={bulkAction === "approved" ? `Approve ${selected.size} applications?` : `Reject ${selected.size} applications?`}>
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This will <strong className="text-[var(--foreground)]">{bulkAction}</strong> all{" "}
            <strong className="text-[var(--foreground)]">{selected.size}</strong> selected application{selected.size > 1 ? "s" : ""}.
            {bulkAction === "approved" && " Students will need individual batch placement — use this for bulk rejection only, or approve one-by-one for batch placement."}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkAction(null)} disabled={submitting}>Cancel</Button>
            <Button variant={bulkAction === "approved" ? "primary" : "danger"} loading={submitting} onClick={confirmBulk}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-3">{title}</p>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">{label}</span>
      <span className="text-[var(--foreground)] break-words">{value}</span>
    </div>
  );
}
