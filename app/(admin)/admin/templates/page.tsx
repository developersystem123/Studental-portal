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
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, relativeTime } from "@/lib/utils";

type Channel = "email" | "sms" | "both";

type Template = {
  id: string;
  key: string;
  name: string;
  channel: Channel;
  subject: string;
  body: string;
  variables: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const CHANNEL_META: Record<Channel, { label: string; icon: React.ReactNode; cls: string; badge: "info" | "primary" | "success" }> = {
  email: { label: "Email", icon: <Icon.Mail size={11} />, cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400", badge: "info" },
  sms: { label: "SMS", icon: <Icon.MessageSquare size={11} />, cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400", badge: "primary" },
  both: { label: "Email + SMS", icon: <Icon.Send size={11} />, cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", badge: "success" },
};

// Substitute {{var}} tokens with a readable sample so admins see how the
// rendered message will look.
function renderPreview(text: string): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, v: string) =>
    `[${v.replace(/_/g, " ")}]`,
  );
}

function extractVariables(...parts: string[]): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  for (const part of parts) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(part))) found.add(m[1]);
  }
  return [...found];
}

type FormState = {
  key: string;
  name: string;
  channel: Channel;
  subject: string;
  body: string;
  enabled: boolean;
};

const emptyForm: FormState = {
  key: "", name: "", channel: "email", subject: "", body: "", enabled: true,
};

export default function AdminTemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Channel | "all">("all");
  const [query, setQuery] = React.useState("");

  // Create / edit modal
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);

  // Preview + delete
  const [viewing, setViewing] = React.useState<Template | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/templates");
        const data = await res.json();
        if (res.ok) setTemplates(data.templates ?? []);
      } catch {
        // empty list on failure
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(t: Template) {
    setEditingId(t.id);
    setForm({ key: t.key, name: t.name, channel: t.channel, subject: t.subject, body: t.body, enabled: t.enabled });
    setFormOpen(true);
  }

  async function save() {
    const name = form.name.trim();
    const bodyText = form.body.trim();
    if (!name) { toast.push({ title: "Name is required.", tone: "danger" }); return; }
    if (!bodyText) { toast.push({ title: "Template body is required.", tone: "danger" }); return; }
    if (form.channel !== "sms" && !form.subject.trim()) {
      toast.push({ title: "An email subject is required.", tone: "danger" }); return;
    }
    if (!editingId && !/^[a-z0-9_]{3,40}$/.test(form.key.trim().toLowerCase().replace(/\s+/g, "_"))) {
      toast.push({ title: "Key must be 3–40 lowercase letters, numbers or underscores.", tone: "danger" }); return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/templates/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, channel: form.channel, subject: form.subject, body: bodyText, enabled: form.enabled,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setTemplates((p) => p.map((t) => (t.id === editingId ? data.template : t)));
          toast.push({ title: "Template updated", tone: "success" });
          setFormOpen(false);
        } else {
          toast.push({ title: data.error ?? "Could not update template.", tone: "danger" });
        }
      } else {
        const res = await fetch("/api/admin/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: form.key, name, channel: form.channel, subject: form.subject, body: bodyText, enabled: form.enabled,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setTemplates((p) => [data.template, ...p]);
          toast.push({ title: "Template created", tone: "success" });
          setFormOpen(false);
        } else {
          toast.push({ title: data.error ?? "Could not create template.", tone: "danger" });
        }
      }
    } catch {
      toast.push({ title: "Network error, please try again.", tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(t: Template) {
    const res = await fetch(`/api/admin/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !t.enabled }),
    });
    if (res.ok) {
      const data = await res.json();
      setTemplates((p) => p.map((x) => (x.id === t.id ? data.template : x)));
      toast.push({ title: data.template.enabled ? "Template enabled" : "Template disabled", tone: "info" });
    }
  }

  async function duplicate(t: Template) {
    // Derive a fresh key by appending a numeric suffix until it's unique.
    const base = t.key.replace(/_copy\d*$/, "");
    const existing = new Set(templates.map((x) => x.key));
    let key = `${base}_copy`;
    let n = 2;
    while (existing.has(key)) key = `${base}_copy${n++}`;
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key, name: `${t.name} (copy)`, channel: t.channel, subject: t.subject, body: t.body, enabled: false,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setTemplates((p) => [data.template, ...p]);
      toast.push({ title: "Template duplicated (disabled)", tone: "success" });
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    const res = await fetch(`/api/admin/templates/${deletingId}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((p) => p.filter((t) => t.id !== deletingId));
      if (viewing?.id === deletingId) setViewing(null);
      toast.push({ title: "Template deleted", tone: "info" });
    }
    setDeletingId(null);
  }

  // Insert a {{variable}} token into the body at the cursor (appends here).
  function insertVariable(token: string) {
    setForm((f) => ({ ...f, body: `${f.body}${f.body && !f.body.endsWith(" ") ? " " : ""}{{${token}}}` }));
  }

  const stats = React.useMemo(() => ({
    total: templates.length,
    email: templates.filter((t) => t.channel === "email" || t.channel === "both").length,
    sms: templates.filter((t) => t.channel === "sms" || t.channel === "both").length,
    enabled: templates.filter((t) => t.enabled).length,
  }), [templates]);

  const counts = React.useMemo(() => ({
    all: templates.length,
    email: templates.filter((t) => t.channel === "email").length,
    sms: templates.filter((t) => t.channel === "sms").length,
    both: templates.filter((t) => t.channel === "both").length,
  }), [templates]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (filter !== "all" && t.channel !== filter) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.key.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);
    });
  }, [templates, filter, query]);

  const liveVars = extractVariables(form.subject, form.body);

  return (
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Operations</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Message Templates</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage reusable email &amp; SMS templates. Use <code className="px-1 py-0.5 rounded bg-[var(--surface-2)] text-[var(--foreground)] text-xs">{"{{variable}}"}</code> placeholders for dynamic content.
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto justify-center">
          <Icon.Plus size={16} /> New template
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard dense label="Total" value={stats.total} icon={<Icon.FilePen size={16} />} tone="primary" />
        <StatCard dense label="Email" value={stats.email} icon={<Icon.Mail size={16} />} tone="accent" />
        <StatCard dense label="SMS" value={stats.sms} icon={<Icon.MessageSquare size={16} />} tone="success" />
        <StatCard dense label="Enabled" value={stats.enabled} icon={<Icon.CheckCircle size={16} />} tone="warning" />
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs
          value={filter}
          onChange={(v) => setFilter(v as Channel | "all")}
          className="overflow-x-auto sm:overflow-visible"
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "email", label: "Email", count: counts.email },
            { value: "sms", label: "SMS", count: counts.sms },
            { value: "both", label: "Both", count: counts.both },
          ]}
        />
        <div className="w-full sm:w-72 sm:shrink-0 sm:ml-auto">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            icon={<Icon.Search size={16} />}
            className="w-full"
          />
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <Card><CardBody><div className="flex items-center justify-center py-12 text-[var(--muted)]"><Icon.Loader size={22} className="animate-spin mr-2" /> Loading templates…</div></CardBody></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.FilePen size={28} />}
              title={templates.length === 0 ? "No templates yet" : "No templates match."}
              description={templates.length === 0 ? "Create your first email or SMS template to get started." : "Try a different filter or search."}
              action={templates.length === 0 && (
                <Button onClick={openCreate}><Icon.Plus size={16} /> New template</Button>
              )}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const cm = CHANNEL_META[t.channel];
            return (
              <Card key={t.id} className={cn("hover:shadow-sm transition-shadow group", !t.enabled && "opacity-70")}>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", cm.cls)}>
                      <Icon.FilePen size={18} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="font-semibold text-sm cursor-pointer hover:text-[var(--primary)] transition"
                          onClick={() => setViewing(t)}
                        >
                          {t.name}
                        </p>
                        <Badge variant={cm.badge}>{cm.icon} {cm.label}</Badge>
                        {!t.enabled && <Badge variant="default">Disabled</Badge>}
                      </div>

                      <code className="text-[11px] text-[var(--muted)]">{t.key}</code>

                      {t.channel !== "sms" && t.subject && (
                        <p className="text-xs text-[var(--muted)]"><span className="font-medium text-[var(--foreground)]">Subject:</span> {t.subject}</p>
                      )}
                      <p className="text-sm text-[var(--muted)] line-clamp-2 leading-relaxed">{t.body}</p>

                      {t.variables.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {t.variables.map((v) => (
                            <span key={v} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-[11px] text-[var(--muted)] flex items-center gap-1 pt-0.5">
                        <Icon.Clock size={11} /> Updated {relativeTime(t.updatedAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleEnabled(t)} title={t.enabled ? "Disable" : "Enable"}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition">
                        {t.enabled ? <Icon.Eye size={14} /> : <Icon.EyeOff size={14} />}
                      </button>
                      <button onClick={() => openEdit(t)} title="Edit"
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition">
                        <Icon.Edit size={14} />
                      </button>
                      <button onClick={() => duplicate(t)} title="Duplicate"
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition">
                        <Icon.Copy size={14} />
                      </button>
                      <button onClick={() => setDeletingId(t.id)} title="Delete"
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-[var(--danger)] transition">
                        <Icon.Trash size={14} />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
          <p className="text-xs text-[var(--muted)] px-1">Showing {filtered.length} of {templates.length} templates</p>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} size="lg" title={editingId ? "Edit template" : "New template"}>

        {/* ── Section 1: Identity ──────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-5 space-y-4">
          <TplSectionLabel icon={<Icon.Tag size={13} />} label="Identity" />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tpl-key">Key</Label>
              <Input
                id="tpl-key"
                icon={<Icon.Lock size={14} />}
                placeholder="e.g. welcome_email"
                value={form.key}
                disabled={!!editingId}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z0-9_\s]/g, "") }))}
              />
              <p className={cn("text-[11px] mt-1.5 flex items-center gap-1", editingId ? "text-amber-500" : "text-muted")}>
                {editingId
                  ? <><Icon.AlertCircle size={11} /> Key can&apos;t be changed after creation.</>
                  : "Stable identifier used in code. Lowercase, no spaces."}
              </p>
            </div>
            <div>
              <Label htmlFor="tpl-name">Name</Label>
              <Input
                id="tpl-name"
                icon={<Icon.FilePen size={14} />}
                placeholder="e.g. Welcome email"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* ── Section 2: Channel & subject ─────────────────────────────── */}
        <div className="px-5 py-5 space-y-4">
          <TplSectionLabel icon={<Icon.Send size={13} />} label="Channel & delivery" />

          {/* Channel pill picker */}
          <div>
            <Label>Channel</Label>
            <div className="flex gap-2 mt-1.5">
              {(["email", "sms", "both"] as Channel[]).map((ch) => {
                const meta = CHANNEL_META[ch];
                const active = form.channel === ch;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, channel: ch }))}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all duration-150",
                      active
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-surface-2 text-muted border-border hover:border-(--primary)/40 hover:text-foreground",
                    )}
                  >
                    <span className={cn("flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
                      active ? "bg-white/20" : meta.cls,
                    )}>
                      {ch === "email" ? <Icon.Mail size={14} /> : ch === "sms" ? <Icon.MessageSquare size={14} /> : <Icon.Send size={14} />}
                    </span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email subject — conditional */}
          {form.channel !== "sms" && (
            <div className="fade-in">
              <Label htmlFor="tpl-subject">Email subject</Label>
              <Input
                id="tpl-subject"
                icon={<Icon.Mail size={14} />}
                placeholder="e.g. Welcome to EduPortal, {{name}}!"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* ── Section 3: Message body ───────────────────────────────────── */}
        <div className="px-5 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <TplSectionLabel icon={<Icon.MessageSquare size={13} />} label="Message body" />
            <span className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors",
              form.body.length > 0
                ? "bg-primary-soft text-primary"
                : "text-muted",
            )}>
              {form.body.length} chars
            </span>
          </div>

          <Textarea
            id="tpl-body"
            placeholder={"Hi {{name}},\n\nYour course {{courseTitle}} is ready…"}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={5}
          />

          {/* Variable insert chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted font-medium shrink-0 mr-0.5">Insert:</span>
            {["name", "email", "courseTitle", "amount", "date", "link"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-white border border-(--primary)/20 transition-all duration-150"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>

          {/* Detected vars banner */}
          {liveVars.length > 0 && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
              <Icon.AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                <span className="font-semibold">Variables detected:</span>{" "}
                {liveVars.map((v, i) => (
                  <span key={v}>
                    <code className="font-mono">{`{{${v}}}`}</code>
                    {i < liveVars.length - 1 && ", "}
                  </span>
                ))}
              </span>
            </div>
          )}

          {/* Live preview */}
          {(form.subject || form.body) && (
            <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
                <Icon.Eye size={12} className="text-muted" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Preview</span>
                <span className="ml-auto">
                  <Badge variant={CHANNEL_META[form.channel].badge}>
                    {CHANNEL_META[form.channel].label}
                  </Badge>
                </span>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {form.channel !== "sms" && form.subject && (
                  <p className="font-semibold text-sm">{renderPreview(form.subject)}</p>
                )}
                {form.body && (
                  <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">
                    {renderPreview(form.body)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer: toggle + actions ──────────────────────────────────── */}
        <div className="px-5 pb-5 flex items-center gap-4 border-t border-border pt-4">
          {/* Enabled toggle */}
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
            className="flex items-center gap-2.5 shrink-0"
          >
            <span className={cn(
              "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
              form.enabled ? "bg-primary" : "bg-surface-2 border-border",
            )}>
              <span className={cn(
                "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                form.enabled ? "translate-x-4" : "translate-x-0",
              )} />
            </span>
            <span className={cn("text-sm font-medium", form.enabled ? "text-primary" : "text-muted")}>
              {form.enabled ? "Enabled" : "Disabled"}
            </span>
          </button>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
            <Button loading={saving} onClick={save}>
              {editingId ? <><Icon.Check size={14} /> Save changes</> : <><Icon.Plus size={14} /> Create template</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Preview Modal ── */}
      {viewing && (
        <Modal open onClose={() => setViewing(null)} size="md" title="Template preview">
          <div className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold leading-snug">{viewing.name}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <Badge variant={CHANNEL_META[viewing.channel].badge}>{CHANNEL_META[viewing.channel].icon} {CHANNEL_META[viewing.channel].label}</Badge>
                <code className="text-[11px] text-[var(--muted)]">{viewing.key}</code>
                {!viewing.enabled && <Badge variant="default">Disabled</Badge>}
              </div>
            </div>

            {viewing.channel !== "sms" && viewing.subject && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">Subject</p>
                <p className="text-sm font-medium">{renderPreview(viewing.subject)}</p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">Body</p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{renderPreview(viewing.body)}</p>
            </div>

            {viewing.variables.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5">Variables</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {viewing.variables.map((v) => (
                    <span key={v} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)]">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setViewing(null)} className="flex-1">Close</Button>
              <Button variant="outline" onClick={() => { const v = viewing; setViewing(null); setTimeout(() => openEdit(v), 60); }}>
                <Icon.Edit size={14} /> Edit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      <Modal open={!!deletingId} onClose={() => setDeletingId(null)} size="sm" title="Delete template?">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">This template will be permanently removed. This action can&apos;t be undone.</p>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}><Icon.Trash size={16} /> Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TplSectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-primary-soft text-primary">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
    </div>
  );
}
