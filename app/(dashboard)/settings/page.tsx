"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Switch,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth, useTheme } from "@/lib/store";
import { cn } from "@/lib/utils";

type Settings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  language: string;
  timezone: string;
  theme: string;
};

const DEFAULTS: Settings = {
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  marketingEmails: false,
  language: "en",
  timezone: "UTC",
  theme: "auto",
};

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

const TIMEZONES = [
  "UTC",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

export default function SettingsPage() {
  const { changePassword, deleteAccount } = useAuth();
  const { setTheme } = useTheme();
  const { push } = useToast();

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // Security
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);

  // Danger zone
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const s: Settings = { ...DEFAULTS, ...data.settings };
          setSettings(s);
          if (s.theme !== "auto") setTheme(s.theme as "light" | "dark");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setTheme]);

  async function patchSettings(patch: Partial<Settings>): Promise<Response> {
    return fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  function setToggle(key: keyof Settings, value: boolean) {
    const prev = settings[key];
    setSettings((s) => ({ ...s, [key]: value }));
    setAutoSaving(true);
    patchSettings({ [key]: value })
      .then((r) => {
        if (!r.ok) {
          // Rollback on server error.
          setSettings((s) => ({ ...s, [key]: prev }));
          push({ title: "Couldn't save setting", tone: "danger" });
        }
      })
      .catch(() => {
        setSettings((s) => ({ ...s, [key]: prev }));
        push({ title: "Couldn't save setting", tone: "danger" });
      })
      .finally(() => setAutoSaving(false));
  }

  async function savePreferences() {
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: settings.language,
          timezone: settings.timezone,
          theme: settings.theme,
        }),
      });
      push(r.ok
        ? { title: "Preferences saved", tone: "success" }
        : { title: "Couldn't save", tone: "danger" }
      );
    } catch {
      push({ title: "Couldn't save", tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPwd || !newPwd || !confirmPwd) {
      push({ title: "Fill in all password fields", tone: "danger" }); return;
    }
    if (newPwd !== confirmPwd) {
      push({ title: "Passwords don't match", tone: "danger" }); return;
    }
    if (newPwd.length < 8) {
      push({ title: "New password must be at least 8 characters", tone: "danger" }); return;
    }
    setPwdBusy(true);
    const result = await changePassword(currentPwd, newPwd);
    setPwdBusy(false);
    if (!result.ok) {
      push({ title: "Couldn't update password", description: result.error, tone: "danger" }); return;
    }
    push({ title: "Password updated", tone: "success" });
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") {
      push({ title: 'Type "DELETE" to confirm', tone: "danger" }); return;
    }
    setDeleteBusy(true);
    try { await deleteAccount(); } finally { setDeleteBusy(false); }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-[var(--surface-2)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Manage your preferences and account.</p>
      </div>

      {/* Notifications */}
      <CollapsibleCard
        title="Notifications"
        icon={<Icon.Bell size={16} />}
        defaultOpen
        extra={
          autoSaving ? (
            <span className="text-xs text-[var(--muted)] flex items-center gap-1.5 mr-2">
              <Icon.Loader size={12} className="animate-spin" /> Saving…
            </span>
          ) : null
        }
      >
        <div className="p-5 space-y-5">
          <ToggleRow
            label="Email notifications"
            description="Course updates, assignment reminders, and replies."
            checked={settings.emailNotifications}
            onChange={(v) => setToggle("emailNotifications", v)}
          />
          <ToggleRow
            label="Push notifications"
            description="Browser push for urgent updates."
            checked={settings.pushNotifications}
            onChange={(v) => setToggle("pushNotifications", v)}
          />
          <ToggleRow
            label="Weekly digest"
            description="A summary of your progress every Monday."
            checked={settings.weeklyDigest}
            onChange={(v) => setToggle("weeklyDigest", v)}
          />
          <ToggleRow
            label="Marketing emails"
            description="Product news, promotions, and new courses."
            checked={settings.marketingEmails}
            onChange={(v) => setToggle("marketingEmails", v)}
          />
        </div>
      </CollapsibleCard>

      {/* Region & Language */}
      <CollapsibleCard
        title="Region & Language"
        icon={<Icon.Globe size={16} />}
        defaultOpen
      >
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm font-medium mb-1.5">Language</p>
            <Select
              className="w-full"
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            >
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium mb-1.5">Timezone</p>
            <Select
              className="w-full"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            >
              {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
        </div>
      </CollapsibleCard>

      {/* Appearance */}
      <CollapsibleCard
        title="Appearance"
        icon={<Icon.Sun size={16} />}
        defaultOpen
      >
        <div className="p-5 space-y-3">
          <p className="text-sm font-medium">Theme</p>
          <div className="flex gap-3 flex-wrap">
            {(["auto", "light", "dark"] as const).map((t) => {
              const active = settings.theme === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setSettings({ ...settings, theme: t });
                    if (t === "auto") {
                      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
                      setTheme(prefersDark ? "dark" : "light");
                    } else {
                      setTheme(t);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium border transition-all ${
                    active
                      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  {t === "auto" ? <Icon.Globe size={15} /> : t === "light" ? <Icon.Sun size={15} /> : <Icon.Moon size={15} />}
                  {t === "auto" ? "Auto (system)" : t === "light" ? "Light" : "Dark"}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[var(--muted-2)]">
            Theme applies immediately. The toggle in the top bar also updates this setting.
          </p>
        </div>
      </CollapsibleCard>

      <div className="flex justify-end">
        <Button onClick={savePreferences} loading={saving}>
          <Icon.Save size={14} /> Save preferences
        </Button>
      </div>

      {/* Security */}
      <CollapsibleCard
        title="Security"
        icon={<Icon.Lock size={16} />}
        defaultOpen={false}
      >
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Current password</label>
            <div className="relative">
              <Input
                type={showCurrentPwd ? "text" : "password"}
                placeholder="••••••••"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition"
              >
                {showCurrentPwd ? <Icon.EyeOff size={16} /> : <Icon.Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">New password</label>
            <div className="relative">
              <Input
                type={showNewPwd ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition"
              >
                {showNewPwd ? <Icon.EyeOff size={16} /> : <Icon.Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirm new password</label>
            <Input
              type="password"
              placeholder="Repeat new password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {newPwd && confirmPwd && newPwd !== confirmPwd && (
            <p className="text-xs text-[var(--danger)] flex items-center gap-1">
              <Icon.AlertCircle size={12} /> Passwords don&apos;t match
            </p>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleChangePassword} loading={pwdBusy}>
              <Icon.Lock size={14} /> Update password
            </Button>
          </div>
        </div>
      </CollapsibleCard>

      {/* Danger Zone */}
      <CollapsibleCard
        title="Danger Zone"
        icon={<Icon.AlertCircle size={16} />}
        defaultOpen={false}
        iconColor="text-[var(--danger)]"
        iconBg="bg-red-500/10"
        titleColor="text-[var(--danger)]"
        cardClassName="border-[var(--danger)]/25"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-[var(--muted)] mt-0.5 max-w-sm">
                Permanently removes your account, all courses, certificates, and data.
                This action cannot be undone.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
              <Icon.Trash size={14} /> Delete account
            </Button>
          </div>
        </div>
      </CollapsibleCard>

      {/* Delete confirmation modal */}
      <Modal
        open={showDelete}
        onClose={() => { setShowDelete(false); setDeleteConfirm(""); }}
        title="Delete account?"
        size="sm"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <Icon.AlertCircle size={18} className="text-[var(--danger)] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--danger)]">
              This will permanently delete your account and all associated data. There is no way to
              undo this.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeleteAccount}
              loading={deleteBusy}
              disabled={deleteConfirm !== "DELETE"}
            >
              <Icon.Trash size={14} /> Delete forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Collapsible card ────────────────────────────────────────────────────────

function CollapsibleCard({
  title,
  icon,
  defaultOpen = true,
  extra,
  children,
  cardClassName,
  iconColor = "text-[var(--primary)]",
  iconBg = "bg-[var(--primary-soft)]",
  titleColor = "text-[var(--foreground)]",
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  extra?: React.ReactNode;
  children: React.ReactNode;
  cardClassName?: string;
  iconColor?: string;
  iconBg?: string;
  titleColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cardClassName}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--surface-2)] transition-colors rounded-2xl"
      >
        <span className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", iconBg, iconColor)}>
          {icon}
        </span>
        <span className={cn("flex-1 font-semibold text-base", titleColor)}>{title}</span>
        {extra}
        <Icon.ChevronDown
          size={16}
          className={cn(
            "text-[var(--muted)] transition-transform duration-200 shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--border)]">
          {children}
        </div>
      )}
    </Card>
  );
}

// ─── Toggle row ──────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}
