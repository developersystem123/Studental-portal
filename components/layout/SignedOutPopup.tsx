"use client";

import * as React from "react";
import Icon from "@/components/icons";

/**
 * Full-screen centered popup shown for ~1.4s after a successful sign-out,
 * then navigates to /login. Pure presentational — controlled by the parent.
 */
export function SignedOutPopup({
  open,
  message = "You've been signed out",
  description = "Redirecting you to the sign-in page…",
  redirectTo = "/login",
  durationMs = 1400,
}: {
  open: boolean;
  message?: string;
  description?: string;
  redirectTo?: string;
  durationMs?: number;
}) {
  React.useEffect(() => {
    if (!open) return;
    // Hard navigation clears in-memory auth state and prevents
    // the router from bouncing back via middleware.
    const t = setTimeout(() => {
      window.location.replace(redirectTo);
    }, durationMs);
    return () => clearTimeout(t);
  }, [open, redirectTo, durationMs]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm fade-in" />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] card-shadow pop-in p-8 text-center">
        {/* Animated check medallion */}
        <div className="relative mx-auto h-20 w-20 mb-5">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-[var(--primary)]/30 ring-expand"
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-[var(--primary)]/20 ring-expand"
            style={{ animationDelay: "0.4s" }}
          />
          <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/30">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5 L10 17 L19 7" className="check-draw" />
            </svg>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-[var(--foreground)]">{message}</h2>
        <p className="text-sm text-[var(--muted)] mt-1.5">{description}</p>

        {/* Progress bar */}
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
            style={{
              animation: `signoutBar ${durationMs}ms linear forwards`,
            }}
          />
        </div>

        <style>{`
          @keyframes signoutBar {
            from { width: 0%; }
            to   { width: 100%; }
          }
        `}</style>
      </div>

      {/* Subtle floating icon decoration */}
      <Icon.Logout
        size={14}
        className="absolute top-6 left-1/2 -translate-x-1/2 text-white/40"
        aria-hidden
      />
    </div>
  );
}
