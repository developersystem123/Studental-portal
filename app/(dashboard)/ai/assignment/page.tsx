"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { Markdown } from "@/components/ai/Markdown";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/store";

type AssignmentType = "Essay" | "Report" | "Research" | "Presentation" | "Case Study" | "Literature Review";
type Tone = "Academic" | "Professional" | "Analytical" | "Creative" | "Simple";
type Outline = { title: string; sections: { heading: string; bullets: string[] }[] };
type Step = 1 | 2 | 3;

const TYPE_OPTIONS: AssignmentType[] = ["Essay", "Report", "Research", "Presentation", "Case Study", "Literature Review"];
const TONE_OPTIONS: Tone[] = ["Academic", "Professional", "Analytical", "Creative", "Simple"];

const TONE_DESC: Record<Tone, string> = {
  Academic: "Formal, citation-heavy",
  Professional: "Clear, business-style",
  Analytical: "Evidence-driven",
  Creative: "Engaging, narrative",
  Simple: "Plain language",
};

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function AssignmentHelperPage() {
  const { user } = useAuth();
  const isPro = user?.plan === "pro" || user?.plan === "team";

  // Gate wrapper — keeps all of the helper's hooks in <AssignmentHelperInner>
  // so this early return never conditionally skips them (rules of hooks).
  if (user && !isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--primary-soft)] to-[var(--surface-2)] text-[var(--primary)] flex items-center justify-center border border-[var(--border)]">
          <Icon.Crown size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Assignment Helper requires Pro</h1>
          <p className="text-[var(--muted)] mt-2 max-w-sm">Upgrade to a Pro plan to unlock AI-powered assignment assistance.</p>
        </div>
        <Link href="/subscription">
          <Button><Icon.Sparkles size={14} /> Upgrade to Pro</Button>
        </Link>
      </div>
    );
  }
  return <AssignmentHelperInner />;
}

function AssignmentHelperInner() {
  const { push } = useToast();

  // Step 1 inputs
  const [topic, setTopic] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [type, setType] = React.useState<AssignmentType>("Essay");
  const [tone, setTone] = React.useState<Tone>("Academic");
  const [wordLimit, setWordLimit] = React.useState("1500");

  // Progress
  const [step, setStep] = React.useState<Step>(1);
  const [outline, setOutline] = React.useState<Outline | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [references, setReferences] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);

  // Final doc
  const [showFinal, setShowFinal] = React.useState(false);

  async function call(action: string, payload: Record<string, unknown> = {}) {
    const res = await fetch("/api/ai/assignment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? `Request failed (${res.status})`);
    }
    return res.json();
  }

  async function generateOutline() {
    if (!topic.trim()) { push({ title: "Enter a topic first", tone: "danger" }); return; }
    setBusy("outline");
    try {
      const out = await call("outline", { topic, type });
      if (!out.sections) throw new Error("Bad response");
      setOutline(out);
      setDrafts({});
      setReferences([]);
      setShowFinal(false);
      setStep(2);
    } catch {
      push({ title: "Couldn't generate outline", tone: "danger" });
    } finally {
      setBusy(null);
    }
  }

  async function draftSection(heading: string) {
    setBusy(`draft:${heading}`);
    try {
      const out = await call("draft", { topic, heading, tone });
      setDrafts((p) => ({ ...p, [heading]: out.text }));
    } catch {
      push({ title: "Couldn't draft section", tone: "danger" });
    } finally {
      setBusy(null);
    }
  }

  async function draftAll() {
    if (!outline) return;
    setBusy("draft:all");
    const undrafted = outline.sections.filter((s) => !drafts[s.heading]);
    for (const s of undrafted) {
      const out = await call("draft", { topic, heading: s.heading, tone });
      setDrafts((p) => ({ ...p, [s.heading]: out.text }));
    }
    setBusy(null);
    push({ title: "All sections drafted", tone: "success" });
  }

  async function polishSection(heading: string) {
    setBusy(`polish:${heading}`);
    try {
      const out = await call("polish", { text: drafts[heading] });
      setDrafts((p) => ({ ...p, [heading]: out.text }));
      push({ title: "Section polished ✨", tone: "success" });
    } finally {
      setBusy(null);
    }
  }

  async function rewriteSection(heading: string) {
    setBusy(`rewrite:${heading}`);
    try {
      const out = await call("rewrite", { text: drafts[heading] });
      setDrafts((p) => ({ ...p, [heading]: out.text }));
      push({ title: "Section rewritten", tone: "success" });
    } finally {
      setBusy(null);
    }
  }

  async function fetchReferences() {
    setBusy("refs");
    try {
      const out = await call("references", { topic });
      setReferences(out.references ?? []);
    } finally {
      setBusy(null);
    }
  }

  function copyAll() {
    if (!outline) return;
    const md = buildMarkdown(outline, drafts, references);
    navigator.clipboard.writeText(md).then(() =>
      push({ title: "Copied to clipboard", tone: "success" })
    );
  }

  function downloadAs(format: "md" | "pdf") {
    if (!outline) return;
    const md = buildMarkdown(outline, drafts, references);
    if (format === "md") {
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${outline.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${outline.title}</title>
<style>body{font-family:Georgia,serif;max-width:780px;margin:40px auto;padding:0 20px;color:#1f2937;line-height:1.7}h1{color:#16a34a;font-size:2em;margin-bottom:8px}h2{color:#111827;border-bottom:2px solid #dcfce7;padding-bottom:6px;margin-top:36px}p{margin:10px 0}ul{padding-left:22px}li{margin:5px 0}.refs{background:#f0fdf4;border:1px solid #bbf7d0;padding:18px 22px;border-radius:10px;margin-top:32px}.meta{font-size:0.8em;color:#6b7280;margin-bottom:24px;border-bottom:1px solid #e5e7eb;padding-bottom:12px}</style>
</head><body>
<h1>${escapeHtml(outline.title)}</h1>
<div class="meta">Type: ${escapeHtml(type)} · Tone: ${escapeHtml(tone)}${subject ? ` · Subject: ${escapeHtml(subject)}` : ""}${wordLimit ? ` · Target: ${escapeHtml(wordLimit)} words` : ""}</div>
${outline.sections.map((s) =>
  `<h2>${escapeHtml(s.heading)}</h2>` +
  (drafts[s.heading]
    ? `<div>${escapeHtml(drafts[s.heading]).replace(/\n\n/g, "</p><p>").replace(/^/, "<p>").concat("</p>")}</div>`
    : `<ul>${s.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`)
).join("")}
${references.length ? `<div class="refs"><h2>References</h2><ol>${references.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ol></div>` : ""}
<script>window.onload=()=>setTimeout(()=>window.print(),200);</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { push({ title: "Popup blocked — allow popups for PDF export", tone: "danger" }); return; }
    w.document.write(html);
    w.document.close();
  }

  const draftedCount = outline ? outline.sections.filter((s) => !!drafts[s.heading]).length : 0;
  const totalSections = outline?.sections.length ?? 0;
  const totalWords = Object.values(drafts).reduce((sum, t) => sum + wordCount(t), 0);
  const targetWords = parseInt(wordLimit || "0") || 0;
  const wordProgress = targetWords ? Math.min(100, Math.round((totalWords / targetWords) * 100)) : 0;
  const anyDrafted = draftedCount > 0;

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-4 sm:p-6 text-white">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute right-16 bottom-0 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <Icon.FilePen size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold leading-tight">AI Assignment Helper</h1>
            <p className="text-xs sm:text-sm text-white/80 mt-0.5">
              Outline → Draft → Polish → Export. Full AI-assisted writing workflow.
            </p>
          </div>
        </div>
        {/* Step indicator */}
        <div className="relative mt-5 flex items-center gap-2">
          {([1, 2, 3] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 h-7 rounded-full transition-all",
                  step >= s
                    ? "bg-white text-[var(--primary)]"
                    : "bg-white/20 text-white/70",
                )}
              >
                <span>{s}</span>
                <span className="hidden sm:inline">
                  {s === 1 ? "Topic & type" : s === 2 ? "Outline & drafts" : "Review & export"}
                </span>
              </div>
              {i < 2 && (
                <div className={cn("flex-1 h-px max-w-[40px]", step > s ? "bg-white/70" : "bg-white/25")} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1 — Topic & settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Step 1 — Topic & settings</CardTitle>
            {outline && (
              <button
                onClick={() => setStep(1)}
                className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <Icon.Edit size={12} /> Edit
              </button>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4">
            <div>
              <Label htmlFor="topic">Assignment topic *</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The impact of AI on modern education"
                onKeyDown={(e) => e.key === "Enter" && generateOutline()}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject / course</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <Label>Assignment type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value as AssignmentType)}>
                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label>Writing tone</Label>
              <Select value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
                {TONE_OPTIONS.map((t) => <option key={t} value={t}>{t} — {TONE_DESC[t]}</option>)}
              </Select>
            </div>
            <div>
              <Label>Word limit (target)</Label>
              <Input
                type="number"
                value={wordLimit}
                onChange={(e) => setWordLimit(e.target.value)}
                placeholder="1500"
                min={100}
                max={10000}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={generateOutline} loading={busy === "outline"}>
              <Icon.Sparkles size={16} />
              {outline ? "Regenerate outline" : "Generate outline"}
            </Button>
            {outline && (
              <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                <Icon.CheckCircle size={14} className="text-emerald-500" />
                Outline ready — {totalSections} sections
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Step 2 — Outline & drafts */}
      {outline && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Step 2 — Outline & drafts</CardTitle>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {draftedCount}/{totalSections} sections drafted
                  {totalWords > 0 && ` · ${totalWords.toLocaleString()} words`}
                  {targetWords > 0 && ` / ${targetWords.toLocaleString()} target`}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {draftedCount < totalSections && (
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={draftAll}
                    loading={busy === "draft:all"}
                    disabled={!!busy}
                  >
                    <Icon.Sparkles size={14} /> Draft all sections
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchReferences}
                  loading={busy === "refs"}
                >
                  <Icon.Book size={14} /> Suggest references
                </Button>
                <Button size="sm" variant="outline" onClick={copyAll} disabled={!anyDrafted}>
                  <Icon.Copy size={14} /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadAs("md")} disabled={!anyDrafted}>
                  <Icon.Download size={14} /> .md
                </Button>
                <Button size="sm" onClick={() => downloadAs("pdf")} disabled={!anyDrafted}>
                  <Icon.Download size={14} /> PDF
                </Button>
              </div>
            </div>

            {/* Word progress bar */}
            {targetWords > 0 && totalWords > 0 && (
              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      wordProgress >= 100 ? "bg-emerald-500" : "bg-[var(--primary)]",
                    )}
                    style={{ width: `${wordProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--muted)] mt-1">
                  {wordProgress}% of {targetWords.toLocaleString()} word target
                  {wordProgress >= 100 && " ✓ target reached!"}
                </p>
              </div>
            )}
          </CardHeader>

          <CardBody className="space-y-4">
            <h3 className="text-lg font-bold">{outline.title}</h3>

            {outline.sections.map((s, idx) => {
              const hasDraft = !!drafts[s.heading];
              const sectionWords = wordCount(drafts[s.heading] ?? "");
              const isDraftingThis = busy === `draft:${s.heading}`;
              const isPolishingThis = busy === `polish:${s.heading}`;
              const isRewritingThis = busy === `rewrite:${s.heading}`;

              return (
                <div
                  key={s.heading}
                  className={cn(
                    "rounded-xl border p-4 space-y-3 transition-all",
                    hasDraft
                      ? "border-[var(--primary)]/20 bg-[var(--primary-soft)]/10"
                      : "border-[var(--border)]",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold">{s.heading}</h4>
                      {hasDraft && (
                        <Badge variant="success" className="text-[10px] py-0">
                          {sectionWords}w
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {!hasDraft ? (
                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() => draftSection(s.heading)}
                          loading={isDraftingThis}
                          disabled={!!busy && !isDraftingThis}
                        >
                          <Icon.Sparkles size={13} /> Draft section
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => polishSection(s.heading)}
                            loading={isPolishingThis}
                            disabled={!!busy && !isPolishingThis}
                          >
                            <Icon.Spark size={13} /> Polish
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rewriteSection(s.heading)}
                            loading={isRewritingThis}
                            disabled={!!busy && !isRewritingThis}
                          >
                            <Icon.Edit size={13} /> Rewrite
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => draftSection(s.heading)}
                            loading={isDraftingThis}
                            disabled={!!busy && !isDraftingThis}
                          >
                            <Icon.Sparkles size={13} /> Redraft
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {!hasDraft ? (
                    <ul className="list-disc pl-5 text-sm text-[var(--muted)] space-y-1">
                      {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        value={drafts[s.heading]}
                        onChange={(e) => setDrafts((p) => ({ ...p, [s.heading]: e.target.value }))}
                        className="min-h-[140px] text-sm"
                      />
                      <div className="p-3 rounded-lg bg-[var(--surface-2)]">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--muted-2)] mb-2">
                          Rendered preview
                        </p>
                        <Markdown text={drafts[s.heading]} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {/* References */}
      {references.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Suggested references</CardTitle>
              <Badge variant="default">{references.length}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <ol className="space-y-2">
              {references.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="h-5 w-5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[var(--muted)]">{r}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-[var(--muted-2)] mt-4 flex items-start gap-1.5">
              <Icon.AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-500" />
              Always verify these references against your library catalog before citing.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Step 3 — Final document preview */}
      {outline && anyDrafted && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 3 — Final document</CardTitle>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {totalWords.toLocaleString()} words · {draftedCount}/{totalSections} sections complete
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowFinal((v) => !v)}>
                  {showFinal ? <><Icon.EyeOff size={13} /> Hide</> : <><Icon.Eye size={13} /> Preview</>}
                </Button>
                <Button size="sm" variant="outline" onClick={copyAll}>
                  <Icon.Copy size={13} /> Copy
                </Button>
                <Button size="sm" onClick={() => downloadAs("pdf")}>
                  <Icon.Download size={13} /> Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          {showFinal && (
            <CardBody>
              <div className="prose prose-sm max-w-none space-y-4 p-4 rounded-xl bg-[var(--surface-2)]">
                <h2 className="text-xl font-bold text-[var(--foreground)]">{outline.title}</h2>
                {subject && (
                  <p className="text-xs text-[var(--muted)]">
                    {type} · {tone} tone{subject ? ` · ${subject}` : ""}
                  </p>
                )}
                {outline.sections.map((s) => (
                  <div key={s.heading}>
                    <h3 className="font-semibold text-[var(--foreground)] mb-2">{s.heading}</h3>
                    {drafts[s.heading] ? (
                      <Markdown text={drafts[s.heading]} />
                    ) : (
                      <ul className="list-disc pl-5 text-sm text-[var(--muted)] space-y-1">
                        {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
                {references.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-2">References</h3>
                    <ol className="list-decimal pl-5 text-sm text-[var(--muted)] space-y-1">
                      {references.map((r, i) => <li key={i}>{r}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            </CardBody>
          )}
        </Card>
      )}
    </div>
  );
}

function buildMarkdown(outline: Outline, drafts: Record<string, string>, refs: string[]) {
  const sections = outline.sections
    .map((s) => {
      const body = drafts[s.heading]
        ? drafts[s.heading]
        : s.bullets.map((b) => `- ${b}`).join("\n");
      return `## ${s.heading}\n\n${body}\n`;
    })
    .join("\n");
  const refBlock = refs.length
    ? `\n## References\n\n${refs.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n`
    : "";
  return `# ${outline.title}\n\n${sections}${refBlock}`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
