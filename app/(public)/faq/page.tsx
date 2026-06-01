"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/icons";
import { Button, Card, CardBody, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "general", label: "Getting started" },
  { id: "courses", label: "Courses" },
  { id: "payments", label: "Payments" },
  { id: "certificates", label: "Certificates" },
  { id: "account", label: "Account" },
];

type FAQ = { category: string; q: string; a: string };

const FAQS: FAQ[] = [
  { category: "general", q: "What is EduPortal?", a: "EduPortal is an AI-powered learning platform with expert-led courses, interactive quizzes, live classes, and 24/7 AI tutoring across web dev, data science, design, business, and more." },
  { category: "general", q: "Is EduPortal free to use?", a: "Yes — sign-up is free and you'll find many free courses. We also offer paid courses and a Pro plan ($9.99/month) for unlimited AI usage and exclusive content." },
  { category: "general", q: "Who is EduPortal for?", a: "Students, working professionals, and lifelong learners. Whether you're starting from scratch or upskilling, our courses adapt to your level." },
  { category: "courses", q: "How long do I have access to a course?", a: "Once enrolled, you keep lifetime access — including any future updates the instructor publishes." },
  { category: "courses", q: "Are courses self-paced?", a: "Yes. You can pause, rewind, and learn at your own pace. Some live classes happen at scheduled times but recordings are always available." },
  { category: "courses", q: "Can I download videos for offline viewing?", a: "Offline downloads are available for Pro members through our mobile app." },
  { category: "payments", q: "What payment methods do you accept?", a: "Credit/debit cards via Stripe, bank transfers (manual), and scholarship codes. We're adding regional payment methods soon." },
  { category: "payments", q: "Can I get a refund?", a: "Yes — within 14 days of purchase if you've completed less than 25% of the course. See our refund policy for details." },
  { category: "payments", q: "Do you offer discounts?", a: "Yes! Students get 30% off with a valid ID, and we run seasonal promotions. Bundle discounts also apply when buying multiple courses." },
  { category: "certificates", q: "Are certificates recognized?", a: "Certificates are signed and verifiable. Many employers and universities recognize them. We also partner with industry organizations for select tracks." },
  { category: "certificates", q: "How do I earn a certificate?", a: "Complete all chapters, pass the final quiz with the minimum passing score, and submit any required assignments. The certificate is issued automatically." },
  { category: "certificates", q: "Can I share my certificate on LinkedIn?", a: "Absolutely — every certificate comes with a verifiable link and one-click LinkedIn share." },
  { category: "account", q: "How do I reset my password?", a: "Click 'Forgot password' on the login page. We'll email you a reset link valid for 30 minutes." },
  { category: "account", q: "Can I change my email address?", a: "Yes, from Settings → Account. You'll need to verify the new address." },
  { category: "account", q: "How do I delete my account?", a: "Go to Settings → Account → Delete account. This is permanent — your enrollments, certificates, and data will be removed." },
];

export const dynamic = "force-static";

export default function FAQPage() {
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const filtered = FAQS.filter((f) => {
    if (activeCat !== "all" && f.category !== activeCat) return false;
    if (search.trim() && !`${f.q} ${f.a}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 lg:pt-20 lg:pb-12 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Help Center</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">
          Frequently asked <span className="gradient-text">questions</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Can&apos;t find what you&apos;re looking for? Reach out — we usually reply within 24 hours.
        </p>
        <div className="mt-6 max-w-xl mx-auto">
          <Input
            icon={<Icon.Search size={18} />}
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={cn(
                "px-4 h-9 rounded-full text-sm font-medium transition",
                activeCat === c.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card><CardBody>
            <p className="text-center text-[var(--muted)] py-8">No questions match your search.</p>
          </CardBody></Card>
        ) : (
          <ul className="space-y-3">
            {filtered.map((f, idx) => (
              <li key={`${f.category}-${idx}`}>
                <Card>
                  <button
                    onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                    className="w-full text-left p-5 flex items-center gap-3"
                  >
                    <span className="h-8 w-8 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                      <Icon.Help size={16} />
                    </span>
                    <span className="flex-1 text-sm font-semibold">{f.q}</span>
                    <Icon.ChevronDown
                      size={18}
                      className={cn("text-[var(--muted)] transition-transform", openIdx === idx && "rotate-180")}
                    />
                  </button>
                  {openIdx === idx && (
                    <div className="px-5 pb-5 -mt-2 pl-16">
                      <p className="text-sm text-[var(--muted)] leading-relaxed">{f.a}</p>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}

        <Card className="mt-12 bg-gradient-to-br from-[var(--primary-soft)] to-transparent">
          <CardBody className="text-center py-10">
            <p className="text-xl font-semibold">Still need help?</p>
            <p className="text-sm text-[var(--muted)] mt-2 mb-5">Our support team is happy to help.</p>
            <Link href="/contact"><Button><Icon.Mail size={14} /> Contact us</Button></Link>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
