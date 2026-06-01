import Link from "next/link";
import { Card, CardBody } from "@/components/ui";

export type Section = { id: string; title: string; body: string };

export function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
}) {
  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 lg:pt-20 lg:pb-10 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">{eyebrow}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Last updated: {lastUpdated}</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="mb-6">
          <CardBody>
            <p className="text-[var(--muted)] leading-relaxed">{intro}</p>
          </CardBody>
        </Card>

        <nav className="mb-8">
          <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-2">Contents</p>
          <ol className="space-y-1 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <Link href={`#${s.id}`} className="text-[var(--primary)] hover:underline">
                  {i + 1}. {s.title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id}>
              <h2 className="text-xl font-bold">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-3 text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <Card className="mt-12">
          <CardBody>
            <p className="text-sm">
              Questions? Reach us at{" "}
              <a href="mailto:legal@eduportal.example" className="text-[var(--primary)] hover:underline">
                legal@eduportal.example
              </a>{" "}
              or via the{" "}
              <Link href="/contact" className="text-[var(--primary)] hover:underline">
                contact form
              </Link>
              .
            </p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
