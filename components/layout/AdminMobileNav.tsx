"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/icons";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: Icon.Home, exact: true },
  { href: "/admin/students", label: "Students", icon: Icon.User },
  { href: "/admin/courses", label: "Courses", icon: Icon.Book },
  { href: "/admin/notifications", label: "Alerts", icon: Icon.Bell },
];

export function AdminMobileNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)]">
      <div className="flex items-center h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const Icn = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                active ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              <span
                className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center transition-colors",
                  active && "bg-[var(--primary-soft)]",
                )}
              >
                <Icn size={18} />
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <span className="h-8 w-8 rounded-xl flex items-center justify-center">
            <Icon.Menu size={18} />
          </span>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
