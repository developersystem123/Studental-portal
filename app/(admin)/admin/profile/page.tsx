"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, Modal } from "@/components/ui";
import Icon from "@/components/icons";
import { SignedOutPopup } from "@/components/layout/SignedOutPopup";
import { useAdmin, useAuth, useData } from "@/lib/store";
import {
  ChangePasswordCard,
  PersonalInfoCard,
  ProfileCompletionCard,
  ProfileHero,
  SectionHeader,
} from "@/components/profile/sections";
import { cn } from "@/lib/utils";

export default function AdminProfilePage() {
  const { user, logout } = useAuth();
  const admin = useAdmin();
  const { courses } = useData();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [signedOut, setSignedOut] = React.useState(false);

  if (!user) return null;

  const stats = admin.stats();

  const STAT_CARDS: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    href: string;
  }[] = [
    {
      label: "Students",
      value: stats.students,
      icon: <Icon.Users size={18} />,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      border: "border-sky-500/15",
      href: "/admin/students",
    },
    {
      label: "Teachers",
      value: stats.teachers,
      icon: <Icon.Sparkles size={18} />,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "border-violet-500/15",
      href: "/admin/teachers",
    },
    {
      label: "Courses",
      value: courses.length,
      icon: <Icon.Book size={18} />,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/15",
      href: "/admin/courses",
    },
    {
      label: "Enrollments",
      value: stats.enrollments,
      icon: <Icon.ListChecks size={18} />,
      color: "text-[var(--primary)]",
      bg: "bg-[var(--primary-soft)]",
      border: "border-[var(--primary)]/15",
      href: "/admin/enrollments",
    },
    {
      label: "Certificates",
      value: stats.certificates,
      icon: <Icon.Award size={18} />,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/15",
      href: "/admin/certificates",
    },
  ];

  const CONSOLE_LINKS = [
    { href: "/admin", icon: <Icon.Home size={16} />, title: "Overview", description: "Stats & recent activity" },
    { href: "/admin/students", icon: <Icon.Users size={16} />, title: "Students", description: "Onboard, edit, reset" },
    { href: "/admin/teachers", icon: <Icon.Sparkles size={16} />, title: "Teachers", description: "Instructors & permissions" },
    { href: "/admin/courses", icon: <Icon.Book size={16} />, title: "Courses", description: "Catalog & chapters" },
    { href: "/admin/enrollments", icon: <Icon.ListChecks size={16} />, title: "Enrollments", description: "Award & revoke certificates" },
    { href: "/admin/settings", icon: <Icon.Settings size={16} />, title: "Settings", description: "Preferences & data" },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* ── Hero ── */}
      <ProfileHero
        extra={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="primary"><Icon.Settings size={11} /> Full system access</Badge>
            <Badge variant="default">{stats.students} students</Badge>
            <Badge variant="default">{stats.teachers} teachers</Badge>
            <Badge variant="default">{courses.length} courses</Badge>
            {stats.pendingApplications > 0 && (
              <Badge variant="warning">{stats.pendingApplications} pending</Badge>
            )}
          </div>
        }
      />

      {/* ── System overview stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAT_CARDS.map(({ label, value, icon, color, bg, border, href }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "group rounded-2xl border p-4 card-shadow transition-all hover:-translate-y-0.5 hover:shadow-md",
              bg,
              border,
            )}
          >
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", bg, color)}>
              {icon}
            </div>
            <p className="mt-3 text-xs font-medium text-[var(--muted)]">{label}</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">{value}</span>
              <Icon.ChevronRight
                size={13}
                className={cn(
                  "opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100",
                  color,
                )}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Profile completion ── */}
      <ProfileCompletionCard />

      <PersonalInfoCard description="Your details as they appear in the admin console." />
      <ChangePasswordCard />

      {/* ── Console shortcuts ── */}
      <Card>
        <CardBody className="space-y-4">
          <SectionHeader
            icon={<Icon.ListChecks size={18} />}
            title="Console shortcuts"
            description="Jump back to the workspaces you use most."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CONSOLE_LINKS.map(({ href, icon, title, description }) => (
              <QuickLink key={href} href={href} icon={icon} title={title} description={description} />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── Platform health + Session — 2-column row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        {/* Platform at a glance */}
        <Card>
          <CardBody className="space-y-4">
            <SectionHeader
              icon={<Icon.BarChart3 size={18} />}
              title="Platform at a glance"
              description="Live summary of activity across the platform."
            />
            <div className="grid grid-cols-1 gap-3">
              <MetricRow
                label="Completion rate"
                value={
                  stats.enrollments > 0
                    ? `${Math.round((stats.certificates / stats.enrollments) * 100)}%`
                    : "—"
                }
                sub={`${stats.certificates} certificates / ${stats.enrollments} enrollments`}
                icon={<Icon.TrendingUp size={15} />}
                color="text-emerald-500"
              />
              <MetricRow
                label="Pending applications"
                value={String(stats.pendingApplications)}
                sub={stats.pendingApplications === 0 ? "All reviewed" : "Awaiting review"}
                icon={<Icon.Clock size={15} />}
                color={stats.pendingApplications > 0 ? "text-amber-500" : "text-emerald-500"}
              />
            </div>
          </CardBody>
        </Card>

        {/* Session / sign-out */}
        <Card className="border-[var(--danger)]/30">
          <CardBody className="space-y-5">
            <SectionHeader
              icon={<Icon.Logout size={18} />}
              title="Session"
              description="End your session on this device."
              tone="danger"
            />
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--danger)]/20 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Sign out</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Admin accounts can&apos;t be self-deleted to keep the system manageable. Reset everything from{" "}
                  <Link href="/admin/settings" className="text-[var(--primary)] hover:underline">
                    Settings
                  </Link>{" "}
                  if you really need a clean slate.
                </p>
              </div>
              <Button variant="danger" onClick={() => setConfirmLogout(true)}>
                <Icon.Logout size={16} /> Sign out
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Sign out?" size="sm">
        <div className="space-y-4 p-5">
          <p className="text-sm text-[var(--muted)]">
            You&apos;ll need to sign back in to access the admin console.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                setConfirmLogout(false);
                await logout();
                setSignedOut(true);
              }}
            >
              <Icon.Logout size={16} /> Sign out
            </Button>
          </div>
        </div>
      </Modal>

      <SignedOutPopup open={signedOut} redirectTo="/login" />
    </div>
  );
}

function MetricRow({
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={color}>{icon}</span>
        <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-[var(--muted-2)] mt-0.5">{sub}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)]/30"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-[var(--muted)]">{description}</p>
      </div>
      <Icon.ChevronRight
        size={16}
        className="text-[var(--muted-2)] transition group-hover:translate-x-0.5 group-hover:text-[var(--primary)]"
      />
    </Link>
  );
}
