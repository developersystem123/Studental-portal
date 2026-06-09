"use client";

import * as React from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/icons";
import { Button, Modal } from "@/components/ui";
import { SignedOutPopup } from "@/components/layout/SignedOutPopup";
import { useAuth, useTheme } from "@/lib/store";
import { cn } from "@/lib/utils";

function LinkPending({ report }: { report: (delta: number) => void }) {
  const { pending } = useLinkStatus();
  React.useEffect(() => {
    if (!pending) return;
    report(1);
    return () => report(-1);
  }, [pending, report]);
  return <span aria-hidden className={cn("link-hint", pending && "is-pending")} />;
}

const links = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/pricing", label: "Pricing" },
  { href: "/business", label: "For Business" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

type MoreGroup = {
  title: string;
  items: { href: string; label: string; description: string; icon: React.ReactNode }[];
};

const moreMenu: MoreGroup[] = [
  {
    title: "Earn & teach",
    items: [
      {
        href: "/teach",
        label: "Become a Teacher",
        description: "Share what you know, earn 70% revenue share.",
        icon: <Icon.Award size={15} />,
      },
      {
        href: "/affiliate",
        label: "Affiliate program",
        description: "30% recurring commission on every Pro referral.",
        icon: <Icon.TrendingUp size={15} />,
      },
      {
        href: "/careers",
        label: "Careers",
        description: "Help us build the future of learning.",
        icon: <Icon.Users size={15} />,
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        href: "/blog",
        label: "Blog",
        description: "Guides, deep-dives, and learning tips.",
        icon: <Icon.Book size={15} />,
      },
      {
        href: "/help",
        label: "Help Center",
        description: "Articles & how-tos, search-first.",
        icon: <Icon.Help size={15} />,
      },
      {
        href: "/faq",
        label: "FAQ",
        description: "Common questions, grouped by topic.",
        icon: <Icon.MessageSquare size={15} />,
      },
      {
        href: "/status",
        label: "Service status",
        description: "Uptime & incident history.",
        icon: <Icon.CheckCircle size={15} />,
      },
      {
        href: "/press",
        label: "Press & Media",
        description: "News, brand kit, and media contacts.",
        icon: <Icon.Megaphone size={15} />,
      },
    ],
  },
];

const moreHrefs = moreMenu.flatMap((g) => g.items.map((i) => i.href));

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [signedOut, setSignedOut] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);
  const reportPending = React.useCallback((delta: number) => {
    setPendingCount((c) => Math.max(0, c + delta));
  }, []);
  const userMenuRef = React.useRef<HTMLDivElement | null>(null);
  const moreRef = React.useRef<HTMLDivElement | null>(null);

  const moreActive = moreHrefs.some((h) => pathname.startsWith(h));

  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
    if (userMenuOpen) setUserMenuOpen(false);
    if (moreOpen) setMoreOpen(false);
  }

  React.useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 12); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!userMenuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setUserMenuOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
  }, [userMenuOpen]);

  React.useEffect(() => {
    if (!moreOpen) return;
    function onDocClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMoreOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
  }, [moreOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "glass border-b border-[var(--border)] shadow-sm shadow-black/5"
          : "bg-transparent",
      )}
    >
      {pendingCount > 0 && <div className="nav-progress" aria-hidden />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-xl shadow-md shadow-green-500/20 group-hover:shadow-green-500/40 group-hover:scale-105 transition-all duration-200 shrink-0"
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-base font-bold gradient-text">EduPortal</span>
            <span className="text-[10px] text-[var(--muted-2)] -mt-0.5 tracking-widest uppercase">Learn · Build · Grow</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-3 h-9 rounded-lg text-sm font-medium inline-flex items-center transition-all duration-150",
                  active
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]",
                )}
              >
                {l.label}
                <LinkPending report={reportPending} />
              </Link>
            );
          })}

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className={cn(
                "px-3 h-9 rounded-lg text-sm font-medium inline-flex items-center gap-1 transition-all duration-150",
                moreOpen || moreActive
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]",
              )}
            >
              More
              <Icon.ChevronDown
                size={13}
                className={cn("transition-transform duration-200", moreOpen && "rotate-180")}
              />
            </button>

            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-[38rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl shadow-black/10 overflow-hidden fade-in z-50"
              >
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
                  {moreMenu.map((group) => (
                    <div key={group.title} className="p-2.5">
                      <p className="px-2.5 pt-1.5 pb-2 text-[10px] uppercase tracking-widest text-[var(--muted-2)] font-bold">
                        {group.title}
                      </p>
                      <ul className="space-y-0.5">
                        {group.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              role="menuitem"
                              href={item.href}
                              onClick={() => setMoreOpen(false)}
                              className="flex items-start gap-3 px-2.5 py-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors group/item"
                            >
                              <span className="shrink-0 h-8 w-8 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] inline-flex items-center justify-center group-hover/item:bg-[var(--primary)] group-hover/item:text-white transition-colors">
                                {item.icon}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-[var(--foreground)] leading-tight">
                                  {item.label}
                                  <LinkPending report={reportPending} />
                                </span>
                                <span className="block text-xs text-[var(--muted)] mt-0.5 leading-snug">
                                  {item.description}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="h-9 w-9 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] text-[var(--muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all"
          >
            {theme === "dark" ? <Icon.Sun size={17} /> : <Icon.Moon size={17} />}
          </button>

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                  userMenuOpen
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] text-[var(--muted)] hover:text-[var(--primary)]",
                )}
              >
                <Icon.User size={17} />
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg shadow-black/10 overflow-hidden fade-in z-50"
                >
                  <div className="px-3 py-2.5 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-2)]/50 to-transparent">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href={user.role === "Admin" ? "/admin/profile" : user.role === "Instructor" ? "/teacher/profile" : "/profile"}
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
                    >
                      <Icon.User size={15} className="text-[var(--muted)]" />
                      Profile page
                    </Link>
                    <Link
                      href={user.role === "Admin" ? "/admin" : user.role === "Instructor" ? "/teacher" : "/dashboard"}
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
                    >
                      {user.role === "Admin" ? <Icon.Settings size={15} className="text-[var(--muted)]" /> : user.role === "Instructor" ? <Icon.Users size={15} className="text-[var(--muted)]" /> : <Icon.Book size={15} className="text-[var(--muted)]" />}
                      {user.role === "Admin" ? "Admin Portal" : user.role === "Instructor" ? "Teacher Portal" : "Student Portal"}
                    </Link>
                    <div className="h-px bg-[var(--border)] my-1" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setUserMenuOpen(false); setConfirmLogout(true); }}
                      className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm text-[var(--danger)] hover:bg-red-500/8 transition"
                    >
                      <Icon.Logout size={15} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Get started <Icon.ChevronRight size={14} />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="lg:hidden flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-9 w-9 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] text-[var(--muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all"
          >
            {theme === "dark" ? <Icon.Sun size={17} /> : <Icon.Moon size={17} />}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
              open
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] text-[var(--muted)] hover:text-[var(--primary)]",
            )}
          >
            {open ? <Icon.X size={18} /> : <Icon.Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--surface)] fade-in">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "px-3 h-11 rounded-xl text-sm font-medium inline-flex items-center transition-all",
                    active
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--foreground)] hover:bg-[var(--surface-2)]",
                  )}
                >
                  {l.label}
                  <LinkPending report={reportPending} />
                </Link>
              );
            })}
            {moreMenu.map((group) => (
              <div key={group.title} className="mt-2">
                <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-[var(--muted-2)] font-bold">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "px-3 h-11 rounded-xl text-sm font-medium inline-flex items-center gap-2.5 transition-all",
                        active
                          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "text-[var(--foreground)] hover:bg-[var(--surface-2)]",
                      )}
                    >
                      <span className="h-7 w-7 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] inline-flex items-center justify-center shrink-0">
                        {item.icon}
                      </span>
                      {item.label}
                      <LinkPending report={reportPending} />
                    </Link>
                  );
                })}
              </div>
            ))}
            <div className="h-px bg-[var(--border)] my-2" />
            {user ? (
              <div className="flex flex-col gap-2 pb-1">
                <Link href={user.role === "Admin" ? "/admin/profile" : user.role === "Instructor" ? "/teacher/profile" : "/profile"}>
                  <Button variant="outline" className="w-full" size="sm">
                    <Icon.User size={15} /> Profile page
                  </Button>
                </Link>
                <Link href={user.role === "Admin" ? "/admin" : user.role === "Instructor" ? "/teacher" : "/dashboard"}>
                  <Button variant="outline" className="w-full" size="sm">
                    {user.role === "Admin" ? <Icon.Settings size={15} /> : user.role === "Instructor" ? <Icon.Users size={15} /> : <Icon.Book size={15} />}
                    {user.role === "Admin" ? "Admin Portal" : user.role === "Instructor" ? "Teacher Portal" : "Student Portal"}
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" size="sm" onClick={() => setConfirmLogout(true)}>
                  <Icon.Logout size={15} /> Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pb-1">
                <Link href="/login">
                  <Button variant="outline" className="w-full" size="sm">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full" size="sm">Get started free</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

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

      <SignedOutPopup open={signedOut} redirectTo="/" />
    </header>
  );
}
