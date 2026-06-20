"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons";
import { Avatar, Badge, Button, Modal } from "@/components/ui";
import { SignedOutPopup } from "@/components/layout/SignedOutPopup";
import { useAuth, useTheme } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Topbar({
  onToggleSidebar,
  sidebarOpen,
  onLockScreen,
}: {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onLockScreen?: () => void;
}) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const isAdmin = user?.role === "Admin";
  const isTeacher = user?.role === "Instructor";
  const portalRoot = isAdmin ? "/admin" : isTeacher ? "/teacher" : "";
  const notificationsHref = portalRoot ? `${portalRoot}/notifications` : "/notifications";
  const profileHref = portalRoot ? `${portalRoot}/profile` : "/profile";

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [signedOut, setSignedOut] = React.useState(false);

  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Implement the ⌘K / Ctrl+K shortcut to focus the search input.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="hidden lg:flex sticky top-0 z-30 w-full glass border-b border-[var(--border)] h-16 items-center gap-2.5 px-4 sm:px-5">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
        aria-label="Toggle sidebar"
        className="h-9 w-9 -ml-1 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] text-[var(--muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all shrink-0"
      >
        <Icon.Menu size={18} />
      </button>

      {/* Search */}
      <div className="flex-1 flex justify-center min-w-0 mx-1 sm:mx-2">
        <div className={cn(
          "relative transition-all duration-200 w-full max-w-lg",
          searchFocused ? "scale-[1.01]" : "",
        )}>
          <Icon.Search
            size={15}
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
              searchFocused ? "text-[var(--primary)]" : "text-[var(--muted)]",
            )}
          />
          <input
            ref={searchInputRef}
            type="search"
            aria-label="Search"
            placeholder={
              isAdmin
                ? "Search students, courses…"
                : isTeacher
                  ? "Search courses or students…"
                  : "Search courses, AI tools…"
            }
            className={cn(
              "w-full h-10 pl-10 pr-4 md:pr-20 rounded-xl text-sm transition-all duration-200",
              "bg-[var(--surface-2)] border border-transparent",
              "focus:outline-none focus:bg-[var(--surface)] focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--ring)]/30",
              "placeholder:text-[var(--muted-2)] text-[var(--foreground)]",
            )}
            onFocus={() => {
              setSearchFocused(true);
              router.prefetch(isAdmin ? "/admin/students" : isTeacher ? "/teacher/students" : "/explore");
            }}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const q = (e.target as HTMLInputElement).value.trim();
                if (isAdmin) router.push("/admin/students");
                else if (isTeacher) router.push("/teacher/students");
                else router.push(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
              }
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 pointer-events-none">
            <kbd className="flex items-center gap-0.5 px-1.5 h-5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[10px] font-mono text-[var(--muted)]">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      {/* AI shortcut (student only) */}
      {!isAdmin && !isTeacher && (
        <Link
          href="/ai/chat"
          className="hidden md:inline-flex h-9 items-center gap-1.5 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-[var(--primary-soft)] to-[color-mix(in_oklab,var(--accent)_12%,var(--surface-2))] text-[var(--primary)] border border-[var(--primary)]/15 hover:border-[var(--primary)]/35 hover:shadow-sm transition-all shrink-0"
        >
          <Icon.Sparkles size={14} />
          <span className="hidden lg:inline">Ask AI</span>
        </Link>
      )}

      {/* Theme toggle */}
      <button
        onClick={toggle}
        title={theme === "dark" ? "Switch to light" : "Switch to dark"}
        className="h-9 w-9 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] text-[var(--muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all shrink-0"
      >
        {theme === "dark" ? <Icon.Sun size={17} /> : <Icon.Moon size={17} />}
      </button>

      {/* User menu */}
      <div className="relative shrink-0" ref={userMenuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(
            "flex items-center gap-2 h-9 pl-1 pr-2 sm:pr-2.5 rounded-xl transition-all",
            menuOpen ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]",
          )}
        >
          <Avatar name={user?.name ?? "?"} src={user?.avatar ?? null} size={30} />
          <div className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold truncate max-w-[80px]">{user?.name?.split(" ")[0]}</span>
            <span className="text-[10px] text-[var(--muted)] -mt-0.5">{user?.role ?? "Student"}</span>
          </div>
          <Icon.ChevronDown
            size={13}
            className={cn("hidden md:block text-[var(--muted)] transition-transform duration-150", menuOpen && "rotate-180")}
          />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-60 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl shadow-black/10 fade-in overflow-hidden z-50">
            {/* Profile header */}
            <div className="px-3 py-3.5 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-2)]/60 to-transparent flex items-center gap-3">
              <Avatar name={user?.name ?? "?"} src={user?.avatar ?? null} size={38} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-[var(--muted)] truncate">{user?.email}</p>
                <Badge variant="primary" className="mt-1 text-[10px]">{user?.role}</Badge>
              </div>
            </div>

            <div className="p-1.5 space-y-0.5">
              <MenuItem href={profileHref} icon={<Icon.User size={15} />} onClick={() => setMenuOpen(false)}>
                My Profile
              </MenuItem>
              <MenuItem href={notificationsHref} icon={<Icon.Bell size={15} />} onClick={() => setMenuOpen(false)}>
                Notifications
              </MenuItem>
              {(isAdmin || isTeacher) && (
                <MenuItem
                  href={isAdmin ? "/admin/settings" : "/teacher/settings"}
                  icon={<Icon.Settings size={15} />}
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </MenuItem>
              )}
              <div className="h-px bg-[var(--border)] my-1" />
              {onLockScreen && (
                <button
                  onClick={() => { setMenuOpen(false); onLockScreen(); }}
                  className="w-full px-3 py-2 rounded-xl text-sm flex items-center gap-2.5 text-foreground hover:bg-surface-2 transition"
                >
                  <span className="text-muted"><Icon.Lock size={15} /></span>
                  Lock screen
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); setConfirmLogout(true); }}
                className="w-full px-3 py-2 rounded-xl text-sm flex items-center gap-2.5 text-[var(--danger)] hover:bg-red-500/8 transition"
              >
                <Icon.Logout size={15} /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Sign out?" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            You&apos;ll need to sign back in to access your account.
          </p>
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

      <SignedOutPopup
        open={signedOut}
        message="You've been signed out"
        description="Redirecting you to the sign-in page…"
        redirectTo="/login"
      />
    </header>
  );
}

function MenuItem({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
    >
      <span className="text-[var(--muted)]">{icon}</span>
      {children}
    </Link>
  );
}
