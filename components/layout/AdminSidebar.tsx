"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/icons";
import { NavLinkIcon } from "./NavLinkIcon";
import { cn } from "@/lib/utils";

const main = [
  { href: "/admin", label: "Overview", icon: Icon.Home, exact: true },
  { href: "/admin/students", label: "Students", icon: Icon.User },
  { href: "/admin/teachers", label: "Teachers", icon: Icon.Sparkles },
  { href: "/admin/courses", label: "Courses", icon: Icon.Book },
  { href: "/admin/learning-paths", label: "Learning Paths", icon: Icon.Route },
  { href: "/admin/enrollments", label: "Enrollments", icon: Icon.ListChecks },
  { href: "/admin/applications", label: "In-Person Apps", icon: Icon.Calendar },
  { href: "/admin/physical-classes", label: "Physical Classes", icon: Icon.Pin },
  { href: "/admin/certificates", label: "Certificates", icon: Icon.Award },
];

const operations = [
  { href: "/admin/live-classes", label: "Live Classes", icon: Icon.Video },
  { href: "/admin/forum", label: "Forum", icon: Icon.Globe },
  { href: "/admin/reviews", label: "Reviews", icon: Icon.Star },
  { href: "/admin/coupons", label: "Coupons", icon: Icon.Tag },
  { href: "/admin/payments", label: "Payments", icon: Icon.CreditCard },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Icon.Crown },
  { href: "/admin/support", label: "Support", icon: Icon.MessageSquare },
  { href: "/admin/reports", label: "Reports", icon: Icon.BarChart3 },
  { href: "/admin/announcements", label: "Announcements", icon: Icon.Megaphone },
  { href: "/admin/templates", label: "Templates", icon: Icon.FilePen },
  { href: "/admin/ai", label: "AI Management", icon: Icon.Sparkles },
];

const account = [
  { href: "/admin/notifications", label: "Notifications", icon: Icon.Bell },
  { href: "/admin/profile", label: "Profile", icon: Icon.User },
  { href: "/admin/settings", label: "Settings", icon: Icon.Settings },
];

export function AdminSidebar({
  onClose,
  collapsed = false,
}: {
  onClose?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)]",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div
        className={cn(
          "h-16 flex items-center border-b border-[var(--border)] shrink-0",
          collapsed ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        <Link
          href="/admin"
          className="flex items-center gap-2.5 group"
          onClick={onClose}
          title={collapsed ? "EduPortal Admin" : undefined}
        >
          <div className="h-9 w-9 rounded-xl btn-primary flex items-center justify-center shadow-md shadow-green-500/20 group-hover:shadow-green-500/35 group-hover:scale-105 transition-all duration-200 shrink-0">
            <Icon.Settings size={17} />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold gradient-text">EduPortal</span>
              <span className="text-[10px] text-[var(--muted-2)] -mt-0.5 tracking-widest uppercase">Admin Console</span>
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

      <nav
        className={cn(
          "flex-1 overflow-y-auto pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-fade",
          collapsed ? "px-2" : "px-3",
        )}
      >
        <NavGroup title="Manage" items={main} pathname={pathname} onClose={onClose} collapsed={collapsed} />
        <NavGroup title="Operations" items={operations} pathname={pathname} onClose={onClose} collapsed={collapsed} />
        <NavGroup title="Account" items={account} pathname={pathname} onClose={onClose} collapsed={collapsed} />
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        {collapsed ? (
          <Link
            href="/"
            onClick={onClose}
            title="Back to Home"
            aria-label="Back to Home"
            className="flex items-center justify-center h-10 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
          >
            <Icon.ArrowLeft size={17} />
          </Link>
        ) : (
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 h-9 px-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] transition"
          >
            <Icon.ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  onClose,
  collapsed,
}: {
  title: string;
  items: { href: string; label: string; icon: (p: { size?: number }) => React.ReactElement; exact?: boolean }[];
  pathname: string;
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
        </div>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icn = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
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
                    ? "text-[var(--primary)] font-semibold bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 shadow-sm ring-1 ring-[var(--primary)]/20"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                )}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-6 rounded-r-md bg-[var(--primary)] shadow-sm" />
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
