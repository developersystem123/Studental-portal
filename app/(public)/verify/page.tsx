"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import Icon from "@/components/icons";
import { formatDate } from "@/lib/utils";

type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "invalid" }
  | {
      state: "valid";
      certificate: {
        verifyCode: string;
        studentName: string;
        courseTitle: string;
        score: number;
        issuedAt: string;
      };
    };

export default function VerifyCertificatePage() {
  const [code, setCode] = React.useState("");
  const [result, setResult] = React.useState<Result>({ state: "idle" });

  const check = React.useCallback(async (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setResult({ state: "loading" });
    try {
      const r = await fetch(`/api/certificates/verify?code=${encodeURIComponent(value)}`);
      const data = await r.json();
      if (data.valid) setResult({ state: "valid", certificate: data.certificate });
      else setResult({ state: "invalid" });
    } catch {
      setResult({ state: "invalid" });
    }
  }, []);

  // Support a direct link like /verify?code=EDU-XXXXXX
  React.useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("code");
    if (fromUrl) {
      setCode(fromUrl);
      check(fromUrl);
    }
  }, [check]);

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="text-center">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] items-center justify-center">
          <Icon.Award size={26} />
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
          Verify a <span className="gradient-text">certificate</span>
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Enter the verification code printed on an EduPortal certificate to confirm it&apos;s
          genuine.
        </p>
      </div>

      <Card className="mt-8">
        <CardBody className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              check(code);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. EDU-AB12CD"
              icon={<Icon.Search size={16} />}
              autoFocus
            />
            <Button type="submit" loading={result.state === "loading"} className="sm:w-36">
              <Icon.CheckCircle size={16} /> Verify
            </Button>
          </form>

          {result.state === "valid" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 fade-in">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Icon.CheckCircle size={18} /> Valid certificate
                <Badge variant="success" className="ml-auto">
                  {result.certificate.score}%
                </Badge>
              </div>
              <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Row label="Issued to" value={result.certificate.studentName} />
                <Row label="Course" value={result.certificate.courseTitle} />
                <Row label="Issued on" value={formatDate(result.certificate.issuedAt)} />
                <Row label="Verification code" value={result.certificate.verifyCode} />
              </dl>
            </div>
          )}

          {result.state === "invalid" && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 flex items-start gap-2 text-sm fade-in">
              <Icon.X size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  No certificate found
                </p>
                <p className="text-[var(--muted)] mt-0.5">
                  We couldn&apos;t find a certificate with that code. Check the code and try again.
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">
        {label}
      </dt>
      <dd className="text-[var(--foreground)] font-medium mt-0.5 break-words">{value}</dd>
    </div>
  );
}
