"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardBody, EmptyState, StatCard, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth, useData } from "@/lib/store";
import { COURSES } from "@/lib/mockData";
import { formatDate, formatHours } from "@/lib/utils";

type SortKey = "newest" | "oldest" | "score-high" | "score-low";

function scoreGrade(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: "Excellent", color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30" };
  if (score >= 80) return { label: "Great", color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30" };
  if (score >= 70) return { label: "Good", color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/30" };
  return { label: "Pass", color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/30" };
}


export default function CertificatesPage() {
  const { certificates } = useData();
  const { user } = useAuth();
  const toast = useToast();
  const [sort, setSort] = useState<SortKey>("newest");
  const [copied, setCopied] = useState<string | null>(null);

  const items = useMemo(() => {
    return certificates
      .map((c) => ({ cert: c, course: COURSES.find((x) => x.id === c.courseId) }))
      .filter((x) => x.course)
      .map((x) => ({ cert: x.cert, course: x.course! }));
  }, [certificates]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sort === "newest") return new Date(b.cert.issuedAt).getTime() - new Date(a.cert.issuedAt).getTime();
      if (sort === "oldest") return new Date(a.cert.issuedAt).getTime() - new Date(b.cert.issuedAt).getTime();
      if (sort === "score-high") return b.cert.score - a.cert.score;
      return a.cert.score - b.cert.score;
    });
  }, [items, sort]);

  const summary = useMemo(() => {
    if (items.length === 0) return { count: 0, avgScore: 0, minutes: 0, latest: null as string | null };
    const minutes = items.reduce((s, { course }) => s + course.durationMinutes, 0);
    const avg = Math.round(items.reduce((s, { cert }) => s + cert.score, 0) / items.length);
    const latest = items.reduce(
      (acc, { cert }) => (acc === null || cert.issuedAt > acc ? cert.issuedAt : acc),
      null as string | null,
    );
    return { count: items.length, avgScore: avg, minutes, latest };
  }, [items]);

  function copyVerifyCode(code: string) {
    const url = `${window.location.origin}/verify?code=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(code);
      toast.push({ title: "Verification link copied!", tone: "success" });
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function downloadCertificate(courseName: string, name: string, score: number, code: string, date: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const grade = scoreGrade(score);
    const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${courseName} – Certificate</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f0fdf4; display: flex; min-height: 100vh; align-items: center; justify-content: center; padding: 24px 16px; }
  .cert { width: 100%; max-width: 820px; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.12); }
  .cert-top { background: linear-gradient(135deg, #16a34a, #4ade80); padding: 32px 32px 28px; color: white; position: relative; overflow: hidden; }
  .cert-top::before { content:''; position:absolute; top:-40px; right:-40px; width:200px; height:200px; border-radius:50%; background:rgba(255,255,255,.1); }
  .cert-top::after { content:''; position:absolute; bottom:-60px; left:200px; width:160px; height:160px; border-radius:50%; background:rgba(255,255,255,.07); }
  .badge-label { font-size:11px; letter-spacing:4px; text-transform:uppercase; opacity:.85; margin-bottom:6px; }
  .cert-title { font-family: 'Playfair Display', serif; font-size: clamp(24px, 5vw, 38px); font-weight: 700; }
  .cert-body { padding: 28px 32px 36px; }
  .awarded-to { font-size: 12px; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; }
  .student-name { font-family: 'Playfair Display', serif; font-size: clamp(22px, 5vw, 36px); color: #111; margin: 6px 0 16px; border-bottom: 2px solid #dcfce7; padding-bottom: 10px; word-break: break-word; }
  .desc { color: #374151; font-size: clamp(13px, 2.5vw, 15px); line-height: 1.7; }
  .score-pill { display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 999px; padding: 4px 14px; font-size: 13px; font-weight: 600; color: #16a34a; margin: 16px 0 0; }
  .footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f3f4f6; }
  .sig-block { display: flex; flex-direction: column; gap: 4px; }
  .sig-name { font-weight: 600; font-size: 14px; }
  .sig-role { font-size: 11px; color: #9ca3af; }
  .seal { width: 68px; height: 68px; border-radius: 50%; background: linear-gradient(135deg, #16a34a, #4ade80); color: white; display:flex; flex-direction: column; align-items:center; justify-content:center; font-size: 9px; font-weight: 700; letter-spacing: 1px; text-align: center; line-height: 1.4; flex-shrink: 0; }
  .verify { font-size: 10px; color: #9ca3af; text-align: right; word-break: break-all; max-width: 220px; }
  .verify code { display: block; font-family: monospace; font-size: 12px; color: #374151; font-weight: 600; margin-top: 2px; }
  @media (max-width: 480px) {
    body { padding: 16px 12px; align-items: flex-start; }
    .cert-top { padding: 24px 20px 20px; }
    .cert-body { padding: 20px 20px 28px; }
    .footer { flex-direction: column; align-items: flex-start; }
    .verify { text-align: left; max-width: 100%; }
  }
  @media print {
    body { padding: 0; background: white; }
    .cert { box-shadow: none; border-radius: 0; max-width: 100%; }
  }
</style></head><body>
<div class="cert">
  <div class="cert-top">
    <div class="badge-label">Certificate of Completion</div>
    <div class="cert-title">EduPortal</div>
  </div>
  <div class="cert-body">
    <div class="awarded-to">This certifies that</div>
    <div class="student-name">${name}</div>
    <p class="desc">has successfully completed the course<br><strong>${courseName}</strong><br>demonstrating mastery of the subject matter.</p>
    <div class="score-pill">★ Score: ${score}% — ${grade.label}</div>
    <div class="footer">
      <div class="sig-block">
        <div class="sig-name">Sameer Ali</div>
        <div class="sig-role">Director, EduPortal · ${formatDate(date)}</div>
      </div>
      <div class="seal">EDU<br>PORTAL</div>
      <div class="verify">
        Verify certificate
        <code>${code}</code>
        <div style="margin-top:4px;font-size:10px;color:#bbb">${origin}/verify?code=${code}</div>
      </div>
    </div>
  </div>
</div>
<script>window.onload = () => setTimeout(() => window.print(), 250);</script>
</body></html>`;
    // Use a Blob URL instead of document.write() which is deprecated and may be
    // blocked by some browsers and Content Security Policies.
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) {
      toast.push({ title: "Popup blocked", description: "Allow popups to download.", tone: "danger" });
      URL.revokeObjectURL(url);
      return;
    }
    // Revoke the object URL after a short delay to free memory.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Certificates</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Your earned achievements. Download or share to verify.</p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Sort:</span>
            {(["newest", "oldest", "score-high", "score-low"] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                  sort === k
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {k === "newest" ? "Newest" : k === "oldest" ? "Oldest" : k === "score-high" ? "Score ↓" : "Score ↑"}
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Certificates earned" value={summary.count} tone="primary" icon={<Icon.Award size={22} />} />
          <StatCard
            label="Average score"
            value={`${summary.avgScore}%`}
            delta={summary.avgScore >= 90 ? "Excellent" : summary.avgScore >= 80 ? "Great" : "Solid"}
            tone="success"
            icon={<Icon.TrendingUp size={22} />}
          />
          <StatCard
            label="Hours certified"
            value={formatHours(summary.minutes)}
            tone="accent"
            icon={<Icon.Clock size={22} />}
          />
          <StatCard
            label="Latest earned"
            value={summary.latest ? formatDate(summary.latest) : "—"}
            tone="warning"
            icon={<Icon.Calendar size={22} />}
          />
        </div>
      )}

      {/* Progress to next milestone */}
      {items.length > 0 && items.length < 5 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-5 py-3.5 flex items-center gap-4">
          <Icon.TrendingUp size={18} className="text-[var(--primary)] shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {items.length < 3
                ? `${3 - items.length} more certificate${3 - items.length > 1 ? "s" : ""} to earn the Scholar badge 🎓`
                : `${5 - items.length} more certificate${5 - items.length > 1 ? "s" : ""} to reach Gold status`}
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all"
                style={{ width: `${Math.min(100, (items.length / 5) * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-[var(--muted)] shrink-0">{items.length} / 5</span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Icon.Award size={28} />}
          title="No certificates yet"
          description="Complete a course to earn your first certificate."
          action={
            <Link href="/my-courses">
              <Button><Icon.Book size={16} /> Go to my courses</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map(({ cert, course }) => {
            const grade = scoreGrade(cert.score);
            return (
              <Card key={cert.id} className="overflow-hidden group">
                {/* Card hero */}
                <div className="relative h-44 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white p-5 flex flex-col justify-between">
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,.6), transparent 40%)" }}
                  />
                  <div className="relative space-y-1">
                    <p className="text-[10px] uppercase tracking-widest opacity-80">EduPortal Certificate</p>
                    <p className="font-semibold line-clamp-2 leading-snug">{course.title}</p>
                  </div>
                  <div className="relative flex items-end justify-between">
                    <Icon.Award size={32} className="opacity-90" />
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${grade.bg} ${grade.color}`}>
                        {grade.label}
                      </span>
                      <span className="text-xs text-white/80">Score {cert.score}%</span>
                    </div>
                  </div>
                </div>

                <CardBody className="space-y-3">
                  {/* Student + date */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{user?.name}</p>
                      <p className="text-xs text-[var(--muted)]">Issued on {formatDate(cert.issuedAt)}</p>
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">{formatHours(course.durationMinutes)}</span>
                  </div>

                  {/* Verify code row */}
                  <div className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2">
                    <span className="text-xs text-[var(--muted)]">Verify code</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold">{cert.verifyCode}</span>
                      <button
                        onClick={() => copyVerifyCode(cert.verifyCode)}
                        className={`p-1 rounded transition ${
                          copied === cert.verifyCode ? "text-green-500" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                        title="Copy verify link"
                      >
                        {copied === cert.verifyCode ? <Icon.Check size={13} /> : <Icon.Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        downloadCertificate(course.title, user?.name ?? "Student", cert.score, cert.verifyCode, cert.issuedAt)
                      }
                    >
                      <Icon.Download size={14} /> Download PDF
                    </Button>
                    <Link href={`/verify?code=${cert.verifyCode}`} target="_blank">
                      <Button size="sm" variant="outline">
                        <Icon.CheckCircle size={14} /> Verify
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
