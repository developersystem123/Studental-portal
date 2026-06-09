"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Avatar, Badge, Button, Card, CardBody, Modal, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { useAuth, useData } from "@/lib/store";
import { COURSES } from "@/lib/mockData";
import { cn, formatDuration, formatHours } from "@/lib/utils";

function formatPKR(amount: number) {
  return `Rs ${Math.round(amount).toLocaleString("en-PK")}`;
}

type PayMethod = "card" | "jazzcash" | "easypaisa" | "bank_transfer";

const PAY_METHODS: { key: PayMethod; label: string; desc: string; icon: string }[] = [
  { key: "card",          label: "Debit / Credit Card", desc: "Visa, Mastercard, or local bank card", icon: "💳" },
  { key: "jazzcash",      label: "JazzCash",             desc: "Pay via JazzCash mobile account",      icon: "📱" },
  { key: "easypaisa",     label: "EasyPaisa",            desc: "Pay via EasyPaisa mobile account",     icon: "📱" },
  { key: "bank_transfer", label: "Bank Transfer",        desc: "Transfer directly to our bank account", icon: "🏦" },
];

function formatCardNumber(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}
function formatExpiry(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}
function detectBrand(num: string) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  return null;
}

export default function CoursePreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();
  const { enrollments, enroll, addNotification } = useData();

  const course = COURSES.find((c) => c.id === params.id);
  const enrollment = useMemo(
    () => enrollments.find((e) => e.courseId === params.id),
    [enrollments, params.id],
  );
  const enrolled = !!enrollment;

  const [enrolling, setEnrolling] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [stripeProcessing, setStripeProcessing] = useState(false);

  // Payment method + form state
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [mobileNum, setMobileNum] = useState("");
  const [txnRef, setTxnRef] = useState("");
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [payStep, setPayStep] = useState<"summary" | "method" | "details">("summary");

  function resetCardForm() {
    setCardName(""); setCardNumber(""); setExpiry(""); setCvv("");
    setMobileNum(""); setTxnRef("");
    setCardErrors({}); setPayStep("summary"); setPayMethod("card");
  }

  function validateCard() {
    const errors: Record<string, string> = {};
    if (!cardName.trim()) errors.name = "Cardholder name is required";
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 16) errors.number = "Enter a valid 16-digit card number";
    if (expiry.length < 5) {
      errors.expiry = "Enter expiry as MM/YY";
    } else {
      const month = parseInt(expiry.slice(0, 2));
      if (month < 1 || month > 12) errors.expiry = "Invalid month";
    }
    if (cvv.replace(/\D/g, "").length < 3) errors.cvv = "Enter 3-digit CVV";
    return errors;
  }

  // Handle return from Stripe checkout (?payment=success&courseId=xxx)
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const returnedCourseId = searchParams.get("courseId");
    if (paymentStatus !== "success" || !returnedCourseId || returnedCourseId !== params.id) return;
    if (enrolled) return;
    const courseTitle = COURSES.find((c) => c.id === returnedCourseId)?.title ?? "";
    setStripeProcessing(true);
    enroll(returnedCourseId)
      .then(() => {
        addNotification({ type: "achievement", title: "Enrolled!", message: `You're now enrolled in ${courseTitle}.` });
        toast.push({ title: "Payment successful! Enrolled.", tone: "success" });
        router.replace(`/my-courses/${returnedCourseId}`);
      })
      .catch(() => {
        toast.push({ title: "Enrolled!", tone: "success" });
        router.replace(`/my-courses/${returnedCourseId}`);
      })
      .finally(() => setStripeProcessing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold">Course not found</p>
        <Link href="/explore" className="text-[var(--primary)] hover:underline text-sm mt-2 inline-block">
          ← Back to explore
        </Link>
      </div>
    );
  }

  const firstChapter = course.chapters[0];
  const isPaid = course.price > 0;

  // Free course — direct enroll
  async function handleFreeEnroll() {
    if (!course || !user) { if (!user) router.push("/login"); return; }
    setEnrolling(true);
    try {
      await enroll(course.id);
      addNotification({ type: "achievement", title: "Enrolled!", message: `You're now enrolled in ${course.title}.` });
      toast.push({ title: "Enrolled!", description: course.title, tone: "success" });
      router.push(`/my-courses/${course.id}`);
    } catch {
      toast.push({ title: "Couldn't enroll", description: "Please try again.", tone: "danger" });
    } finally {
      setEnrolling(false);
    }
  }

  // Paid course — process payment for the selected method
  async function handlePurchase() {
    if (!course || !user) { if (!user) router.push("/login"); return; }

    if (payMethod === "card") {
      const errors = validateCard();
      if (Object.keys(errors).length) { setCardErrors(errors); return; }
      setCardErrors({});
    }
    if ((payMethod === "jazzcash" || payMethod === "easypaisa") && !mobileNum.trim()) {
      toast.push({ title: "Enter your mobile number.", tone: "danger" }); return;
    }
    if (payMethod === "bank_transfer" && !txnRef.trim()) {
      toast.push({ title: "Enter the transaction reference number.", tone: "danger" }); return;
    }

    setPaying(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: course.price,
          courseId: course.id,
          description: `Course: ${course.title}`,
          method: payMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Payment failed.");

      // Stripe redirect (card only)
      if ((data as { checkoutUrl?: string }).checkoutUrl) {
        window.location.href = (data as { checkoutUrl: string }).checkoutUrl;
        return;
      }

      const isImmediate = payMethod === "card";
      if (isImmediate) {
        await enroll(course.id);
        addNotification({ type: "achievement", title: "Enrolled!", message: `You're now enrolled in ${course.title}.` });
        toast.push({ title: "Payment successful!", description: `Welcome to ${course.title}`, tone: "success" });
        router.push(`/my-courses/${course.id}`);
      } else {
        toast.push({
          title: "Payment submitted — pending confirmation",
          description: "We'll enroll you once your payment is verified (usually within a few hours).",
          tone: "info",
        });
      }
      setPayModal(false);
      resetCardForm();
    } catch (err) {
      toast.push({ title: "Payment failed", description: err instanceof Error ? err.message : "Please try again.", tone: "danger" });
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => { if (window.history.length > 1) router.back(); else router.push("/explore"); }}
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1 transition"
      >
        <Icon.ChevronLeft size={14} /> Back
      </button>

      {stripeProcessing && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-600 dark:text-emerald-400">
          <Icon.Loader size={16} className="animate-spin shrink-0" />
          Verifying payment and completing enrollment…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* ── Main ── */}
        <div className="space-y-5">
          <VideoPlayer
            title={firstChapter ? firstChapter.title : course.title}
            durationSeconds={firstChapter?.duration ?? 600}
          />

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="primary">{course.category}</Badge>
              <Badge>{course.level}</Badge>
              {!isPaid && <Badge variant="success">Free</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{course.title}</h1>
            <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">{course.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Duration" value={formatHours(course.durationMinutes)} />
            <StatCard label="Chapters" value={String(course.chapters.length)} />
            <StatCard label="Rating" value={`${course.rating} ★`} />
            <StatCard label="Reviews" value={course.reviews.toLocaleString()} />
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <Avatar name={course.instructor} size={48} />
            <div>
              <p className="font-semibold">{course.instructor}</p>
              <p className="text-xs text-[var(--muted)]">Instructor · {course.category}</p>
            </div>
          </div>

          {course.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">Topics covered</p>
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--primary-soft)] text-[var(--primary)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="lg:sticky lg:top-20 h-fit space-y-4">
          <Card>
            <CardBody className="space-y-4">
              {/* Price display */}
              <div>
                {isPaid ? (
                  <div className="space-y-0.5">
                    <p className="text-3xl font-bold">{formatPKR(course.price)}</p>
                    <p className="text-xs text-[var(--muted)]">One-time payment · Lifetime access</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-emerald-500">Free</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">No payment required</p>
                  </div>
                )}
              </div>

              {/* CTA */}
              {enrolled ? (
                <Link href={`/my-courses/${course.id}`} className="block">
                  <Button className="w-full" size="lg">
                    <Icon.Play size={16} /> Continue Learning
                  </Button>
                </Link>
              ) : isPaid ? (
                <div className="space-y-2">
                  <Button className="w-full" size="lg" onClick={() => { if (!user) { router.push("/login"); return; } setPayModal(true); }}>
                    <Icon.CreditCard size={16} /> Buy Now — {formatPKR(course.price)}
                  </Button>
                  <div className="flex items-center justify-center gap-3 text-[10px] text-[var(--muted)]">
                    <span className="flex items-center gap-1"><Icon.Lock size={10} /> Secure</span>
                    <span className="flex items-center gap-1">📱 JazzCash / EasyPaisa</span>
                    <span className="flex items-center gap-1">🏦 Bank Transfer</span>
                  </div>
                </div>
              ) : (
                <Button className="w-full" size="lg" loading={enrolling} onClick={handleFreeEnroll}>
                  <Icon.Book size={16} /> Enroll Free
                </Button>
              )}

              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li className="flex items-center gap-2">
                  <Icon.Clock size={14} className="text-[var(--primary)] shrink-0" />
                  {formatHours(course.durationMinutes)} of content
                </li>
                <li className="flex items-center gap-2">
                  <Icon.Book size={14} className="text-[var(--primary)] shrink-0" />
                  {course.chapters.length} chapters
                </li>
                <li className="flex items-center gap-2">
                  <Icon.Award size={14} className="text-[var(--primary)] shrink-0" />
                  Certificate on completion
                </li>
                {isPaid && (
                  <li className="flex items-center gap-2">
                    <Icon.CheckCircle size={14} className="text-[var(--primary)] shrink-0" />
                    Lifetime access
                  </li>
                )}
              </ul>
            </CardBody>
          </Card>

          {/* Chapter list */}
          <Card>
            <div className="p-4 border-b border-[var(--border)]">
              <p className="text-sm font-semibold">Course content</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {course.chapters.length} chapters · {formatHours(course.durationMinutes)}
              </p>
            </div>
            <ul className="max-h-[380px] overflow-y-auto">
              {course.chapters.map((ch, i) => {
                const isFirst = i === 0 && !isPaid;
                return (
                  <li key={ch.id} className="border-b border-[var(--border)] last:border-0">
                    <div className={cn("flex items-center gap-3 px-4 py-3", isFirst ? "text-[var(--foreground)]" : "text-[var(--muted)]")}>
                      <span className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                        isFirst ? "bg-[var(--primary)] text-white" :
                        enrolled ? "bg-[var(--surface-2)] text-[var(--foreground)]" :
                        "bg-[var(--surface-2)] text-[var(--muted)]",
                      )}>
                        {!enrolled && !isFirst ? <Icon.Lock size={11} /> : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{ch.title}</p>
                        <p className="text-[11px] text-[var(--muted)]">{formatDuration(ch.duration)}</p>
                      </div>
                      {(enrolled || isFirst) && <Icon.Play size={13} className="text-[var(--muted)] shrink-0" />}
                    </div>
                  </li>
                );
              })}
            </ul>
            {isPaid && !enrolled && (
              <div className="p-3 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--muted)] bg-[var(--surface-2)]">
                <Icon.Lock size={12} className="text-[var(--primary)] shrink-0" />
                Purchase the course to unlock all chapters
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* ── Payment Modal ── */}
      <Modal
        open={payModal}
        onClose={() => { if (!paying) { setPayModal(false); resetCardForm(); } }}
        title={payStep === "summary" ? "Order Summary" : payStep === "method" ? "Choose Payment Method" : PAY_METHODS.find(m => m.key === payMethod)?.label ?? "Payment Details"}
      >
        <div className="p-5 space-y-5">

          {/* ── Step 1: Summary ── */}
          {payStep === "summary" && (
            <>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Order summary</p>
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={course.thumbnail} alt={course.title} className="h-14 w-20 rounded-lg object-cover shrink-0 border border-[var(--border)]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-2">{course.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{course.instructor} · {course.level}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon.Star size={11} className="text-amber-500" />
                      <span className="text-xs text-[var(--muted)]">{course.rating} · {formatHours(course.durationMinutes)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">Total</span>
                  <p className="font-bold text-xl">{formatPKR(course.price)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Icon.CheckCircle, text: "Lifetime access" },
                  { icon: Icon.Award, text: "Certificate included" },
                  { icon: Icon.Book, text: `${course.chapters.length} chapters` },
                  { icon: Icon.Clock, text: formatHours(course.durationMinutes) },
                ].map(({ icon: Ic, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <Ic size={13} className="text-[var(--primary)] shrink-0" /> {text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => { setPayModal(false); resetCardForm(); }}>Cancel</Button>
                <Button className="flex-1" onClick={() => setPayStep("method")}>
                  Choose Payment <Icon.ChevronRight size={15} />
                </Button>
              </div>
            </>
          )}

          {/* ── Step 2: Method selection ── */}
          {payStep === "method" && (
            <>
              <div className="space-y-2">
                {PAY_METHODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setPayMethod(m.key)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition",
                      payMethod === m.key
                        ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-2)]"
                    )}
                  >
                    <span className="text-xl shrink-0">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-xs text-[var(--muted)]">{m.desc}</p>
                    </div>
                    {payMethod === m.key && <Icon.CheckCircle size={16} className="text-[var(--primary)] shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setPayStep("summary")}>Back</Button>
                <Button className="flex-1" onClick={() => setPayStep("details")}>
                  Continue <Icon.ChevronRight size={15} />
                </Button>
              </div>
            </>
          )}

          {/* ── Step 3: Payment details ── */}
          {payStep === "details" && (
            <>
              {/* Compact order line */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <p className="text-sm font-medium truncate flex-1 mr-3">{course.title}</p>
                <p className="font-bold text-base shrink-0">{formatPKR(course.price)}</p>
              </div>

              {/* Card form */}
              {payMethod === "card" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">Cardholder Name</label>
                    <input type="text" placeholder="Ali Hassan" value={cardName}
                      onChange={e => { setCardName(e.target.value); if (cardErrors.name) setCardErrors(p => ({ ...p, name: "" })); }}
                      className={cn("w-full px-3 py-2.5 rounded-xl border text-sm bg-[var(--surface)] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20", cardErrors.name ? "border-red-500" : "border-[var(--border)]")}
                    />
                    {cardErrors.name && <p className="text-[11px] text-red-500 mt-1">{cardErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">Card Number</label>
                    <div className="relative">
                      <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber} inputMode="numeric"
                        onChange={e => { setCardNumber(formatCardNumber(e.target.value)); if (cardErrors.number) setCardErrors(p => ({ ...p, number: "" })); }}
                        className={cn("w-full px-3 py-2.5 pr-16 rounded-xl border text-sm bg-[var(--surface)] text-[var(--foreground)] outline-none transition font-mono tracking-widest focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20", cardErrors.number ? "border-red-500" : "border-[var(--border)]")}
                      />
                      {detectBrand(cardNumber) && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--muted)] bg-[var(--surface-2)] border border-[var(--border)] rounded px-1.5 py-0.5">{detectBrand(cardNumber)}</span>
                      )}
                    </div>
                    {cardErrors.number && <p className="text-[11px] text-red-500 mt-1">{cardErrors.number}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted)] mb-1">Expiry Date</label>
                      <input type="text" placeholder="MM/YY" value={expiry} inputMode="numeric"
                        onChange={e => { setExpiry(formatExpiry(e.target.value)); if (cardErrors.expiry) setCardErrors(p => ({ ...p, expiry: "" })); }}
                        className={cn("w-full px-3 py-2.5 rounded-xl border text-sm bg-[var(--surface)] text-[var(--foreground)] outline-none transition font-mono focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20", cardErrors.expiry ? "border-red-500" : "border-[var(--border)]")}
                      />
                      {cardErrors.expiry && <p className="text-[11px] text-red-500 mt-1">{cardErrors.expiry}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted)] mb-1">CVV</label>
                      <input type="password" placeholder="•••" value={cvv} inputMode="numeric" maxLength={4}
                        onChange={e => { setCvv(e.target.value.replace(/\D/g, "").slice(0, 4)); if (cardErrors.cvv) setCardErrors(p => ({ ...p, cvv: "" })); }}
                        className={cn("w-full px-3 py-2.5 rounded-xl border text-sm bg-[var(--surface)] text-[var(--foreground)] outline-none transition font-mono focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20", cardErrors.cvv ? "border-red-500" : "border-[var(--border)]")}
                      />
                      {cardErrors.cvv && <p className="text-[11px] text-red-500 mt-1">{cardErrors.cvv}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* JazzCash / EasyPaisa form */}
              {(payMethod === "jazzcash" || payMethod === "easypaisa") && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    <p className="font-semibold">How to pay via {payMethod === "jazzcash" ? "JazzCash" : "EasyPaisa"}:</p>
                    <p>1. Open your {payMethod === "jazzcash" ? "JazzCash" : "EasyPaisa"} app</p>
                    <p>2. Send <strong>{formatPKR(course.price)}</strong> to: <strong>0300-1234567</strong></p>
                    <p>3. Enter your mobile number and transaction reference below</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">Your Mobile Number</label>
                    <input type="tel" placeholder="03XX-XXXXXXX" value={mobileNum}
                      onChange={e => setMobileNum(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">Transaction Reference (optional)</label>
                    <input type="text" placeholder="e.g. TXN123456789" value={txnRef}
                      onChange={e => setTxnRef(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                  </div>
                </div>
              )}

              {/* Bank Transfer form */}
              {payMethod === "bank_transfer" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs space-y-2">
                    <p className="font-semibold text-sky-700 dark:text-sky-400">Bank Account Details</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[var(--muted)]">
                      <span>Bank:</span>         <span className="font-medium text-[var(--foreground)]">HBL</span>
                      <span>Account Title:</span><span className="font-medium text-[var(--foreground)]">EduPortal Pvt Ltd</span>
                      <span>Account #:</span>    <span className="font-medium text-[var(--foreground)]">1234-5678-901</span>
                      <span>IBAN:</span>         <span className="font-medium text-[var(--foreground)]">PK36HABB0000001234567901</span>
                      <span>Amount:</span>       <span className="font-semibold text-[var(--primary)]">{formatPKR(course.price)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">Transaction Reference / TT Number</label>
                    <input type="text" placeholder="Enter your transfer reference" value={txnRef}
                      onChange={e => setTxnRef(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-[var(--muted)] p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <Icon.Lock size={12} className="text-emerald-500 shrink-0" />
                {payMethod === "card" ? "Secure payment · 30-day money-back guarantee" : "Payment will be verified within 1-2 hours. You'll receive email confirmation."}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setPayStep("method")} disabled={paying}>Back</Button>
                <Button className="flex-1" loading={paying} onClick={handlePurchase}>
                  {payMethod === "card"
                    ? <><Icon.CreditCard size={15} /> Pay {formatPKR(course.price)}</>
                    : <><Icon.CheckCircle size={15} /> Submit Payment</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-3">
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{value}</p>
    </div>
  );
}
