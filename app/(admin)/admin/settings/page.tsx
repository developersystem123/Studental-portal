"use client";

import * as React from "react";
import Link from "next/link";
import Icon from "@/components/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Modal,
  Switch,
  useToast,
} from "@/components/ui";
import { SignedOutPopup } from "@/components/layout/SignedOutPopup";
import { useAdmin, useAuth, useData, useTheme } from "@/lib/store";
import { cn } from "@/lib/utils";

const LS_PREFS = "eduportal:admin-prefs";
const LS_USERS = "eduportal:users";
const LS_ENROLL = "eduportal:enrollments";
const LS_CERTS = "eduportal:certificates";
const LS_NOTIFS = "eduportal:notifications";
const LS_COURSES = "eduportal:courses";

type Prefs = {
  emailNewStudents: boolean;
  emailNewEnrollments: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
};

const DEFAULTS: Prefs = {
  emailNewStudents: true,
  emailNewEnrollments: true,
  weeklyDigest: true,
  productUpdates: true,
};

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggle, setTheme } = useTheme();
  const admin = useAdmin();
  const { courses } = useData();
  const toast = useToast();

  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);
  const [hydrated, setHydrated] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [signedOut, setSignedOut] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);

  const stats = admin.stats();

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_PREFS);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_PREFS, JSON.stringify(prefs));
    } catch {}
  }, [prefs, hydrated]);

  function setPref<K extends keyof Prefs>(k: K, v: Prefs[K]) {
    setPrefs((p) => ({ ...p, [k]: v }));
  }

  function resetPrefs() {
    setPrefs(DEFAULTS);
    toast.push({ title: "Preferences reset", tone: "success" });
  }

  function wipeAllData() {
    [LS_USERS, LS_ENROLL, LS_CERTS, LS_NOTIFS, LS_COURSES].forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
    setConfirmReset(false);
    toast.push({
      title: "Demo data cleared",
      description: "Reloading to re-seed defaults…",
      tone: "success",
    });
    setTimeout(() => {
      window.location.href = "/login";
    }, 600);
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Account</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-[var(--muted)]">Manage your account, appearance, notifications, and system data.</p>
      </div>

      {/* Profile */}
      <CollapsibleSection
        title="Profile"
        icon={<Icon.User size={18} />}
        description="Your account information."
        defaultOpen
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar name={user?.name ?? "?"} src={user?.avatar ?? null} size={56} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{user?.name}</p>
                <Badge variant="primary">{user?.role}</Badge>
              </div>
              <p className="text-sm text-[var(--muted)] truncate">{user?.email}</p>
              {user?.phone && <p className="text-xs text-[var(--muted-2)] mt-0.5">{user.phone}</p>}
            </div>
          </div>
          <Link href="/admin/profile">
            <Button variant="outline">
              <Icon.User size={16} /> Edit profile
            </Button>
          </Link>
        </div>
      </CollapsibleSection>

      {/* System summary */}
      <CollapsibleSection
        title="System"
        icon={<Icon.Settings size={18} />}
        description="At-a-glance view of what's in the system right now."
        defaultOpen
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatMini label="Students" value={stats.students} />
          <StatMini label="Teachers" value={stats.teachers} />
          <StatMini label="Courses" value={courses.length} />
          <StatMini label="Enrollments" value={stats.enrollments} />
          <StatMini label="Certificates" value={stats.certificates} />
        </div>
      </CollapsibleSection>

      {/* Appearance */}
      <CollapsibleSection
        title="Appearance"
        icon={theme === "dark" ? <Icon.Moon size={18} /> : <Icon.Sun size={18} />}
        description="Choose how the admin console looks to you."
        defaultOpen
      >
        <div className="grid grid-cols-2 gap-3">
          <ThemeCard
            active={theme === "light"}
            onClick={() => setTheme("light")}
            label="Light"
            preview={
              <div className="h-16 rounded-lg bg-gradient-to-br from-rose-50 to-pink-100 border border-rose-200" />
            }
          />
          <ThemeCard
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
            label="Dark"
            preview={
              <div className="h-16 rounded-lg bg-gradient-to-br from-rose-950 to-pink-900 border border-rose-800" />
            }
          />
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">Quick toggle</p>
            <p className="text-xs text-[var(--muted)]">Flip between light and dark.</p>
          </div>
          <Button variant="outline" onClick={toggle}>
            {theme === "dark" ? <Icon.Sun size={16} /> : <Icon.Moon size={16} />}
            Switch to {theme === "dark" ? "light" : "dark"}
          </Button>
        </div>
      </CollapsibleSection>

      {/* Notifications */}
      <CollapsibleSection
        title="Notifications"
        icon={<Icon.Bell size={18} />}
        description="What we send you by email."
        defaultOpen
      >
        <ul className="divide-y divide-[var(--border)]">
          <PrefRow
            title="New student signups"
            description="Email me when a new student registers."
            checked={prefs.emailNewStudents}
            onChange={(v) => setPref("emailNewStudents", v)}
          />
          <PrefRow
            title="New enrollments"
            description="Email me when a student enrolls in a course."
            checked={prefs.emailNewEnrollments}
            onChange={(v) => setPref("emailNewEnrollments", v)}
          />
          <PrefRow
            title="Weekly digest"
            description="A Monday summary of platform activity."
            checked={prefs.weeklyDigest}
            onChange={(v) => setPref("weeklyDigest", v)}
          />
          <PrefRow
            title="Product updates"
            description="Occasional updates about new features."
            checked={prefs.productUpdates}
            onChange={(v) => setPref("productUpdates", v)}
          />
        </ul>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={resetPrefs}>
            Reset to defaults
          </Button>
        </div>
      </CollapsibleSection>

      {/* Danger zone */}
      <CollapsibleSection
        title="Danger zone"
        icon={<Icon.Trash size={18} />}
        description="Irreversible actions. Be sure before continuing."
        defaultOpen={false}
        tone="danger"
        cardClassName="border-[var(--danger)]/30"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap border border-[var(--danger)]/20 rounded-xl p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Reset demo data</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Clears all students, teachers, courses, enrollments, certificates, and notifications, then re-seeds the
              default demo accounts.
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            <Icon.Trash size={16} /> Reset everything
          </Button>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-[var(--muted)]">Sign out of this device.</p>
          <Button variant="outline" onClick={() => setConfirmLogout(true)}>
            <Icon.Logout size={16} /> Sign out
          </Button>
        </div>
      </CollapsibleSection>

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

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset all demo data?" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This permanently deletes every student, teacher, course, enrollment, certificate, and notification stored
            locally, then re-seeds the default demo accounts. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={wipeAllData}>
              <Icon.Trash size={16} /> Reset everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Collapsible section ─────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  description,
  defaultOpen = true,
  tone = "primary",
  children,
  cardClassName,
}: {
  title: string;
  icon: React.ReactNode;
  description?: string;
  defaultOpen?: boolean;
  tone?: "primary" | "danger";
  children: React.ReactNode;
  cardClassName?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const iconCls =
    tone === "danger"
      ? "bg-red-500/10 text-[var(--danger)]"
      : "bg-[var(--primary-soft)] text-[var(--primary)]";

  return (
    <Card className={cardClassName}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--surface-2)] transition-colors rounded-2xl"
      >
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", iconCls)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold", tone === "danger" && "text-[var(--danger)]")}>{title}</p>
          {description && <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>}
        </div>
        <Icon.ChevronDown
          size={16}
          className={cn(
            "text-[var(--muted)] transition-transform duration-200 shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--border)] p-5 space-y-4">
          {children}
        </div>
      )}
    </Card>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function ThemeCard({
  active,
  onClick,
  label,
  preview,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  preview: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left p-3 rounded-xl border-2 transition-all ${
        active
          ? "border-[var(--primary)] bg-[var(--primary-soft)]/40"
          : "border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)]"
      }`}
    >
      {preview}
      <p className={`mt-2 text-sm font-semibold ${active ? "text-[var(--primary)]" : ""}`}>{label}</p>
      {active && (
        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
          <Icon.Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function PrefRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </li>
  );
}
