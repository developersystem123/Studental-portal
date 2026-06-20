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
  Modal,
  Switch,
  useToast,
} from "@/components/ui";
import { SignedOutPopup } from "@/components/layout/SignedOutPopup";
import { useAuth, useTheme } from "@/lib/store";
import { cn } from "@/lib/utils";

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

      {/* Account */}
      <CollapsibleCard
        icon={<Icon.User size={18} />}
        title="Account"
        description="Your profile and identity on EduPortal."
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
              {user?.phone && <p className="text-xs text-muted-2 mt-0.5">{user.phone}</p>}
            </div>
          </div>
          <Link href="/teacher/profile">
            <Button variant="outline">
              <Icon.User size={16} /> Edit profile
            </Button>
          </Link>
        </div>
      </CollapsibleCard>

      {/* Appearance */}
      <CollapsibleCard
        icon={theme === "dark" ? <Icon.Moon size={18} /> : <Icon.Sun size={18} />}
        title="Appearance"
        description="Choose how the teacher portal looks to you."
      >
        <div className="grid grid-cols-2 gap-3">
          <ThemeCard
            active={theme === "light"}
            onClick={() => setTheme("light")}
            label="Light"
            preview={
              <div className="h-16 rounded-lg bg-linear-to-br from-emerald-50 to-teal-100 border border-emerald-200" />
            }
          />
          <ThemeCard
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
            label="Dark"
            preview={
              <div className="h-16 rounded-lg bg-linear-to-br from-emerald-950 to-teal-900 border border-emerald-800" />
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Quick toggle</p>
            <p className="text-xs text-muted">Flip between light and dark.</p>
          </div>
          <Button variant="outline" onClick={toggle}>
            {theme === "dark" ? <Icon.Sun size={16} /> : <Icon.Moon size={16} />}
            Switch to {theme === "dark" ? "light" : "dark"}
          </Button>
        </div>
      </CollapsibleCard>

      {/* Notifications */}
      <CollapsibleCard
        icon={<Icon.Bell size={18} />}
        title="Notifications"
        description="Decide what we send you by email."
      >
        <ul className="divide-y divide-border">
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
        <div className="flex justify-end pt-1">
          <Button variant="ghost" onClick={resetPrefs}>
            Reset to defaults
          </Button>
        </div>
      </CollapsibleCard>

      {/* Session */}
      <CollapsibleCard
        icon={<Icon.Logout size={18} />}
        title="Session"
        description="End your current session on this device."
        tone="danger"
        className="border-(--danger)/30"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted">
            Signing out will return you to the login screen. Your data stays safe.
          </p>
          <Button variant="danger" onClick={() => setConfirmLogout(true)}>
            <Icon.Logout size={16} /> Sign out
          </Button>
        </div>
      </CollapsibleCard>

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

/* ---------- CollapsibleCard ---------- */
function CollapsibleCard({
  icon,
  title,
  description,
  tone = "primary",
  className,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone?: "primary" | "danger";
  className?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  const iconCls =
    tone === "danger"
      ? "bg-red-500/10 text-danger"
      : "bg-primary-soft text-primary";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-(--surface-2)/40 transition-colors"
      >
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", iconCls)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{title}</p>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
        <span
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
            open
              ? "bg-primary-soft text-primary rotate-180"
              : "bg-surface-2 text-muted",
          )}
        >
          <Icon.ChevronDown size={16} />
        </span>
      </button>

      {/* smooth height animation via grid-rows trick */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 space-y-4 border-t border-border">
            <div className="pt-4 space-y-4">{children}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- ThemeCard ---------- */
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
      className={cn(
        "relative text-left p-3 rounded-xl border-2 transition-all",
        active
          ? "border-primary bg-primary-soft/40"
          : "border-border hover:border-[var(--border-strong)] bg-surface",
      )}
    >
      {preview}
      <p className={cn("mt-2 text-sm font-semibold", active && "text-primary")}>{label}</p>
      {active && (
        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center">
          <Icon.Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/* ---------- PrefRow ---------- */
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
    <li className="py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </li>
  );
}
