"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Checkbox, Input, Label, Select, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth } from "@/lib/store";
import { EDUCATION_LEVELS, type EducationLevel } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { cleanPhoneInput, validatePhone } from "@/lib/validation";

function scorePassword(p: string) {
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}

const strengthMeta = [
  { label: "Too weak", color: "bg-red-500", text: "text-red-500" },
  { label: "Weak", color: "bg-red-500", text: "text-red-500" },
  { label: "Okay", color: "bg-amber-500", text: "text-amber-500" },
  { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" },
  { label: "Excellent", color: "bg-emerald-600", text: "text-emerald-600" },
];

const ROLES = [
  { value: "Student", label: "Student", desc: "Take courses & earn certificates", icon: "🎓" },
  { value: "Instructor", label: "Instructor", desc: "Create & teach courses", icon: "👨‍🏫" },
  { value: "Admin", label: "Admin", desc: "Manage the platform", icon: "⚙️" },
] as const;

type RoleValue = (typeof ROLES)[number]["value"];

const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, loginWithGoogle } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    if (user.role === "Admin") router.replace("/admin");
    else if (user.role === "Instructor") router.replace("/teacher");
    else router.replace("/dashboard");
  }, [user, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<RoleValue>("Student");
  const [education, setEducation] = useState<EducationLevel>("None");
  const [agree, setAgree] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const phoneTouched = useRef(false);

  const pwScore = useMemo(() => scorePassword(password), [password]);
  const pwMatch = password.length > 0 && password === confirm;
  const pwMismatch = confirm.length > 0 && password !== confirm;

  function validate() {
    const next: Record<string, string> = {};
    const trimmedName = name.trim();
    if (trimmedName.length < 2) next.name = "Please enter your full name (min 2 characters).";
    else if (trimmedName.length > 60) next.name = "Name is too long (max 60 characters).";
    else if (!NAME_RE.test(trimmedName))
      next.name = "Name can only contain letters, spaces, dots, hyphens and apostrophes.";

    const trimmedEmail = email.trim();
    if (!trimmedEmail) next.email = "Email is required.";
    else if (!EMAIL_RE.test(trimmedEmail)) next.email = "Enter a valid email (e.g. you@example.com).";

    const phoneErr = validatePhone(phone);
    if (phoneErr) next.phone = phoneErr;

    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    else if (password.length > 64) next.password = "Password is too long (max 64).";

    if (!confirm) next.confirm = "Please confirm your password.";
    else if (password !== confirm) next.confirm = "Passwords don't match.";

    if (!agree) next.agree = "You must agree to the terms to continue.";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      toast.push({ title: "Please fix the errors", description: "Check the highlighted fields.", tone: "danger" });
      return;
    }
    setLoading(true);
    const res = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role,
      education: role === "Student" ? education : undefined,
    });
    setLoading(false);
    if (!res.ok) {
      setErrors({ form: res.error || "Registration failed." });
      toast.push({ title: "Couldn't sign up", description: res.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Account created!", description: "Welcome to EduPortal 🎉", tone: "success" });
    if (role === "Admin") router.replace("/admin");
    else if (role === "Instructor") router.replace("/teacher");
    else router.replace("/dashboard");
  }

  async function onGoogle() {
    setGLoading(true);
    await loginWithGoogle();
    setGLoading(false);
    // Role-based redirect is handled by the useEffect above.
  }

  const meta = strengthMeta[pwScore];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-medium">
          <Icon.Sparkles size={12} /> Free forever · No credit card needed
        </span>
        <h2 className="text-3xl font-bold leading-tight">
          Create your <span className="gradient-text">EduPortal</span> account
        </h2>
      </div>

      {/* Google */}
      <Button variant="outline" className="w-full h-11 font-medium" onClick={onGoogle} loading={gLoading} type="button">
        <Icon.Google size={18} />
        Sign up with Google
      </Button>

      {/* OR divider */}
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="px-1">or fill in your details</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>

        {/* Role selector — card style */}
        <div>
          <Label>I&apos;m signing up as</Label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-2 py-3.5 rounded-xl border-2 text-center transition-all cursor-pointer select-none",
                  role === r.value
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-sm"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
                )}
              >
                <span className="text-2xl leading-none">{r.icon}</span>
                <span className={cn("text-xs font-semibold", role === r.value ? "text-[var(--primary)]" : "text-[var(--foreground)]")}>
                  {r.label}
                </span>
                <span className="text-[10px] text-[var(--muted)] leading-tight hidden sm:block">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Aarav Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<Icon.User size={16} />}
              error={errors.name}
              maxLength={60}
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Icon.Mail size={16} />}
              error={errors.email}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+92 300 1234567"
            value={phone}
            onChange={(e) => { phoneTouched.current = false; setPhone(cleanPhoneInput(e.target.value)); }}
            onBlur={() => { phoneTouched.current = true; if (phone.trim()) setErrors((prev) => ({ ...prev, phone: validatePhone(phone) ?? "" })); }}
            error={errors.phone || (phoneTouched.current && phone.trim() ? validatePhone(phone) ?? undefined : undefined)}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        {/* Education (students only) */}
        {role === "Student" && (
          <div className="fade-in">
            <Label htmlFor="education">Highest qualification</Label>
            <Select
              id="education"
              value={education}
              onChange={(e) => setEducation(e.target.value as EducationLevel)}
            >
              {EDUCATION_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === "None" ? "Below Matriculation" : lvl}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Password section */}
        <div className="space-y-4 rounded-xl border border-[var(--border)] p-4 bg-[var(--surface-2)]/50">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Security</p>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Icon.Lock size={16} />}
                error={errors.password}
                maxLength={64}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition"
                tabIndex={-1}
              >
                {showPw ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
              </button>
            </div>
            {password && (
              <div className="mt-2.5 space-y-1.5 fade-in">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-all duration-300",
                        i < pwScore ? meta.color : "bg-[var(--border)]",
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={cn("font-semibold", meta.text)}>{meta.label}</span>
                  <span className="text-[var(--muted-2)]">Use 8+ chars, number & symbol</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                icon={<Icon.Lock size={16} />}
                error={errors.confirm}
                maxLength={64}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className={cn(
                "absolute top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition",
                confirm.length > 0 ? "right-9" : "right-3"
              )}
                tabIndex={-1}
              >
                {showConfirm ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
              </button>
              {confirm.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {pwMatch ? (
                    <Icon.CheckCircle size={18} className="text-emerald-500" />
                  ) : pwMismatch ? (
                    <Icon.X size={18} className="text-red-500" />
                  ) : null}
                </div>
              )}
            </div>
            {pwMismatch && !errors.confirm && (
              <p className="mt-1.5 text-xs text-[var(--danger)]">Passwords don&apos;t match.</p>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className={cn(
          "rounded-xl p-3.5 border transition-colors",
          errors.agree ? "border-red-400/40 bg-red-500/5" : "border-[var(--border)] bg-[var(--surface-2)]"
        )}>
          <Checkbox
            checked={agree}
            onChange={setAgree}
            label={
              <span className="text-sm">
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-[var(--primary)] hover:underline font-medium">Terms of Service</Link> and{" "}
                <Link href="/privacy" target="_blank" className="text-[var(--primary)] hover:underline font-medium">Privacy Policy</Link>.
              </span>
            }
          />
          {errors.agree && <p className="mt-2 text-xs text-[var(--danger)] ml-7">{errors.agree}</p>}
        </div>

        {errors.form && (
          <div className="flex items-center gap-2.5 text-sm text-[var(--danger)] bg-red-500/8 border border-red-500/20 px-3.5 py-2.5 rounded-xl">
            <Icon.X size={15} className="shrink-0" />
            {errors.form}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full h-12 text-base font-semibold">
          {loading ? "Creating account…" : (
            <>
              Create account
              <Icon.ChevronRight size={16} />
            </>
          )}
        </Button>
      </form>

      <p className="text-sm text-center text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--primary)] font-semibold hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
