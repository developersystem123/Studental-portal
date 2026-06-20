"use client";

import * as React from "react";
import Icon from "@/components/icons";
import { Avatar } from "@/components/ui";
import { useAuth } from "@/lib/store";

interface LockScreenProps {
  onUnlock: () => void;
  onLogout: () => void;
}

export function LockScreen({ onUnlock, onLogout }: LockScreenProps) {
  const { user, login, logout } = useAuth();
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !user?.email) return;
    setLoading(true);
    setError("");
    const res = await login(user.email, password);
    setLoading(false);
    if (res.ok) {
      setPassword("");
      onUnlock();
    } else {
      setError("Incorrect password. Try again.");
      setPassword("");
      inputRef.current?.focus();
    }
  }

  async function handleLogout() {
    await logout();
    onLogout();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl shadow-black/30 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-6 flex flex-col items-center gap-3 bg-gradient-to-b from-[var(--surface-2)] to-transparent border-b border-[var(--border)]">
          <div className="relative">
            <Avatar name={user?.name ?? "?"} src={user?.avatar ?? null} size={72} />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-md">
              <Icon.Lock size={12} className="text-white" />
            </span>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-[var(--foreground)]">{user?.name}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{user?.email}</p>
          </div>
          <p className="text-xs text-[var(--muted)] bg-[var(--surface)] px-3 py-1.5 rounded-full border border-[var(--border)]">
            Screen locked — enter your password to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="px-8 py-6 space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter password"
              autoComplete="current-password"
              className="w-full h-11 pl-4 pr-10 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--ring)]/30 text-[var(--foreground)] placeholder:text-[var(--muted-2)] transition"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition"
              tabIndex={-1}
            >
              {showPass ? <Icon.EyeOff size={16} /> : <Icon.Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-[var(--danger)] flex items-center gap-1.5">
              <Icon.AlertCircle size={13} /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full h-11 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <Icon.Lock size={15} />
                Unlock
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-8 flex justify-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-[var(--muted)] hover:text-[var(--danger)] flex items-center gap-1.5 transition"
          >
            <Icon.Logout size={13} />
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  );
}
