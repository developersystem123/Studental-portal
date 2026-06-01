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
  Tabs,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { relativeTime } from "@/lib/utils";

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

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default function AdminPaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [managing, setManaging] = React.useState<Payment | null>(null);
  const [nextStatus, setNextStatus] = React.useState<PaymentStatus>("completed");
  const [saving, setSaving] = React.useState(false);

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

  React.useEffect(() => {
    load();
  }, [load]);

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

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!q) return true;
      return (
        p.userName.toLowerCase().includes(q) ||
        p.userEmail.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.courseTitle ?? "").toLowerCase().includes(q) ||
        (p.txnId ?? "").toLowerCase().includes(q)
      );
    });
  }, [payments, filter, query]);

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
      // Refresh summary figures.
      load();
    } catch {
      toast.push({ title: "Update failed.", tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  const currency = summary?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Payments &amp; revenue</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Every transaction on the platform — track revenue, settle pending charges, and issue refunds.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gross revenue"
          value={money(summary?.grossRevenue ?? 0, currency)}
          icon={<Icon.DollarSign size={18} />}
          tone="success"
          delta={`${summary?.transactions ?? 0} paid`}
        />
        <StatCard
          label="Refunded"
          value={money(summary?.refunded ?? 0, currency)}
          icon={<Icon.ArrowLeft size={18} />}
          tone="warning"
        />
        <StatCard
          label="Pending"
          value={summary?.pending ?? 0}
          icon={<Icon.Clock size={18} />}
          tone="accent"
        />
        <StatCard
          label="Failed"
          value={summary?.failed ?? 0}
          icon={<Icon.AlertCircle size={18} />}
          tone="warning"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Tabs
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "completed", label: "Completed", count: counts.completed },
            { value: "pending", label: "Pending", count: counts.pending },
            { value: "failed", label: "Failed", count: counts.failed },
            { value: "refunded", label: "Refunded", count: counts.refunded },
          ]}
        />
        <div className="md:w-80">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by user, course, description, txn…"
            icon={<Icon.Search size={16} />}
          />
        </div>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
              <Icon.Loader size={18} /> Loading payments…
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
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                <tr>
                  <Th>User</Th>
                  <Th>Description</Th>
                  <Th>Method</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/50">
                    <Td>
                      <div className="font-medium">{p.userName}</div>
                      <div className="text-xs text-[var(--muted)]">{p.userEmail}</div>
                    </Td>
                    <Td>
                      <div className="font-medium truncate max-w-[24ch]">{p.description}</div>
                      {p.courseTitle && (
                        <div className="text-xs text-[var(--muted)] truncate max-w-[24ch]">
                          {p.courseTitle}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <span className="capitalize text-xs">{p.method}</span>
                    </Td>
                    <Td className="text-right font-semibold tabular-nums">
                      {money(p.amount, p.currency)}
                    </Td>
                    <Td>
                      <Badge variant={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                    </Td>
                    <Td className="text-xs text-[var(--muted)]">{relativeTime(p.createdAt)}</Td>
                    <Td className="text-right">
                      <Button size="sm" variant="soft" onClick={() => openManage(p)}>
                        <Icon.Edit size={14} /> Manage
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Manage modal */}
      <Modal
        open={!!managing}
        onClose={() => setManaging(null)}
        size="md"
        title="Manage payment"
      >
        {managing && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-[var(--border)] p-4 space-y-1.5 text-sm">
              <Row label="User" value={`${managing.userName} · ${managing.userEmail}`} />
              <Row label="Description" value={managing.description} />
              {managing.courseTitle && <Row label="Course" value={managing.courseTitle} />}
              <Row label="Amount" value={money(managing.amount, managing.currency)} />
              <Row label="Method" value={managing.method} />
              {managing.txnId && <Row label="Transaction" value={managing.txnId} />}
              <Row label="Created" value={relativeTime(managing.createdAt)} />
            </div>
            <div>
              <p className="text-sm font-medium mb-1.5">Payment status</p>
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
                <p className="text-xs text-amber-500 dark:text-amber-400 mt-1.5">
                  Marking this payment as refunded removes its amount from gross revenue.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setManaging(null)}>
                Cancel
              </Button>
              <Button onClick={saveStatus} loading={saving} disabled={nextStatus === managing.status}>
                <Icon.Save size={16} /> Save changes
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--muted)] shrink-0">{label}</span>
      <span className="text-right break-words font-medium">{value}</span>
    </div>
  );
}
