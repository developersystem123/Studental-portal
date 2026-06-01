"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/icons";
import { Badge, Button, Card, CardBody, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

type Plan = {
  id: string;
  key: string;
  name: string;
  tagline: string;
  monthlyPrice: number; // cents
  annualPrice: number; // cents
  features: string[];
  highlight: boolean;
  order: number;
};

const FAQ_ITEMS = [
  { q: "Can I cancel anytime?", a: "Yes — cancel at any time. You'll keep access until the end of your billing period." },
  { q: "Do you offer student discounts?", a: "Yes — 30% off Pro with a valid student ID. Contact us after sign-up to claim." },
  { q: "Is there a free trial?", a: "Pro includes a 14-day free trial. No credit card needed to start." },
  { q: "Can I switch plans?", a: "Yes, you can upgrade or downgrade anytime from your Subscription page." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/subscription");
        const data = r.ok ? await r.json().catch(() => ({})) : {};
        if (!cancelled) setPlans(data.plans ?? []);
      } catch {
        // Plans will fall back to empty; UI shows "contact us" state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 lg:pt-20 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Pricing</p>
        <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          Simple, <span className="gradient-text">honest pricing</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Pay monthly or save 20% annually. Cancel anytime.
        </p>

        <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-xl bg-[var(--surface-2)]">
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              "px-4 h-9 rounded-lg text-sm font-medium transition",
              !annual ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              "px-4 h-9 rounded-lg text-sm font-medium transition flex items-center gap-2",
              annual ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"
            )}
          >
            Annual <Badge variant="success">Save 20%</Badge>
          </button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[28rem]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isFree = p.monthlyPrice === 0 && p.annualPrice === 0;
              const perMonth = annual ? p.annualPrice / 12 : p.monthlyPrice;
              return (
                <Card
                  key={p.id}
                  className={cn(
                    "overflow-hidden flex flex-col",
                    p.highlight && "ring-2 ring-[var(--primary)] scale-100 md:scale-105"
                  )}
                >
                  {p.highlight && (
                    <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-center py-1.5 text-xs font-semibold">
                      ⭐ MOST POPULAR
                    </div>
                  )}
                  <CardBody className="flex-1 flex flex-col p-6">
                    <p className="text-sm font-semibold text-[var(--muted)]">{p.name}</p>
                    <p className="text-xs text-[var(--muted-2)] mt-1 mb-4">{p.tagline}</p>
                    <p className="text-4xl font-bold">
                      ${(perMonth / 100).toFixed(2)}
                      <span className="text-base text-[var(--muted)] font-normal">/month</span>
                    </p>
                    {annual && !isFree && (
                      <p className="text-xs text-[var(--muted-2)] mt-1">
                        ${(p.annualPrice / 100).toFixed(2)} billed annually
                      </p>
                    )}
                    <ul className="mt-6 space-y-2.5 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Icon.CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={isFree ? "/register" : "/subscription"} className="mt-6">
                      <Button variant={p.highlight ? "primary" : "outline"} className="w-full">
                        {isFree ? "Sign up free" : `Get ${p.name}`}
                      </Button>
                    </Link>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mt-12 bg-gradient-to-br from-[var(--primary-soft)] to-transparent">
          <CardBody className="p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center shrink-0">
              <Icon.Users size={26} />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold">Enterprise & Universities</p>
              <p className="text-sm text-[var(--muted)] mt-1">
                Bulk licensing, custom branding, SSO, and content licensing. Volume discounts available.
              </p>
            </div>
            <Link href="/contact">
              <Button variant="outline">Contact sales</Button>
            </Link>
          </CardBody>
        </Card>

        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Pricing questions</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((f) => (
              <Card key={f.q}>
                <CardBody>
                  <p className="font-semibold mb-1">{f.q}</p>
                  <p className="text-sm text-[var(--muted)]">{f.a}</p>
                </CardBody>
              </Card>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-[var(--muted)]">
            More questions? <Link href="/faq" className="text-[var(--primary)] hover:underline">Visit our FAQ</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
