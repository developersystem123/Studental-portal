"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Label, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { validateEmail } from "@/lib/validation";

type Phase = "form" | "sent";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("form");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    setError("");
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always show success to avoid email enumeration.
      setPhase("sent");
    } catch {
      toast.push({ title: "Something went wrong", description: "Please try again.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  if (phase === "sent") {
    return (
      <div className="space-y-6 fade-in text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
            <Icon.Mail size={32} />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Check your inbox</h2>
          <p className="text-[var(--muted)] text-sm max-w-sm mx-auto">
            If an account exists for <span className="font-semibold text-[var(--foreground)]">{email}</span>,
            we&apos;ve sent a password reset link. Check your spam folder if you don&apos;t see it.
          </p>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { setPhase("form"); setEmail(""); }}
          >
            Try a different email
          </Button>
          <p className="text-sm text-[var(--muted)]">
            Remembered it?{" "}
            <Link href="/login" className="text-[var(--primary)] font-semibold hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="space-y-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition mb-1"
        >
          <Icon.ArrowLeft size={14} /> Back to sign in
        </Link>
        <h2 className="text-3xl font-bold">Forgot password?</h2>
        <p className="text-[var(--muted)] text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            icon={<Icon.Mail size={16} />}
            error={error}
            autoComplete="email"
          />
        </div>
        <Button type="submit" loading={loading} className="w-full h-11 text-sm font-semibold">
          {loading ? "Sending link…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-sm text-center text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[var(--primary)] font-semibold hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
