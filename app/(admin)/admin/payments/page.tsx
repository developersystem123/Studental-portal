"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  Select,
  StatCard,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { formatDate, relativeTime } from "@/lib/utils";

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  txnId: string | null;
  description: string;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string | null;
  courseTitle: string | null;
};

type Summary = {
  grossRevenue: number;
  refunded: number;
  pending: number;
  failed: number;
  transactions: number;
  currency: string;
};

type Filter = "all" | PaymentStatus;
type SortKey = "newest" | "oldest" | "amount-desc" | "amount-asc";
type DateRange = "all" | "today" | "week" | "month";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};

const STATUS_BADGE: Record<PaymentStatus, "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  completed: "success",
  failed: "danger",
  refunded: "info",
};

const STATUS_AMOUNT_CLS: Record<PaymentStatus, string> = {
  completed: "text-emerald-600 dark:text-emerald-400",
  pending: "text-amber-600 dark:text-amber-400",
  failed: "text-rose-500 dark:text-rose-400 line-through opacity-70",
  refunded: "text-sky-500 dark:text-sky-400",
};

const STATUS_BORDER: Record<PaymentStatus, string> = {
  completed: "border-l-emerald-400",
  pending: "border-l-amber-400",
  failed: "border-l-rose-400",
  refunded: "border-l-sky-400",
};

const PAGE_SIZE = 10;

function money(amount: number, currency = "PKR") {
  if (currency === "PKR" || currency === "pkr") {
    return `Rs ${Math.round(amount).toLocaleString("en-PK")}`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function avatarColor(name: string) {
  const colors = [
    "from-violet-500 to-purple-400",
    "from-blue-500 to-sky-400",
    "from-emerald-500 to-green-400",
    "from-amber-500 to-orange-400",
    "from-rose-500 to-pink-400",
    "from-teal-500 to-cyan-400",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

function isInRange(iso: string, range: DateRange): boolean {
  if (range === "all") return true;
  const d = new Date(iso);
  const now = new Date();
  if (range === "today") {
    return d.toDateString() === now.toDateString();
  }
  if (range === "week") {
    const diff = now.getTime() - d.getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }
  if (range === "month") {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
}

function exportCSV(payments: Payment[]) {
  const header = [
    "User", "Email", "Description", "Course", "Method",
    "Amount", "Currency", "Status", "TXN ID", "Date",
  ];
  const rows = payments.map((p) => [
    `"${p.userName.replace(/"/g, '""')}"`,
    p.userEmail,
    `"${p.description.replace(/"/g, '""')}"`,
    `"${(p.courseTitle ?? "").replace(/"/g, '""')}"`,
    p.method,
    money(p.amount, p.currency),
    p.currency,
    p.status,
    p.txnId ?? "",
    new Date(p.createdAt).toLocaleDateString(),
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "payments.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
};

export default function AdminPaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("newest");
  const [dateRange, setDateRange] = React.useState<DateRange>("all");
  const [managing, setManaging] = React.useState<Payment | null>(null);
  const [nextStatus, setNextStatus] = React.useState<PaymentStatus>("completed");
  const [saving, setSaving] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payments", { credentials: "same-origin" });
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments ?? []);
        setSummary(data.summary ?? null);
      } else {
        toast.push({ title: data.error ?? "Failed to load payments.", tone: "danger" });
      }
    } catch {
      toast.push({ title: "Failed to load payments.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { setPage(1); }, [filter, query, sortKey, dateRange]);

  const counts = React.useMemo(
    () => ({
      all: payments.length,
      completed: payments.filter((p) => p.status === "completed").length,
      pending: payments.filter((p) => p.status === "pending").length,
      failed: payments.filter((p) => p.status === "failed").length,
      refunded: payments.filter((p) => p.status === "refunded").length,
    }),
    [payments],
  );

  // Method breakdown
  const methodBreakdown = React.useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    for (const p of payments.filter((p) => p.status === "completed")) {
      const m = p.method || "Other";
      if (!map[m]) map[m] = { count: 0, amount: 0 };
      map[m].count++;
      map[m].amount += p.amount;
    }
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
  }, [payments]);

  const currency = summary?.currency ?? "USD";
  const netRevenue = (summary?.grossRevenue ?? 0) - (summary?.refunded ?? 0);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments
      .filter((p) => {
        if (filter !== "all" && p.status !== filter) return false;
        if (!isInRange(p.createdAt, dateRange)) return false;
        if (!q) return true;
        return (
          p.userName.toLowerCase().includes(q) ||
          p.userEmail.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.courseTitle ?? "").toLowerCase().includes(q) ||
          (p.txnId ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortKey === "oldest")
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortKey === "amount-desc") return b.amount - a.amount;
        if (sortKey === "amount-asc") return a.amount - b.amount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [payments, filter, query, sortKey, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function openManage(p: Payment) {
    setManaging(p);
    setNextStatus(p.status);
  }

  async function saveStatus() {
    if (!managing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/payments/${managing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push({ title: data.error ?? "Update failed.", tone: "danger" });
        return;
      }
      setPayments((prev) =>
        prev.map((p) => (p.id === managing.id ? { ...p, status: nextStatus } : p)),
      );
      toast.push({
        title: nextStatus === "refunded" ? "Payment refunded" : "Payment updated",
        tone: "success",
      });
      setManaging(null);
      load();
    } catch {
      toast.push({ title: "Update failed.", tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  function copyTxn(txnId: string) {
    navigator.clipboard.writeText(txnId).then(() => {
      toast.push({ title: "Transaction ID copied", tone: "success" });
    }).catch(() => {
      toast.push({ title: "Copy failed", tone: "danger" });
    });
  }

  return (
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Manage
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Payments &amp; revenue</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Every transaction on the platform — track revenue, settle pending charges, and issue
            refunds.
          </p>
        </div>
        <Button variant="outline" onClick={() => exportCSV(filtered)}>
          <Icon.Download size={15} /> Export CSV
        </Button>
      </div>

      {/* ── StatCards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Gross revenue"
          value={money(summary?.grossRevenue ?? 0, currency)}
          icon={<Icon.DollarSign size={18} />}
          tone="success"
          delta={`${summary?.transactions ?? 0} paid`}
        />
        <StatCard
          label="Net revenue"
          value={money(netRevenue, currency)}
          icon={<Icon.TrendingUp size={18} />}
          tone="primary"
        />
        <StatCard
          label="Pending"
          value={summary?.pending ?? 0}
          icon={<Icon.Clock size={18} />}
          tone="warning"
        />
        <StatCard
          label="Failed"
          value={summary?.failed ?? 0}
          icon={<Icon.AlertCircle size={18} />}
          tone="warning"
        />
      </div>

      {/* ── Revenue method breakdown ── */}
      {methodBreakdown.length > 0 && (
        <Card>
          <CardBody className="py-4">
            <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
              Revenue by payment method
            </p>
            <div className="flex flex-wrap gap-3">
              {methodBreakdown.map(([method, { count, amount }]) => {
                const pct =
                  summary?.grossRevenue
                    ? Math.round((amount / summary.grossRevenue) * 100)
                    : 0;
                return (
                  <div
                    key={method}
                    className="flex-1 min-w-[140px] rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold capitalize text-[var(--foreground)]">
                        {method}
                      </span>
                      <span className="text-[11px] text-[var(--muted)]">{count} txn{count !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums">{money(amount, currency)}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--muted)] mt-1">{pct}% of gross</p>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Controls ── */}
      <div className="space-y-3">
        {/* Scrollable tab bar */}
        <div className="overflow-x-auto pb-1">
          <div className="flex p-1 rounded-xl bg-[var(--surface-2)] gap-1 w-max min-w-full">
            {([
              { value: "all",       label: "All",       count: counts.all },
              { value: "completed", label: "Completed", count: counts.completed },
              { value: "pending",   label: "Pending",   count: counts.pending },
              { value: "failed",    label: "Failed",    count: counts.failed },
              { value: "refunded",  label: "Refunded",  count: counts.refunded },
            ] as { value: Filter; label: string; count: number }[]).map((o) => (
              <button
                key={o.value}
                onClick={() => setFilter(o.value)}
                className={`px-3 h-9 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  filter === o.value
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {o.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === o.value
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "bg-[var(--surface-2)]"
                }`}>
                  {o.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search payments…"
            icon={<Icon.Search size={16} />}
            className="flex-1 !h-9"
          />
          <Select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="!h-9 text-xs !py-0 w-full sm:w-[148px]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </Select>
        </div>

        {/* Date range chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[var(--muted)] shrink-0">Period:</span>
          {(["all", "today", "week", "month"] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`h-7 px-3 rounded-full text-xs font-medium transition whitespace-nowrap ${
                dateRange === r
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {DATE_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
              <Icon.Loader size={18} className="animate-spin" /> Loading payments…
            </div>
          </CardBody>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.CreditCard size={28} />}
              title="No payments"
              description={
                payments.length === 0
                  ? "No transactions have been recorded yet."
                  : "No payments match the current filter."
              }
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                  <tr>
                    <Th>User</Th>
                    <Th className="hidden md:table-cell">Description</Th>
                    <Th className="hidden sm:table-cell">Method</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Status</Th>
                    <Th className="hidden lg:table-cell">Date</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => openManage(p)}
                      className={`border-t border-[var(--border)] border-l-2 ${STATUS_BORDER[p.status]} hover:bg-[var(--surface-2)]/50 transition cursor-pointer group`}
                    >
                      {/* User */}
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatarColor(p.userName)} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                          >
                            {p.userName.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate max-w-[14ch]">{p.userName}</div>
                            <div className="text-xs text-[var(--muted)] truncate max-w-[16ch]">
                              {p.userEmail}
                            </div>
                          </div>
                        </div>
                      </Td>

                      {/* Description */}
                      <Td className="hidden md:table-cell">
                        <div className="font-medium truncate max-w-[22ch]">{p.description}</div>
                        {p.courseTitle && (
                          <div className="text-xs text-[var(--muted)] truncate max-w-[22ch]">
                            {p.courseTitle}
                          </div>
                        )}
                        {p.txnId && (
                          <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5 truncate max-w-[18ch]">
                            #{p.txnId}
                          </div>
                        )}
                      </Td>

                      {/* Method */}
                      <Td className="hidden sm:table-cell">
                        <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-medium">
                          {p.method}
                        </span>
                      </Td>

                      {/* Amount */}
                      <Td className="text-right">
                        <span className={`font-bold tabular-nums ${STATUS_AMOUNT_CLS[p.status]}`}>
                          {p.status === "refunded" && (
                            <Icon.ArrowLeft size={11} className="inline mr-0.5 -mt-0.5" />
                          )}
                          {money(p.amount, p.currency)}
                        </span>
                      </Td>

                      {/* Status */}
                      <Td>
                        <Badge variant={STATUS_BADGE[p.status]}>
                          {STATUS_LABEL[p.status]}
                        </Badge>
                      </Td>

                      {/* Date */}
                      <Td className="hidden lg:table-cell text-xs text-[var(--muted)]">
                        {formatDate(p.createdAt)}
                      </Td>

                      {/* Actions */}
                      <Td
                        className="text-right"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openManage(p)}
                          title="Manage payment"
                          className="h-8 px-3 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition opacity-70 group-hover:opacity-100"
                        >
                          Manage
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="px-4 py-3 border-t border-[var(--border)]">
              <PaymentPagination
                page={safePage}
                totalPages={totalPages}
                total={filtered.length}
                onChange={setPage}
              />
            </div>
          </Card>
        </>
      )}

      {/* ── Manage modal ── */}
      <Modal
        open={!!managing}
        onClose={() => setManaging(null)}
        size="md"
        title="Payment details"
      >
        {managing && (
          <div className="p-5 space-y-5">
            {/* Amount hero */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
                  Amount
                </p>
                <p className={`text-3xl font-bold tabular-nums ${STATUS_AMOUNT_CLS[managing.status]}`}>
                  {money(managing.amount, managing.currency)}
                </p>
              </div>
              <Badge variant={STATUS_BADGE[managing.status]} className="text-sm !px-3 !py-1">
                {STATUS_LABEL[managing.status]}
              </Badge>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: "User", value: managing.userName },
                { label: "Email", value: managing.userEmail },
                { label: "Description", value: managing.description },
                { label: "Course", value: managing.courseTitle ?? "—" },
                { label: "Method", value: managing.method },
                { label: "Date", value: formatDate(managing.createdAt) },
                { label: "Created", value: relativeTime(managing.createdAt) },
                { label: "Currency", value: managing.currency },
              ].map((row) => (
                <div key={row.label} className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
                  <p className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wide mb-0.5">
                    {row.label}
                  </p>
                  <p className="text-sm font-medium truncate">{row.value}</p>
                </div>
              ))}
            </div>

            {/* TXN ID with copy */}
            {managing.txnId && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
                <Icon.CreditCard size={14} className="text-[var(--muted)] shrink-0" />
                <span className="text-xs font-mono text-[var(--muted)] flex-1 truncate">
                  {managing.txnId}
                </span>
                <button
                  onClick={() => copyTxn(managing.txnId!)}
                  className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                  title="Copy transaction ID"
                >
                  <Icon.Copy size={13} />
                </button>
              </div>
            )}

            {/* Status change */}
            <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
              <p className="text-sm font-semibold">Update status</p>
              <Select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as PaymentStatus)}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </Select>
              {nextStatus === "refunded" && managing.status !== "refunded" && (
                <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                  <Icon.AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>
                    Marking as refunded removes this amount from gross revenue and cannot be undone.
                  </span>
                </div>
              )}
            </div>

            {/* Quick refund shortcut */}
            {managing.status === "completed" && nextStatus !== "refunded" && (
              <button
                onClick={() => setNextStatus("refunded")}
                className="w-full text-xs text-rose-500 hover:text-rose-600 flex items-center justify-center gap-1.5 py-1 hover:underline transition"
              >
                <Icon.ArrowLeft size={12} /> Issue refund for {money(managing.amount, managing.currency)}
              </button>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setManaging(null)}>
                Cancel
              </Button>
              <Button
                onClick={saveStatus}
                loading={saving}
                disabled={nextStatus === managing.status}
              >
                <Icon.Save size={16} /> Save changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Pagination                                                               */
/* ──────────────────────────────────────────────────────────────────────── */

function PaymentPagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-xs text-[var(--muted)]">
        {total} transaction{total !== 1 ? "s" : ""}
      </p>
    );
  }

  function getPages(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-[var(--muted)]">
        {start}–{end} of {total} transactions
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <Icon.ChevronLeft size={15} />
        </button>
        {getPages().map((p, i) =>
          p === "..." ? (
            <span
              key={`e${i}`}
              className="h-7 w-7 flex items-center justify-center text-xs text-[var(--muted)]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-medium transition ${
                page === p
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <Icon.ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Table helpers                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left font-semibold px-4 py-3 ${className ?? ""}`}>{children}</th>
  );
}

function Td({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <td className={`px-4 py-3 align-middle ${className ?? ""}`} onClick={onClick}>
      {children}
    </td>
  );
}
