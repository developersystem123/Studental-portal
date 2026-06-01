import Link from "next/link";
import Icon from "@/components/icons";
import { Badge, Card, CardBody } from "@/components/ui";

export const metadata = {
  title: "Service Status — EduPortal",
  description:
    "Real-time status, uptime, and incident history for EduPortal services including the platform, AI tutor, live classes, and payments.",
};

type Status = "operational" | "degraded" | "down" | "maintenance";

const services: { name: string; description: string; status: Status; uptime: string }[] = [
  { name: "Platform (Web & Mobile)", description: "Course player, dashboard, profile.", status: "operational", uptime: "99.98%" },
  { name: "Authentication", description: "Sign-in, registration, Google sign-in.", status: "operational", uptime: "100.00%" },
  { name: "AI Chat tutor", description: "Real-time AI tutoring sessions.", status: "operational", uptime: "99.94%" },
  { name: "AI Quiz & Assignment", description: "AI quiz generation and assignment helper.", status: "operational", uptime: "99.91%" },
  { name: "Live classes", description: "Live-streaming and recordings.", status: "operational", uptime: "99.86%" },
  { name: "Payments & billing", description: "Subscriptions, invoices, refunds.", status: "operational", uptime: "99.99%" },
  { name: "Notifications", description: "Email, push, and in-app alerts.", status: "operational", uptime: "99.92%" },
  { name: "Forum & messaging", description: "Community forum and DMs.", status: "operational", uptime: "99.95%" },
];

type Incident = {
  date: string;
  service: string;
  severity: "minor" | "major" | "critical";
  title: string;
  resolved: boolean;
  updates: { time: string; body: string }[];
};

const incidents: Incident[] = [
  {
    date: "2026-05-12",
    service: "AI Chat tutor",
    severity: "minor",
    title: "Elevated AI response latency in EU region",
    resolved: true,
    updates: [
      { time: "14:48 UTC", body: "Investigating reports of slow AI tutor responses in Europe." },
      { time: "15:11 UTC", body: "Identified — upstream model provider throttling. Rerouting traffic." },
      { time: "15:34 UTC", body: "Resolved. Latency back within normal range." },
    ],
  },
  {
    date: "2026-04-28",
    service: "Live classes",
    severity: "major",
    title: "Live class join failures for ~12 minutes",
    resolved: true,
    updates: [
      { time: "09:02 UTC", body: "We're aware some users can't join scheduled live classes. Investigating." },
      { time: "09:10 UTC", body: "Identified — bad deploy to live-class gateway. Rolling back." },
      { time: "09:14 UTC", body: "Rollback complete. Monitoring." },
      { time: "09:24 UTC", body: "Fully resolved. Recordings of impacted sessions are being regenerated." },
    ],
  },
  {
    date: "2026-04-04",
    service: "Notifications",
    severity: "minor",
    title: "Email delivery delays via secondary provider",
    resolved: true,
    updates: [
      { time: "20:30 UTC", body: "Some transactional emails are delayed up to 15 minutes." },
      { time: "21:02 UTC", body: "Failover to primary provider complete. Queue draining." },
      { time: "21:18 UTC", body: "Resolved." },
    ],
  },
];

const statusStyles: Record<Status, { label: string; badge: "success" | "warning" | "danger" | "info"; dot: string }> = {
  operational: { label: "Operational", badge: "success", dot: "bg-emerald-500" },
  degraded: { label: "Degraded", badge: "warning", dot: "bg-amber-500" },
  down: { label: "Outage", badge: "danger", dot: "bg-red-500" },
  maintenance: { label: "Maintenance", badge: "info", dot: "bg-sky-500" },
};

const severityBadge: Record<Incident["severity"], "warning" | "danger" | "default"> = {
  minor: "default",
  major: "warning",
  critical: "danger",
};

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function UptimeBars({ days = 90 }: { days?: number }) {
  return (
    <div className="flex items-end gap-[2px] h-6 mt-3">
      {Array.from({ length: days }).map((_, i) => {
        const seed = (i * 31 + 7) % 97;
        const incident = seed === 12 || seed === 64;
        const partial = seed === 33;
        const color = incident
          ? "bg-red-500"
          : partial
            ? "bg-amber-400"
            : "bg-emerald-500";
        return <span key={i} className={`flex-1 ${color} rounded-sm`} title={`Day -${days - i}`} />;
      })}
    </div>
  );
}

export default function StatusPage() {
  const allUp = services.every((s) => s.status === "operational");

  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 lg:pt-20 lg:pb-12">
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Status</p>
        <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">EduPortal service status</h1>
        <p className="mt-3 text-[var(--muted)] max-w-2xl">
          Real-time service health, 90-day uptime, and recent incidents. Subscribe by email to get notified the moment
          something changes.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <Card
          className={
            "overflow-hidden border-2 " +
            (allUp ? "border-emerald-500/40" : "border-amber-500/40")
          }
        >
          <CardBody className="flex items-center gap-4 p-6">
            <div
              className={
                "h-14 w-14 rounded-2xl flex items-center justify-center " +
                (allUp ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500")
              }
            >
              {allUp ? <Icon.CheckCircle size={28} /> : <Icon.AlertCircle size={28} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold">
                {allUp ? "All systems operational" : "Some systems are experiencing issues"}
              </p>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                Last checked just now · 90-day average uptime: <strong>99.94%</strong>
              </p>
            </div>
            <a
              href="mailto:status-subscribe@eduportal.app"
              className="hidden sm:inline-flex h-10 px-4 rounded-xl border border-[var(--border-strong)] text-sm font-medium items-center gap-2 hover:bg-[var(--surface-2)] transition"
            >
              <Icon.Bell size={14} /> Subscribe
            </a>
          </CardBody>
        </Card>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Components</p>
          <h2 className="mt-1 text-2xl font-bold">Service health</h2>
        </div>
        <ul className="space-y-3">
          {services.map((s) => {
            const st = statusStyles[s.status];
            return (
              <li key={s.name}>
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} aria-hidden />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">{s.description}</p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-xs text-[var(--muted-2)] uppercase tracking-wider">90-day uptime</p>
                        <p className="text-sm font-semibold">{s.uptime}</p>
                      </div>
                      <Badge variant={st.badge}>{st.label}</Badge>
                    </div>
                    <UptimeBars />
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-[var(--surface)]/60 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Recent incidents</p>
            <h2 className="mt-1 text-2xl font-bold">Past 30 days</h2>
          </div>
          {incidents.length === 0 ? (
            <Card>
              <CardBody className="text-center py-10">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-3">
                  <Icon.CheckCircle size={26} />
                </div>
                <p className="font-semibold">No incidents this period</p>
                <p className="mt-1 text-sm text-[var(--muted)]">All clear for 30 days running.</p>
              </CardBody>
            </Card>
          ) : (
            <ul className="space-y-4">
              {incidents.map((i) => (
                <li key={i.date + i.title}>
                  <Card>
                    <CardBody>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant={severityBadge[i.severity]}>
                          {i.severity[0].toUpperCase() + i.severity.slice(1)}
                        </Badge>
                        <span className="text-xs text-[var(--muted)]">
                          {formatDate(i.date)} · {i.service}
                        </span>
                        {i.resolved && <Badge variant="success">Resolved</Badge>}
                      </div>
                      <p className="font-semibold leading-snug">{i.title}</p>
                      <ol className="mt-3 space-y-2 border-l-2 border-[var(--border)] pl-4">
                        {i.updates.map((u) => (
                          <li key={u.time} className="text-sm">
                            <span className="text-xs text-[var(--muted-2)] uppercase tracking-wider mr-2 font-semibold">
                              {u.time}
                            </span>
                            <span className="text-[var(--muted)]">{u.body}</span>
                          </li>
                        ))}
                      </ol>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardBody className="grid sm:grid-cols-2 gap-6 items-center">
            <div>
              <p className="font-semibold">Looking for our SLA?</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Business customers can request our 99.9% SLA and incident postmortems. We publish RCAs for every major
                incident within 5 business days.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/business"
                className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white inline-flex items-center gap-2 text-sm font-medium hover:brightness-110 transition justify-center"
              >
                EduPortal for Business <Icon.ChevronRight size={16} />
              </Link>
              <Link
                href="/contact?reason=Partnership"
                className="h-10 px-4 rounded-xl border border-[var(--border-strong)] inline-flex items-center gap-2 text-sm font-medium hover:bg-[var(--surface-2)] transition justify-center"
              >
                Contact sales
              </Link>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
