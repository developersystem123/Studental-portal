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
  ProfileHero,
  SectionHeader,
} from "@/components/profile/sections";

export default function AdminProfilePage() {
  const { user, logout } = useAuth();
  const admin = useAdmin();
  const { courses } = useData();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [signedOut, setSignedOut] = React.useState(false);

  if (!user) return null;

  const stats = admin.stats();

  return (
    <div className="space-y-6 fade-in">
      <ProfileHero
        extra={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="primary"><Icon.Settings size={11} /> Full system access</Badge>
            <Badge variant="default">{stats.students} students</Badge>
            <Badge variant="default">{stats.teachers} teachers</Badge>
            <Badge variant="default">{courses.length} courses</Badge>
          </div>
        }
      />

      <PersonalInfoCard description="Your details as they appear in the admin console." />
      <ChangePasswordCard />

      {/* System overview — admin-only */}
      <Card>
        <CardBody className="space-y-5">
          <SectionHeader
            icon={<Icon.Settings size={18} />}
            title="System overview"
            description="What you currently oversee on the platform."
          />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatMini label="Students" value={stats.students} />
            <StatMini label="Teachers" value={stats.teachers} />
            <StatMini label="Courses" value={courses.length} />
            <StatMini label="Enrollments" value={stats.enrollments} />
            <StatMini label="Certificates" value={stats.certificates} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <QuickLink href="/admin/students" icon={<Icon.User size={16} />} title="Manage students" description="Onboard, edit, reset" />
            <QuickLink href="/admin/teachers" icon={<Icon.Sparkles size={16} />} title="Manage teachers" description="Instructors & permissions" />
            <QuickLink href="/admin/courses" icon={<Icon.Book size={16} />} title="Manage courses" description="Catalog & chapters" />
          </div>
        </CardBody>
      </Card>

      {/* Quick admin links */}
      <Card>
        <CardBody className="space-y-4">
          <SectionHeader
            icon={<Icon.ListChecks size={18} />}
            title="Console shortcuts"
            description="Jump back to the workspaces you use most."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickLink href="/admin" icon={<Icon.Home size={16} />} title="Overview" description="Stats & recent activity" />
            <QuickLink href="/admin/enrollments" icon={<Icon.Award size={16} />} title="Enrollments" description="Award & revoke certificates" />
            <QuickLink href="/admin/settings" icon={<Icon.Settings size={16} />} title="Settings" description="Preferences & data" />
          </div>
        </CardBody>
      </Card>

      {/* Session — no delete account for admins, to avoid locking out the system */}
      <Card className="border-[var(--danger)]/30">
        <CardBody className="space-y-5">
          <SectionHeader
            icon={<Icon.Logout size={18} />}
            title="Session"
            description="End your session on this device."
            tone="danger"
          />
          <div className="flex items-center justify-between gap-4 flex-wrap border border-[var(--danger)]/20 rounded-xl p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
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

      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Sign out?" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">You&apos;ll need to sign back in to access the admin console.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>Cancel</Button>
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

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
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
      className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)]/30 transition group"
    >
      <div className="h-9 w-9 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-[var(--muted)]">{description}</p>
      </div>
      <Icon.ChevronRight size={16} className="text-[var(--muted-2)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition" />
    </Link>
  );
}
