"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Tabs } from "@/components/ui";
import Icon from "@/components/icons";
import { useData } from "@/lib/store";
import { cn, relativeTime } from "@/lib/utils";
import type { Notification } from "@/lib/mockData";

type TypeFilter = Notification["type"] | "all";

const TYPE_INFO: Record<Notification["type"], {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}> = {
  assignment: {
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary-soft)]",
    border: "border-[var(--primary)]/20",
    icon: <Icon.FilePen size={16} />,
    label: "Assignment",
  },
  announcement: {
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    icon: <Icon.Megaphone size={16} />,
    label: "Announcement",
  },
  reminder: {
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: <Icon.Clock size={16} />,
    label: "Reminder",
  },
  achievement: {
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: <Icon.Award size={16} />,
    label: "Achievement",
  },
};

const BADGE_VARIANTS: Record<Notification["type"], "primary" | "default" | "warning" | "success"> = {
  assignment: "primary",
  announcement: "default",
  reminder: "warning",
  achievement: "success",
};

export default function NotificationsPage() {
  const { notifications, markAllNotificationsRead, markNotificationRead, deleteNotification } = useData();
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [inboxOpen, setInboxOpen] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeCounts = (Object.keys(TYPE_INFO) as Notification["type"][]).map((t) => ({
    type: t,
    total: notifications.filter((n) => n.type === t).length,
    unread: notifications.filter((n) => n.type === t && !n.read).length,
  }));

  const filtered = notifications
    .filter((n) => readFilter === "all" || !n.read)
    .filter((n) => typeFilter === "all" || n.type === typeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs
            value={readFilter}
            onChange={(v) => setReadFilter(v as "all" | "unread")}
            options={[
              { value: "all", label: "All", count: notifications.length },
              { value: "unread", label: "Unread", count: unreadCount },
            ]}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsRead}
            disabled={unreadCount === 0}
          >
            <Icon.Check size={14} /> Mark all read
          </Button>
        </div>
      </div>

      {/* Type summary cards — clickable to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {typeCounts.map(({ type, total, unread }) => {
          const info = TYPE_INFO[type];
          const active = typeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(active ? "all" : type)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all card-shadow hover:-translate-y-0.5",
                active
                  ? `${info.bg} ${info.border} ring-2 ring-[var(--primary)]/30`
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]",
              )}
            >
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", info.bg, info.color)}>
                {info.icon}
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">{info.label}</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold tabular-nums">{total}</span>
                {unread > 0 && (
                  <span className="text-xs text-[var(--primary)] font-semibold">{unread} new</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active type filter pill */}
      {typeFilter !== "all" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--muted)]">Filtering by:</span>
          <Badge variant="primary" className="gap-1">
            {TYPE_INFO[typeFilter].label}
            <button onClick={() => setTypeFilter("all")} className="ml-1 hover:opacity-70 transition">
              <Icon.X size={11} />
            </button>
          </Badge>
        </div>
      )}

      {/* Inbox */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {typeFilter !== "all" ? `${TYPE_INFO[typeFilter].label} notifications` : "Inbox"}
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--muted)]">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
              <button
                onClick={() => setInboxOpen((prev) => !prev)}
                title={inboxOpen ? "Collapse inbox" : "Expand inbox"}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-all"
              >
                <Icon.ChevronDown
                  size={16}
                  className={cn("transition-transform duration-200", inboxOpen ? "rotate-0" : "-rotate-90")}
                />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0" style={{ display: inboxOpen ? undefined : "none" }}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Bell size={28} />}
              title={typeFilter !== "all" ? `No ${TYPE_INFO[typeFilter].label.toLowerCase()} notifications` : "No notifications"}
              description={
                readFilter === "unread"
                  ? "All caught up! No unread notifications."
                  : "You'll see assignments, announcements, and reminders here."
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((n) => {
                const info = TYPE_INFO[n.type];
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "px-4 py-4 flex gap-3 items-start group transition-colors",
                      !n.read && "bg-[var(--primary-soft)]/25",
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        info.bg,
                        info.color,
                      )}
                    >
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold leading-snug">{n.title}</p>
                        <Badge variant={BADGE_VARIANTS[n.type]}>{info.label}</Badge>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-[var(--primary)] shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-[var(--muted-2)] mt-1.5">{relativeTime(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!n.read && (
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          title="Mark as read"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary-soft)] transition"
                        >
                          <Icon.Check size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        title="Delete"
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition"
                      >
                        <Icon.Trash size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
