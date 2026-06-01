"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  Modal,
  Switch,
  useToast,
} from "@/components/ui";
import { SignedOutPopup } from "@/components/layout/SignedOutPopup";
import { useAuth, useTheme } from "@/lib/store";

const LS_PREFS = "eduportal:teacher-prefs";

type Prefs = {
  emailEnrollments: boolean;
  emailCompletions: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
};

const DEFAULTS: Prefs = {
  emailEnrollments: true,
  emailCompletions: true,
  weeklyDigest: false,
  productUpdates: true,
};

export default function TeacherSettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle, setTheme } = useTheme();
  const toast = useToast();

  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);
  const [hydrated, setHydrated] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [signedOut, setSignedOut] = React.useState(false);

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

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Account</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-[var(--muted)]">Manage your account, appearance, and notification preferences.</p>
      </div>

      {/* Account card */}
      <Card>
        <CardBody className="space-y-4">
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
            <Link href="/teacher/profile">
              <Button variant="outline">
                <Icon.User size={16} /> Edit profile
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Appearance */}
      <Card>
        <CardBody className="space-y-4">
          <SectionHeader
            icon={theme === "dark" ? <Icon.Moon size={18} /> : <Icon.Sun size={18} />}
            title="Appearance"
            description="Choose how the teacher portal looks to you."
          />
          <div className="grid grid-cols-2 gap-3">
            <ThemeCard
              active={theme === "light"}
              onClick={() => setTheme("light")}
              label="Light"
              preview={
                <div className="h-16 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200" />
              }
            />
            <ThemeCard
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
              label="Dark"
              preview={
                <div className="h-16 rounded-lg bg-gradient-to-br from-emerald-950 to-teal-900 border border-emerald-800" />
              }
            />
          </div>
          <div className="pt-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Quick toggle</p>
              <p className="text-xs text-[var(--muted)]">Flip between light and dark.</p>
            </div>
            <Button variant="outline" onClick={toggle}>
              {theme === "dark" ? <Icon.Sun size={16} /> : <Icon.Moon size={16} />}
              Switch to {theme === "dark" ? "light" : "dark"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Notifications */}
      <Card>
        <CardBody className="space-y-4">
          <SectionHeader
            icon={<Icon.Bell size={18} />}
            title="Notifications"
            description="Decide what we send you by email."
          />
          <ul className="divide-y divide-[var(--border)]">
            <PrefRow
              title="New enrollments"
              description="Email me when a student enrolls in one of my courses."
              checked={prefs.emailEnrollments}
              onChange={(v) => setPref("emailEnrollments", v)}
            />
            <PrefRow
              title="Course completions"
              description="Email me when a student finishes a course I teach."
              checked={prefs.emailCompletions}
              onChange={(v) => setPref("emailCompletions", v)}
            />
            <PrefRow
              title="Weekly digest"
              description="A Monday summary of your class activity."
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
          <div className="pt-2 flex justify-end">
            <Button variant="ghost" onClick={resetPrefs}>
              Reset to defaults
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Danger zone */}
      <Card className="border-[var(--danger)]/30">
        <CardBody className="space-y-3">
          <SectionHeader
            icon={<Icon.Logout size={18} />}
            title="Session"
            description="End your current session on this device."
            tone="danger"
          />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-[var(--muted)]">
              Signing out will return you to the login screen. Your data stays safe.
            </p>
            <Button variant="danger" onClick={() => setConfirmLogout(true)}>
              <Icon.Logout size={16} /> Sign out
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Sign out?" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">You&apos;ll need to sign back in to access your account.</p>
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

function SectionHeader({
  icon,
  title,
  description,
  tone = "primary",
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone?: "primary" | "danger";
}) {
  const cls =
    tone === "danger"
      ? "bg-red-500/10 text-[var(--danger)]"
      : "bg-[var(--primary-soft)] text-[var(--primary)]";
  return (
    <div className="flex items-start gap-3">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        {description && <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>}
      </div>
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
