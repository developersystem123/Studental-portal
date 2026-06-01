"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/icons";
import { NavLinkIcon } from "./NavLinkIcon";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/store";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Icon.Home },
  { href: "/my-courses", label: "My Courses", icon: Icon.Book },
  { href: "/explore", label: "Explore", icon: Icon.Compass },
  { href: "/wishlist", label: "Wishlist", icon: Icon.Heart },
];

const learnNav = [
  { href: "/paths", label: "Learning Paths", icon: Icon.Route },
  { href: "/assignments", label: "Assignments", icon: Icon.FilePen },
  { href: "/quizzes", label: "Quizzes", icon: Icon.ListChecks },
  { href: "/live", label: "Live Classes", icon: Icon.Video },
  { href: "/schedule", label: "Schedule", icon: Icon.Calendar },
  { href: "/progress", label: "Progress", icon: Icon.TrendingUp },
  { href: "/achievements", label: "Achievements", icon: Icon.Star },
  { href: "/certificates", label: "Certificates", icon: Icon.Award },
];

const communityNav = [
  { href: "/forum", label: "Forum", icon: Icon.MessageSquare },
  { href: "/messages", label: "Messages", icon: Icon.Inbox },
  { href: "/physical-classes", label: "Physical Classes", icon: Icon.Pin },
  { href: "/applications", label: "In-Person Apps", icon: Icon.Tag },
];

const aiNav = [
  { href: "/ai/chat", label: "AI Chat", icon: Icon.Sparkles },
  { href: "/ai/quiz", label: "Quiz Generator", icon: Icon.ListChecks },
  { href: "/ai/assignment", label: "Assignment Helper", icon: Icon.FilePen },
];

const otherNav = [
  { href: "/notifications", label: "Notifications", icon: Icon.Bell },
  { href: "/billing", label: "Billing", icon: Icon.CreditCard },
  { href: "/subscription", label: "Subscription", icon: Icon.Crown },
  { href: "/support", label: "Help & Support", icon: Icon.Help },
  { href: "/settings", label: "Settings", icon: Icon.Settings },
  { href: "/profile", label: "Profile", icon: Icon.User },
];

export function Sidebar({
  onClose,
  collapsed = false,
}: {
  onClose?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isPro = user?.plan === "pro" || user?.plan === "team";

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)]",
        collapsed ? "w-20" : "w-72",
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-[var(--border)] shrink-0",
          collapsed ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={onClose}
          title={collapsed ? "EduPortal" : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Logo"
            width={36}
            height={36}
            className="rounded-xl shadow-md shadow-green-500/20 group-hover:shadow-green-500/40 group-hover:scale-105 transition-all duration-200 shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold gradient-text">EduPortal</span>
              <span className="text-[10px] text-[var(--muted-2)] -mt-0.5 tracking-widest uppercase">Learn · Build · Grow</span>
            </div>
          )}
        </Link>
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
            aria-label="Close sidebar"
          >
            <Icon.X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-fade",
          collapsed ? "px-2" : "px-3",
        )}
      >
        <NavGroup title="Main" items={nav} pathname={pathname} onClose={onClose} collapsed={collapsed} />
        <NavGroup title="Learning" items={learnNav} pathname={pathname} onClose={onClose} collapsed={collapsed} />
        <NavGroup title="Community" items={communityNav} pathname={pathname} onClose={onClose} collapsed={collapsed} />
        <NavGroup
          title="AI Suite"
          items={aiNav}
          pathname={pathname}
          onClose={onClose}
          collapsed={collapsed}
          badge={
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[var(--primary-soft)] to-[color-mix(in_oklab,var(--accent)_15%,var(--surface-2))] text-[var(--primary)] font-bold border border-[var(--primary)]/15">
              NEW
            </span>
          }
        />
        <NavGroup title="Account" items={otherNav} pathname={pathname} onClose={onClose} collapsed={collapsed} />
      </nav>

      {/* Bottom panel */}
      {collapsed ? (
        <div className="p-2 space-y-2 border-t border-[var(--border)]">
          <Link
            href="/"
            onClick={onClose}
            title="Back to Home"
            aria-label="Back to Home"
            className="flex items-center justify-center h-10 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
          >
            <Icon.ArrowLeft size={18} />
          </Link>
          <Link
            href="/subscription"
            onClick={onClose}
            title={isPro ? "Pro plan active" : "Upgrade to Pro"}
            className="flex items-center justify-center h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/35 hover:brightness-105 transition-all"
          >
            {isPro ? <Icon.Crown size={18} /> : <Icon.Sparkles size={18} />}
          </Link>
        </div>
      ) : (
        <div className="p-3 space-y-2.5 border-t border-[var(--border)]">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 h-9 px-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] transition"
          >
            <Icon.ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>
          <Link
            href="/subscription"
            onClick={onClose}
            className="block rounded-2xl p-4 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white hover:brightness-105 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200"
          >
            <div className="flex items-center gap-2 mb-1.5">
              {isPro ? <Icon.Crown size={15} /> : <Icon.Sparkles size={15} />}
              <p className="font-semibold text-sm">{isPro ? "Pro Plan Active" : "Upgrade to Pro"}</p>
              {isPro && (
                <span className="ml-auto text-[10px] font-bold bg-white/25 px-1.5 py-0.5 rounded-full">PRO</span>
              )}
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              {isPro
                ? "Unlimited AI access and exclusive courses."
                : "Unlock unlimited AI queries and exclusive courses."}
            </p>
            <div className="mt-3 w-full h-8 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur flex items-center justify-center gap-1.5 transition-colors">
              {isPro ? "Manage plan" : "Get Pro"} <Icon.ChevronRight size={12} />
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  badge,
  onClose,
  collapsed,
}: {
  title: string;
  items: { href: string; label: string; icon: (p: { size?: number }) => React.ReactElement }[];
  pathname: string;
  badge?: React.ReactNode;
  onClose?: () => void;
  collapsed?: boolean;
}) {
  return (
    <div>
      {collapsed ? (
        <div className="h-px bg-[var(--border)] mx-1 mb-3 first:hidden" aria-hidden />
      ) : (
        <div className="flex items-center gap-2 px-3 mb-1.5">
          <p className="text-[10px] uppercase tracking-widest text-[var(--muted-2)] font-bold">{title}</p>
          {badge}
        </div>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icn = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center h-10 rounded-xl text-sm font-medium transition-all duration-150",
                  collapsed ? "justify-center px-0" : "gap-3 px-3",
                  active
                    ? [
                        "text-[var(--primary)]",
                        collapsed
                          ? "bg-[var(--primary-soft)]"
                          : "bg-gradient-to-r from-[var(--primary-soft)] to-[color-mix(in_oklab,var(--primary-soft)_40%,transparent)]",
                      ]
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                )}
              >
                {/* Active left-bar indicator */}
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--primary)]" />
                )}
                <NavLinkIcon icon={Icn} size={17} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
