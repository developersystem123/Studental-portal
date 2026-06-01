"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { relativeTime } from "@/lib/utils";

type Ticket = {
  id: string;
  subject: string;
  body: string;
  category: "technical" | "billing" | "course" | "account" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  replyCount: number;
  createdAt: string;
  updatedAt: string;
};

const STATUS_TONE: Record<Ticket["status"], "primary" | "warning" | "success" | "default"> = {
  open: "warning",
  in_progress: "primary",
  resolved: "success",
  closed: "default",
};

const PRIORITY_TONE: Record<Ticket["priority"], "default" | "info" | "warning" | "danger"> = {
  low: "default",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "", category: "other" as Ticket["category"], priority: "medium" as Ticket["priority"] });
  const [saving, setSaving] = useState(false);
  const { push } = useToast();

  async function load() {
    try {
      const r = await fetch("/api/support");
      const data = r.ok ? await r.json() : { tickets: [] };
      setTickets(data.tickets ?? []);
    } catch {
      push({ title: "Couldn't load tickets", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/support");
        const data = r.ok ? await r.json() : { tickets: [] };
        if (!cancelled) setTickets(data.tickets ?? []);
      } catch {
        if (!cancelled) push({ title: "Couldn't load tickets", tone: "danger" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    if (!form.subject.trim() || !form.body.trim()) {
      push({ title: "Subject & message required", tone: "warning" });
      return;
    }
    setSaving(true);
    const r = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!r.ok) {
      push({ title: "Couldn't create ticket", tone: "danger" });
      return;
    }
    push({ title: "Ticket created", description: "We'll get back to you soon.", tone: "success" });
    setOpen(false);
    setForm({ subject: "", body: "", category: "other", priority: "medium" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Help & Support</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Open a ticket — we usually reply within 24 hours.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Icon.Plus size={14} /> New ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Icon.Help size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">FAQ</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Browse common questions.</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Icon.Mail size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Email us</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">support@eduportal.example</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Icon.MessageSquare size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Live chat</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Mon–Fri · 9am–6pm</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Your tickets</CardTitle></CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <p className="text-sm text-[var(--muted)] p-5">Loading…</p>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={<Icon.Help size={28} />}
              title="No tickets yet"
              description="If you need help, open one."
              action={<Button onClick={() => setOpen(true)}><Icon.Plus size={14} /> New ticket</Button>}
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {tickets.map((t) => (
                <li key={t.id} className="hover:bg-[var(--surface-2)]">
                  <Link href={`/support/${t.id}`} className="flex items-start gap-3 p-4">
                    <div className="h-9 w-9 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                      <Icon.Help size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold line-clamp-1">{t.subject}</p>
                        <Badge variant={STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Badge>
                        <Badge variant={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                        <Badge variant="default">{t.category}</Badge>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">{t.body}</p>
                      <p className="text-xs text-[var(--muted-2)] mt-1 flex items-center gap-2">
                        <span>{relativeTime(t.updatedAt)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Icon.MessageSquare size={11} /> {t.replyCount}</span>
                      </p>
                    </div>
                    <Icon.ChevronRight size={16} className="text-[var(--muted-2)] mt-2" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New support ticket" size="md">
        <div className="p-5 space-y-4">
          <div>
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Briefly, what's wrong?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Ticket["category"] })}>
                <option value="technical">Technical issue</option>
                <option value="billing">Billing / Payments</option>
                <option value="course">Course content</option>
                <option value="account">Account</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Ticket["priority"] })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} placeholder="Describe the issue in detail…" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} loading={saving}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
