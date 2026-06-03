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

const USD_TO_PKR = 280;

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
  // After Stripe redirect back, auto-complete enrollment
  const [stripeProcessing, setStripeProcessing] = useState(false);

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

  // Paid course — payment then enroll
  async function handlePurchase() {
    if (!course || !user) { if (!user) router.push("/login"); return; }
    setPaying(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: course.price,
          courseId: course.id,
          description: `Course: ${course.title}`,
          method: "card",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Payment failed.");

      // Stripe mode — redirect to hosted checkout
      if ((data as { checkoutUrl?: string }).checkoutUrl) {
        window.location.href = (data as { checkoutUrl: string }).checkoutUrl;
        return;
      }

      // Simulated payment completed — enroll immediately
      await enroll(course.id);
      addNotification({ type: "achievement", title: "Enrolled!", message: `You're now enrolled in ${course.title}.` });
      toast.push({ title: "Payment successful!", description: `Welcome to ${course.title}`, tone: "success" });
      setPayModal(false);
      router.push(`/my-courses/${course.id}`);
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
                    <p className="text-3xl font-bold">${course.price}</p>
                    <p className="text-sm text-[var(--muted)]">₨{(course.price * USD_TO_PKR).toLocaleString()} PKR</p>
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
                    <Icon.CreditCard size={16} /> Buy Now — ${course.price}
                  </Button>
                  <p className="text-[10px] text-center text-[var(--muted)] flex items-center justify-center gap-1">
                    <Icon.Lock size={10} /> Secure payment · 30-day money-back guarantee
                  </p>
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
      <Modal open={payModal} onClose={() => !paying && setPayModal(false)} title={`Purchase — ${course.title}`}>
        <div className="p-5 space-y-5">
          {/* Order summary */}
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
              <div className="text-right">
                <p className="font-bold text-lg">${course.price}</p>
                <p className="text-xs text-[var(--muted)]">₨{(course.price * USD_TO_PKR).toLocaleString()} PKR</p>
              </div>
            </div>
          </div>

          {/* What you get */}
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

          <div className="flex items-center gap-2 text-xs text-[var(--muted)] p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            <Icon.Lock size={12} className="text-emerald-500 shrink-0" />
            Secure payment · 30-day money-back guarantee
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setPayModal(false)} disabled={paying}>
              Cancel
            </Button>
            <Button className="flex-1" loading={paying} onClick={handlePurchase}>
              <Icon.CreditCard size={15} /> Pay ${course.price}
            </Button>
          </div>
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
