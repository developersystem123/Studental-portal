"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  StatCard,
  Switch,
  Tabs,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, formatDate } from "@/lib/utils";

type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
};

type Filter  = "all" | "active" | "expired" | "used-up" | "inactive";
type SortKey = "code" | "discount" | "usage" | "expires" | "created";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

function discountLabel(c: Coupon) {
  return c.type === "percent" ? `${c.value}% off` : `$${(c.value / 100).toFixed(2)} off`;
}

function isExpired(c: Coupon) {
  return !!(c.expiresAt && new Date(c.expiresAt).getTime() < Date.now());
}

function isUsedUp(c: Coupon) {
  return c.maxUses !== undefined && c.usedCount >= c.maxUses;
}

function couponStatus(c: Coupon): "active" | "expired" | "used-up" | "inactive" {
  if (!c.active) return "inactive";
  if (isExpired(c)) return "expired";
  if (isUsedUp(c)) return "used-up";
  return "active";
}

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function exportCSV(coupons: Coupon[]) {
  const header = ["Code", "Type", "Value", "Used", "Max Uses", "Status", "Expires", "Created"];
  const data   = coupons.map((c) => [
    c.code, c.type,
    c.type === "percent" ? `${c.value}%` : `$${(c.value / 100).toFixed(2)}`,
    c.usedCount, c.maxUses ?? "Unlimited",
    couponStatus(c),
    c.expiresAt ? formatDate(c.expiresAt) : "Never",
    formatDate(c.createdAt),
  ]);
  const csv  = [header, ...data].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "coupons.csv"; a.click();
  URL.revokeObjectURL(url);
}

const STATUS_META: Record<ReturnType<typeof couponStatus>, { label: string; variant: "success" | "danger" | "warning" | "default"; cls: string }> = {
  active:   { label: "Active",   variant: "success", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  expired:  { label: "Expired",  variant: "danger",  cls: "bg-red-500/10 text-red-600 dark:text-red-400" },
  "used-up":{ label: "Used up",  variant: "warning", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  inactive: { label: "Inactive", variant: "default", cls: "bg-slate-500/10 text-slate-500" },
};

export default function AdminCouponsPage() {
  const toast = useToast();

  const [coupons,  setCoupons]  = React.useState<Coupon[]>([]);
  const [loading,  setLoading]  = React.useState(true);
  const [query,    setQuery]    = React.useState("");
  const [filter,   setFilter]   = React.useState<Filter>("all");
  const [sortKey,  setSortKey]  = React.useState<SortKey>("created");
  const [sortDir,  setSortDir]  = React.useState<SortDir>("desc");
  const [page,     setPage]     = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Coupon | null>(null);
  const [bulkDel,  setBulkDel]  = React.useState(false);

  // Form state
  const [code,      setCode]      = React.useState("");
  const [type,      setType]      = React.useState<"percent" | "fixed">("percent");
  const [value,     setValue]     = React.useState("20");
  const [maxUses,   setMaxUses]   = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [saving,    setSaving]    = React.useState(false);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/admin/coupons");
    const data = r.ok ? await r.json() : { coupons: [] };
    setCoupons(data.coupons ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const stats = React.useMemo(() => {
    const active   = coupons.filter((c) => couponStatus(c) === "active").length;
    const expired  = coupons.filter((c) => couponStatus(c) === "expired").length;
    const usedUp   = coupons.filter((c) => couponStatus(c) === "used-up").length;
    const totalUses = coupons.reduce((s, c) => s + c.usedCount, 0);
    return { total: coupons.length, active, expired, usedUp, totalUses };
  }, [coupons]);

  const counts = React.useMemo(() => ({
    all:      coupons.length,
    active:   coupons.filter((c) => couponStatus(c) === "active").length,
    expired:  coupons.filter((c) => couponStatus(c) === "expired").length,
    "used-up":coupons.filter((c) => couponStatus(c) === "used-up").length,
    inactive: coupons.filter((c) => couponStatus(c) === "inactive").length,
  }), [coupons]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons
      .filter((c) => {
        if (filter !== "all" && couponStatus(c) !== filter) return false;
        if (!q) return true;
        return c.code.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "code")     cmp = a.code.localeCompare(b.code);
        if (sortKey === "discount") cmp = a.value - b.value;
        if (sortKey === "usage")    cmp = a.usedCount - b.usedCount;
        if (sortKey === "expires")  cmp = (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999");
        if (sortKey === "created")  cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [coupons, query, filter, sortKey, sortDir]);

  React.useEffect(() => { setPage(1); setSelected(new Set()); }, [query, filter, sortKey, sortDir]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected = paginated.length > 0 && paginated.every((c) => selected.has(c.id));

  function toggleSelect(id: string) {
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleSelectAll() {
    if (allSelected) setSelected((p) => { const n = new Set(p); paginated.forEach((c) => n.delete(c.id)); return n; });
    else             setSelected((p) => { const n = new Set(p); paginated.forEach((c) => n.add(c.id)); return n; });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }
  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <Icon.ChevronDown size={11} className="opacity-30" />;
    return <Icon.ChevronDown size={11} className={cn("text-[var(--primary)]", sortDir === "asc" && "rotate-180")} />;
  }

  function openCreate() {
    setCode(""); setType("percent"); setValue("20"); setMaxUses(""); setExpiresAt("");
    setFormOpen(true);
  }

  async function create() {
    if (code.length < 3) { toast.push({ title: "Code must be at least 3 characters", tone: "danger" }); return; }
    const numVal = type === "fixed" ? Math.round(Number(value) * 100) : Math.round(Number(value));
    if (!Number.isFinite(numVal) || numVal <= 0) { toast.push({ title: "Enter a valid discount value", tone: "danger" }); return; }
    setSaving(true);
    const r = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, type, value: numVal, maxUses: maxUses ? Number(maxUses) : null, expiresAt: expiresAt || null }),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({})) as { error?: string };
      toast.push({ title: "Couldn't create coupon", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Coupon created", tone: "success" });
    setFormOpen(false); load();
  }

  async function toggleActive(c: Coupon) {
    const r = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    if (r.ok) { toast.push({ title: c.active ? "Coupon deactivated" : "Coupon activated", tone: "info" }); load(); }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const r = await fetch(`/api/admin/coupons/${deleting.id}`, { method: "DELETE" });
    if (r.ok) { toast.push({ title: "Coupon deleted", tone: "info" }); setDeleting(null); load(); }
  }

  async function confirmBulkDelete() {
    for (const id of Array.from(selected)) {
      await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    }
    toast.push({ title: `${selected.size} coupon${selected.size > 1 ? "s" : ""} deleted`, tone: "info" });
    setBulkDel(false); setSelected(new Set()); load();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => toast.push({ title: "Code copied", tone: "success" })).catch(() => {});
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="mt-1 text-[var(--muted)]">Create and manage discount codes students can apply at checkout.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { exportCSV(filtered); toast.push({ title: "CSV exported", tone: "success" }); }}>
            <Icon.Download size={15} /> Export CSV
          </Button>
          <Button onClick={openCreate}>
            <Icon.Plus size={16} /> New coupon
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total coupons" value={stats.total}     icon={<Icon.Tag size={16} />}       tone="primary" delta="All created" />
        <StatCard label="Active"        value={stats.active}    icon={<Icon.CheckCircle size={16} />} tone="success" delta="Ready to use" />
        <StatCard label="Total uses"    value={stats.totalUses} icon={<Icon.TrendingUp size={16} />}  tone="accent"  delta="Times redeemed" />
        <StatCard label="Expired"       value={stats.expired}   icon={<Icon.Clock size={16} />}       tone="warning" delta="Past expiry date" />
        <StatCard label="Used up"       value={stats.usedUp}    icon={<Icon.AlertCircle size={16} />} tone="primary" delta="Limit reached" />
      </div>

      <Card>
        <CardBody className="space-y-4">
          {/* Filters — one row */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-2">
            <div className="overflow-x-auto -mx-1 px-1">
              <Tabs
                value={filter}
                onChange={(v) => setFilter(v as Filter)}
                options={[
                  { value: "all",      label: "All",      count: counts.all },
                  { value: "active",   label: "Active",   count: counts.active },
                  { value: "expired",  label: "Expired",  count: counts.expired },
                  { value: "used-up",  label: "Used up",  count: counts["used-up"] },
                  { value: "inactive", label: "Inactive", count: counts.inactive },
                ]}
              />
            </div>
            <div className="flex gap-2 lg:ml-auto lg:shrink-0">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="Search code…"
                icon={<Icon.Search size={15} />}
                className="!h-9 flex-1 lg:flex-none lg:!w-44"
              />
              <Select
                value={`${sortKey}-${sortDir}`}
                onChange={(e) => { const [k, d] = e.target.value.split("-"); setSortKey(k as SortKey); setSortDir(d as SortDir); }}
                className="!h-9 !w-36 shrink-0"
              >
                <option value="created-desc">Newest first</option>
                <option value="created-asc">Oldest first</option>
                <option value="usage-desc">Most used</option>
                <option value="discount-desc">Highest discount</option>
                <option value="expires-asc">Expiring soon</option>
                <option value="code-asc">Code A–Z</option>
              </Select>
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20">
              <span className="text-sm font-semibold text-[var(--danger)]">{selected.size} selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="danger" onClick={() => setBulkDel(true)}>
                  <Icon.Trash size={13} /> Delete selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon.Loader size={22} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Tag size={28} />}
              title={coupons.length === 0 ? "No coupons yet" : "No matching coupons"}
              description={coupons.length === 0 ? "Create your first discount code." : "Try a different filter."}
              action={coupons.length === 0 && <Button onClick={openCreate}><Icon.Plus size={15} /> New coupon</Button>}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded accent-[var(--primary)] cursor-pointer" />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("code")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Code <SortIcon col="code" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("discount")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Discount <SortIcon col="discount" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("usage")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Usage <SortIcon col="usage" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                        <button onClick={() => toggleSort("expires")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Expires <SortIcon col="expires" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Active</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginated.map((c) => {
                      const status   = couponStatus(c);
                      const sm       = STATUS_META[status];
                      const usagePct = c.maxUses ? Math.min(100, Math.round((c.usedCount / c.maxUses) * 100)) : null;
                      return (
                        <tr key={c.id} className={cn("transition-colors group", selected.has(c.id) ? "bg-[var(--primary-soft)]/30" : "hover:bg-[var(--surface-2)]/60")}>
                          {/* Checkbox */}
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded accent-[var(--primary)] cursor-pointer" />
                          </td>
                          {/* Code */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <code className="font-mono font-bold text-sm tracking-wider bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
                                {c.code}
                              </code>
                              <button onClick={() => copyCode(c.code)} className="p-1 rounded text-[var(--muted)] hover:text-[var(--primary)] transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100" title="Copy">
                                <Icon.Copy size={13} />
                              </button>
                            </div>
                          </td>
                          {/* Discount */}
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-1.5">
                              <span className={cn(
                                "text-sm font-bold px-2.5 py-0.5 rounded-lg",
                                c.type === "percent" ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                              )}>
                                {discountLabel(c)}
                              </span>
                              <span className="text-[10px] text-[var(--muted-2)]">{c.type === "percent" ? "%" : "$"}</span>
                            </div>
                          </td>
                          {/* Usage */}
                          <td className="px-4 py-3">
                            <div className="space-y-1 min-w-[100px]">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold tabular-nums">{c.usedCount}</span>
                                <span className="text-xs text-[var(--muted-2)]">/ {c.maxUses ?? "∞"}</span>
                              </div>
                              {usagePct !== null && (
                                <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden w-20">
                                  <div
                                    className={cn("h-full rounded-full transition-all", usagePct >= 100 ? "bg-red-500" : usagePct >= 75 ? "bg-amber-500" : "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]")}
                                    style={{ width: `${usagePct}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          {/* Expires */}
                          <td className="px-4 py-3 text-xs text-[var(--muted)] hidden md:table-cell whitespace-nowrap">
                            {c.expiresAt ? (
                              <span className={cn(isExpired(c) && "text-[var(--danger)] font-medium")}>
                                {formatDate(c.expiresAt)}
                              </span>
                            ) : (
                              <span className="text-[var(--muted-2)]">Never</span>
                            )}
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full", sm.cls)}>
                              {sm.label}
                            </span>
                          </td>
                          {/* Active toggle */}
                          <td className="px-4 py-3">
                            <Switch checked={c.active} onChange={() => toggleActive(c)} />
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setDeleting(c)}
                              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Delete"
                            >
                              <Icon.Trash size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                <p className="text-xs text-[var(--muted)]">
                  Showing <span className="font-semibold text-[var(--foreground)]">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                  <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> coupons
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(1)} title="First">
                    <Icon.ChevronLeft size={13} /><Icon.ChevronLeft size={13} className="-ml-2" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <Icon.ChevronLeft size={13} /> Prev
                  </Button>
                  <div className="flex items-center gap-1 mx-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, i, arr) => {
                        if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                        acc.push(p); return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span key={`e-${i}`} className="px-1 text-[var(--muted)] text-sm">…</span>
                        ) : (
                          <button key={p} onClick={() => setPage(p as number)}
                            className={cn("h-8 w-8 rounded-lg text-xs font-semibold transition", page === p ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]")}
                          >{p}</button>
                        )
                      )}
                  </div>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <Icon.ChevronRight size={13} />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(totalPages)} title="Last">
                    <Icon.ChevronRight size={13} /><Icon.ChevronRight size={13} className="-ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Create modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="md"
        title="New coupon"
      >
        <div>
          {/* Live preview header */}
          <div className="px-5 sm:px-6 py-4 flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface-2)]/50">
            <div className={cn(
              "h-14 w-14 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md transition-all duration-300 bg-gradient-to-br",
              type === "percent"
                ? "from-[var(--primary)] to-emerald-400 shadow-green-500/20"
                : "from-sky-500 to-blue-400 shadow-sky-500/20",
            )}>
              <Icon.Tag size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("font-bold font-mono tracking-widest truncate", code ? "text-base text-[var(--foreground)]" : "text-sm text-[var(--muted)]")}>
                {code || "COUPON CODE"}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {value && Number(value) > 0 ? (
                  <span className={cn(
                    "text-[11px] font-bold px-2.5 py-0.5 rounded-full",
                    type === "percent"
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "bg-sky-500/15 text-sky-600 dark:text-sky-400",
                  )}>
                    {type === "percent" ? `${value}% off` : `$${value} off`}
                  </span>
                ) : (
                  <span className="text-[11px] text-[var(--muted)]">Set discount below</span>
                )}
                {maxUses && <span className="text-[10px] text-[var(--muted)]">· {maxUses} max uses</span>}
                {expiresAt && <span className="text-[10px] text-[var(--muted)]">· Expires {expiresAt}</span>}
                {!maxUses && !expiresAt && value && Number(value) > 0 && (
                  <span className="text-[10px] text-[var(--muted)]">· Unlimited · No expiry</span>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Code + Generate */}
            <div>
              <Label>Coupon code</Label>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="e.g. SAVE20"
                  maxLength={20}
                  className="flex-1 font-mono tracking-wider"
                  icon={<Icon.Tag size={16} />}
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setCode(generateCode())}
                  className="shrink-0"
                >
                  <Icon.Sparkles size={14} /> Generate
                </Button>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-1.5">
                Only uppercase letters and numbers. Min 3 characters.
              </p>
            </div>

            {/* Discount type + value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
                  <option value="percent">Percentage off (%)</option>
                  <option value="fixed">Fixed amount ($)</option>
                </Select>
              </div>
              <div>
                <Label>{type === "percent" ? "Percent (%)" : "Amount ($)"}</Label>
                <Input
                  type="number"
                  min={1}
                  max={type === "percent" ? 100 : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  icon={type === "fixed" ? <Icon.DollarSign size={16} /> : undefined}
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Max uses <span className="text-[var(--muted-2)] font-normal">(optional)</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Unlimited"
                  icon={<Icon.Users size={16} />}
                />
              </div>
              <div>
                <Label>
                  Expiry date <span className="text-[var(--muted-2)] font-normal">(optional)</span>
                </Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            {!maxUses && !expiresAt && (
              <p className="text-[11px] text-[var(--muted)] -mt-1 flex items-center gap-1.5">
                <Icon.AlertCircle size={12} />
                No limit — students can use this code indefinitely.
              </p>
            )}
          </div>

          <div className="px-5 sm:px-6 pb-5 pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-[var(--border)]">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={create} loading={saving} disabled={code.length < 3} className="w-full sm:w-auto">
              <Icon.CheckCircle size={15} /> Create coupon
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} size="sm" title="Delete coupon?">
        {deleting && (
          <div className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-sm flex items-center gap-3">
              <code className="font-mono font-bold text-base tracking-wider">{deleting.code}</code>
              <div className="ml-auto text-right text-xs text-[var(--muted)]">
                <p>{discountLabel(deleting)}</p>
                <p>{deleting.usedCount} uses</p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted)]">Students will no longer be able to redeem this code. Cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}><Icon.Trash size={14} /> Delete</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk delete */}
      <Modal open={bulkDel} onClose={() => setBulkDel(false)} size="sm" title={`Delete ${selected.size} coupons?`}>
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Permanently deletes <strong className="text-[var(--foreground)]">{selected.size}</strong> coupon{selected.size > 1 ? "s" : ""}. Students will no longer be able to redeem them.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkDel(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmBulkDelete}><Icon.Trash size={14} /> Delete all</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
