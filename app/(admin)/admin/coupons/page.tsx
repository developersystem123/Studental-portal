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
  Switch,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { formatDate } from "@/lib/utils";

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

export default function AdminCouponsPage() {
  const toast = useToast();
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Coupon | null>(null);

  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<"percent" | "fixed">("percent");
  const [value, setValue] = React.useState("20");
  const [maxUses, setMaxUses] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/admin/coupons");
    const data = r.ok ? await r.json() : { coupons: [] };
    setCoupons(data.coupons ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setCode("");
    setType("percent");
    setValue("20");
    setMaxUses("");
    setExpiresAt("");
    setFormOpen(true);
  }

  async function create() {
    setSaving(true);
    const numericValue =
      type === "fixed" ? Math.round(Number(value) * 100) : Math.round(Number(value));
    const r = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        type,
        value: numericValue,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt || null,
      }),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't create coupon", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Coupon created", tone: "success" });
    setFormOpen(false);
    load();
  }

  async function toggleActive(c: Coupon) {
    const r = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    if (r.ok) load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const r = await fetch(`/api/admin/coupons/${deleting.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.push({ title: "Coupon deleted", tone: "info" });
      setDeleting(null);
      load();
    }
  }

  function discountLabel(c: Coupon) {
    return c.type === "percent" ? `${c.value}% off` : `$${(c.value / 100).toFixed(2)} off`;
  }

  const couponStats = React.useMemo(() => {
    const active = coupons.filter((c) => c.active && !(c.expiresAt && new Date(c.expiresAt).getTime() < Date.now())).length;
    const expired = coupons.filter((c) => c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()).length;
    const totalUses = coupons.reduce((s, c) => s + c.usedCount, 0);
    return { active, expired, totalUses };
  }, [coupons]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="mt-1 text-[var(--muted)]">
            Create discount codes students can apply at checkout.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icon.Plus size={16} /> New coupon
        </Button>
      </div>

      {coupons.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active coupons", value: couponStats.active, icon: <Icon.Tag size={16} />, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
            { label: "Total uses", value: couponStats.totalUses, icon: <Icon.TrendingUp size={16} />, tint: "bg-[var(--primary-soft)] text-[var(--primary)]" },
            { label: "Expired", value: couponStats.expired, icon: <Icon.Clock size={16} />, tint: couponStats.expired > 0 ? "bg-red-500/10 text-red-500" : "bg-[var(--surface-2)] text-[var(--muted)]" },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody className="flex items-center gap-3 !py-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                  <p className="text-xl font-bold tracking-tight">{s.value}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <Card>
          <CardBody>
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          </CardBody>
        </Card>
      ) : coupons.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Tag size={28} />}
              title="No coupons yet"
              description="Create your first discount code."
              action={
                <Button onClick={openCreate}>
                  <Icon.Plus size={16} /> New coupon
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                <tr>
                  <Th>Code</Th>
                  <Th>Discount</Th>
                  <Th>Usage</Th>
                  <Th>Expires</Th>
                  <Th>Active</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const exhausted = c.maxUses !== undefined && c.usedCount >= c.maxUses;
                  const expired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
                  return (
                    <tr key={c.id} className="border-t border-[var(--border)]">
                      <Td>
                        <span className="font-mono font-semibold">{c.code}</span>
                        {(exhausted || expired) && (
                          <Badge variant="danger" className="ml-2">
                            {expired ? "Expired" : "Used up"}
                          </Badge>
                        )}
                      </Td>
                      <Td>
                        <Badge variant="primary">{discountLabel(c)}</Badge>
                      </Td>
                      <Td className="text-xs">
                        {c.usedCount}
                        {c.maxUses !== undefined ? ` / ${c.maxUses}` : " (unlimited)"}
                      </Td>
                      <Td className="text-xs text-[var(--muted)]">
                        {c.expiresAt ? formatDate(c.expiresAt) : "Never"}
                      </Td>
                      <Td>
                        <Switch checked={c.active} onChange={() => toggleActive(c)} />
                      </Td>
                      <Td className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(c)}>
                          <Icon.Trash size={14} />
                        </Button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} size="md" title="New coupon">
        <div className="p-5 space-y-4">
          <div>
            <Label>Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="e.g. SAVE20"
              maxLength={20}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as "percent" | "fixed")}
              >
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
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
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max uses (optional)</Label>
              <Input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div>
              <Label>Expires (optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={create} loading={saving} disabled={code.length < 3}>
              <Icon.Tag size={16} /> Create coupon
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} size="sm" title="Delete coupon?">
        {deleting && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Delete coupon{" "}
              <strong className="text-[var(--foreground)] font-mono">{deleting.code}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                <Icon.Trash size={16} /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-semibold px-4 py-3 ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}
