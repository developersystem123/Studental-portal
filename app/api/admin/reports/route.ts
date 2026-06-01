import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// GET /api/admin/reports?months=3|6|12 — aggregated platform analytics:
// monthly trends, headline totals, top courses, and category/method mixes.
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const requested = Number(new URL(request.url).searchParams.get("months"));
    const months = [3, 6, 12].includes(requested) ? requested : 6;

    const [users, enrollments, payments, courses, certificates, ratingAgg] = await Promise.all([
      prisma.user.findMany({ select: { role: true, createdAt: true } }),
      prisma.enrollment.findMany({ select: { enrolledAt: true, completed: true, courseId: true } }),
      prisma.payment.findMany({
        select: { createdAt: true, amount: true, status: true, method: true, courseId: true, currency: true },
      }),
      prisma.course.findMany({ select: { id: true, title: true, category: true } }),
      prisma.certificate.count(),
      prisma.review.aggregate({ where: { hidden: false }, _avg: { rating: true }, _count: { _all: true } }),
    ]);

    const now = new Date();
    // Index of a date within the rolling window ending in the current month.
    const idxOf = (d: Date) =>
      months - 1 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));

    const monthly = [] as {
      label: string;
      enrollments: number;
      signups: number;
      revenue: number;
      completions: number;
    }[];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly.push({ label: MONTH_LABELS[d.getMonth()], enrollments: 0, signups: 0, revenue: 0, completions: 0 });
    }

    for (const u of users) {
      const i = idxOf(u.createdAt);
      if (i >= 0 && i < months) monthly[i].signups += 1;
    }
    for (const e of enrollments) {
      const i = idxOf(e.enrolledAt);
      if (i >= 0 && i < months) {
        monthly[i].enrollments += 1;
        if (e.completed) monthly[i].completions += 1;
      }
    }
    const completedPayments = payments.filter((p) => p.status === "completed");
    for (const p of completedPayments) {
      const i = idxOf(p.createdAt);
      if (i >= 0 && i < months) monthly[i].revenue += p.amount;
    }

    const completionTotal = enrollments.filter((e) => e.completed).length;
    const totals = {
      revenue: completedPayments.reduce((s, p) => s + p.amount, 0),
      refunded: payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0),
      students: users.filter((u) => u.role === "Student").length,
      teachers: users.filter((u) => u.role === "Instructor").length,
      courses: courses.length,
      enrollments: enrollments.length,
      completions: completionTotal,
      certificates,
      transactions: completedPayments.length,
      reviews: ratingAgg._count._all,
      avgRating: Math.round((ratingAgg._avg.rating ?? 0) * 10) / 10,
      completionRate: enrollments.length
        ? Math.round((completionTotal / enrollments.length) * 100)
        : 0,
      currency: payments[0]?.currency ?? "USD",
    };

    // Top courses by enrollment, with revenue earned.
    const courseById = new Map(courses.map((c) => [c.id, c]));
    const enrollByCourse = new Map<string, number>();
    for (const e of enrollments) {
      enrollByCourse.set(e.courseId, (enrollByCourse.get(e.courseId) ?? 0) + 1);
    }
    const revByCourse = new Map<string, number>();
    for (const p of completedPayments) {
      if (!p.courseId) continue;
      revByCourse.set(p.courseId, (revByCourse.get(p.courseId) ?? 0) + p.amount);
    }
    const topCourses = Array.from(enrollByCourse.entries())
      .map(([id, count]) => ({
        id,
        title: courseById.get(id)?.title ?? "Unknown course",
        enrollments: count,
        revenue: revByCourse.get(id) ?? 0,
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 6);

    // Enrollments by course category.
    const catCount = new Map<string, number>();
    for (const e of enrollments) {
      const course = courseById.get(e.courseId);
      if (!course) continue;
      const label = String(course.category).replace(/_/g, " ");
      catCount.set(label, (catCount.get(label) ?? 0) + 1);
    }
    const categoryMix = Array.from(catCount.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    // Completed payments by method.
    const methodCount = new Map<string, number>();
    for (const p of completedPayments) {
      methodCount.set(p.method, (methodCount.get(p.method) ?? 0) + 1);
    }
    const paymentMethods = Array.from(methodCount.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    return Response.json({ months, monthly, totals, topCourses, categoryMix, paymentMethods });
  } catch (err) {
    return errorResponse(err);
  }
}
