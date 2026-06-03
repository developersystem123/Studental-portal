"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Checkbox, Input, Label, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth } from "@/lib/store";
import { validateEmail } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loginWithGoogle } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    if (user.role === "Admin") router.replace("/admin");
    else if (user.role === "Instructor") router.replace("/teacher");
    else router.replace("/dashboard");
  }, [user, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    const emailErr = validateEmail(email);
    // Login should only check presence, not length — existing accounts may predate length rules.
    if (emailErr) next.email = emailErr;
    if (!password) next.password = "Password is required.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      setErrors({ form: res.error });
      toast.push({ title: "Sign in failed", description: res.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Welcome back!", tone: "success" });
    // Redirect handled by the useEffect watching user state.
  }

  async function onGoogle() {
    setGLoading(true);
    try {
      await loginWithGoogle();
      // Redirect handled by the useEffect watching user state.
    } catch {
      toast.push({ title: "Google sign-in failed", tone: "danger" });
    } finally {
      setGLoading(false);
    }
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-medium">
          <Icon.Sparkles size={12} /> 12,000+ learners trust EduPortal
        </span>
        <h2 className="text-3xl font-bold mt-1">
          Welcome back <span className="gradient-text">👋</span>
        </h2>
        <p className="text-[var(--muted)] text-sm">Sign in to continue your learning journey.</p>
      </div>

      {/* Google */}
      <Button variant="outline" className="w-full h-11 font-medium" onClick={onGoogle} loading={gLoading} type="button">
        <Icon.Google size={18} />
        Continue with Google
      </Button>

      {/* OR divider */}
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="px-1">or sign in with email</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password" className="mb-0">Password</Label>
            <Link href="/forgot-password" className="text-xs text-[var(--primary)] hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Icon.Lock size={16} />}
              error={errors.password}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition"
            >
              {show ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
        </div>

        {errors.form && (
          <div className="flex items-center gap-2.5 text-sm text-[var(--danger)] bg-red-500/8 border border-red-500/20 px-3.5 py-2.5 rounded-xl">
            <Icon.X size={15} className="shrink-0" />
            {errors.form}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full h-11 text-sm font-semibold">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-center text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[var(--primary)] font-semibold hover:underline">
          Create one free
        </Link>
      </p>

      {/* Demo accounts — hidden in production to avoid exposing credentials */}
      {process.env.NODE_ENV !== "production" && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface-2)]">
          <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
            <Icon.AlertCircle size={13} className="text-[var(--muted)] shrink-0" />
            <p className="text-xs font-semibold text-[var(--foreground)]">Demo accounts</p>
          </div>
          <div className="p-3 space-y-2">
            {[
              { role: "Student", email: "student@demo.com" },
              { role: "Instructor", email: "teacher@demo.com" },
              { role: "Admin", email: "admin@demo.com" },
            ].map((d) => (
              <div key={d.role} className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted-2)]">
                  <span className="font-medium text-[var(--foreground)]">{d.role}</span>
                  {" · "}{d.email}
                </span>
                <span className="text-[var(--muted)] font-mono">demo1234</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
