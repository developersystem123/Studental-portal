"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, Input, Select, Textarea, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { cn, relativeTime, uid } from "@/lib/utils";

type Audience = "all" | "students" | "teachers" | "pro";
type Channel = "in_app" | "email" | "both";
type AnnStatus = "sent" | "scheduled" | "draft";

type Ann = {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  channel: Channel;
  status: AnnStatus;
  sentAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  reach: number;
};

const MOCK_ANNS: Ann[] = [
  { id: "a1", title: "Platform maintenance on June 1st", body: "We'll be performing scheduled maintenance from 2–4 AM PKT. The platform may be briefly unavailable.", audience: "all", channel: "both", status: "sent", sentAt: "2026-05-24T10:00:00Z", scheduledAt: null, createdAt: "2026-05-23T09:00:00Z", reach: 12400 },
  { id: "a2", title: "New AI Chat feature is live!", body: "Teachers can now access the full AI Chat assistant to help plan lessons and create content.", audience: "teachers", channel: "in_app", status: "sent", sentAt: "2026-05-20T08:30:00Z", scheduledAt: null, createdAt: "2026-05-19T12:00:00Z", reach: 340 },
  { id: "a3", title: "Pro plan discount — 20% off annual", body: "For a limited time, upgrade to Pro annual and save 20%. Use code ANNUAL20 at checkout.", audience: "students", channel: "email", status: "sent", sentAt: "2026-05-15T11:00:00Z", scheduledAt: null, createdAt: "2026-05-14T10:00:00Z", reach: 8600 },
  { id: "a4", title: "June curriculum updates", body: "New courses in Data Science and UI Design are coming next month. Stay tuned!", audience: "all", channel: "in_app", status: "scheduled", sentAt: null, scheduledAt: "2026-06-01T09:00:00Z", createdAt: "2026-05-25T14:00:00Z", reach: 0 },
];

const AUDIENCE_LABELS: Record<Audience, string> = {
  all: "All users",
  students: "Students only",
  teachers: "Teachers only",
  pro: "Pro subscribers",
};

const CHANNEL_LABELS: Record<Channel, string> = {
  in_app: "In-app only",
  email: "Email only",
  both: "In-app + Email",
};

const STATUS_META: Record<AnnStatus, { label: string; variant: "success" | "info" | "default" }> = {
  sent: { label: "Sent", variant: "success" },
  scheduled: { label: "Scheduled", variant: "info" },
  draft: { label: "Draft", variant: "default" },
};

export default function AdminAnnouncementsPage() {
  const toast = useToast();
  const [anns, setAnns] = React.useState<Ann[]>(MOCK_ANNS);
  const [composing, setComposing] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [audience, setAudience] = React.useState<Audience>("all");
  const [channel, setChannel] = React.useState<Channel>("in_app");
  const [scheduleMode, setScheduleMode] = React.useState(false);
  const [scheduledAt, setScheduledAt] = React.useState("");

  function resetForm() {
    setTitle(""); setBody(""); setAudience("all"); setChannel("in_app");
    setScheduleMode(false); setScheduledAt(""); setComposing(false);
  }

  const AUDIENCE_REACH: Record<Audience, number> = { all: 12400, students: 8600, teachers: 340, pro: 1240 };

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.push({ title: "Title and message are required.", tone: "danger" }); return;
    }
    if (scheduleMode && !scheduledAt) {
      toast.push({ title: "Pick a schedule date/time.", tone: "danger" }); return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    const now = new Date().toISOString();
    const newAnn: Ann = {
      id: uid(), title: title.trim(), body: body.trim(), audience, channel,
      status: scheduleMode ? "scheduled" : "sent",
      sentAt: scheduleMode ? null : now,
      scheduledAt: scheduleMode ? new Date(scheduledAt).toISOString() : null,
      createdAt: now,
      reach: scheduleMode ? 0 : AUDIENCE_REACH[audience],
    };
    setAnns((p) => [newAnn, ...p]);
    setSending(false);
    resetForm();
    toast.push({
      title: scheduleMode ? "Announcement scheduled!" : "Announcement sent!",
      tone: "success",
    });
  }

  function deleteAnn(id: string) {
    setAnns((p) => p.filter((a) => a.id !== id));
    toast.push({ title: "Announcement deleted", tone: "info" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Announcements</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Broadcast messages to all users or specific groups via in-app notifications or email.
          </p>
        </div>
        {!composing && (
          <Button onClick={() => setComposing(true)}>
            <Icon.Megaphone size={16} /> New announcement
          </Button>
        )}
      </div>

      {/* Compose form */}
      {composing && (
        <Card className="border-[var(--primary)] border-2">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Compose announcement</h2>
              <button onClick={resetForm} className="text-[var(--muted)] hover:text-[var(--foreground)] transition">
                <Icon.X size={18} />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input placeholder="e.g. Platform maintenance notice" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Message</label>
              <Textarea
                placeholder="Write your announcement here…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Audience</label>
                <Select value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                  <option value="all">All users (~12,400)</option>
                  <option value="students">Students only (~8,600)</option>
                  <option value="teachers">Teachers only (~340)</option>
                  <option value="pro">Pro subscribers (~1,240)</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Channel</label>
                <Select value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
                  <option value="in_app">In-app notification only</option>
                  <option value="email">Email only</option>
                  <option value="both">In-app + Email</option>
                </Select>
              </div>
            </div>

            {/* Schedule toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScheduleMode((v) => !v)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
                  scheduleMode ? "bg-[var(--primary)]" : "bg-[var(--surface-2)]",
                )}
              >
                <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", scheduleMode ? "translate-x-4" : "translate-x-0")} />
              </button>
              <span className="text-sm font-medium">Schedule for later</span>
            </div>

            {scheduleMode && (
              <div className="fade-in">
                <label className="text-sm font-medium mb-1.5 block">Schedule date & time</label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] text-xs text-[var(--muted)]">
              <Icon.Users size={13} className="shrink-0" />
              This will reach approximately <span className="font-semibold text-[var(--foreground)] mx-1">{AUDIENCE_REACH[audience].toLocaleString()} users</span>
              via <span className="font-semibold text-[var(--foreground)] mx-1">{CHANNEL_LABELS[channel].toLowerCase()}</span>.
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={resetForm} disabled={sending}>Cancel</Button>
              <Button className="flex-1" loading={sending} onClick={handleSend}>
                {scheduleMode ? <><Icon.Calendar size={15} /> Schedule</> : <><Icon.Send size={15} /> Send now</>}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">History</h2>
        {anns.length === 0 ? (
          <Card>
            <CardBody>
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-[var(--surface-2)] text-[var(--muted)] flex items-center justify-center">
                  <Icon.Megaphone size={22} />
                </div>
                <p className="font-semibold">No announcements yet</p>
                <p className="text-sm text-[var(--muted)]">Send your first broadcast to get started.</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          anns.map((ann) => {
            const sm = STATUS_META[ann.status];
            return (
              <Card key={ann.id}>
                <CardBody>
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="h-9 w-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                      <Icon.Megaphone size={16} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{ann.title}</p>
                        <Badge variant={sm.variant}>{sm.label}</Badge>
                      </div>
                      <p className="text-sm text-[var(--muted)] line-clamp-2">{ann.body}</p>
                      <div className="flex items-center gap-3 text-xs text-[var(--muted-2)] flex-wrap">
                        <span className="flex items-center gap-1"><Icon.Users size={11} /> {AUDIENCE_LABELS[ann.audience]}</span>
                        <span className="flex items-center gap-1"><Icon.Send size={11} /> {CHANNEL_LABELS[ann.channel]}</span>
                        {ann.status === "sent" && ann.reach > 0 && (
                          <span className="flex items-center gap-1"><Icon.CheckCircle size={11} className="text-emerald-500" /> {ann.reach.toLocaleString()} reached</span>
                        )}
                        {ann.status === "scheduled" && ann.scheduledAt && (
                          <span className="flex items-center gap-1"><Icon.Calendar size={11} /> {new Date(ann.scheduledAt).toLocaleString()}</span>
                        )}
                        {ann.sentAt && <span>{relativeTime(ann.sentAt)}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAnn(ann.id)}
                      className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition"
                      title="Delete"
                    >
                      <Icon.Trash size={15} />
                    </button>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
