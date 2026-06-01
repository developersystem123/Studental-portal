"use client";

import * as React from "react";
import Icon from "@/components/icons";
import { Button, Card, CardBody, Input, Label, Select, Textarea, useToast } from "@/components/ui";
import { validateEmail, validateLength, validateName } from "@/lib/validation";

const reasons = ["General question", "Course suggestion", "Partnership", "Bug or feedback", "Press"];

const channels = [
  {
    icon: <Icon.Mail size={20} />,
    title: "Email",
    description: "We reply within 1 business day.",
    value: "hello@eduportal.app",
    href: "mailto:hello@eduportal.app",
  },
  {
    icon: <Icon.MessageSquare size={20} />,
    title: "Live chat",
    description: "Available weekdays, 9am–6pm.",
    value: "Open in-app chat",
    href: "/dashboard",
  },
  {
    icon: <Icon.Megaphone size={20} />,
    title: "Community",
    description: "Join the conversation with other learners.",
    value: "Visit forum",
    href: "/about",
  },
];

export default function ContactPage() {
  const toast = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    reason: reasons[0],
    message: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof form, string>>>({});

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    const nameErr = validateName(form.name, "Your name");
    const emailErr = validateEmail(form.email);
    const messageErr = validateLength(form.message, "Message", 10, 2000);
    if (nameErr) next.name = nameErr;
    if (emailErr) next.email = emailErr;
    if (messageErr) next.message = messageErr;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        toast.push({ title: "Couldn't send message", description: data.error ?? "Please try again.", tone: "danger" });
        return;
      }
      setForm({ name: "", email: "", reason: reasons[0], message: "" });
      toast.push({ title: "Message sent!", description: "Thanks — we'll be in touch shortly.", tone: "success" });
    } catch {
      toast.push({ title: "Network error", description: "Please check your connection and try again.", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 lg:pt-20 lg:pb-12">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Get in touch</p>
          <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Talk to a <span className="gradient-text">real human</span>.
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)]">
            Questions about a course, a partnership idea, or just want to say hi? Drop us a note and we&apos;ll get
            back fast.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {channels.map((c) => (
            <a key={c.title} href={c.href} className="group block">
              <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-0.5">
                <CardBody className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                    {c.icon}
                  </div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-xs text-[var(--muted)]">{c.description}</p>
                  <p className="text-sm text-[var(--primary)] font-medium inline-flex items-center gap-1 group-hover:underline">
                    {c.value} <Icon.ChevronRight size={14} />
                  </p>
                </CardBody>
              </Card>
            </a>
          ))}
        </div>
      </section>

      {/* Form + Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3">
          <CardBody className="p-6 lg:p-8">
            <h2 className="text-xl font-semibold">Send us a message</h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              We read every message. Please share as much detail as you can.
            </p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    error={errors.name}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    icon={<Icon.Mail size={16} />}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    error={errors.email}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="reason">What&apos;s this about?</Label>
                <Select id="reason" value={form.reason} onChange={(e) => update("reason", e.target.value)}>
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us what's on your mind…"
                  rows={6}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  error={errors.message}
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-[var(--muted)]">
                  By submitting, you agree to our friendly use of your email to reply.
                </p>
                <Button type="submit" loading={submitting}>
                  <Icon.Send size={16} /> Send message
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardBody className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                <Icon.Clock size={20} />
              </div>
              <p className="font-semibold">Support hours</p>
              <ul className="text-sm text-[var(--muted)] space-y-1">
                <li className="flex justify-between">
                  <span>Mon — Fri</span>
                  <span className="text-[var(--foreground)] font-medium">9:00 — 18:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Saturday</span>
                  <span className="text-[var(--foreground)] font-medium">10:00 — 14:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </li>
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                <Icon.Compass size={20} />
              </div>
              <p className="font-semibold">Where we are</p>
              <p className="text-sm text-[var(--muted)]">
                EduPortal HQ
                <br />
                14 Innovation Lane
                <br />
                Bengaluru, KA 560001
                <br />
                India
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Map */}
      <ContactMap />
    </div>
  );
}

function ContactMap() {
  // EduPortal HQ — Bengaluru, India. Coordinates are illustrative.
  const lat = 12.9716;
  const lon = 77.5946;
  const delta = 0.012;
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  const directionsHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-3">
          {/* Info panel */}
          <CardBody className="lg:col-span-1 p-6 lg:p-8 space-y-4 lg:border-r border-[var(--border)]">
            <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
              <Icon.Pin size={20} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Visit our HQ</h3>
              <p className="text-sm text-[var(--muted)] mt-1">
                Drop by, say hi, or schedule a coffee with the team.
              </p>
            </div>
            <div className="text-sm text-[var(--foreground)] leading-relaxed">
              EduPortal HQ
              <br />
              14 Innovation Lane
              <br />
              Bengaluru, KA 560001
              <br />
              India
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a href={directionsHref} target="_blank" rel="noopener noreferrer">
                <Button>
                  <Icon.Compass size={16} /> Get directions
                </Button>
              </a>
              <a
                href={`https://www.openstreetmap.org/#map=14/${lat}/${lon}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <Icon.Globe size={16} /> Open larger map
                </Button>
              </a>
            </div>
          </CardBody>

          {/* Map */}
          <div className="relative lg:col-span-2 h-72 sm:h-96 lg:h-auto lg:min-h-[26rem] bg-[var(--surface-2)]">
            <iframe
              title="EduPortal HQ on the map"
              src={embedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full border-0 contact-map-frame"
            />
            {/* Floating address chip on top of the map */}
            <div className="absolute left-4 top-4 max-w-[min(85%,18rem)] glass rounded-xl px-3 py-2.5 border border-[var(--border)] shadow-md pointer-events-none">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon.Pin size={14} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight">EduPortal HQ</p>
                  <p className="text-[11px] text-[var(--muted)] leading-snug mt-0.5">
                    14 Innovation Lane, Bengaluru
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
