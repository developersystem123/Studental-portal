"use client";

import { useState, useMemo, useCallback } from "react";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Tabs } from "@/components/ui";
import Icon from "@/components/icons";
import { useData } from "@/lib/store";
import { cn, relativeTime } from "@/lib/utils";
import type { Notification } from "@/lib/mockData";

type TypeFilter = Notification["type"] | "all";

const TYPE_INFO: Record<
  Notification["type"],
  { color: string; bg: string; border: string; icon: React.ReactNode; label: string }
> = {
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

function groupByDate(items: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;

  const buckets: { label: string; items: Notification[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Older", items: [] },
  ];

  for (const n of items) {
    const t = new Date(n.createdAt).getTime();
    if (t >= today) buckets[0].items.push(n);
    else if (t >= yesterday) buckets[1].items.push(n);
    else if (t >= weekAgo) buckets[2].items.push(n);
    else buckets[3].items.push(n);
  }

  return buckets.filter((b) => b.items.length > 0);
}

export default function NotificationsPage() {
  const { notifications, markAllNotificationsRead, markNotificationRead, deleteNotification } =
    useData();

  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [grouped, setGrouped] = useState(true);
  const [inboxOpen, setInboxOpen] = useState(true);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [mutedTypes, setMutedTypes] = useState<Set<Notification["type"]>>(new Set());
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [browserNotifs, setBrowserNotifs] = useState(false);

  const toggleMute = (type: Notification["type"]) => {
    setMutedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeCounts = useMemo(
    () =>
      (Object.keys(TYPE_INFO) as Notification["type"][]).map((t) => ({
        type: t,
        total: notifications.filter((n) => n.type === t).length,
        unread: notifications.filter((n) => n.type === t && !n.read).length,
      })),
    [notifications],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications
      .filter((n) => readFilter === "all" || !n.read)
      .filter((n) => typeFilter === "all" || n.type === typeFilter)
      .filter(
        (n) => !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q),
      );
  }, [notifications, readFilter, typeFilter, search]);

  const groups = useMemo(
    () => (grouped ? groupByDate(filtered) : [{ label: "", items: filtered }]),
    [filtered, grouped],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected = selectedIds.size === filtered.length && filtered.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((n) => n.id)));
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const deleteBulk = async () => {
    setDeletingBulk(true);
    try {
      for (const id of selectedIds) await deleteNotification(id);
      setSelectedIds(new Set());
      setBulkMode(false);
    } finally {
      setDeletingBulk(false);
    }
  };

  const activeFilters = typeFilter !== "all" || search.trim() !== "";

  return (
    <div className="space-y-6">
      {/* ── Hero header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/8 via-[var(--surface)] to-[var(--surface-2)] p-6">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[var(--primary)]/6" />
        <div className="pointer-events-none absolute right-14 top-6 h-16 w-16 rounded-full bg-sky-500/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Title block */}
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--primary)]/12 flex items-center justify-center text-[var(--primary)]">
              <Icon.Bell size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up — no unread notifications"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant={bulkMode ? "soft" : "outline"}
              size="sm"
              onClick={bulkMode ? exitBulkMode : () => setBulkMode(true)}
            >
              <Icon.ListChecks size={14} />
              {bulkMode ? "Cancel selection" : "Select"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={markAllNotificationsRead}
              disabled={unreadCount === 0}
            >
              <Icon.Check size={14} /> Mark all read
            </Button>
            <Button
              variant={showPrefs ? "soft" : "outline"}
              size="sm"
              onClick={() => setShowPrefs((v) => !v)}
            >
              <Icon.Settings size={14} /> Preferences
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          {typeCounts.map(({ type, total, unread }) => {
            const info = TYPE_INFO[type];
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-all",
                  typeFilter === type
                    ? `${info.bg} ${info.border} ${info.color}`
                    : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-strong)]",
                )}
              >
                <span className={cn("flex items-center", typeFilter === type ? info.color : "text-[var(--muted)]")}>
                  {type === "assignment" && <Icon.FilePen size={13} />}
                  {type === "announcement" && <Icon.Megaphone size={13} />}
                  {type === "reminder" && <Icon.Clock size={13} />}
                  {type === "achievement" && <Icon.Award size={13} />}
                </span>
                <span className="font-semibold tabular-nums">{total}</span>
                <span className="text-[var(--muted)] hidden sm:inline">{info.label}</span>
                {unread > 0 && (
                  <span className="rounded-full bg-[var(--primary)] px-1.5 py-px text-[10px] font-bold text-white leading-none">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Notification Preferences Panel ─────────────────────── */}
      {showPrefs && (
        <Card className="border-[var(--primary)]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon.Settings size={14} />
                </span>
                Notification Preferences
              </CardTitle>
              <button
                onClick={() => setShowPrefs(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
              >
                <Icon.X size={14} />
              </button>
            </div>
          </CardHeader>
          <CardBody className="space-y-5">
            {/* Notification type toggles */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Notification Types
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(TYPE_INFO) as Notification["type"][]).map((type) => {
                  const info = TYPE_INFO[type];
                  const muted = mutedTypes.has(type);
                  const count = notifications.filter((n) => n.type === type).length;
                  return (
                    <div
                      key={type}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3 transition-colors",
                        muted
                          ? "border-[var(--border)] bg-[var(--surface-2)] opacity-60"
                          : "border-[var(--border)] bg-[var(--surface)]",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            muted ? "bg-[var(--surface-2)] text-[var(--muted)]" : `${info.bg} ${info.color}`,
                          )}
                        >
                          {info.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{info.label}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {muted ? "Muted" : `${count} notification${count !== 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>
                      {/* Toggle switch */}
                      <button
                        onClick={() => toggleMute(type)}
                        className={cn(
                          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
                          muted ? "bg-[var(--border-strong)]" : "bg-[var(--primary)]",
                        )}
                        aria-label={muted ? `Unmute ${info.label}` : `Mute ${info.label}`}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                            muted ? "translate-x-0.5" : "translate-x-[1.375rem]",
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery preferences */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Delivery Channels
              </p>
              <div className="space-y-2">
                {[
                  {
                    label: "Email notifications",
                    description: "Receive a daily digest to your email",
                    icon: <Icon.Mail size={15} />,
                    value: emailNotifs,
                    toggle: () => setEmailNotifs((v) => !v),
                  },
                  {
                    label: "Browser notifications",
                    description: "Show alerts in your browser",
                    icon: <Icon.Bell size={15} />,
                    value: browserNotifs,
                    toggle: () => setBrowserNotifs((v) => !v),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--muted)]">{item.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-[var(--muted)]">{item.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={item.toggle}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
                        item.value ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                          item.value ? "translate-x-[1.375rem]" : "translate-x-0.5",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear read */}
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
              <p className="text-sm text-[var(--muted)]">
                {notifications.filter((n) => n.read).length} read notification{notifications.filter((n) => n.read).length !== 1 ? "s" : ""} can be cleared
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  for (const n of notifications.filter((n) => n.read)) {
                    await deleteNotification(n.id);
                  }
                }}
                disabled={notifications.filter((n) => n.read).length === 0}
              >
                <Icon.Trash size={13} /> Clear read
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Search + controls row ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Icon.Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications…"
            className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-8 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)]/40 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-[var(--muted)] hover:text-[var(--foreground)] transition"
            >
              <Icon.X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          <Tabs
            value={readFilter}
            onChange={(v) => setReadFilter(v as "all" | "unread")}
            options={[
              { value: "all", label: "All", count: notifications.length },
              { value: "unread", label: "Unread", count: unreadCount },
            ]}
          />
          {/* Group-by-date toggle */}
          <button
            onClick={() => setGrouped((v) => !v)}
            title={grouped ? "Show flat list" : "Group by date"}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
              grouped
                ? "border-[var(--primary)]/40 bg-[var(--primary-soft)] text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]",
            )}
          >
            <Icon.Calendar size={15} />
          </button>
        </div>
      </div>

      {/* ── Type filter cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {typeCounts.map(({ type, total, unread }) => {
          const info = TYPE_INFO[type];
          const active = typeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(active ? "all" : type)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5",
                active
                  ? `${info.bg} ${info.border} shadow-md ring-2 ring-[var(--primary)]/15`
                  : "bg-[var(--surface)] border-[var(--border)] card-shadow hover:border-[var(--border-strong)] hover:shadow-md",
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                  info.bg,
                  info.color,
                )}
              >
                {info.icon}
              </div>
              <p className="mt-3 text-xs font-medium text-[var(--muted)]">{info.label}</p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">{total}</span>
                {unread > 0 && (
                  <span className="text-xs font-bold text-[var(--primary)]">{unread} new</span>
                )}
              </div>
              {active && (
                <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", info.color)}>
                  <Icon.Check size={11} /> Filtering
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active filter pills ─────────────────────────────────── */}
      {activeFilters && (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-[var(--muted)]">Active filters:</span>
          {typeFilter !== "all" && (
            <Badge variant="primary" className="gap-1">
              {TYPE_INFO[typeFilter].label}
              <button onClick={() => setTypeFilter("all")} className="ml-0.5 hover:opacity-70 transition">
                <Icon.X size={11} />
              </button>
            </Badge>
          )}
          {search.trim() && (
            <Badge variant="default" className="gap-1">
              &ldquo;{search.trim()}&rdquo;
              <button onClick={() => setSearch("")} className="ml-0.5 hover:opacity-70 transition">
                <Icon.X size={11} />
              </button>
            </Badge>
          )}
          <button
            onClick={() => { setTypeFilter("all"); setSearch(""); }}
            className="text-xs text-[var(--muted)] hover:text-[var(--danger)] underline underline-offset-2 transition"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Bulk-action bar ─────────────────────────────────────── */}
      {bulkMode && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm">
          {/* Select-all checkbox */}
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
                allSelected
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border-strong)] bg-[var(--surface)]",
              )}
            >
              {allSelected && <Icon.Check size={11} />}
            </div>
            {allSelected ? "Deselect all" : "Select all"}
          </button>

          <span className="text-xs text-[var(--muted)]">
            {selectedIds.size} of {filtered.length} selected
          </span>

          <div className="flex-1" />

          {selectedIds.size > 0 && (
            <>
              <Button size="sm" variant="danger" onClick={deleteBulk} loading={deletingBulk}>
                <Icon.Trash size={13} /> Delete ({selectedIds.size})
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── Inbox card ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {search.trim()
                ? `Results for "${search.trim()}"`
                : typeFilter !== "all"
                ? `${TYPE_INFO[typeFilter].label} notifications`
                : "Inbox"}
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--muted)]">
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setInboxOpen((v) => !v)}
                title={inboxOpen ? "Collapse" : "Expand"}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-all"
              >
                <Icon.ChevronDown
                  size={16}
                  className={cn(
                    "transition-transform duration-200",
                    inboxOpen ? "rotate-0" : "-rotate-90",
                  )}
                />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-0" style={{ display: inboxOpen ? undefined : "none" }}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Bell size={28} />}
              title={
                search.trim()
                  ? `No results for "${search.trim()}"`
                  : typeFilter !== "all"
                  ? `No ${TYPE_INFO[typeFilter].label.toLowerCase()} notifications`
                  : readFilter === "unread"
                  ? "All caught up!"
                  : "No notifications"
              }
              description={
                search.trim()
                  ? "Try a different search term or clear your filters."
                  : readFilter === "unread"
                  ? "No unread notifications right now. Check back later."
                  : "You'll see assignments, announcements, reminders, and achievements here."
              }
              action={
                activeFilters || readFilter !== "all" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTypeFilter("all");
                      setSearch("");
                      setReadFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div>
              {groups.map((group, gi) => (
                <div key={group.label || "all"}>
                  {/* Date group header */}
                  {group.label && grouped && (
                    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-2)]/95 px-4 py-2 backdrop-blur-sm">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                        {group.label}
                      </span>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[var(--muted)]">
                        {group.items.length}
                      </span>
                    </div>
                  )}

                  <ul
                    className={cn(
                      "divide-y divide-[var(--border)]",
                      gi < groups.length - 1 && group.label && "border-b border-[var(--border)]",
                    )}
                  >
                    {group.items.map((n) => {
                      const info = TYPE_INFO[n.type];
                      const selected = bulkMode && selectedIds.has(n.id);
                      return (
                        <li
                          key={n.id}
                          onClick={bulkMode ? () => toggleSelect(n.id) : undefined}
                          className={cn(
                            "flex gap-3 items-start px-4 py-4 group transition-colors",
                            !n.read && !selected && "bg-[var(--primary-soft)]/20",
                            selected && "bg-[var(--primary-soft)]/45",
                            bulkMode && "cursor-pointer",
                            bulkMode && !selected && "hover:bg-[var(--surface-2)]",
                          )}
                        >
                          {/* Bulk-mode checkbox */}
                          {bulkMode && (
                            <div
                              className={cn(
                                "mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                                selected
                                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                  : "border-[var(--border-strong)] bg-[var(--surface)]",
                              )}
                            >
                              {selected && <Icon.Check size={11} />}
                            </div>
                          )}

                          {/* Type icon */}
                          <div
                            className={cn(
                              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                              info.bg,
                              info.color,
                            )}
                          >
                            {info.icon}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold leading-snug">{n.title}</p>
                              <Badge variant={BADGE_VARIANTS[n.type]}>{info.label}</Badge>
                              {!n.read && (
                                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[var(--primary)]" />
                              )}
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                              {n.message}
                            </p>
                            <p className="mt-1.5 text-xs text-[var(--muted-2)]">
                              {relativeTime(n.createdAt)}
                            </p>
                          </div>

                          {/* Hover actions — hidden in bulk mode */}
                          {!bulkMode && (
                            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              {!n.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationRead(n.id);
                                  }}
                                  title="Mark as read"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--primary)] hover:bg-[var(--primary-soft)] transition"
                                >
                                  <Icon.Check size={15} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n.id);
                                }}
                                title="Delete"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition"
                              >
                                <Icon.Trash size={15} />
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
