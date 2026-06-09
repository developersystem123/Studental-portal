"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/icons";
import { Badge, Button, Card, CardBody, Input, Modal, Skeleton, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
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

type AppliedCoupon = { code: string; type: "percent" | "fixed"; value: number; label: string };

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
function applyDiscount(cents: number, c: AppliedCoupon): number {
  if (c.type === "percent") return Math.max(0, Math.round(cents * (1 - c.value / 100)));
  return Math.max(0, cents - c.value);
}
function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

const FAQ_ITEMS = [
  { q: "Can I cancel anytime?", a: "Yes — cancel at any time. You'll keep access until the end of your billing period." },
  { q: "Do you offer student discounts?", a: "Yes — 30% off Pro with a valid student ID. Contact us after sign-up to claim." },
  { q: "Is there a free trial?", a: "Pro includes a 14-day free trial. No credit card needed to start." },
  { q: "Can I switch plans?", a: "Yes, you can upgrade or downgrade anytime from your Subscription page." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  /* ── Checkout modal state ── */
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");
  const [busy, setBusy] = useState(false);
  /* Card */
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  /* Bank */
  const [bankHolder, setBankHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIban, setBankIban] = useState("");
  /* Coupon */
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  /* Errors */
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const { push } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/subscription");
        const data = r.ok ? await r.json().catch(() => ({})) : {};
        if (!cancelled) setPlans(data.plans ?? []);
      } catch {
        // noop
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* Reset modal state every time a plan is selected */
  useEffect(() => {
    setPaymentMethod("card");
    setCardName(""); setCardNumber(""); setCardExpiry(""); setCardCvv("");
    setBankHolder(""); setBankName(""); setBankAccount(""); setBankIban("");
    setCouponInput(""); setCoupon(null); setCouponMsg(null);
    setErrors({});
  }, [pendingPlan]);

  function handleGetPlan(plan: Plan) {
    if (!user) {
      push({ title: "Sign in first", description: "Create an account or log in to subscribe.", tone: "info" });
      return;
    }
    setPendingPlan(plan);
  }

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true); setCouponMsg(null);
    try {
      const r = await fetch("/api/coupons/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json();
      if (data.valid) { setCoupon(data.coupon); setCouponMsg(`✓ ${data.coupon.label} applied`); }
      else { setCoupon(null); setCouponMsg(data.error ?? "That coupon isn't valid."); }
    } finally { setCouponBusy(false); }
  }

  async function confirmSubscribe() {
    if (!pendingPlan) return;
    const errs: Record<string, string> = {};
    if (paymentMethod === "card") {
      if (!cardName.trim()) errs.cardName = "Cardholder name is required.";
      if (cardNumber.replace(/\s/g, "").length < 16) errs.cardNumber = "Enter a valid 16-digit card number.";
      const [mm] = cardExpiry.split("/");
      if (cardExpiry.length < 5 || Number(mm) < 1 || Number(mm) > 12) errs.cardExpiry = "Enter a valid expiry (MM/YY).";
      if (cardCvv.length < 3) errs.cardCvv = "CVV must be 3 digits.";
    } else {
      if (!bankHolder.trim()) errs.bankHolder = "Account holder name is required.";
      if (!bankName.trim()) errs.bankName = "Bank name is required.";
      if (!bankAccount.trim()) errs.bankAccount = "Account number is required.";
      if (!bankIban.trim()) errs.bankIban = "IBAN / routing number is required.";
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const activeCoupon = coupon;
    const activePlan = pendingPlan;
    setBusy(true);
    const r = await fetch("/api/subscription", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey: activePlan.key, interval: annual ? "annual" : "monthly" }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    setPendingPlan(null);
    if (!r.ok) { push({ title: "Couldn't subscribe", description: data.error, tone: "danger" }); return; }
    if (activeCoupon) {
      await fetch("/api/coupons/redeem", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: activeCoupon.code }),
      }).catch(() => {});
    }
    push({
      title: `You're on ${activePlan.name}!`,
      description: activeCoupon ? `Coupon ${activeCoupon.code} applied.` : "Your plan is now active.",
      tone: "success",
    });
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 lg:pt-20 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Pricing</p>
        <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          Simple, <span className="gradient-text">honest pricing</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Pay monthly or save 20% annually. Cancel anytime.
        </p>
        <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-xl bg-[var(--surface-2)]">
          <button
            onClick={() => setAnnual(false)}
            className={cn("px-4 h-9 rounded-lg text-sm font-medium transition", !annual ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]")}
          >Monthly</button>
          <button
            onClick={() => setAnnual(true)}
            className={cn("px-4 h-9 rounded-lg text-sm font-medium transition flex items-center gap-2", annual ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]")}
          >
            Annual <Badge variant="success">Save 20%</Badge>
          </button>
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[28rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const perMonth = annual ? p.annualPrice / 12 : p.monthlyPrice;
              const originalPerMonth = p.monthlyPrice;
              return (
                <Card
                  key={p.id}
                  className={cn(
                    "overflow-hidden flex flex-col transition-all",
                    p.highlight && "ring-2 ring-[var(--primary)] scale-100 md:scale-105 shadow-xl",
                  )}
                >
                  {p.highlight && (
                    <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-center py-1.5 text-xs font-semibold">
                      ⭐ MOST POPULAR
                    </div>
                  )}
                  <CardBody className="flex-1 flex flex-col p-6">
                    <p className="text-sm font-semibold text-[var(--muted)]">{p.name}</p>
                    <p className="text-xs text-[var(--muted-2)] mt-1 mb-4">{p.tagline}</p>

                    {/* Price */}
                    <p className="text-4xl font-bold">
                      ${(perMonth / 100).toFixed(2)}
                      <span className="text-base text-[var(--muted)] font-normal">/month</span>
                    </p>
                    {annual && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[var(--muted-2)] line-through">
                          ${(originalPerMonth / 100).toFixed(2)}/mo
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          ${(p.annualPrice / 100).toFixed(2)} billed annually
                        </span>
                      </div>
                    )}

                    <ul className="mt-6 space-y-2.5 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Icon.CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleGetPlan(p)}
                      className={cn(
                        "mt-6 w-full h-11 rounded-xl font-semibold text-sm transition-all",
                        p.highlight
                          ? "bg-[var(--primary)] text-white hover:opacity-90 shadow-md"
                          : "border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
                      )}
                    >
                      Get {p.name}
                    </button>

                    {!user && (
                      <p className="mt-2 text-center text-[10px] text-[var(--muted-2)]">
                        <Link href="/register" className="hover:underline text-[var(--primary)]">Sign up</Link> or{" "}
                        <Link href="/login" className="hover:underline text-[var(--primary)]">log in</Link> to subscribe
                      </p>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Enterprise ── */}
        <Card className="mt-12 bg-gradient-to-br from-[var(--primary-soft)] to-transparent">
          <CardBody className="p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center shrink-0">
              <Icon.Users size={26} />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold">Enterprise & Universities</p>
              <p className="text-sm text-[var(--muted)] mt-1">
                Bulk licensing, custom branding, SSO, and content licensing. Volume discounts available.
              </p>
            </div>
            <Link href="/contact"><Button variant="outline">Contact sales</Button></Link>
          </CardBody>
        </Card>

        {/* ── FAQ ── */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Pricing questions</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((f, i) => (
              <div
                key={f.q}
                className={cn(
                  "rounded-2xl border transition-all",
                  faqOpen === i ? "border-[var(--primary)]/30 bg-[var(--primary-soft)]/10" : "border-[var(--border)] bg-[var(--surface)]",
                )}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold text-sm">{f.q}</span>
                  <Icon.ChevronDown
                    size={15}
                    className={cn("text-[var(--muted)] transition-transform duration-200 shrink-0 ml-3", faqOpen === i && "rotate-180")}
                  />
                </button>
                {faqOpen === i && (
                  <p className="px-5 pb-4 text-sm text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-3">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-[var(--muted)]">
            More questions?{" "}
            <Link href="/faq" className="text-[var(--primary)] hover:underline">Visit our FAQ</Link>
          </p>
        </div>
      </section>

      {/* ── Checkout Modal ── */}
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

              {/* Order Summary */}
              <div className="p-5 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Order Summary</p>
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
                <div className="grid grid-cols-2 gap-1.5">
                  {pendingPlan.features.slice(0, 4).map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <Icon.CheckCircle size={12} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-5 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Payment Method</p>

                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: "card" as const, label: "Credit / Debit Card", sub: "Visa, Mastercard, Amex", icon: <Icon.CreditCard size={18} /> },
                    { key: "bank" as const, label: "Bank Transfer", sub: "Direct bank payment", icon: <Icon.Wallet size={18} /> },
                  ]).map((m) => (
                    <button
                      key={m.key}
                      onClick={() => { setPaymentMethod(m.key); setErrors({}); }}
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
                      )}>{m.icon}</span>
                      <span className="text-xs font-semibold leading-tight">{m.label}</span>
                      <span className={cn("text-[10px]", paymentMethod === m.key ? "text-[var(--primary)]/70" : "text-[var(--muted-2)]")}>
                        {m.sub}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Card fields */}
                {paymentMethod === "card" && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Cardholder name"
                        className={cn(errors.cardName && "border-[var(--danger)]")} />
                      {errors.cardName && <p className="mt-1 text-xs text-[var(--danger)]">{errors.cardName}</p>}
                    </div>
                    <div className="relative">
                      <Input value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456" maxLength={19}
                        className={cn("pr-10", errors.cardNumber && "border-[var(--danger)]")} />
                      <Icon.CreditCard size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      {errors.cardNumber && <p className="mt-1 text-xs text-[var(--danger)]">{errors.cardNumber}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY" maxLength={5} className={cn(errors.cardExpiry && "border-[var(--danger)]")} />
                        {errors.cardExpiry && <p className="mt-1 text-xs text-[var(--danger)]">{errors.cardExpiry}</p>}
                      </div>
                      <div>
                        <Input value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="CVV" maxLength={4} type="password" className={cn(errors.cardCvv && "border-[var(--danger)]")} />
                        {errors.cardCvv && <p className="mt-1 text-xs text-[var(--danger)]">{errors.cardCvv}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {["VISA", "MC", "AMEX", "JCB"].map((c) => (
                        <span key={c} className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)] tracking-wider">{c}</span>
                      ))}
                      <span className="ml-auto text-[10px] text-[var(--muted-2)]">JazzCash / Easypaisa also accepted</span>
                    </div>
                  </div>
                )}

                {/* Bank Transfer fields */}
                {paymentMethod === "bank" && (
                  <div className="space-y-3 pt-1">
                    <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                      <p className="font-semibold mb-0.5">Bank Transfer Instructions</p>
                      Fill in your bank details below. Processing may take 1–3 business days.
                    </div>
                    <div>
                      <Input value={bankHolder} onChange={(e) => setBankHolder(e.target.value)}
                        placeholder="Account holder name" className={cn(errors.bankHolder && "border-[var(--danger)]")} />
                      {errors.bankHolder && <p className="mt-1 text-xs text-[var(--danger)]">{errors.bankHolder}</p>}
                    </div>
                    <div>
                      <Input value={bankName} onChange={(e) => setBankName(e.target.value)}
                        placeholder="Bank name (e.g. HBL, Meezan, UBL)" className={cn(errors.bankName && "border-[var(--danger)]")} />
                      {errors.bankName && <p className="mt-1 text-xs text-[var(--danger)]">{errors.bankName}</p>}
                    </div>
                    <div>
                      <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                        placeholder="Account number" className={cn(errors.bankAccount && "border-[var(--danger)]")} />
                      {errors.bankAccount && <p className="mt-1 text-xs text-[var(--danger)]">{errors.bankAccount}</p>}
                    </div>
                    <div>
                      <Input value={bankIban} onChange={(e) => setBankIban(e.target.value.toUpperCase())}
                        placeholder="IBAN / Routing number" className={cn(errors.bankIban && "border-[var(--danger)]")} />
                      {errors.bankIban && <p className="mt-1 text-xs text-[var(--danger)]">{errors.bankIban}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Coupon */}
              <div className="p-5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Coupon Code</p>
                <div className="flex gap-2">
                  <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Enter coupon code…" />
                  <Button variant="outline" onClick={applyCoupon} loading={couponBusy}>Apply</Button>
                </div>
                {couponMsg && (
                  <p className={cn("text-xs", coupon ? "text-emerald-500" : "text-[var(--danger)]")}>{couponMsg}</p>
                )}
              </div>

              {/* Total */}
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                  <span>Subtotal</span><span>{money(base)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({coupon?.label})</span><span>−{money(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-bold text-base pt-2 border-t border-[var(--border)]">
                  <span>Total</span>
                  <span className="gradient-text">
                    {money(final)}
                    <span className="text-xs font-normal text-[var(--muted)] ml-1">/{annual ? "yr" : "mo"}</span>
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400">
                  <Icon.Shield size={14} className="shrink-0" />
                  <span><span className="font-semibold">256-bit SSL encrypted</span> · Powered by Stripe · Your card details are never stored on our servers.</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setPendingPlan(null)}>Cancel</Button>
                  <Button className="flex-1" onClick={confirmSubscribe} loading={busy}>
                    {paymentMethod === "card"
                      ? <><Icon.CreditCard size={14} /> Pay {money(final)}</>
                      : <><Icon.Wallet size={14} /> Submit Transfer</>
                    }
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
