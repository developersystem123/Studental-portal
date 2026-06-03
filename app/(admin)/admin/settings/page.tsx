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
  inAppEnrollments: boolean;
  inAppReviews: boolean;
  inAppPayments: boolean;
  reducedMotion: boolean;
  compactMode: boolean;
  twoFactor: boolean;
  activityLog: boolean;
  autoLogout: boolean;
};

const DEFAULTS: Prefs = {
  emailNewStudents: true,
  emailNewEnrollments: true,
  weeklyDigest: true,
  productUpdates: true,
  inAppEnrollments: true,
  inAppReviews: true,
  inAppPayments: true,
  reducedMotion: false,
  compactMode: false,
  twoFactor: false,
  activityLog: true,
  autoLogout: true,
};

const ACCENT_COLORS = [
  { label: "Green", value: "green", cls: "bg-emerald-500" },
  { label: "Blue", value: "blue", cls: "bg-blue-500" },
  { label: "Violet", value: "violet", cls: "bg-violet-500" },
  { label: "Orange", value: "orange", cls: "bg-orange-500" },
  { label: "Rose", value: "rose", cls: "bg-rose-500" },
];

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, toggle, setTheme } = useTheme();
  const admin = useAdmin();
  const { courses } = useData();
  const toast = useToast();

  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);
  const [hydrated, setHydrated] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [signedOut, setSignedOut] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  // Password change state
  const [pwForm, setPwForm] = React.useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = React.useState(false);
  const [pwError, setPwError] = React.useState("");

  // Export state
  const [exporting, setExporting] = React.useState(false);

  // Accent color
  const [accent, setAccent] = React.useState("green");

  // 2FA state
  const [tfaEnabled,   setTfaEnabled]   = React.useState(false);
  const [tfaSetupOpen, setTfaSetupOpen] = React.useState(false);
  const [tfaSetupUri,  setTfaSetupUri]  = React.useState("");
  const [tfaSetupSecret, setTfaSetupSecret] = React.useState("");
  const [tfaToken,     setTfaToken]     = React.useState("");
  const [tfaError,     setTfaError]     = React.useState("");
  const [tfaSaving,    setTfaSaving]    = React.useState(false);
  const [tfaDisableOpen, setTfaDisableOpen] = React.useState(false);
  const [tfaLoading,   setTfaLoading]   = React.useState(true);

  const stats = admin.stats();

  // Load 2FA status on mount
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/2fa", { credentials: "same-origin" });
        if (res.ok) {
          const data = await res.json() as { enabled: boolean };
          setTfaEnabled(data.enabled);
          setPrefs((p) => ({ ...p, twoFactor: data.enabled }));
        }
      } catch { /* ignore */ }
      finally { setTfaLoading(false); }
    })();
  }, []);

  async function openTfaSetup() {
    setTfaError("");
    setTfaToken("");
    const res = await fetch("/api/admin/2fa", { credentials: "same-origin" });
    const data = await res.json() as { enabled: boolean; uri: string | null; secret: string | null };
    if (data.enabled) { setTfaEnabled(true); return; }
    setTfaSetupUri(data.uri ?? "");
    setTfaSetupSecret(data.secret ?? "");
    setTfaSetupOpen(true);
  }

  async function enableTfa(e: React.FormEvent) {
    e.preventDefault();
    setTfaError("");
    if (tfaToken.length !== 6) { setTfaError("Enter the 6-digit code from your authenticator app."); return; }
    setTfaSaving(true);
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "enable", secret: tfaSetupSecret, token: tfaToken }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setTfaError(data.error ?? "Verification failed."); return; }
      setTfaEnabled(true);
      setPrefs((p) => ({ ...p, twoFactor: true }));
      setTfaSetupOpen(false);
      setTfaToken("");
      toast.push({ title: "2FA enabled", description: "Your account is now protected with two-factor authentication.", tone: "success" });
    } catch { setTfaError("Network error. Please try again."); }
    finally { setTfaSaving(false); }
  }

  async function disableTfa(e: React.FormEvent) {
    e.preventDefault();
    setTfaError("");
    if (tfaToken.length !== 6) { setTfaError("Enter the 6-digit code from your authenticator app."); return; }
    setTfaSaving(true);
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "disable", token: tfaToken }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setTfaError(data.error ?? "Verification failed."); return; }
      setTfaEnabled(false);
      setPrefs((p) => ({ ...p, twoFactor: false }));
      setTfaDisableOpen(false);
      setTfaToken("");
      toast.push({ title: "2FA disabled", tone: "success" });
    } catch { setTfaError("Network error. Please try again."); }
    finally { setTfaSaving(false); }
  }

  const sessionStarted = React.useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() - Math.floor(Math.random() * 3 + 1));
    return d;
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_PREFS);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrefs({ ...DEFAULTS, ...parsed });
        if (parsed._accent) setAccent(parsed._accent);
      }
    } catch {}
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_PREFS, JSON.stringify({ ...prefs, _accent: accent }));
    } catch {}
  }, [prefs, accent, hydrated]);

  function setPref<K extends keyof Prefs>(k: K, v: Prefs[K]) {
    setPrefs((p) => ({ ...p, [k]: v }));
    toast.push({ title: "Preference saved", tone: "success" });
  }

  function resetPrefs() {
    setPrefs(DEFAULTS);
    toast.push({ title: "Preferences reset to defaults", tone: "success" });
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (!pwForm.current) { setPwError("Enter your current password."); return; }
    if (pwForm.next.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
    setPwSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setPwSaving(false);
    setPwForm({ current: "", next: "", confirm: "" });
    toast.push({ title: "Password updated", description: "Your password has been changed successfully.", tone: "success" });
  }

  async function handleExport() {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const data = {
      exportedAt: new Date().toISOString(),
      students: stats.students,
      teachers: stats.teachers,
      courses: courses.length,
      enrollments: stats.enrollments,
      certificates: stats.certificates,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eduportal-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast.push({ title: "Export complete", description: "Data exported as JSON.", tone: "success" });
  }

  function wipeAllData() {
    [LS_USERS, LS_ENROLL, LS_CERTS, LS_NOTIFS, LS_COURSES].forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
    setConfirmReset(false);
    toast.push({ title: "Demo data cleared", description: "Reloading…", tone: "success" });
    setTimeout(() => { window.location.href = "/login"; }, 600);
  }

  const navItems = [
    { id: "profile", label: "Profile", icon: <Icon.User size={15} /> },
    { id: "system", label: "System", icon: <Icon.Settings size={15} /> },
    { id: "appearance", label: "Appearance", icon: <Icon.Sun size={15} /> },
    { id: "security", label: "Security", icon: <Icon.Lock size={15} /> },
    { id: "notifications", label: "Notifications", icon: <Icon.Bell size={15} /> },
    { id: "privacy", label: "Privacy & Data", icon: <Icon.Save size={15} /> },
    { id: "accessibility", label: "Accessibility", icon: <Icon.Sparkles size={15} /> },
    { id: "danger", label: "Danger zone", icon: <Icon.Trash size={15} />, danger: true },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold mb-1">Account</p>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="mt-1 text-[var(--muted)]">Manage your account, security, appearance, and platform data.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">
              <Icon.CheckCircle size={12} /> Admin
            </Badge>
            <Button variant="outline" onClick={toggle}>
              {resolvedTheme === "dark" ? <Icon.Sun size={15} /> : <Icon.Moon size={15} />}
              {resolvedTheme === "dark" ? "Light" : "Dark"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar nav */}
        <aside className="hidden lg:flex flex-col gap-1 w-48 shrink-0 sticky top-24">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeSection === item.id
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : item.danger
                  ? "text-[var(--danger)] hover:bg-red-500/10"
                  : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]",
              )}
            >
              <span className={item.danger ? "text-[var(--danger)]" : ""}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ── Profile ── */}
          <CollapsibleSection id="profile" title="Profile" icon={<Icon.User size={18} />} description="Your account information and identity." defaultOpen>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <Avatar name={user?.name ?? "?"} src={user?.avatar ?? null} size={60} />
                  <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-[var(--surface)] flex items-center justify-center">
                    <Icon.Check size={10} strokeWidth={3} className="text-white" />
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{user?.name}</p>
                    <Badge variant="primary">{user?.role}</Badge>
                  </div>
                  <p className="text-sm text-[var(--muted)] truncate">{user?.email}</p>
                  {user?.phone && <p className="text-xs text-[var(--muted-2)] mt-0.5">{user.phone}</p>}
                </div>
              </div>
              <Link href="/admin/profile">
                <Button variant="outline">
                  <Icon.Edit size={15} /> Edit profile
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <InfoTile icon={<Icon.CheckCircle size={15} />} label="Account status" value="Active" valueClass="text-emerald-600 dark:text-emerald-400 font-semibold" />
              <InfoTile icon={<Icon.Clock size={15} />} label="Session started" value={sessionStarted.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
              <InfoTile icon={<Icon.Crown size={15} />} label="Plan" value="Admin" valueClass="text-[var(--primary)] font-semibold" />
            </div>
          </CollapsibleSection>

          {/* ── System ── */}
          <CollapsibleSection id="system" title="System" icon={<Icon.Settings size={18} />} description="At-a-glance view of what's in the platform right now." defaultOpen>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatCard label="Students" value={stats.students} icon={<Icon.Users size={16} />} color="blue" />
              <StatCard label="Teachers" value={stats.teachers} icon={<Icon.User size={16} />} color="violet" />
              <StatCard label="Courses" value={courses.length} icon={<Icon.Book size={16} />} color="green" />
              <StatCard label="Enrollments" value={stats.enrollments} icon={<Icon.ListChecks size={16} />} color="orange" />
              <StatCard label="Certificates" value={stats.certificates} icon={<Icon.Award size={16} />} color="rose" />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4 space-y-3">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Platform health</p>
              <HealthBar label="Database" percent={92} color="emerald" />
              <HealthBar label="Storage" percent={67} color="blue" />
              <HealthBar label="API uptime" percent={99} color="violet" />
            </div>
          </CollapsibleSection>

          {/* ── Appearance ── */}
          <CollapsibleSection id="appearance" title="Appearance" icon={resolvedTheme === "dark" ? <Icon.Moon size={18} /> : <Icon.Sun size={18} />} description="Customise how the admin console looks to you." defaultOpen>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Theme</p>
            <div className="grid grid-cols-3 gap-3">
              <ThemeCard
                active={theme === "light"}
                onClick={() => setTheme("light")}
                label="Light"
                preview={<div className="h-14 rounded-lg bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200" />}
              />
              <ThemeCard
                active={theme === "dark"}
                onClick={() => setTheme("dark")}
                label="Dark"
                preview={<div className="h-14 rounded-lg bg-gradient-to-br from-gray-900 to-slate-800 border border-gray-700" />}
              />
              <ThemeCard
                active={theme === "system"}
                onClick={() => setTheme("system")}
                label="System"
                preview={
                  <div className="h-14 rounded-lg border border-gray-200 overflow-hidden flex">
                    <div className="flex-1 bg-gradient-to-br from-slate-50 to-gray-100" />
                    <div className="flex-1 bg-gradient-to-br from-gray-900 to-slate-800" />
                  </div>
                }
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Accent colour</p>
              <div className="flex gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => { setAccent(c.value); toast.push({ title: `Accent: ${c.label}`, tone: "success" }); }}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      c.cls,
                      accent === c.value ? "ring-2 ring-offset-2 ring-[var(--border-strong)] scale-110" : "opacity-70 hover:opacity-100 hover:scale-105",
                    )}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1 border-t border-[var(--border)]">
              <div>
                <p className="text-sm font-medium">Quick toggle</p>
                <p className="text-xs text-[var(--muted)]">Flip between light and dark mode.</p>
              </div>
              <Button variant="outline" onClick={toggle}>
                {resolvedTheme === "dark" ? <Icon.Sun size={15} /> : <Icon.Moon size={15} />}
                Switch to {resolvedTheme === "dark" ? "light" : "dark"}
              </Button>
            </div>
          </CollapsibleSection>

          {/* ── Security ── */}
          <CollapsibleSection id="security" title="Security" icon={<Icon.Lock size={18} />} description="Manage your password, 2FA, and active sessions." defaultOpen>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Change password</p>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <PasswordField
                  label="Current password"
                  value={pwForm.current}
                  onChange={(v) => setPwForm((f) => ({ ...f, current: v }))}
                  placeholder="••••••••"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <PasswordField
                    label="New password"
                    value={pwForm.next}
                    onChange={(v) => setPwForm((f) => ({ ...f, next: v }))}
                    placeholder="Min. 8 characters"
                  />
                  <PasswordField
                    label="Confirm new password"
                    value={pwForm.confirm}
                    onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))}
                    placeholder="Repeat new password"
                  />
                </div>
                {pwError && (
                  <p className="text-xs text-[var(--danger)] flex items-center gap-1.5">
                    <Icon.AlertCircle size={13} /> {pwError}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" disabled={pwSaving}>
                    {pwSaving ? <Icon.Loader size={15} /> : <Icon.Lock size={15} />}
                    {pwSaving ? "Saving…" : "Update password"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="border-t border-[var(--border)] pt-4 space-y-3">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Security settings</p>
              {/* 2FA row */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">Two-factor authentication</p>
                    {tfaEnabled ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Icon.Check size={10} /> Enabled
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded">Recommended</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {tfaEnabled ? "Your account is protected with TOTP-based 2FA." : "Add an extra layer of protection using an authenticator app."}
                  </p>
                </div>
                {tfaLoading ? (
                  <Icon.Loader size={18} className="animate-spin text-[var(--muted)]" />
                ) : tfaEnabled ? (
                  <Button size="sm" variant="outline" onClick={() => { setTfaToken(""); setTfaError(""); setTfaDisableOpen(true); }}>
                    <Icon.Lock size={13} /> Disable
                  </Button>
                ) : (
                  <Button size="sm" onClick={openTfaSetup}>
                    <Icon.Shield size={13} /> Enable 2FA
                  </Button>
                )}
              </div>
              <ul className="divide-y divide-[var(--border)]">
                <PrefRow
                  title="Auto sign-out after inactivity"
                  description="Automatically log out after 30 minutes of inactivity."
                  checked={prefs.autoLogout}
                  onChange={(v) => setPref("autoLogout", v)}
                />
              </ul>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Icon.Globe size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium">Active sessions</p>
                  <p className="text-xs text-[var(--muted)]">1 session · This device · Chrome</p>
                </div>
              </div>
              <Badge variant="primary">Current</Badge>
            </div>
          </CollapsibleSection>

          {/* ── Notifications ── */}
          <CollapsibleSection id="notifications" title="Notifications" icon={<Icon.Bell size={18} />} description="Control what alerts you receive and how." defaultOpen>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Email notifications</p>
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
                  description="Occasional updates about new platform features."
                  checked={prefs.productUpdates}
                  onChange={(v) => setPref("productUpdates", v)}
                />
              </ul>
            </div>

            <div className="space-y-1 border-t border-[var(--border)] pt-4">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">In-app notifications</p>
              <ul className="divide-y divide-[var(--border)]">
                <PrefRow
                  title="Enrollment alerts"
                  description="Show a badge when new enrollments come in."
                  checked={prefs.inAppEnrollments}
                  onChange={(v) => setPref("inAppEnrollments", v)}
                />
                <PrefRow
                  title="New reviews"
                  description="Notify me when a course receives a new review."
                  checked={prefs.inAppReviews}
                  onChange={(v) => setPref("inAppReviews", v)}
                />
                <PrefRow
                  title="Payment alerts"
                  description="Notify me when a payment is received or refunded."
                  checked={prefs.inAppPayments}
                  onChange={(v) => setPref("inAppPayments", v)}
                />
              </ul>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={resetPrefs}>Reset to defaults</Button>
            </div>
          </CollapsibleSection>

          {/* ── Privacy & Data ── */}
          <CollapsibleSection id="privacy" title="Privacy & Data" icon={<Icon.Save size={18} />} description="Control your data, exports, and activity logging." defaultOpen>

            <ul className="divide-y divide-[var(--border)]">
              <PrefRow
                title="Activity logging"
                description="Record admin actions like course changes and user edits."
                checked={prefs.activityLog}
                onChange={(v) => setPref("activityLog", v)}
              />
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Icon.Download size={15} />
                  </div>
                  <p className="text-sm font-semibold">Export platform data</p>
                </div>
                <p className="text-xs text-[var(--muted)]">Download a JSON snapshot of all platform statistics.</p>
                <Button variant="outline" onClick={handleExport} disabled={exporting} className="w-full mt-1">
                  {exporting ? <Icon.Loader size={14} /> : <Icon.Download size={14} />}
                  {exporting ? "Exporting…" : "Export JSON"}
                </Button>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                    <Icon.BarChart3 size={15} />
                  </div>
                  <p className="text-sm font-semibold">Usage report</p>
                </div>
                <p className="text-xs text-[var(--muted)]">View detailed platform analytics in the reports section.</p>
                <Link href="/admin/reports" className="block">
                  <Button variant="outline" className="w-full mt-1">
                    <Icon.TrendingUp size={14} /> View reports
                  </Button>
                </Link>
              </div>
            </div>
          </CollapsibleSection>

          {/* ── Accessibility ── */}
          <CollapsibleSection id="accessibility" title="Accessibility" icon={<Icon.Sparkles size={18} />} description="Adjust the interface for your comfort and needs." defaultOpen>
            <ul className="divide-y divide-[var(--border)]">
              <PrefRow
                title="Reduced motion"
                description="Minimise animations and transitions across the console."
                checked={prefs.reducedMotion}
                onChange={(v) => setPref("reducedMotion", v)}
              />
              <PrefRow
                title="Compact mode"
                description="Use tighter spacing and smaller padding in tables and lists."
                checked={prefs.compactMode}
                onChange={(v) => setPref("compactMode", v)}
              />
            </ul>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4 space-y-3">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Keyboard shortcuts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { keys: ["⌘", "K"], label: "Open search" },
                  { keys: ["⌘", "D"], label: "Toggle dark mode" },
                  { keys: ["G", "H"], label: "Go to dashboard" },
                  { keys: ["G", "S"], label: "Go to students" },
                  { keys: ["G", "C"], label: "Go to courses" },
                  { keys: ["Esc"], label: "Close modal" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--muted)]">{s.label}</span>
                    <div className="flex gap-1">
                      {s.keys.map((k) => (
                        <kbd key={k} className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* ── Danger zone ── */}
          <CollapsibleSection
            id="danger"
            title="Danger zone"
            icon={<Icon.Trash size={18} />}
            description="Irreversible actions. Be sure before continuing."
            defaultOpen={false}
            tone="danger"
            cardClassName="border-[var(--danger)]/30"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap border border-[var(--danger)]/20 rounded-xl p-4 bg-red-500/5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Reset demo data</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Clears all students, teachers, courses, enrollments, certificates, and notifications, then re-seeds default accounts.
                  </p>
                </div>
                <Button variant="danger" onClick={() => setConfirmReset(true)}>
                  <Icon.Trash size={15} /> Reset everything
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap p-4 rounded-xl border border-[var(--border)]">
                <div>
                  <p className="text-sm font-medium">Sign out of this device</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">You will need to sign in again to access the admin console.</p>
                </div>
                <Button variant="outline" onClick={() => setConfirmLogout(true)}>
                  <Icon.Logout size={15} /> Sign out
                </Button>
              </div>
            </div>
          </CollapsibleSection>

        </div>
      </div>

      {/* ── 2FA setup modal ── */}
      <Modal
        open={tfaSetupOpen}
        onClose={() => { if (!tfaSaving) { setTfaSetupOpen(false); setTfaToken(""); setTfaError(""); } }}
        title="Enable two-factor authentication"
        size="md"
      >
        <form onSubmit={enableTfa} className="p-5 space-y-5">
          <p className="text-sm text-[var(--muted)]">
            Scan the QR code below with an authenticator app (Google Authenticator, Authy, 1Password, etc.), then enter the 6-digit code to verify.
          </p>

          {/* QR code */}
          {tfaSetupUri && (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(tfaSetupUri)}`}
                alt="2FA QR code"
                width={180}
                height={180}
                className="rounded-xl border border-[var(--border)] p-2 bg-white"
              />
            </div>
          )}

          {/* Manual entry */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Manual entry key</p>
            <p className="font-mono text-sm tracking-widest break-all select-all">{tfaSetupSecret}</p>
            <p className="text-[11px] text-[var(--muted)]">Can&apos;t scan? Enter this key manually in your authenticator app.</p>
          </div>

          {/* Token input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={tfaToken}
              onChange={(e) => setTfaToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
            />
          </div>

          {tfaError && (
            <p className="text-xs text-[var(--danger)] flex items-center gap-1.5">
              <Icon.AlertCircle size={13} /> {tfaError}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-3">
            <Button variant="outline" type="button" onClick={() => setTfaSetupOpen(false)} disabled={tfaSaving}>Cancel</Button>
            <Button type="submit" loading={tfaSaving} disabled={tfaToken.length !== 6}>
              <Icon.Shield size={14} /> Verify &amp; enable
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── 2FA disable modal ── */}
      <Modal
        open={tfaDisableOpen}
        onClose={() => { if (!tfaSaving) { setTfaDisableOpen(false); setTfaToken(""); setTfaError(""); } }}
        title="Disable two-factor authentication"
        size="sm"
      >
        <form onSubmit={disableTfa} className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Enter the 6-digit code from your authenticator app to confirm disabling 2FA.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={tfaToken}
              onChange={(e) => setTfaToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/30 focus:border-[var(--danger)] transition-all"
            />
          </div>
          {tfaError && (
            <p className="text-xs text-[var(--danger)] flex items-center gap-1.5">
              <Icon.AlertCircle size={13} /> {tfaError}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-3">
            <Button variant="outline" type="button" onClick={() => setTfaDisableOpen(false)} disabled={tfaSaving}>Cancel</Button>
            <Button variant="danger" type="submit" loading={tfaSaving} disabled={tfaToken.length !== 6}>
              <Icon.Lock size={14} /> Disable 2FA
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modals ── */}
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
              <Icon.Logout size={15} /> Sign out
            </Button>
          </div>
        </div>
      </Modal>

      <SignedOutPopup open={signedOut} redirectTo="/login" />

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset all demo data?" size="sm">
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-[var(--danger)]/20">
            <Icon.AlertCircle size={18} className="text-[var(--danger)] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--muted)]">
              This permanently deletes every student, teacher, course, enrollment, certificate, and notification stored
              locally, then re-seeds the default demo accounts. This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={wipeAllData}>
              <Icon.Trash size={15} /> Reset everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Collapsible section ─────────────────────────────────────────────────────

function CollapsibleSection({
  id,
  title,
  icon,
  description,
  defaultOpen = true,
  tone = "primary",
  children,
  cardClassName,
}: {
  id?: string;
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
    <Card id={id} className={cn("scroll-mt-24", cardClassName)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--surface-2)]/60 transition-colors rounded-2xl"
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
          className={cn("text-[var(--muted)] transition-transform duration-200 shrink-0", open && "rotate-180")}
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

const STAT_COLORS: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3 space-y-2">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", STAT_COLORS[color])}>
        {icon}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-[var(--muted)] font-medium">{label}</p>
    </div>
  );
}

function HealthBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  const barCls: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
  };
  const textCls: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    violet: "text-violet-600 dark:text-violet-400",
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className={cn("text-xs font-semibold", textCls[color])}>{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--border)]">
        <div
          className={cn("h-full rounded-full transition-all", barCls[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40">
      <span className="text-[var(--muted)] shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider">{label}</p>
        <p className={cn("text-sm font-medium truncate mt-0.5", valueClass)}>{value}</p>
      </div>
    </div>
  );
}

function ThemeCard({ active, onClick, label, preview }: { active: boolean; onClick: () => void; label: string; preview: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative text-left p-3 rounded-xl border-2 transition-all",
        active
          ? "border-[var(--primary)] bg-[var(--primary-soft)]/40"
          : "border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)]",
      )}
    >
      {preview}
      <p className={cn("mt-2 text-sm font-semibold", active && "text-[var(--primary)]")}>{label}</p>
      {active && (
        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
          <Icon.Check size={11} strokeWidth={3} />
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
  badge,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  badge?: React.ReactNode;
}) {
  return (
    <li className="py-3 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{title}</p>
          {badge}
        </div>
        {description && <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </li>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--muted)]">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all placeholder:text-[var(--muted-2)]"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          {show ? <Icon.EyeOff size={15} /> : <Icon.Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
