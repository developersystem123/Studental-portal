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
  Select,
  useToast,
} from "@/components/ui";
import { BarChart, Sparkline } from "@/components/charts";
import { useTeacher } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

// Platform standard: instructors keep 70% of each course sale.
const REVENUE_SHARE = 0.7;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Payout = {
  id: string;
  amount: number;
  method: string;
  status: "pending" | "paid" | "failed";
  requestedAt: string;
  paidAt: string | null;
};

export default function TeacherEarningsPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const courses = teacher.myCourses();
  const students = teacher.myStudents();

  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [requesting, setRequesting] = React.useState(false);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/teacher/payouts");
    const data = r.ok ? await r.json() : { payouts: [] };
    setPayouts(data.payouts ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Earnings are derived from real enrollments × course price × revenue share.
  const totalGross = React.useMemo(() => {
    let g = 0;
    for (const s of students) {
      const c = courses.find((x) => x.id === s.courseId);
      if (c) g += c.price;
    }
    return g;
  }, [students, courses]);

  const totalEarnings = Math.round(totalGross * REVENUE_SHARE * 100) / 100;
  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const available = Math.max(0, totalEarnings - totalPaid - pending);

  const trend = React.useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: MONTHS[d.getMonth()], value: 0, key: `${d.getFullYear()}-${d.getMonth()}` };
    });
    for (const s of students) {
      const c = courses.find((x) => x.id === s.courseId);
      if (!c) continue;
      const d = new Date(s.enrolledAt);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = buckets.findIndex((b) => b.key === k);
      if (idx >= 0) buckets[idx].value += Math.round(c.price * REVENUE_SHARE);
    }
    return buckets;
  }, [students, courses]);

  const breakdown = React.useMemo(
    () =>
      courses
        .map((c) => {
          const count = students.filter((s) => s.courseId === c.id).length;
          const earned = Math.round(c.price * count * REVENUE_SHARE * 100) / 100;
          return { course: c, count, earned };
        })
        .sort((a, b) => b.earned - a.earned),
    [courses, students],
  );

  async function requestPayout(amount: number, method: string) {
    const r = await fetch("/api/teacher/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't request payout", description: e.error, tone: "danger" });
      return;
    }
    toast.push({
      title: "Payout requested",
      description: "An admin will process it shortly.",
      tone: "success",
    });
    setRequesting(false);
    load();
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Insights
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="mt-1 text-[var(--muted)]">
            Track revenue from your courses and request payouts.
          </p>
        </div>
        <Button onClick={() => setRequesting(true)} disabled={available <= 0}>
          <Icon.Wallet size={16} /> Request payout
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BigStat label="Available" value={`$${available.toFixed(2)}`} icon={<Icon.DollarSign size={18} />} tint="emerald" />
        <BigStat label="Pending payout" value={`$${pending.toFixed(2)}`} icon={<Icon.Clock size={18} />} tint="amber" />
        <BigStat label="Lifetime paid" value={`$${totalPaid.toFixed(2)}`} icon={<Icon.CheckCircle size={18} />} tint="sky" />
        <BigStat label="Total earned" value={`$${totalEarnings.toFixed(2)}`} icon={<Icon.TrendingUp size={18} />} tint="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Monthly earnings</h2>
                <p className="text-xs text-[var(--muted)]">Last 6 months</p>
              </div>
              <Sparkline data={trend.map((t) => t.value)} width={120} height={32} />
            </div>
            <div className="h-[220px] mt-4">
              <BarChart
                data={trend.map((t) => ({ label: t.label, value: t.value }))}
                height={220}
                valueLabel={(v) => `$${v}`}
              />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold">Revenue share</h2>
            <p className="text-xs text-[var(--muted)]">Your cut of each course sale.</p>
            <div className="rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] p-4 text-center">
              <p className="text-4xl font-bold">{Math.round(REVENUE_SHARE * 100)}%</p>
              <p className="text-xs mt-1 opacity-80">
                to you · {100 - Math.round(REVENUE_SHARE * 100)}% to platform
              </p>
            </div>
            <ul className="space-y-1 text-xs text-[var(--muted)]">
              <li>
                Gross sales: <b className="text-[var(--foreground)]">${totalGross.toFixed(2)}</b>
              </li>
              <li>
                Your earnings:{" "}
                <b className="text-[var(--foreground)]">${totalEarnings.toFixed(2)}</b>
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-semibold">Earnings by course</h2>
          {breakdown.length === 0 || breakdown.every((b) => b.count === 0) ? (
            <EmptyState
              icon={<Icon.Book size={20} />}
              title="No earnings yet"
              description="When students enroll in paid courses, the revenue appears here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="py-2.5 px-3 font-medium">Course</th>
                    <th className="py-2.5 px-3 font-medium">Price</th>
                    <th className="py-2.5 px-3 font-medium">Enrollments</th>
                    <th className="py-2.5 px-3 font-medium text-right">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((b) => (
                    <tr key={b.course.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-3 px-3 font-medium truncate max-w-xs">{b.course.title}</td>
                      <td className="py-3 px-3">
                        {b.course.price === 0 ? (
                          <Badge variant="default">Free</Badge>
                        ) : (
                          `$${b.course.price}`
                        )}
                      </td>
                      <td className="py-3 px-3">{b.count}</td>
                      <td className="py-3 px-3 text-right font-semibold">
                        ${b.earned.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-semibold">Payouts</h2>
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : payouts.length === 0 ? (
            <EmptyState
              icon={<Icon.Wallet size={20} />}
              title="No payouts yet"
              description="When you request a payout it'll show up here."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {payouts.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      ${p.amount.toFixed(2)} via {p.method}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Requested {relativeTime(p.requestedAt)}
                      {p.paidAt && ` · Paid ${relativeTime(p.paidAt)}`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      p.status === "paid"
                        ? "success"
                        : p.status === "pending"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {p.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <PayoutModal
        open={requesting}
        onClose={() => setRequesting(false)}
        available={available}
        onRequest={requestPayout}
      />
    </div>
  );
}

function BigStat({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tint: "emerald" | "amber" | "sky" | "violet";
}) {
  const tints: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };
  return (
    <Card>
      <CardBody className="flex items-start gap-3">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${tints[tint]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[var(--muted)]">{label}</p>
          <p className="text-2xl font-bold tracking-tight mt-0.5">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function PayoutModal({
  open,
  onClose,
  available,
  onRequest,
}: {
  open: boolean;
  onClose: () => void;
  available: number;
  onRequest: (amount: number, method: string) => void;
}) {
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("Bank");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) setAmount(available.toFixed(2));
  }, [open, available]);

  return (
    <Modal open={open} onClose={onClose} title="Request payout" size="sm">
      <div className="p-5 space-y-3">
        <p className="text-sm text-[var(--muted)]">
          Available to withdraw:{" "}
          <b className="text-[var(--foreground)]">${available.toFixed(2)}</b>
        </p>
        <div>
          <Label>Amount (USD)</Label>
          <Input
            type="number"
            min={1}
            max={available}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label>Method</Label>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="Bank">Bank transfer</option>
            <option value="PayPal">PayPal</option>
            <option value="Stripe">Stripe</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            loading={busy}
            disabled={Number(amount) <= 0 || Number(amount) > available}
            onClick={async () => {
              setBusy(true);
              await onRequest(Number(Number(amount).toFixed(2)), method);
              setBusy(false);
            }}
          >
            <Icon.Wallet size={14} /> Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}
