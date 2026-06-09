"use client";

import * as React from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  Label,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth } from "@/lib/store";
import { EDUCATION_LEVELS, type EducationLevel } from "@/lib/mockData";
import { cn, relativeTime } from "@/lib/utils";
import { cleanPhoneInput, validateEmail, validateName, validatePhone } from "@/lib/validation";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_BANNER_BYTES = 4 * 1024 * 1024; // 4 MB

/* ─────────────────────────────── Section header ──────────────────────────── */
export function SectionHeader({
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
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        {description && <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

/* ──────────────────────────── Collapsible card ────────────────────────────── */
export function CollapsibleCard({
  icon,
  title,
  description,
  tone = "primary",
  defaultOpen = true,
  children,
  cardClassName,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone?: "primary" | "danger";
  defaultOpen?: boolean;
  children?: React.ReactNode;
  cardClassName?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  const iconCls =
    tone === "danger"
      ? "bg-red-500/10 text-[var(--danger)]"
      : "bg-[var(--primary-soft)] text-[var(--primary)]";

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] card-shadow overflow-hidden",
        tone === "danger" && "border-[var(--danger)]/30",
        cardClassName,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--surface-2)] transition-colors"
        aria-expanded={open}
      >
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
            iconCls,
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{title}</p>
          {description && (
            <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>
          )}
        </div>
        <Icon.ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-[var(--muted)] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-5 space-y-4 fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── Profile hero ────────────────────────────── */
export function ProfileHero({
  subtitle,
  extra,
}: {
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const bannerRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [bannerUploading, setBannerUploading] = React.useState(false);

  if (!user) return null;

  async function onAvatarUpload(file?: File) {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.push({ title: "Unsupported file", description: "Please choose an image.", tone: "danger" });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.push({ title: "Image too large", description: "Max 2 MB. Try compressing it first.", tone: "danger" });
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "image");
      const r = await fetch("/api/upload", { method: "POST", body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Upload failed.");
      await updateUser({ avatar: data.url });
      toast.push({ title: "Avatar updated", tone: "success" });
    } catch (err) {
      toast.push({ title: "Couldn't upload", description: (err as Error).message, tone: "danger" });
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    try {
      await updateUser({ avatar: null });
      toast.push({ title: "Avatar removed", tone: "success" });
    } catch {
      toast.push({ title: "Couldn't remove avatar", tone: "danger" });
    }
  }

  async function onBannerUpload(file?: File) {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.push({ title: "Unsupported file", description: "Please choose an image.", tone: "danger" });
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      toast.push({ title: "Image too large", description: "Max 4 MB. Try compressing it first.", tone: "danger" });
      return;
    }
    setBannerUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "image");
      const r = await fetch("/api/upload", { method: "POST", body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Upload failed.");
      await updateUser({ banner: data.url });
      toast.push({ title: "Cover photo updated", tone: "success" });
    } catch (err) {
      toast.push({ title: "Couldn't upload", description: (err as Error).message, tone: "danger" });
    } finally {
      setBannerUploading(false);
    }
  }

  async function removeBanner() {
    try {
      await updateUser({ banner: null });
      toast.push({ title: "Cover photo removed", tone: "success" });
    } catch {
      toast.push({ title: "Couldn't remove cover photo", tone: "danger" });
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* ── Banner ── */}
      <div className="relative h-44 sm:h-56 bg-gradient-to-br from-[var(--primary)] via-[var(--accent)] to-sky-500">
        {user.banner ? (
          <>
            <img
              src={user.banner}
              alt="Profile cover"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <>
            {/* Dot pattern overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <svg viewBox="0 0 400 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="hero-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="3" cy="3" r="1.8" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-dots)" />
              </svg>
            </div>
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute right-24 bottom-0 h-24 w-24 rounded-full bg-white/8" />
          </>
        )}

        {/* Cover controls */}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            disabled={bannerUploading}
            className="flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/55 disabled:opacity-60"
          >
            {bannerUploading ? <Icon.Loader size={13} /> : <Icon.Camera size={13} />}
            {user.banner ? "Change cover" : "Add cover photo"}
          </button>
          {user.banner && (
            <button
              type="button"
              onClick={removeBanner}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-[var(--danger)]"
              title="Remove cover photo"
            >
              <Icon.Trash size={13} />
            </button>
          )}
        </div>

        <input
          ref={bannerRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onBannerUpload(e.target.files?.[0])}
        />

        {/* Upload overlay */}
        {bannerUploading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
            <div className="flex items-center gap-2.5 rounded-full bg-black/55 px-4 py-2 text-white shadow-lg ring-1 ring-white/15">
              <Icon.Loader size={18} />
              <span className="text-sm font-medium">Uploading cover…</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Avatar + name row ── */}
      <CardBody className="pt-0">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          {/* Avatar: render large on sm+ and a smaller variant on mobile */}
          <div className="shrink-0">
            {/* Desktop / tablet */}
            <div className="relative -mt-16 hidden sm:block">
              <div className="rounded-full ring-4 ring-[var(--surface)] shadow-xl bg-[var(--surface)]">
                <Avatar name={user.name} src={user.avatar ?? null} size={112} />
              </div>
              {uploading && (
                <div className="absolute inset-1 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-[2px] fade-in">
                  <Icon.Loader size={24} className="text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full btn-primary shadow-md hover:shadow-lg transition disabled:opacity-60"
                title="Change avatar"
              >
                {uploading ? <Icon.Loader size={16} /> : <Icon.Camera size={16} />}
              </button>
            </div>

            {/* Mobile */}
            <div className="relative -mt-12 block sm:hidden">
              <div className="rounded-full ring-2 ring-[var(--surface)] shadow-md bg-[var(--surface)]">
                <Avatar name={user.name} src={user.avatar ?? null} size={64} />
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-[2px] fade-in">
                  <Icon.Loader size={18} className="text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full btn-primary shadow hover:shadow-md transition disabled:opacity-60"
                title="Change avatar"
              >
                {uploading ? <Icon.Loader size={14} /> : <Icon.Camera size={14} />}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onAvatarUpload(e.target.files?.[0])}
            />
          </div>

          {/* Name / role / email */}
          <div className="min-w-0 flex-1 pt-3 sm:pt-5">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="primary">{user.role}</Badge>
              <span className="text-sm text-[var(--muted)] truncate">{user.email}</span>
            </div>
            {subtitle ? (
              <div className="mt-1">{subtitle}</div>
            ) : user.createdAt ? (
              <p className="mt-1 text-xs text-[var(--muted-2)]">
                Joined {relativeTime(user.createdAt)}
              </p>
            ) : null}
            {extra && <div className="mt-3">{extra}</div>}
          </div>

          {/* Remove photo */}
          {user.avatar && (
            <div className="pt-1 sm:pt-5">
              <Button variant="ghost" size="sm" onClick={removeAvatar} title="Remove photo">
                <Icon.Trash size={14} /> Remove photo
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

/* ─────────────────────────── Profile completion ──────────────────────────── */
export function ProfileCompletionCard() {
  const { user } = useAuth();
  if (!user) return null;

  const checks = [
    { label: "Profile photo", done: !!user.avatar },
    { label: "Cover photo", done: !!user.banner },
    { label: "Bio written", done: (user.bio?.trim().length ?? 0) > 10 },
    { label: "Phone number", done: !!(user.phone?.trim()) },
    ...(user.role === "Student"
      ? [{ label: "Education level", done: !!user.education && user.education !== "None" }]
      : []),
  ];

  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);
  const complete = pct === 100;

  return (
    <CollapsibleCard
      icon={complete ? <Icon.CheckCircle size={18} /> : <Icon.User size={18} />}
      title="Profile completion"
      description={
        complete
          ? "Your profile is complete — looking great!"
          : `${checks.length - done} item${checks.length - done !== 1 ? "s" : ""} remaining.`
      }
    >
      <div className="flex items-center justify-between gap-4 -mt-1">
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              style={{ width: `${pct}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-700",
                complete ? "bg-emerald-500" : pct >= 60 ? "bg-[var(--primary)]" : "bg-amber-500",
              )}
            />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-bold tabular-nums">{pct}%</p>
          <p className="text-xs text-[var(--muted)]">{done}/{checks.length} done</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {checks.map(({ label, done: itemDone }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all",
              itemDone
                ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400"
                : "border-[var(--border)] bg-[var(--surface-2)]/40 text-[var(--muted)]",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                itemDone
                  ? "bg-emerald-500 text-white"
                  : "border border-[var(--border-strong)] bg-[var(--surface)]",
              )}
            >
              {itemDone && <Icon.Check size={10} />}
            </span>
            <span className="flex-1">{label}</span>
            {itemDone && <Icon.Check size={13} className="text-emerald-500" />}
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
}

/* ──────────────────────────── Personal info card ─────────────────────────── */
export function PersonalInfoCard({
  description = "This is how others will see you in the platform.",
  bioPlaceholder = "Tell others a bit about yourself.",
}: {
  description?: string;
  bioPlaceholder?: string;
}) {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [bio, setBio] = React.useState(user?.bio ?? "");
  const [phone, setPhone] = React.useState(user?.phone ?? "");
  const [education, setEducation] = React.useState<EducationLevel>(
    (user?.education as EducationLevel) ?? "None",
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setBio(user.bio ?? "");
    setPhone(user.phone ?? "");
    setEducation((user.education as EducationLevel) ?? "None");
  }, [user]);

  if (!user) return null;

  const showEducation = user.role === "Student";
  const dirty =
    name !== user.name ||
    email !== user.email ||
    (bio ?? "") !== (user.bio ?? "") ||
    (phone ?? "") !== (user.phone ?? "") ||
    (showEducation && education !== ((user.education as EducationLevel) ?? "None"));

  function reset() {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setBio(user.bio ?? "");
    setPhone(user.phone ?? "");
    setEducation((user.education as EducationLevel) ?? "None");
  }

  const phoneError = validatePhone(phone, false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const err = validateName(name, "Full name") ?? validateEmail(email) ?? phoneError;
    if (err) return toast.push({ title: err, tone: "danger" });
    setSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        ...(showEducation ? { education } : {}),
      });
      toast.push({ title: "Profile updated", tone: "success" });
    } catch (err) {
      toast.push({ title: "Couldn't save profile", description: (err as Error).message, tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <CollapsibleCard
      icon={<Icon.User size={18} />}
      title="Personal information"
      description={description}
    >
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pi-name">Full name</Label>
            <Input
              id="pi-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<Icon.User size={16} />}
            />
          </div>
          <div>
            <Label htmlFor="pi-email">Email</Label>
            <Input
              id="pi-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Icon.Mail size={16} />}
            />
          </div>
          <div>
            <Label htmlFor="pi-phone">Phone</Label>
            <Input
              id="pi-phone"
              value={phone}
              onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
              placeholder="+92 300 1234567"
              inputMode="tel"
              error={phone ? phoneError : undefined}
            />
          </div>
          {showEducation && (
            <div>
              <Label htmlFor="pi-education">Highest qualification</Label>
              <Select
                id="pi-education"
                value={education}
                onChange={(e) => setEducation(e.target.value as EducationLevel)}
              >
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl === "None" ? "Below Matriculation" : lvl}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-[var(--muted)]">
                Required for in-person class applications (Matriculation or above).
              </p>
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="pi-bio">Bio</Label>
          <Textarea
            id="pi-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={bioPlaceholder}
            rows={3}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">{bio.length}/300 characters</p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={reset} disabled={!dirty || saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={!dirty} loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </CollapsibleCard>
  );
}

/* ──────────────────────────── Change password card ───────────────────────── */
export function ChangePasswordCard() {
  const { changePassword } = useAuth();
  const toast = useToast();

  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNext, setShowNext] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  function resetForm() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setShowCurrent(false);
    setShowNext(false);
    setShowConfirm(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return toast.push({ title: "Enter your current password", tone: "danger" });
    if (next.length < 8)
      return toast.push({ title: "New password must be at least 8 characters", tone: "danger" });
    if (next !== confirm) return toast.push({ title: "Passwords don't match", tone: "danger" });
    setSaving(true);
    const res = await changePassword(current, next);
    setSaving(false);
    if (!res.ok) {
      toast.push({ title: "Couldn't update password", description: res.error, tone: "danger" });
      return;
    }
    resetForm();
    toast.push({
      title: "Password updated",
      description: "Use your new password next time you sign in.",
      tone: "success",
    });
  }

  const strength = scorePassword(next);

  return (
    <CollapsibleCard
      icon={<Icon.Lock size={18} />}
      title="Change password"
      description="Use a strong password with at least 8 characters."
      defaultOpen={false}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PasswordField
            id="cp-current"
            label="Current password"
            value={current}
            onChange={setCurrent}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((s) => !s)}
          />
          <PasswordField
            id="cp-new"
            label="New password"
            value={next}
            onChange={setNext}
            show={showNext}
            onToggleShow={() => setShowNext((s) => !s)}
          />
          <PasswordField
            id="cp-confirm"
            label="Confirm new"
            value={confirm}
            onChange={setConfirm}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((s) => !s)}
            error={confirm.length > 0 && confirm !== next ? "Doesn't match." : undefined}
          />
        </div>

        {next && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all",
                    i < strength.score ? strength.color : "bg-[var(--surface-2)]",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--muted)]">
              Strength:{" "}
              <span className={cn("font-medium", strength.textColor)}>{strength.label}</span>
              {strength.score < 3 && " — add length, a number, or a symbol."}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
            Clear
          </Button>
          <Button
            type="submit"
            disabled={!current || !next || next !== confirm}
            loading={saving}
          >
            <Icon.Lock size={16} /> Update password
          </Button>
        </div>
      </form>
    </CollapsibleCard>
  );
}

/* ────────────────────────── Password field helper ────────────────────────── */
function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          icon={<Icon.Lock size={16} />}
          error={error}
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition"
        >
          {show ? <Icon.EyeOff size={16} /> : <Icon.Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function scorePassword(p: string) {
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const score = Math.min(s, 4);
  const meta = [
    { label: "Too weak", color: "bg-red-500", textColor: "text-red-500" },
    { label: "Weak", color: "bg-red-500", textColor: "text-red-500" },
    { label: "Okay", color: "bg-amber-500", textColor: "text-amber-500" },
    { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500" },
    { label: "Excellent", color: "bg-emerald-600", textColor: "text-emerald-600" },
  ];
  return { score, ...meta[score] };
}
