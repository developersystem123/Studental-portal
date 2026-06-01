"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Skeleton,
  StatCard,
  Tabs,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useData } from "@/lib/store";
import { cn, formatDate, relativeTime } from "@/lib/utils";
import type { ApplicationStatus, PhysicalApplication } from "@/lib/mockData";

type Filter = "all" | ApplicationStatus;

const STATUS_BADGE: Record<ApplicationStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const STATUS_META: Record<ApplicationStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pending: {
    label: "Pending review",
    icon: <Icon.Clock size={15} />,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  approved: {
    label: "Approved",
    icon: <Icon.CheckCircle size={15} />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  rejected: {
    label: "Rejected",
    icon: <Icon.X size={15} />,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
};

export default function StudentApplicationsPage() {
  const { applications, courses, withdrawApplication } = useData();
  const toast = useToast();

  const [filter, setFilter] = React.useState<Filter>("all");
  const [search, setSearch] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [withdrawConfirmId, setWithdrawConfirmId] = React.useState<string | null>(null);
  const [sortDesc, setSortDesc] = React.useState(true);

  const counts = React.useMemo(() => ({
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }), [applications]);

  const filtered = React.useMemo(() => {
    let list = filter === "all" ? applications : applications.filter((a) => a.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => {
        const course = courses.find((c) => c.id === a.courseId);
        return (
          course?.title.toLowerCase().includes(q) ||
          a.campus.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q)
        );
      });
    }
    list = [...list].sort((a, b) => {
      const diff = new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      return sortDesc ? diff : -diff;
    });
    return list;
  }, [applications, filter, search, courses, sortDesc]);

  function handleWithdraw(id: string) {
    withdrawApplication(id);
    setWithdrawConfirmId(null);
    toast.push({ title: "Application withdrawn", description: "Your application has been withdrawn successfully.", tone: "success" });
  }

  const rejectionRate = counts.all > 0 ? Math.round((counts.rejected / counts.all) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">In-Person Applications</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Track and manage your applications for in-person classes.
          </p>
        </div>
        <Link href="/physical-classes">
          <Button variant="outline">
            <Icon.Calendar size={16} /> My classes
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total applications"
            value={counts.all}
            icon={<Icon.FilePen size={20} />}
            tone="primary"
          />
          <StatCard
            label="Pending"
            value={counts.pending}
            icon={<Icon.Clock size={20} />}
            tone="warning"
          />
          <StatCard
            label="Approved"
            value={counts.approved}
            icon={<Icon.CheckCircle size={20} />}
            tone="success"
          />
          <StatCard
            label="Rejected"
            value={counts.rejected}
            icon={<Icon.X size={20} />}
            tone={counts.rejected > 0 ? "warning" : "accent"}
          />
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
        <div className="flex items-center gap-2 sm:ml-auto">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course or campus…"
            icon={<Icon.Search size={15} />}
            className="h-9 w-full sm:w-56"
          />
          <button
            onClick={() => setSortDesc((d) => !d)}
            title={sortDesc ? "Oldest first" : "Newest first"}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition shrink-0"
          >
            {sortDesc ? <Icon.ArrowUp size={15} /> : <Icon.ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Approval rate info */}
      {counts.approved > 0 && (
        <div className="flex items-center gap-2 text-xs text-[var(--muted)] bg-[var(--surface-2)] rounded-xl px-4 py-2.5">
          <Icon.TrendingUp size={14} className="text-emerald-500 shrink-0" />
          <span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {Math.round((counts.approved / counts.all) * 100)}% approval rate
            </span>
            {" "}· {counts.approved} of {counts.all} applications approved
            {rejectionRate > 0 && ` · ${rejectionRate}% rejected`}
          </span>
        </div>
      )}

      {/* Application cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.FilePen size={28} />}
              title={
                applications.length === 0
                  ? "No applications yet"
                  : search
                    ? "No matching applications"
                    : `No ${filter === "all" ? "" : filter} applications`
              }
              description={
                applications.length === 0
                  ? "Apply for any course's in-person classes from the catalog."
                  : "Try a different filter or search term."
              }
              action={
                applications.length === 0 ? (
                  <Link href="/explore">
                    <Button><Icon.Compass size={16} /> Browse courses</Button>
                  </Link>
                ) : undefined
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const course = courses.find((c) => c.id === app.courseId);
            const meta = STATUS_META[app.status];
            const isExpanded = expandedId === app.id;
            const isConfirming = withdrawConfirmId === app.id;

            return (
              <Card key={app.id} className={cn(
                "transition-all",
                app.status === "approved" && "border-emerald-500/20",
                app.status === "rejected" && "border-red-500/20",
              )}>
                <CardBody className="space-y-0 p-0">
                  {/* Status top bar */}
                  <div className={cn("px-4 py-2 rounded-t-2xl flex items-center gap-2 text-xs font-semibold", meta.bg, meta.color)}>
                    {meta.icon}
                    <span>{meta.label}</span>
                    <span className="ml-auto text-[var(--muted)] font-normal">
                      Submitted {relativeTime(app.submittedAt)}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Main row */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="h-16 w-24 rounded-xl overflow-hidden bg-[var(--surface-2)] shrink-0">
                        {course && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-base truncate">
                              {course?.title ?? "Removed course"}
                            </h3>
                            {app.reviewedAt && app.status !== "pending" && (
                              <p className="text-xs text-[var(--muted)] mt-0.5">
                                Reviewed {relativeTime(app.reviewedAt)} · {formatDate(app.reviewedAt)}
                              </p>
                            )}
                          </div>
                          <Badge variant={STATUS_BADGE[app.status]}>{meta.label}</Badge>
                        </div>

                        {/* Application details grid */}
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <Detail label="Campus" value={app.campus} />
                          <Detail label="Batch" value={app.batch} />
                          <Detail label="Education" value={app.education} />
                          <Detail label="Marks" value={`${app.obtainedMarks} / ${app.totalMarks}`} />
                        </div>
                      </div>
                    </div>

                    {/* Application progress timeline */}
                    <div className="flex items-center gap-0">
                      <TimelineStep
                        done
                        label="Applied"
                        date={formatDate(app.submittedAt)}
                        icon={<Icon.FilePen size={12} />}
                      />
                      <div className={cn("flex-1 h-0.5 mx-1", app.reviewedAt ? "bg-[var(--primary)]" : "bg-[var(--border)]")} />
                      <TimelineStep
                        done={!!app.reviewedAt}
                        label="Under review"
                        date={app.reviewedAt ? formatDate(app.reviewedAt) : "Pending"}
                        icon={<Icon.Search size={12} />}
                      />
                      <div className={cn(
                        "flex-1 h-0.5 mx-1",
                        app.status === "approved" ? "bg-emerald-500"
                          : app.status === "rejected" ? "bg-red-500"
                            : "bg-[var(--border)]",
                      )} />
                      <TimelineStep
                        done={app.status !== "pending"}
                        label={app.status === "approved" ? "Approved" : app.status === "rejected" ? "Rejected" : "Decision"}
                        date=""
                        icon={
                          app.status === "approved" ? <Icon.Check size={12} />
                            : app.status === "rejected" ? <Icon.X size={12} />
                              : <Icon.Clock size={12} />
                        }
                        variant={
                          app.status === "approved" ? "success"
                            : app.status === "rejected" ? "danger"
                              : "default"
                        }
                      />
                    </div>

                    {/* Reviewer note */}
                    {app.reviewNote && (
                      <div className={cn(
                        "rounded-xl px-4 py-3 text-xs flex items-start gap-2",
                        app.status === "approved" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : app.status === "rejected" ? "bg-red-500/10 text-red-700 dark:text-red-400"
                            : "bg-[var(--surface-2)] text-[var(--muted)]",
                      )}>
                        <Icon.MessageSquare size={13} className="mt-0.5 shrink-0" />
                        <span>
                          <span className="font-semibold">Reviewer note: </span>
                          {app.reviewNote}
                        </span>
                      </div>
                    )}

                    {/* Expandable full details */}
                    {isExpanded && (
                      <ExpandedDetails app={app} />
                    )}

                    {/* Withdraw confirmation */}
                    {isConfirming && (
                      <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/30 p-4">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Withdraw this application?</p>
                        <p className="text-xs text-red-600/80 dark:text-red-400/70 mb-3">
                          This action cannot be undone. You&apos;ll need to re-apply if you change your mind.
                        </p>
                        <div className="flex gap-2">
                          <Button variant="danger" size="sm" onClick={() => handleWithdraw(app.id)}>
                            <Icon.Trash size={13} /> Yes, withdraw
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setWithdrawConfirmId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Footer actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] flex-wrap gap-2">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1 transition"
                      >
                        {isExpanded ? <Icon.ChevronDown size={13} className="rotate-180" /> : <Icon.ChevronDown size={13} />}
                        {isExpanded ? "Hide details" : "View full application"}
                      </button>
                      <div className="flex items-center gap-2">
                        {app.status === "approved" && app.physicalClassId && (
                          <Link href={`/physical-classes/${app.physicalClassId}`}>
                            <Button size="sm" variant="soft">
                              <Icon.Calendar size={13} /> View class
                            </Button>
                          </Link>
                        )}
                        {app.status === "rejected" && (
                          <Link href="/explore">
                            <Button size="sm" variant="outline">
                              <Icon.Compass size={13} /> Browse other courses
                            </Button>
                          </Link>
                        )}
                        {app.status === "pending" && !isConfirming && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setWithdrawConfirmId(app.id)}
                            className="text-[var(--muted)] hover:text-[var(--danger)]"
                          >
                            <Icon.Trash size={13} /> Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function ExpandedDetails({ app }: { app: PhysicalApplication }) {
  const fields: { label: string; value: string | undefined }[] = [
    { label: "Full name", value: app.fullName },
    { label: "Father's name", value: app.fatherName },
    { label: "Email", value: app.email },
    { label: "Phone", value: app.phone },
    { label: "CNIC", value: app.cnic },
    { label: "Date of birth", value: app.dateOfBirth },
    { label: "Address", value: app.address },
    { label: "City", value: app.city },
    { label: "Institute", value: app.institute },
    { label: "Passing year", value: app.passingYear },
  ];

  return (
    <Card className="bg-[var(--surface-2)] border-dashed">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon.User size={14} /> Full application details
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
          {fields.map(({ label, value }) =>
            value ? <Detail key={label} label={label} value={value} /> : null,
          )}
        </div>
        {app.motivation && (
          <div className="mt-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-1">
              Motivation / Statement
            </p>
            <p className="text-sm text-[var(--muted)] leading-relaxed italic bg-[var(--surface)] rounded-lg px-3 py-2">
              &ldquo;{app.motivation}&rdquo;
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function TimelineStep({
  done,
  label,
  date,
  icon,
  variant = "primary",
}: {
  done: boolean;
  label: string;
  date: string;
  icon: React.ReactNode;
  variant?: "primary" | "success" | "danger" | "default";
}) {
  const colorMap = {
    primary: done ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)]",
    success: "bg-emerald-500 text-white",
    danger: "bg-red-500 text-white",
    default: "bg-[var(--surface-2)] text-[var(--muted)]",
  };
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center", done ? colorMap[variant] : colorMap.default)}>
        {icon}
      </div>
      <p className="text-[10px] font-medium text-[var(--foreground)] whitespace-nowrap">{label}</p>
      {date && <p className="text-[9px] text-[var(--muted)]">{date}</p>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">{label}</p>
      <p className="text-[var(--foreground)] font-medium truncate">{value}</p>
    </div>
  );
}
