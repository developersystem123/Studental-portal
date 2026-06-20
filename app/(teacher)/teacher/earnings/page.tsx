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
  useToast,
} from "@/components/ui";
import { BarChart, Donut, Sparkline } from "@/components/charts";
import { useTeacher } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

// Platform standard: instructors keep 70% of each course sale.
const REVENUE_SHARE = 0.7;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const RANGES = [3, 6, 12] as const;

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
  const [range, setRange] = React.useState<number>(6);
  const [monthlyGoal, setMonthlyGoal] = React.useState<number>(1000);
  const [editingGoal, setEditingGoal] = React.useState(false);
  const [goalInput, setGoalInput] = React.useState("1000");

  const load = React.useCallback(async () => {
    const r = await fetch("/api/teacher/payouts");
    const data = r.ok ? await r.json() : { payouts: [] };
    setPayouts(data.payouts ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

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
    const buckets = Array.from({ length: range }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (range - 1 - i), 1);
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
  }, [students, courses, range]);

  const thisMonthEarnings = trend[trend.length - 1]?.value ?? 0;
  const prevMonthEarnings = trend[trend.length - 2]?.value ?? 0;
  const momGrowth =
    prevMonthEarnings === 0
      ? null
      : Math.round(((thisMonthEarnings - prevMonthEarnings) / prevMonthEarnings) * 100);
  const bestMonth =
    trend.length > 0 ? trend.reduce((best, b) => (b.value > best.value ? b : best), trend[0]) : null;
  const avgMonthly =
    trend.length === 0 ? 0 : Math.round(trend.reduce((s, b) => s + b.value, 0) / trend.length);
  const revenuePerStudent =
    students.length === 0 ? 0 : Math.round((totalEarnings / students.length) * 100) / 100;
  const goalProgress =
    monthlyGoal === 0 ? 0 : Math.min(100, Math.round((thisMonthEarnings / monthlyGoal) * 100));

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

  const totalBreakdownEarned = breakdown.reduce((s, b) => s + b.earned, 0);
  const paidCount = payouts.filter((p) => p.status === "paid").length;
  const pendingCount = payouts.filter((p) => p.status === "pending").length;
  const avgPayoutAmount =
    paidCount === 0 ? 0 : Math.round((totalPaid / paidCount) * 100) / 100;

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

      {/* 4 big stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BigStat label="Available" value={`$${available.toFixed(2)}`} icon={<Icon.DollarSign size={18} />} tint="emerald" />
        <BigStat label="Pending payout" value={`$${pending.toFixed(2)}`} icon={<Icon.Clock size={18} />} tint="amber" />
        <BigStat label="Lifetime paid" value={`$${totalPaid.toFixed(2)}`} icon={<Icon.CheckCircle size={18} />} tint="sky" />
        <BigStat label="Total earned" value={`$${totalEarnings.toFixed(2)}`} icon={<Icon.TrendingUp size={18} />} tint="violet" />
      </div>

      {/* Quick insight strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickStat
          label="Best earning month"
          value={bestMonth && bestMonth.value > 0 ? `$${bestMonth.value}` : "$0"}
          sub={bestMonth && bestMonth.value > 0 ? bestMonth.label : "No data yet"}
          icon={<Icon.Star size={15} />}
          color="#10b981"
        />
        <QuickStat
          label="Monthly average"
          value={`$${avgMonthly}`}
          sub={`over ${range} month${range !== 1 ? "s" : ""}`}
          icon={<Icon.BarChart3 size={15} />}
          color="var(--primary)"
        />
        <QuickStat
          label="Revenue per student"
          value={`$${revenuePerStudent.toFixed(2)}`}
          sub={`${students.length} total student${students.length !== 1 ? "s" : ""}`}
          icon={<Icon.Users size={15} />}
          color="var(--accent)"
        />
      </div>

      {/* Monthly chart + revenue share / goal tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-1 lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-semibold">Monthly earnings</h2>
                <p className="text-xs text-[var(--muted)]">Last {range} months</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {momGrowth !== null && (
                  <Badge variant={momGrowth >= 0 ? "success" : "danger"}>
                    {momGrowth >= 0 ? "↑" : "↓"} {Math.abs(momGrowth)}% MoM
                  </Badge>
                )}
                <div className="flex gap-1">
                  {RANGES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={[
                        "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors",
                        range === r
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
                      ].join(" ")}
                    >
                      {r}M
                    </button>
                  ))}
                </div>
                <Sparkline data={trend.map((t) => t.value)} width={80} height={28} />
              </div>
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

            {/* Monthly goal tracker */}
            <div className="border-t border-[var(--border)] pt-3">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold">Monthly goal</span>
                {editingGoal ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="w-20 text-xs border border-[var(--border)] rounded-lg px-2 py-0.5 bg-[var(--surface)] text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                    />
                    <button
                      onClick={() => {
                        const v = Number(goalInput);
                        if (v > 0) setMonthlyGoal(v);
                        setEditingGoal(false);
                      }}
                      className="text-xs text-[var(--primary)] font-semibold hover:underline"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setGoalInput(monthlyGoal.toString());
                      setEditingGoal(true);
                    }}
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Donut value={goalProgress} size={76} label="goal" />
                <div className="text-xs space-y-1 min-w-0">
                  <p className="font-semibold">
                    ${thisMonthEarnings}{" "}
                    <span className="text-[var(--muted)] font-normal">this month</span>
                  </p>
                  <p className="text-[var(--muted)]">Target: ${monthlyGoal}</p>
                  <p
                    className="font-semibold"
                    style={{ color: goalProgress >= 100 ? "#10b981" : "var(--muted)" }}
                  >
                    {goalProgress >= 100 ? "Goal reached!" : `${goalProgress}% reached`}
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Earnings by course — enhanced with share bar */}
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
            <>
              {/* Mobile card list */}
              <div className="sm:hidden space-y-2">
                {breakdown.map((b) => {
                  const share = totalBreakdownEarned === 0 ? 0 : Math.round((b.earned / totalBreakdownEarned) * 100);
                  return (
                    <div key={b.course.id} className="p-3 rounded-xl bg-[var(--surface-2)] space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug flex-1 min-w-0">{b.course.title}</p>
                        <span className="text-sm font-bold shrink-0">${b.earned.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                        <span>{b.course.price === 0 ? "Free" : `$${b.course.price}`}</span>
                        <span>·</span>
                        <span>{b.count} enrolled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-[10px] text-[var(--muted)] tabular-nums shrink-0">{share}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="py-2.5 px-3 font-medium text-xs">Course</th>
                      <th className="py-2.5 px-3 font-medium text-xs">Price</th>
                      <th className="py-2.5 px-3 font-medium text-xs">Enrollments</th>
                      <th className="py-2.5 px-3 font-medium text-xs">Revenue share</th>
                      <th className="py-2.5 px-3 font-medium text-xs text-right">Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((b) => {
                      const share = totalBreakdownEarned === 0 ? 0 : Math.round((b.earned / totalBreakdownEarned) * 100);
                      return (
                        <tr key={b.course.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                          <td className="py-3 px-3 font-medium truncate max-w-xs text-xs">{b.course.title}</td>
                          <td className="py-3 px-3 text-xs">
                            {b.course.price === 0 ? <Badge variant="default">Free</Badge> : `$${b.course.price}`}
                          </td>
                          <td className="py-3 px-3 text-xs">{b.count}</td>
                          <td className="py-3 px-3 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${share}%` }} />
                              </div>
                              <span className="text-[10px] text-[var(--muted)] tabular-nums w-7 shrink-0">{share}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-xs">${b.earned.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Payouts — with summary stats in header */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold">Payouts</h2>
            {payouts.length > 0 && (
              <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                {paidCount > 0 && (
                  <span>
                    <span className="font-semibold" style={{ color: "#10b981" }}>{paidCount}</span> paid
                  </span>
                )}
                {pendingCount > 0 && (
                  <span>
                    <span className="font-semibold" style={{ color: "#f59e0b" }}>{pendingCount}</span> pending
                  </span>
                )}
                {paidCount > 0 && (
                  <span>
                    avg <b className="text-[var(--foreground)]">${avgPayoutAmount.toFixed(2)}</b>
                  </span>
                )}
              </div>
            )}
          </div>
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
      <CardBody className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4">
        <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 ${tints[tint]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs text-[var(--muted)] truncate">{label}</p>
          <p className="text-base sm:text-2xl font-bold tracking-tight mt-0.5 truncate">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function QuickStat({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
          >
            {icon}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
            {label}
          </span>
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-[var(--muted)] mt-0.5">{sub}</p>
      </CardBody>
    </Card>
  );
}

const PAYOUT_METHODS = [
  {
    value: "Bank",
    label: "Bank transfer",
    desc: "2–5 business days",
    icon: <Icon.DollarSign size={16} />,
    active: "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
  },
  {
    value: "PayPal",
    label: "PayPal",
    desc: "Within 24 hours",
    icon: <Icon.Globe size={16} />,
    active: "border-sky-400 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300",
    iconBg: "bg-sky-100 dark:bg-sky-500/20",
  },
  {
    value: "Stripe",
    label: "Stripe",
    desc: "Instant payout",
    icon: <Icon.CreditCard size={16} />,
    active: "border-violet-400 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300",
    iconBg: "bg-violet-100 dark:bg-violet-500/20",
  },
];

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
    if (open) { setAmount(available.toFixed(2)); setMethod("Bank"); }
  }, [open, available]);

  const numAmount = Number(amount);
  const pct = available > 0 ? Math.min(100, Math.round((numAmount / available) * 100)) : 0;
  const isValid = numAmount > 0 && numAmount <= available;
  const activeMethod = PAYOUT_METHODS.find((m) => m.value === method)!;

  return (
    <Modal open={open} onClose={onClose} title="Request payout" size="md">
      {/* Accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-primary" />

      <div className="p-6 space-y-6">

        {/* ── Live preview card ── */}
        <div className="flex items-center gap-4 rounded-2xl px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-primary text-white shadow-md">
          <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <Icon.Wallet size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold tracking-tight">
              ${isValid ? numAmount.toFixed(2) : "0.00"}
            </p>
            <p className="text-xs text-white/80 mt-0.5">via {activeMethod.label} · {activeMethod.desc}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-white/70">of available</p>
            <p className="text-sm font-bold">${available.toFixed(2)}</p>
          </div>
        </div>

        {/* ── Section 1: Amount ── */}
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-widest font-bold text-muted flex items-center gap-1.5">
            <Icon.DollarSign size={12} /> Amount
          </p>

          {/* Available balance display */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-2 border border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Icon.Wallet size={15} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Available</p>
                <p className="font-bold text-sm text-foreground">${available.toFixed(2)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Requesting</p>
              <p className={`font-bold text-sm ${isValid ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}`}>
                {pct}%
              </p>
            </div>
          </div>

          {/* Percentage bar */}
          <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Quick preset chips */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Icon.DollarSign size={14} className="text-muted" />
              Amount (USD) <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {[25, 50, 75, 100].map((p) => {
                const v = ((available * p) / 100).toFixed(2);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(v)}
                    className={`px-3 h-8 rounded-lg text-xs font-semibold border transition-all ${
                      amount === v
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-[var(--border)] bg-surface-2 text-muted hover:border-[var(--border-strong)]"
                    }`}
                  >
                    {p === 100 ? "Max" : `${p}%`}
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-semibold text-sm pointer-events-none">$</span>
              <Input
                type="number"
                min={1}
                max={available}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="!pl-7"
                placeholder="0.00"
              />
            </div>
            {numAmount > available && (
              <p className="text-xs text-[var(--danger)] flex items-center gap-1.5">
                <Icon.AlertCircle size={12} /> Amount exceeds available balance
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* ── Section 2: Method ── */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest font-bold text-muted flex items-center gap-1.5">
            <Icon.CreditCard size={12} /> Payout method
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PAYOUT_METHODS.map(({ value, label, desc, icon, active, iconBg }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all ${
                  method === value
                    ? active
                    : "border-[var(--border)] bg-surface-2 text-muted hover:border-[var(--border-strong)]"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  method === value ? iconBg : "bg-[var(--surface)]"
                }`}>
                  {icon}
                </span>
                <span className="text-[11px] font-bold leading-tight">{label}</span>
                <span className="text-[10px] opacity-70 leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            loading={busy}
            disabled={!isValid}
            onClick={async () => {
              setBusy(true);
              await onRequest(Number(numAmount.toFixed(2)), method);
              setBusy(false);
            }}
          >
            <Icon.Wallet size={14} /> Request ${isValid ? numAmount.toFixed(2) : "0.00"}
          </Button>
        </div>

      </div>
    </Modal>
  );
}
