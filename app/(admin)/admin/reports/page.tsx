"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, StatCard, Tabs, useToast } from "@/components/ui";
import { BarChart, Donut, LineChart, ProgressBar } from "@/components/charts";
import Icon from "@/components/icons";

type Monthly = {
  label: string;
  enrollments: number;
  signups: number;
  revenue: number;
  completions: number;
};

type Totals = {
  revenue: number;
  refunded: number;
  students: number;
  teachers: number;
  courses: number;
  enrollments: number;
  completions: number;
  certificates: number;
  transactions: number;
  reviews: number;
  avgRating: number;
  completionRate: number;
  currency: string;
};

type TopCourse = { id: string; title: string; enrollments: number; revenue: number };
type Mix = { label: string; value: number };

type ReportData = {
  months: number;
  monthly: Monthly[];
  totals: Totals;
  topCourses: TopCourse[];
  categoryMix: Mix[];
  paymentMethods: Mix[];
};

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function shortMoney(cents: number) {
  const v = cents / 100;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}

export default function AdminReportsPage() {
  const toast = useToast();
  const [range, setRange] = React.useState("6");
  const [data, setData] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/reports?months=${range}`, {
          credentials: "same-origin",
        });
        const json = await res.json();
        if (cancelled) return;
        if (res.ok) setData(json);
        else toast.push({ title: json.error ?? "Failed to load reports.", tone: "danger" });
      } catch {
        if (!cancelled) toast.push({ title: "Failed to load reports.", tone: "danger" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range, toast]);

  function changeRange(v: string) {
    setLoading(true);
    setRange(v);
  }

  function exportCsv() {
    if (!data) return;
    const header = "Month,Enrollments,Signups,Completions,Revenue\n";
    const rows = data.monthly
      .map(
        (m) =>
          `${m.label},${m.enrollments},${m.signups},${m.completions},${(m.revenue / 100).toFixed(2)}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${range}mo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push({ title: "Report exported", tone: "success" });
  }

  const totals = data?.totals;
  const currency = totals?.currency ?? "USD";
  const monthly = data?.monthly ?? [];
  const topMax = Math.max(...(data?.topCourses ?? []).map((c) => c.enrollments), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reports &amp; analytics</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Platform-wide trends for growth, revenue, and learning outcomes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={range}
            onChange={changeRange}
            options={[
              { value: "3", label: "3 mo" },
              { value: "6", label: "6 mo" },
              { value: "12", label: "12 mo" },
            ]}
          />
          <Button variant="outline" onClick={exportCsv} disabled={!data}>
            <Icon.Download size={16} /> Export CSV
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
              <Icon.Loader size={18} /> Crunching the numbers…
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className={`space-y-6 ${loading ? "opacity-60 transition" : ""}`}>
          {/* Headline totals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Gross revenue"
              value={money(totals?.revenue ?? 0, currency)}
              icon={<Icon.DollarSign size={18} />}
              tone="success"
              delta={`${totals?.transactions ?? 0} paid charges`}
            />
            <StatCard
              label="Enrollments"
              value={totals?.enrollments ?? 0}
              icon={<Icon.ListChecks size={18} />}
              tone="primary"
              delta={`${totals?.completions ?? 0} completed`}
            />
            <StatCard
              label="Completion rate"
              value={`${totals?.completionRate ?? 0}%`}
              icon={<Icon.Award size={18} />}
              tone="accent"
            />
            <StatCard
              label="Avg rating"
              value={totals?.avgRating || "—"}
              icon={<Icon.Star size={18} />}
              tone="warning"
              delta={`${totals?.reviews ?? 0} reviews`}
            />
          </div>

          {/* Enrollment trend + completion */}
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardBody>
                <h2 className="font-semibold">Enrollment trend</h2>
                <p className="text-xs text-[var(--muted)]">New enrollments per month</p>
                <div className="h-[240px] mt-3">
                  <LineChart
                    data={monthly.map((m) => ({ day: m.label, hours: m.enrollments }))}
                    height={240}
                    yFormatter={(v) => Math.round(v).toString()}
                  />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Completion</h2>
                  <Badge variant="info">{totals?.completionRate ?? 0}%</Badge>
                </div>
                <p className="text-xs text-[var(--muted)]">All-time enrollments</p>
                <div className="flex items-center justify-center py-6">
                  <Donut value={totals?.completionRate ?? 0} size={170} label="completed" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Certificates" value={totals?.certificates ?? 0} />
                  <MiniStat label="Completions" value={totals?.completions ?? 0} />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Revenue + signups */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardBody>
                <h2 className="font-semibold">Revenue per month</h2>
                <p className="text-xs text-[var(--muted)]">
                  Completed charges · {money(totals?.revenue ?? 0, currency)} total
                </p>
                <div className="h-[240px] mt-3">
                  <BarChart
                    data={monthly.map((m) => ({ label: m.label, value: m.revenue / 100 }))}
                    height={240}
                    valueLabel={(v) => shortMoney(v * 100)}
                  />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <h2 className="font-semibold">New signups per month</h2>
                <p className="text-xs text-[var(--muted)]">Student &amp; instructor registrations</p>
                <div className="h-[240px] mt-3">
                  <BarChart
                    data={monthly.map((m) => ({ label: m.label, value: m.signups }))}
                    height={240}
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Category mix + payment methods */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardBody>
                <h2 className="font-semibold">Enrollments by category</h2>
                <p className="text-xs text-[var(--muted)]">Where learners are spending time</p>
                {(data?.categoryMix ?? []).length === 0 ? (
                  <Empty />
                ) : (
                  <div className="h-[240px] mt-3">
                    <BarChart data={data!.categoryMix} height={240} />
                  </div>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <h2 className="font-semibold">Payments by method</h2>
                <p className="text-xs text-[var(--muted)]">Completed charges by payment type</p>
                {(data?.paymentMethods ?? []).length === 0 ? (
                  <Empty />
                ) : (
                  <div className="h-[240px] mt-3">
                    <BarChart
                      data={data!.paymentMethods.map((m) => ({
                        label: m.label.charAt(0).toUpperCase() + m.label.slice(1),
                        value: m.value,
                      }))}
                      height={240}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Top courses */}
          <Card>
            <CardBody>
              <h2 className="font-semibold">Top courses</h2>
              <p className="text-xs text-[var(--muted)] mb-3">
                Most-enrolled courses and the revenue they earned
              </p>
              {(data?.topCourses ?? []).length === 0 ? (
                <Empty />
              ) : (
                <ul className="space-y-4">
                  {data!.topCourses.map((c) => (
                    <li key={c.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium truncate pr-3">{c.title}</span>
                        <span className="text-[var(--muted)] shrink-0 tabular-nums">
                          {money(c.revenue, currency)}
                        </span>
                      </div>
                      <ProgressBar
                        label=""
                        value={(c.enrollments / topMax) * 100}
                        hint={`${c.enrollments} ${c.enrollments === 1 ? "learner" : "learners"}`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">
        {label}
      </p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="h-10 w-10 rounded-full bg-[var(--surface-2)] text-[var(--muted-2)] flex items-center justify-center">
        <Icon.BarChart3 size={18} />
      </div>
      <p className="text-sm text-[var(--muted)]">No data for this period yet.</p>
    </div>
  );
}
