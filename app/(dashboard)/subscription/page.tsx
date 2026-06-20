"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  Skeleton,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/store";

type Plan = {
  id: string;
  key: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  highlight: boolean;
  order: number;
};

type Subscription = {
  id: string;
  planKey: string;
  planName: string;
  interval: "monthly" | "annual";
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
};

function money(amount: number) {
  return `Rs ${Math.round(amount).toLocaleString("en-PK")}`;
}

type AppliedCoupon = { code: string; type: "percent" | "fixed"; value: number; label: string };

function applyDiscount(amount: number, c: AppliedCoupon): number {
  if (c.type === "percent") return Math.max(0, Math.round(amount * (1 - c.value / 100)));
  return Math.max(0, amount - c.value);
}

/* ─── Feature comparison data ─────────────────────────────────── */
type FeatureRow = {
  label: string;
  starter: string | boolean;
  pro: string | boolean;
  team: string | boolean;
  group?: string;
};

const COMPARISON: FeatureRow[] = [
  // Courses
  { group: "Courses & Content", label: "Free courses", starter: true, pro: true, team: true },
  { label: "Paid courses", starter: false, pro: true, team: true },
  { label: "Offline downloads", starter: false, pro: true, team: true },
  { label: "Enrolled course tracking", starter: "Up to 10", pro: "Unlimited", team: "Unlimited" },
  // AI
  { group: "AI Suite", label: "AI chat", starter: "20/day", pro: "Unlimited", team: "Unlimited" },
  { label: "Quiz generation", starter: false, pro: true, team: true },
  { label: "Assignment helper", starter: false, pro: true, team: true },
  // Learning
  { group: "Learning", label: "Live class participation", starter: false, pro: true, team: true },
  { label: "Verifiable certificates", starter: false, pro: true, team: true },
  { label: "Community forum", starter: true, pro: true, team: true },
  // Team
  { group: "Team Features", label: "Team members", starter: "1", pro: "1", team: "Up to 5" },
  { label: "Team progress dashboard", starter: false, pro: false, team: true },
  { label: "Shared notes & discussions", starter: false, pro: false, team: true },
  { label: "Admin invoicing", starter: false, pro: false, team: true },
  // Support
  { group: "Support", label: "Email support", starter: true, pro: true, team: true },
  { label: "Priority support", starter: false, pro: true, team: true },
  { label: "Dedicated account manager", starter: false, pro: false, team: true },
];

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true)
    return <Icon.CheckCircle size={18} className="text-emerald-500 mx-auto" />;
  if (value === false)
    return <Icon.X size={16} className="text-[var(--muted-2)] mx-auto opacity-40" />;
  return <span className="text-xs font-medium text-[var(--foreground)]">{value}</span>;
}

/* ─── Page ─────────────────────────────────────────────────────── */
export default function SubscriptionPage() {
  const { push } = useToast();
  const { refreshUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [annual, setAnnual] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setCouponInput("");
    setCoupon(null);
    setCouponMsg(null);
    setPaymentMethod("card");
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setBankHolder("");
    setBankName("");
    setBankAccount("");
    setBankIban("");
    setCardErrors({});
  }, [pendingPlan]);

  useEffect(() => {
    if (!subscription) return;
    function tick() {
      const end = new Date(subscription!.currentPeriodEnd).getTime();
      const diff = Math.max(0, end - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      });
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [subscription]);

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponMsg(null);
    try {
      const r = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json();
      if (data.valid) {
        setCoupon(data.coupon);
        setCouponMsg(`✓ ${data.coupon.label} applied`);
      } else {
        setCoupon(null);
        setCouponMsg(data.error ?? "That coupon isn't valid.");
      }
    } finally {
      setCouponBusy(false);
    }
  }

  const load = useCallback(async () => {
    const r = await fetch("/api/subscription");
    const data = await r.json().catch(() => ({}));
    setPlans(data.plans ?? []);
    setSubscription(data.subscription ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentKey = subscription?.planKey ?? "none";

  function formatCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  async function confirmSubscribe() {
    if (!pendingPlan) return;
    // Validate payment fields
    const errs: Record<string, string> = {};
    if (paymentMethod === "card") {
      if (!cardName.trim()) errs.cardName = "Cardholder name is required.";
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length < 16) errs.cardNumber = "Enter a valid 16-digit card number.";
      const [mm] = cardExpiry.split("/");
      if (cardExpiry.length < 5 || Number(mm) < 1 || Number(mm) > 12)
        errs.cardExpiry = "Enter a valid expiry (MM/YY).";
      if (cardCvv.length < 3) errs.cardCvv = "CVV must be 3 digits.";
    } else {
      if (!bankHolder.trim()) errs.bankHolder = "Account holder name is required.";
      if (!bankName.trim()) errs.bankName = "Bank name is required.";
      if (!bankAccount.trim()) errs.bankAccount = "Account number is required.";
      if (!bankIban.trim()) errs.bankIban = "IBAN / routing number is required.";
    }
    if (Object.keys(errs).length > 0) { setCardErrors(errs); return; }
    setCardErrors({});
    const activeCoupon = coupon;
    const activePlan = pendingPlan;
    setBusy(true);
    const r = await fetch("/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey: activePlan.key, interval: annual ? "annual" : "monthly" }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    setPendingPlan(null);
    if (!r.ok) {
      push({ title: "Couldn't update plan", description: data.error, tone: "danger" });
      return;
    }
    if (activeCoupon) {
      await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: activeCoupon.code }),
      }).catch(() => {});
    }
    push({
      title: `You're on ${activePlan.name}`,
      description: activeCoupon
        ? `Your plan is active — coupon ${activeCoupon.code} applied.`
        : "Your plan is now active.",
      tone: "success",
    });
    await refreshUser();
    load();
  }

  async function setCancel(cancel: boolean) {
    setBusy(true);
    const r = await fetch("/api/subscription", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelAtPeriodEnd: cancel }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      push({ title: "Something went wrong", description: data.error, tone: "danger" });
      return;
    }
    push({
      title: cancel ? "Subscription will cancel" : "Subscription resumed",
      description: cancel
        ? "You'll keep access until the end of your billing period."
        : "Your plan will renew as usual.",
      tone: cancel ? "info" : "success",
    });
    await refreshUser();
    load();
  }

  /* Savings badge for annual toggle */
  const annualSavings = plans.length > 0
    ? Math.round(100 - (plans[1]?.annualPrice / (plans[1]?.monthlyPrice * 12)) * 100)
    : 20;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Subscription</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage your membership plan and billing cycle.
        </p>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-96" />)}
          </div>
        </>
      ) : (
        <>
          {/* ── Current plan banner ──────────────────────────── */}
          <Card className="overflow-hidden">
            <CardBody className="p-0">
              <div className="p-5 sm:p-6 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
                <div className="flex items-start gap-3 flex-wrap">
                  <Icon.Crown size={28} />
                  <div className="flex-1 min-w-[14rem]">
                    <p className="text-sm text-white/80">Current plan</p>
                    <p className="text-xl font-bold">
                      {subscription ? subscription.planName : "No active plan"}
                      {subscription && (
                        <span className="text-sm font-normal text-white/80">
                          {" "}· {subscription.interval}
                        </span>
                      )}
                    </p>
                    {subscription ? (
                      <p className="text-sm text-white/85 mt-1">
                        {subscription.cancelAtPeriodEnd
                          ? `Access ends ${formatDate(subscription.currentPeriodEnd)}`
                          : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
                      </p>
                    ) : (
                      <p className="text-sm text-white/85 mt-1">
                        Choose a plan below to unlock the full platform.
                      </p>
                    )}
                  </div>
                  {subscription &&
                    (subscription.cancelAtPeriodEnd ? (
                      <Button variant="secondary" onClick={() => setCancel(false)} disabled={busy}>
                        Resume plan
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={() => setCancel(true)} disabled={busy}>
                        Cancel plan
                      </Button>
                    ))}
                </div>

                {/* Stats strip */}
                {subscription && (
                  <div className="mt-4 grid grid-cols-3 gap-1.5">
                    {[
                      {
                        label: "Plan",
                        value: subscription.planName,
                        icon: <Icon.Crown size={12} />,
                      },
                      {
                        label: "Billing",
                        value: subscription.interval === "annual" ? "Annual" : "Monthly",
                        icon: <Icon.Calendar size={12} />,
                      },
                      {
                        label: "Status",
                        value: subscription.cancelAtPeriodEnd ? "Cancelling" : "Active",
                        icon: <Icon.CheckCircle size={12} />,
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl bg-white/10 px-2 py-2 text-center backdrop-blur-sm min-w-0"
                      >
                        <div className="flex items-center justify-center gap-0.5 text-white/70 mb-0.5">
                          {s.icon}
                          <span className="text-[9px] uppercase tracking-wide">{s.label}</span>
                        </div>
                        <p className="text-xs font-bold text-white truncate">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Countdown timer */}
                {subscription && (
                  <div className="mt-4 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon.Clock size={13} className="text-white/70" />
                      <span className="text-[10px] uppercase tracking-widest text-white/70 font-semibold">
                        {subscription.cancelAtPeriodEnd ? "Access expires in" : "Renews in"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                      {/* Days */}
                      <div className="flex items-end gap-1">
                        <div className="flex gap-1">
                          {String(timeLeft.days).padStart(2, "0").split("").map((d, i) => (
                            <span
                              key={i}
                              className="flex h-9 w-7 sm:h-10 sm:w-8 items-center justify-center rounded-lg bg-white/20 text-lg sm:text-xl font-bold tabular-nums text-white shadow-inner"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-white/70 uppercase tracking-wider mb-1">
                          Days
                        </span>
                      </div>

                      <span className="text-white/50 text-xl font-bold mb-1">:</span>

                      {/* Hours */}
                      <div className="flex items-end gap-1">
                        <div className="flex gap-1">
                          {String(timeLeft.hours).padStart(2, "0").split("").map((h, i) => (
                            <span
                              key={i}
                              className="flex h-9 w-7 sm:h-10 sm:w-8 items-center justify-center rounded-lg bg-white/20 text-lg sm:text-xl font-bold tabular-nums text-white shadow-inner"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-white/70 uppercase tracking-wider mb-1">
                          Hours
                        </span>
                      </div>

                      <div className="ml-auto text-right shrink-0">
                        <p className="text-xs text-white/60">
                          {subscription.cancelAtPeriodEnd ? "Until access ends" : "Until next billing"}
                        </p>
                        <p className="text-xs font-semibold text-white/90 mt-0.5">
                          {formatDate(subscription.currentPeriodEnd)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {subscription?.cancelAtPeriodEnd && (
            <div className="flex items-center gap-2 text-sm rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-4 py-3">
              <Icon.AlertCircle size={16} />
              Your subscription is set to cancel. Access ends on{" "}
              {formatDate(subscription.currentPeriodEnd)}.
            </div>
          )}

          {/* ── Billing cycle toggle ─────────────────────────── */}
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-2)]">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  "px-4 h-9 rounded-lg text-sm font-medium transition",
                  !annual ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]",
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  "px-4 h-9 rounded-lg text-sm font-medium transition flex items-center gap-2",
                  annual ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]",
                )}
              >
                Annual{" "}
                <Badge variant="success">Save {annualSavings}%</Badge>
              </button>
            </div>
            {annual && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Icon.TrendingUp size={12} className="inline mr-1" />
                Switch to annual and save up to {money(plans.reduce((acc, p) => Math.max(acc, p.monthlyPrice * 12 - p.annualPrice), 0))} per year
              </p>
            )}
          </div>

          {/* ── Plan cards ───────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isCurrent = p.key === currentKey;
              const perMonth = annual ? p.annualPrice / 12 : p.monthlyPrice;
              const originalPerMonth = p.monthlyPrice;
              const isDowngrade = plans.findIndex((x) => x.key === p.key) <
                plans.findIndex((x) => x.key === currentKey);

              return (
                <Card
                  key={p.id}
                  className={cn(
                    "overflow-hidden flex flex-col transition-all",
                    p.highlight && "ring-2 ring-[var(--primary)] shadow-lg",
                    isCurrent && "ring-2 ring-emerald-500/50",
                  )}
                >
                  {p.highlight && !isCurrent && (
                    <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-center py-1.5 text-xs font-semibold">
                      ⭐ MOST POPULAR
                    </div>
                  )}
                  {isCurrent && (
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-center py-1.5 text-xs font-semibold">
                      ✓ YOUR CURRENT PLAN
                    </div>
                  )}
                  <CardBody className="flex-1 flex flex-col p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--muted)]">{p.name}</p>
                      {isCurrent && <Badge variant="success">Active</Badge>}
                    </div>
                    <p className="text-xs text-[var(--muted-2)] mt-1 mb-4">{p.tagline}</p>

                    {/* Price */}
                    <div className="mb-1">
                      <p className="text-4xl font-bold">
                        {money(perMonth)}
                        <span className="text-base text-[var(--muted)] font-normal">/mo</span>
                      </p>
                      {annual && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[var(--muted-2)] line-through">
                            {money(originalPerMonth)}/mo
                          </span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            {money(p.annualPrice)}/yr
                          </span>
                        </div>
                      )}
                    </div>

                    <ul className="mt-6 space-y-2.5 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Icon.CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      {isCurrent ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current plan
                        </Button>
                      ) : (
                        <Button
                          variant={p.highlight ? "primary" : "outline"}
                          className="w-full"
                          disabled={busy}
                          onClick={() => setPendingPlan(p)}
                        >
                          {isDowngrade ? "Downgrade" : "Upgrade"} to {p.name}
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* ── Feature comparison table ─────────────────────── */}
          <Card>
            <CardBody className="p-0">
              <button
                onClick={() => setShowCompare((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 hover:bg-[var(--surface-2)] transition rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon.ListChecks size={14} />
                  </span>
                  <span className="font-semibold text-sm">Compare all features</span>
                </div>
                <Icon.ChevronDown
                  size={16}
                  className={cn(
                    "text-[var(--muted)] transition-transform duration-200",
                    showCompare && "rotate-180",
                  )}
                />
              </button>

              {showCompare && (
                <div className="overflow-x-auto border-t border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider w-1/2">
                          Feature
                        </th>
                        {plans.map((p) => (
                          <th
                            key={p.id}
                            className={cn(
                              "px-4 py-3 text-center text-xs font-bold uppercase tracking-wider",
                              p.key === currentKey
                                ? "text-emerald-600 dark:text-emerald-400"
                                : p.highlight
                                ? "text-[var(--primary)]"
                                : "text-[var(--foreground)]",
                            )}
                          >
                            <div>{p.name}</div>
                            <div className="text-[10px] font-normal text-[var(--muted)] mt-0.5 normal-case tracking-normal">
                              {money(annual ? p.annualPrice / 12 : p.monthlyPrice)}/mo
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const rows: React.ReactNode[] = [];
                        let lastGroup = "";
                        for (const row of COMPARISON) {
                          if (row.group && row.group !== lastGroup) {
                            lastGroup = row.group;
                            rows.push(
                              <tr key={`group-${row.group}`} className="bg-[var(--surface-2)]">
                                <td
                                  colSpan={4}
                                  className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]"
                                >
                                  {row.group}
                                </td>
                              </tr>,
                            );
                          }
                          rows.push(
                            <tr
                              key={row.label}
                              className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
                            >
                              <td className="px-5 py-3 text-sm text-[var(--foreground)]">
                                {row.label}
                              </td>
                              {(["starter", "pro", "team"] as const).map((key) => (
                                <td key={key} className="px-4 py-3 text-center">
                                  <FeatureCell value={row[key]} />
                                </td>
                              ))}
                            </tr>,
                          );
                        }
                        return rows;
                      })()}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-2)]">
                        <td className="px-5 py-4" />
                        {plans.map((p) => (
                          <td key={p.id} className="px-4 py-4 text-center">
                            {p.key === currentKey ? (
                              <Button variant="outline" size="sm" disabled className="w-full">
                                Current
                              </Button>
                            ) : (
                              <Button
                                variant={p.highlight ? "primary" : "outline"}
                                size="sm"
                                className="w-full"
                                onClick={() => setPendingPlan(p)}
                              >
                                Select
                              </Button>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* ── Subscribe checkout modal ─────────────────────────── */}
      <Modal
        open={pendingPlan !== null}
        onClose={() => setPendingPlan(null)}
        title={`Subscribe to ${pendingPlan?.name ?? ""}`}
        size="md"
      >
        {pendingPlan && (() => {
          const base = annual ? pendingPlan.annualPrice : pendingPlan.monthlyPrice;
          const final = coupon ? applyDiscount(base, coupon) : base;
          const discount = base - final;
          return (
            <div className="divide-y divide-[var(--border)]">

              {/* ── Order summary ── */}
              <div className="p-5 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Order Summary
                </p>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-2)]">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shrink-0">
                    <Icon.Crown size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{pendingPlan.name} Plan</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {annual ? "Billed annually" : "Billed monthly"} · cancel anytime
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">{money(base)}</p>
                    <p className="text-[10px] text-[var(--muted)]">/{annual ? "yr" : "mo"}</p>
                  </div>
                </div>
                {/* Included features */}
                <div className="grid grid-cols-2 gap-1.5">
                  {pendingPlan.features.slice(0, 4).map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <Icon.CheckCircle size={12} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Payment method selector + details ── */}
              <div className="p-5 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Payment Method
                </p>

                {/* Method tabs */}
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        key: "card" as const,
                        label: "Credit / Debit Card",
                        sub: "Visa, Mastercard, Amex",
                        icon: <Icon.CreditCard size={18} />,
                      },
                      {
                        key: "bank" as const,
                        label: "Bank Transfer",
                        sub: "Direct bank payment",
                        icon: <Icon.Wallet size={18} />,
                      },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.key}
                      onClick={() => { setPaymentMethod(m.key); setCardErrors({}); }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition-all",
                        paymentMethod === m.key
                          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--border-strong)]",
                      )}
                    >
                      <span className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        paymentMethod === m.key ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)]",
                      )}>
                        {m.icon}
                      </span>
                      <span className="text-xs font-semibold leading-tight">{m.label}</span>
                      <span className={cn(
                        "text-[10px]",
                        paymentMethod === m.key ? "text-[var(--primary)]/70" : "text-[var(--muted-2)]",
                      )}>{m.sub}</span>
                    </button>
                  ))}
                </div>

                {/* ── Card fields ── */}
                {paymentMethod === "card" && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <Input
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Cardholder name"
                        className={cn(cardErrors.cardName && "border-[var(--danger)]")}
                      />
                      {cardErrors.cardName && (
                        <p className="mt-1 text-xs text-[var(--danger)]">{cardErrors.cardName}</p>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={cn("pr-10", cardErrors.cardNumber && "border-[var(--danger)]")}
                      />
                      <Icon.CreditCard
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                      />
                      {cardErrors.cardNumber && (
                        <p className="mt-1 text-xs text-[var(--danger)]">{cardErrors.cardNumber}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className={cn(cardErrors.cardExpiry && "border-[var(--danger)]")}
                        />
                        {cardErrors.cardExpiry && (
                          <p className="mt-1 text-xs text-[var(--danger)]">{cardErrors.cardExpiry}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="CVV"
                          maxLength={4}
                          type="password"
                          className={cn(cardErrors.cardCvv && "border-[var(--danger)]")}
                        />
                        {cardErrors.cardCvv && (
                          <p className="mt-1 text-xs text-[var(--danger)]">{cardErrors.cardCvv}</p>
                        )}
                      </div>
                    </div>
                    {/* Accepted cards */}
                    <div className="flex items-center gap-2 pt-1">
                      {["VISA", "MC", "AMEX", "JCB"].map((c) => (
                        <span
                          key={c}
                          className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)] tracking-wider"
                        >
                          {c}
                        </span>
                      ))}
                      <span className="ml-auto text-[10px] text-[var(--muted-2)]">
                        JazzCash / Easypaisa also accepted
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Bank Transfer fields ── */}
                {paymentMethod === "bank" && (
                  <div className="space-y-3 pt-1">
                    <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                      <p className="font-semibold mb-0.5">Bank Transfer Instructions</p>
                      Fill in your bank details below. Once confirmed, a transfer request will be
                      submitted. Processing may take 1–3 business days.
                    </div>
                    <div>
                      <Input
                        value={bankHolder}
                        onChange={(e) => setBankHolder(e.target.value)}
                        placeholder="Account holder name"
                        className={cn(cardErrors.bankHolder && "border-[var(--danger)]")}
                      />
                      {cardErrors.bankHolder && (
                        <p className="mt-1 text-xs text-[var(--danger)]">{cardErrors.bankHolder}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Bank name (e.g. HBL, Meezan, UBL)"
                        className={cn(cardErrors.bankName && "border-[var(--danger)]")}
                      />
                      {cardErrors.bankName && (
                        <p className="mt-1 text-xs text-[var(--danger)]">{cardErrors.bankName}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                        placeholder="Account number"
                        className={cn(cardErrors.bankAccount && "border-[var(--danger)]")}
                      />
                      {cardErrors.bankAccount && (
                        <p className="mt-1 text-xs text-[var(--danger)]">{cardErrors.bankAccount}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        value={bankIban}
                        onChange={(e) => setBankIban(e.target.value.toUpperCase())}
                        placeholder="IBAN / Routing number"
                        className={cn(cardErrors.bankIban && "border-[var(--danger)]")}
                      />
                      {cardErrors.bankIban && (
                        <p className="mt-1 text-xs text-[var(--danger)]">{cardErrors.bankIban}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Coupon ── */}
              <div className="p-5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Coupon Code
                </p>
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code…"
                  />
                  <Button variant="outline" onClick={applyCoupon} loading={couponBusy}>
                    Apply
                  </Button>
                </div>
                {couponMsg && (
                  <p className={cn("text-xs", coupon ? "text-emerald-500" : "text-[var(--danger)]")}>
                    {couponMsg}
                  </p>
                )}
              </div>

              {/* ── Total breakdown ── */}
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                  <span>Subtotal</span>
                  <span>{money(base)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({coupon?.label})</span>
                    <span>−{money(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-bold text-base pt-2 border-t border-[var(--border)]">
                  <span>Total</span>
                  <span className="gradient-text">
                    {money(final)}
                    <span className="text-xs font-normal text-[var(--muted)] ml-1">
                      /{annual ? "yr" : "mo"}
                    </span>
                  </span>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400">
                  <Icon.Shield size={14} className="shrink-0" />
                  <span>
                    <span className="font-semibold">256-bit SSL encrypted</span> · Powered by Stripe ·
                    Your card details are never stored on our servers.
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setPendingPlan(null)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={confirmSubscribe} loading={busy}>
                    <Icon.CreditCard size={14} /> Pay {money(final)}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
