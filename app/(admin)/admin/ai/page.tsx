"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, StatCard, Tabs, useToast } from "@/components/ui";
import { BarChart, LineChart } from "@/components/charts";
import Icon from "@/components/icons";
import { cn } from "@/lib/utils";

const MOCK_DAILY = [
  { day: "May 20", hours: 210 }, { day: "May 21", hours: 340 }, { day: "May 22", hours: 280 },
  { day: "May 23", hours: 450 }, { day: "May 24", hours: 390 }, { day: "May 25", hours: 520 },
  { day: "May 26", hours: 610 },
];

const MOCK_BY_FEATURE = [
  { label: "AI Chat", value: 4820 },
  { label: "Quiz Gen", value: 3210 },
  { label: "Assignment", value: 2140 },
  { label: "Moderation", value: 870 },
];

const MOCK_FLAGGED = [
  { id: "f1", type: "Forum Post", content: "Inappropriate language detected in forum thread #482", user: "Ali Khan", severity: "medium", createdAt: "2026-05-26T08:14:00Z" },
  { id: "f2", type: "Assignment", content: "Possible plagiarism detected in assignment submission", user: "Sara Ahmed", severity: "high", createdAt: "2026-05-26T07:55:00Z" },
  { id: "f3", type: "Review", content: "Spam-like content detected in course review", user: "Usman Tariq", severity: "low", createdAt: "2026-05-25T22:10:00Z" },
  { id: "f4", type: "Forum Post", content: "Off-topic promotional content in study group", user: "Zara Malik", severity: "low", createdAt: "2026-05-25T18:45:00Z" },
  { id: "f5", type: "Assignment", content: "Potential AI-generated submission without disclosure", user: "Ahmed Raza", severity: "medium", createdAt: "2026-05-25T14:30:00Z" },
];

const SEVERITY_TONE: Record<string, string> = {
  high: "text-red-600 bg-red-500/10 border-red-400/30",
  medium: "text-amber-600 bg-amber-500/10 border-amber-400/30",
  low: "text-blue-600 bg-blue-500/10 border-blue-400/30",
};

const AI_MODELS = [
  { name: "Claude Sonnet 4.6", usage: "Chat & assignments", status: "active", queries: 8170, latency: "1.2s" },
  { name: "Claude Haiku 4.5", usage: "Quiz generation", status: "active", queries: 3210, latency: "0.6s" },
  { name: "Claude Opus 4.7", usage: "Content moderation", status: "active", queries: 870, latency: "2.1s" },
];

const DEFAULT_FEATURES = [
  { label: "AI Chat (students)", desc: "Allow students to use the AI study assistant", key: "chat_student", on: true },
  { label: "AI Chat (teachers)", desc: "Allow teachers to use AI chat for lesson planning", key: "chat_teacher", on: true },
  { label: "Quiz generator", desc: "AI-powered quiz generation for teachers and students", key: "quiz_gen", on: true },
  { label: "Assignment helper", desc: "AI assistance for assignment writing", key: "assignment", on: true },
  { label: "Content moderation", desc: "Auto-flag potentially harmful content using AI", key: "moderation", on: true },
];

export default function AdminAiPage() {
  const toast = useToast();
  const [tab, setTab] = React.useState("overview");
  const [flagged, setFlagged] = React.useState(MOCK_FLAGGED);
  const [resolving, setResolving] = React.useState<string | null>(null);
  const [features, setFeatures] = React.useState(DEFAULT_FEATURES);

  function toggleFeature(key: string) {
    setFeatures((prev) => prev.map((f) => f.key === key ? { ...f, on: !f.on } : f));
    toast.push({ title: "Setting saved", tone: "success" });
  }

  async function resolveFlag(id: string, action: "dismiss" | "remove") {
    setResolving(id);
    await new Promise((r) => setTimeout(r, 600));
    setFlagged((p) => p.filter((f) => f.id !== id));
    setResolving(null);
    toast.push({
      title: action === "dismiss" ? "Flag dismissed" : "Content removed",
      tone: action === "dismiss" ? "info" : "success",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">AI Management</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Monitor AI usage, moderate flagged content, and configure platform AI settings.
          </p>
        </div>
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            { value: "moderation", label: "Moderation" },
            { value: "config", label: "Config" },
          ]}
        />
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total AI queries" value="12,240" icon={<Icon.Sparkles size={18} />} tone="primary" delta="↑ 18% this week" />
            <StatCard label="Active AI users" value="3,840" icon={<Icon.Users size={18} />} tone="success" delta="Students + Teachers" />
            <StatCard label="Flagged items" value={flagged.length} icon={<Icon.AlertCircle size={18} />} tone="warning" delta="Needs review" />
            <StatCard label="Avg latency" value="1.1s" icon={<Icon.Clock size={18} />} tone="accent" delta="All models" />
          </div>

          {/* Usage chart */}
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardBody>
                <h2 className="font-semibold">Daily AI queries</h2>
                <p className="text-xs text-[var(--muted)]">Total queries across all AI features</p>
                <div className="h-[220px] mt-3">
                  <LineChart data={MOCK_DAILY} height={220} yFormatter={(v) => `${Math.round(v)}`} />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <h2 className="font-semibold">Usage by feature</h2>
                <p className="text-xs text-[var(--muted)]">All-time query distribution</p>
                <div className="h-[220px] mt-3">
                  <BarChart data={MOCK_BY_FEATURE} height={220} />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Models table */}
          <Card>
            <CardBody>
              <h2 className="font-semibold mb-4">Active AI models</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-2 text-[var(--muted)] font-medium">Model</th>
                      <th className="text-left py-2 text-[var(--muted)] font-medium">Usage</th>
                      <th className="text-left py-2 text-[var(--muted)] font-medium">Queries</th>
                      <th className="text-left py-2 text-[var(--muted)] font-medium">Avg latency</th>
                      <th className="text-left py-2 text-[var(--muted)] font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {AI_MODELS.map((m) => (
                      <tr key={m.name}>
                        <td className="py-3 font-medium">{m.name}</td>
                        <td className="py-3 text-[var(--muted)]">{m.usage}</td>
                        <td className="py-3 tabular-nums">{m.queries.toLocaleString()}</td>
                        <td className="py-3 tabular-nums">{m.latency}</td>
                        <td className="py-3">
                          <Badge variant="success">{m.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "moderation" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">{flagged.length} item{flagged.length !== 1 ? "s" : ""} awaiting review</p>
            {flagged.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => {
                setFlagged([]);
                toast.push({ title: "All flags dismissed", tone: "info" });
              }}>
                Dismiss all
              </Button>
            )}
          </div>

          {flagged.length === 0 ? (
            <Card>
              <CardBody>
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Icon.CheckCircle size={22} />
                  </div>
                  <p className="font-semibold">No flagged content</p>
                  <p className="text-sm text-[var(--muted)]">The AI moderation queue is clear.</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {flagged.map((item) => (
                <Card key={item.id}>
                  <CardBody>
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="default">{item.type}</Badge>
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", SEVERITY_TONE[item.severity])}>
                            {item.severity} severity
                          </span>
                        </div>
                        <p className="text-sm font-medium">{item.content}</p>
                        <p className="text-xs text-[var(--muted)]">
                          By <span className="font-medium text-[var(--foreground)]">{item.user}</span>
                          {" · "}
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          loading={resolving === item.id}
                          onClick={() => resolveFlag(item.id, "dismiss")}
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          loading={resolving === item.id}
                          onClick={() => resolveFlag(item.id, "remove")}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "config" && (
        <div className="space-y-4 max-w-2xl">
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold">AI feature toggles</h2>
              {features.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-[var(--muted)]">{f.desc}</p>
                  </div>
                  <button
                    aria-pressed={f.on}
                    aria-label={`${f.on ? "Disable" : "Enable"} ${f.label}`}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
                      f.on ? "bg-[var(--primary)]" : "bg-[var(--surface-2)]",
                    )}
                    onClick={() => toggleFeature(f.key)}
                  >
                    <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform", f.on ? "translate-x-5" : "translate-x-0")} />
                  </button>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-semibold">Rate limits</h2>
              {[
                { label: "Free plan — daily AI queries", value: "10 queries / day" },
                { label: "Pro plan — daily AI queries", value: "Unlimited" },
                { label: "Teacher — daily AI queries", value: "Unlimited" },
                { label: "Max tokens per response", value: "4,096 tokens" },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">{r.label}</span>
                  <span className="font-medium">{r.value}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => toast.push({ title: "Rate limits saved", tone: "success" })}>
                Save limits
              </Button>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
